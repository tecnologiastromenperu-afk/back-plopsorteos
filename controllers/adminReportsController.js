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
    const { q, from, to, prizeType } = req.query;

    const match = {
      status: 'valid',
    };

    const range = dateRangeFilter(from, to);
    if (range) {
      match.timestamp = range;
    }

    if (prizeType) {
      match['prize.type'] = { $regex: prizeType.trim(), $options: 'i' };
    }

    if (q) {
      const regex = { $regex: q.trim(), $options: 'i' };
      match.$or = [{ code: regex }, { email: regex }, { documentId: regex }, { fullName: regex }];
    }

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

export const getAdminDashboardSummary = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalCodes,
      activeCodes,
      expiredCodes,
      validRedemptions,
      winnerCountResult,
      topPrizes,
      topProducts,
    ] = await Promise.all([
      PromotionalCode.countDocuments({}),
      PromotionalCode.countDocuments({ isActive: true, expirationDate: { $gte: now } }),
      PromotionalCode.countDocuments({ expirationDate: { $lt: now } }),
      ValidationLog.countDocuments({ status: 'valid' }),
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
    const redemptionRate = totalCodes > 0 ? Number(((validRedemptions / totalCodes) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalCodes,
        activeCodes,
        expiredCodes,
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
