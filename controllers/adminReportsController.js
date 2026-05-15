import ValidationLog from '../models/ValidationLog.js';
import PromotionalCode from '../models/PromotionalCode.js';
import { logger } from '../middleware/logger.js';

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

const dateRangeFilter = (from, to) => {
  const filter = {};

  if (from) {
    filter.$gte = new Date(from);
  }

  if (to) {
    filter.$lte = new Date(to);
  }

  return Object.keys(filter).length ? filter : null;
};

export const getAdminRedemptions = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { q, status, product, from, to } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (product) {
      filter.product = { $regex: product.trim(), $options: 'i' };
    }

    const range = dateRangeFilter(from, to);
    if (range) {
      filter.timestamp = range;
    }

    if (q) {
      const regex = { $regex: q.trim(), $options: 'i' };
      filter.$or = [{ code: regex }, { email: regex }, { documentId: regex }, { fullName: regex }];
    }

    const [items, total] = await Promise.all([
      ValidationLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      ValidationLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch redemptions', error, { adminId: req.admin?.id });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAdminWinners = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { q, from, to, prizeType, prizeDeliveryStatus } = req.query;

    const matchConditions = [{ status: 'valid' }];

    const range = dateRangeFilter(from, to);
    if (range) {
      matchConditions.push({ timestamp: range });
    }

    if (prizeType) {
      matchConditions.push({ 'prize.type': { $regex: prizeType.trim(), $options: 'i' } });
    }

    if (prizeDeliveryStatus) {
      if (prizeDeliveryStatus === 'pending') {
        matchConditions.push({
          $or: [{ prizeDeliveryStatus: 'pending' }, { prizeDeliveryStatus: { $exists: false } }],
        });
      } else {
        matchConditions.push({ prizeDeliveryStatus: 'delivered' });
      }
    }

    if (q) {
      const regex = { $regex: q.trim(), $options: 'i' };
      matchConditions.push({
        $or: [{ code: regex }, { email: regex }, { documentId: regex }, { fullName: regex }],
      });
    }

    const match = matchConditions.length > 1 ? { $and: matchConditions } : matchConditions[0];

    const basePipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'promotionalcodes',
          localField: 'code',
          foreignField: 'code',
          as: 'codeData',
        },
      },
      {
        $addFields: {
          promoCode: { $arrayElemAt: ['$codeData', 0] },
        },
      },
      {
        $match: {
          'promoCode.isActive': true,
        },
      },
      {
        $project: {
          _id: 1,
          code: 1,
          fullName: 1,
          email: 1,
          documentId: 1,
          phone: 1,
          product: 1,
          prize: 1,
          timestamp: 1,
          status: 1,
          prizeDeliveryStatus: { $ifNull: ['$prizeDeliveryStatus', 'pending'] },
          codeActive: '$promoCode.isActive',
        },
      },
    ];

    const [items, countResult] = await Promise.all([
      ValidationLog.aggregate([...basePipeline, { $sort: { timestamp: -1 } }, { $skip: skip }, { $limit: limit }]),
      ValidationLog.aggregate([...basePipeline, { $count: 'total' }]),
    ]);

    const total = countResult.length ? countResult[0].total : 0;

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch winners', error, { adminId: req.admin?.id });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateAdminWinnerDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { prizeDeliveryStatus } = req.body;

    const updatedWinner = await ValidationLog.findOneAndUpdate(
      { _id: id, status: 'valid' },
      { $set: { prizeDeliveryStatus } },
      {
        new: true,
        projection: {
          _id: 1,
          code: 1,
          fullName: 1,
          email: 1,
          documentId: 1,
          prize: 1,
          timestamp: 1,
          prizeDeliveryStatus: 1,
        },
      }
    );

    if (!updatedWinner) {
      return res.status(404).json({
        success: false,
        message: 'Winner not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Prize delivery status updated',
      data: updatedWinner,
    });
  } catch (error) {
    logger.error('Failed to update winner delivery status', error, {
      adminId: req.admin?.id,
      winnerId: req.params?.id,
    });

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid winner id',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAdminDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const redeemableCodesFilter = {
      isActive: true,
      expirationDate: { $gte: now },
      $expr: { $lt: ['$usedCount', '$maxUses'] },
    };
    const doubleUseRedeemableFilter = {
      maxUses: 2,
      isActive: true,
      expirationDate: { $gte: now },
      $expr: { $lt: ['$usedCount', 2] },
    };

    const [
      totalCodes,
      validRedemptions,
      nonValidRedemptions,
      availableCodesCount,
      winnerCountResult,
      remainingUsesResult,
      productRedemptions,
      doubleUseStatsResult,
      doubleUseRedeemableRemainingUsesResult,
      doubleUseCodes,
      topPrizes,
      topProducts,
    ] = await Promise.all([
      PromotionalCode.countDocuments({}),
      ValidationLog.countDocuments({ status: 'valid' }),
      ValidationLog.countDocuments({ status: { $nin: ['valid', 'invalid'] } }),
      PromotionalCode.countDocuments(redeemableCodesFilter),
      ValidationLog.aggregate([
        { $match: { status: 'valid' } },
        {
          $lookup: {
            from: 'promotionalcodes',
            localField: 'code',
            foreignField: 'code',
            as: 'codeData',
          },
        },
        {
          $addFields: {
            promoCode: { $arrayElemAt: ['$codeData', 0] },
          },
        },
        {
          $match: {
            'promoCode.isActive': true,
          },
        },
        { $count: 'total' },
      ]),
      PromotionalCode.aggregate([
        { $match: redeemableCodesFilter },
        {
          $project: {
            remainingUses: {
              $max: [{ $subtract: ['$maxUses', '$usedCount'] }, 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$remainingUses' },
          },
        },
      ]),
      ValidationLog.aggregate([
        {
          $match: {
            status: { $ne: 'invalid' },
          },
        },
        {
          $group: {
            _id: '$product',
            validCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'valid'] }, 1, 0],
              },
            },
            nonValidCount: {
              $sum: {
                $cond: [{ $and: [{ $ne: ['$status', 'valid'] }, { $ne: ['$status', 'invalid'] }] }, 1, 0],
              },
            },
          },
        },
        {
          $match: {
            $or: [{ validCount: { $gt: 0 } }, { nonValidCount: { $gt: 0 } }],
          },
        },
        {
          $sort: {
            validCount: -1,
            nonValidCount: -1,
          },
        },
      ]),
      PromotionalCode.aggregate([
        { $match: { maxUses: 2 } },
        {
          $project: {
            usedCount: 1,
            remainingUses: {
              $max: [{ $subtract: [2, '$usedCount'] }, 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalCodes: { $sum: 1 },
            redeemedCodes: {
              $sum: {
                $cond: [{ $gt: ['$usedCount', 0] }, 1, 0],
              },
            },
            fullyRedeemedCodes: {
              $sum: {
                $cond: [{ $gte: ['$usedCount', 2] }, 1, 0],
              },
            },
            oneUseLeftCodes: {
              $sum: {
                $cond: [{ $eq: ['$usedCount', 1] }, 1, 0],
              },
            },
            unusedCodes: {
              $sum: {
                $cond: [{ $eq: ['$usedCount', 0] }, 1, 0],
              },
            },
            remainingUsesTotal: {
              $sum: '$remainingUses',
            },
          },
        },
      ]),
      PromotionalCode.aggregate([
        { $match: doubleUseRedeemableFilter },
        {
          $project: {
            remainingUses: {
              $max: [{ $subtract: [2, '$usedCount'] }, 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$remainingUses' },
          },
        },
      ]),
      PromotionalCode.aggregate([
        { $match: { maxUses: 2 } },
        {
          $addFields: {
            remainingUses: {
              $max: [{ $subtract: [2, '$usedCount'] }, 0],
            },
            isExpired: {
              $lt: ['$expirationDate', now],
            },
          },
        },
        {
          $addFields: {
            stateLabel: {
              $switch: {
                branches: [
                  {
                    case: { $or: [{ $eq: ['$isActive', false] }, '$isExpired'] },
                    then: 'Unavailable',
                  },
                  {
                    case: { $gte: ['$usedCount', 2] },
                    then: 'Exhausted',
                  },
                  {
                    case: { $eq: ['$usedCount', 1] },
                    then: 'Partial',
                  },
                ],
                default: 'Available',
              },
            },
          },
        },
        {
          $addFields: {
            stateSort: {
              $switch: {
                branches: [
                  { case: { $eq: ['$stateLabel', 'Partial'] }, then: 1 },
                  { case: { $eq: ['$stateLabel', 'Available'] }, then: 2 },
                  { case: { $eq: ['$stateLabel', 'Exhausted'] }, then: 3 },
                ],
                default: 4,
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            code: 1,
            product: {
              $let: {
                vars: {
                  productText: { $trim: { input: { $ifNull: ['$product', ''] } } },
                },
                in: {
                  $cond: [{ $eq: ['$$productText', ''] }, 'N/A', '$$productText'],
                },
              },
            },
            usedCount: 1,
            maxUses: 1,
            remainingUses: 1,
            stateLabel: 1,
            isActive: 1,
            expirationDate: 1,
            isExpired: 1,
            stateSort: 1,
          },
        },
        { $sort: { stateSort: 1, usedCount: -1, expirationDate: 1, code: 1 } },
      ]),
      ValidationLog.aggregate([
        { $match: { status: 'valid' } },
        { $group: { _id: '$prize.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      ValidationLog.aggregate([
        { $match: { status: 'valid' } },
        { $group: { _id: '$product', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const activeWinners = winnerCountResult.length ? winnerCountResult[0].total : 0;
    const remainingUsesTotal = remainingUsesResult.length ? remainingUsesResult[0].total : 0;
    const doubleUseStats = doubleUseStatsResult.length
      ? {
          totalCodes: doubleUseStatsResult[0].totalCodes,
          redeemedCodes: doubleUseStatsResult[0].redeemedCodes,
          fullyRedeemedCodes: doubleUseStatsResult[0].fullyRedeemedCodes,
          oneUseLeftCodes: doubleUseStatsResult[0].oneUseLeftCodes,
          unusedCodes: doubleUseStatsResult[0].unusedCodes,
          remainingUsesTotal: doubleUseStatsResult[0].remainingUsesTotal,
        }
      : {
          totalCodes: 0,
          redeemedCodes: 0,
          fullyRedeemedCodes: 0,
          oneUseLeftCodes: 0,
          unusedCodes: 0,
          remainingUsesTotal: 0,
        };
    const doubleUseRedeemableRemainingUsesTotal = doubleUseRedeemableRemainingUsesResult.length
      ? doubleUseRedeemableRemainingUsesResult[0].total
      : 0;
    const doubleUseAvailableCodesCount = doubleUseCodes.filter((item) => item.stateLabel === 'Available').length;
    const redemptionRate = totalCodes > 0 ? Number(((validRedemptions / totalCodes) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalCodes,
        validRedeemedCodes: validRedemptions,
        nonValidRedeemedCodes: nonValidRedemptions,
        availableCodesCount,
        remainingUsesTotal,
        productRedemptions: productRedemptions.map((item) => ({
          product: item._id && String(item._id).trim() ? String(item._id).trim() : 'N/A',
          validCount: item.validCount,
          nonValidCount: item.nonValidCount,
        })),
        doubleUseStats: {
          ...doubleUseStats,
          availableCodesCount: doubleUseAvailableCodesCount,
          redeemableRemainingUsesTotal: doubleUseRedeemableRemainingUsesTotal,
        },
        doubleUseCodes: doubleUseCodes.map((item) => ({
          code: item.code,
          product: item.product,
          usedCount: item.usedCount,
          maxUses: item.maxUses,
          remainingUses: item.remainingUses,
          stateLabel: item.stateLabel,
          isActive: item.isActive,
          isExpired: item.isExpired,
          expirationDate: item.expirationDate,
        })),
        validRedemptions,
        activeWinners,
        redemptionRate,
        topPrizes: topPrizes.map((item) => ({ prizeType: item._id || 'N/A', count: item.count })),
        topProducts: topProducts.map((item) => ({ product: item._id || 'N/A', count: item.count })),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch admin dashboard summary', error, { adminId: req.admin?.id });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
