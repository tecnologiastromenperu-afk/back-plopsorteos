import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import PromotionalCode from '../models/PromotionalCode.js';
import { logger } from '../middleware/logger.js';

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

const normalizeCodePayload = (payload) => ({
  code: payload.code?.trim().toUpperCase(),
  prize: {
    type: payload.prize?.type?.trim(),
    description: payload.prize?.description?.trim(),
  },
  maxUses: Number(payload.maxUses),
  expirationDate: new Date(payload.expirationDate),
  product: payload.product ? payload.product.trim() : null,
  isActive: payload.isActive !== undefined ? payload.isActive : true,
});

export const createAdminCode = async (req, res) => {
  try {
    const data = normalizeCodePayload(req.body);

    const exists = await PromotionalCode.findOne({ code: data.code });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Code already exists',
      });
    }

    const created = await PromotionalCode.create(data);

    logger.audit('admin_code_created', {
      adminId: req.admin.id,
      code: created.code,
      prizeType: created.prize.type,
    });

    return res.status(201).json({
      success: true,
      message: 'Promotional code created',
      data: created,
    });
  } catch (error) {
    logger.error('Failed to create promotional code', error, { adminId: req.admin?.id });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const listAdminCodes = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { q, isActive, product, prizeType, status } = req.query;

    const filter = {};

    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    if (product) {
      filter.product = { $regex: product.trim(), $options: 'i' };
    }

    if (prizeType) {
      filter['prize.type'] = { $regex: prizeType.trim(), $options: 'i' };
    }

    if (q) {
      const regex = { $regex: q.trim(), $options: 'i' };
      filter.$or = [{ code: regex }, { product: regex }, { 'prize.type': regex }, { 'prize.description': regex }];
    }

    const now = new Date();
    if (status === 'expired') {
      filter.expirationDate = { $lt: now };
    }
    if (status === 'available') {
      filter.expirationDate = { $gte: now };
      filter.$expr = { $lt: ['$usedCount', '$maxUses'] };
    }

    const [items, total] = await Promise.all([
      PromotionalCode.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PromotionalCode.countDocuments(filter),
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
    logger.error('Failed to list promotional codes', error, { adminId: req.admin?.id });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAdminCodeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid code id' });
    }

    const item = await PromotionalCode.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Code not found' });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    logger.error('Failed to get promotional code', error, { adminId: req.admin?.id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateAdminCode = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid code id' });
    }

    const updates = {};
    const allowed = ['code', 'maxUses', 'usedCount', 'expirationDate', 'product', 'isActive', 'prize'];

    allowed.forEach((field) => {
      if (typeof req.body[field] !== 'undefined') {
        updates[field] = req.body[field];
      }
    });

    if (updates.code) {
      updates.code = String(updates.code).trim().toUpperCase();
    }

    if (updates.expirationDate) {
      updates.expirationDate = new Date(updates.expirationDate);
    }

    const updated = await PromotionalCode.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Code not found' });
    }

    logger.audit('admin_code_updated', {
      adminId: req.admin.id,
      codeId: id,
      code: updated.code,
      fields: Object.keys(updates),
    });

    return res.status(200).json({ success: true, message: 'Code updated', data: updated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Code already exists',
      });
    }

    logger.error('Failed to update promotional code', error, { adminId: req.admin?.id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteAdminCode = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid code id' });
    }

    const updated = await PromotionalCode.findByIdAndUpdate(
      id,
      { isActive: false },
      {
        new: true,
      }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Code not found' });
    }

    logger.audit('admin_code_deleted', {
      adminId: req.admin.id,
      codeId: id,
      code: updated.code,
    });

    return res.status(200).json({ success: true, message: 'Code disabled successfully' });
  } catch (error) {
    logger.error('Failed to delete promotional code', error, { adminId: req.admin?.id });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const parseBoolean = (raw, fallback = false) => {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    return ['1', 'true', 'yes', 'y'].includes(raw.toLowerCase());
  }
  return fallback;
};

const processImportRecords = async ({ records, upsert, adminId, source }) => {
  const seenCodes = new Set();
  const details = [];
  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < records.length; i += 1) {
    const row = records[i];
    const rowNumber = i + 2;

    try {
      const code = (row.code || '').trim().toUpperCase();
      const prizeType = (row.prizeType || '').trim();
      const prizeDescription = (row.prizeDescription || '').trim();
      const maxUses = parseInt(row.maxUses, 10);
      const expirationDate = new Date(row.expirationDate);
      const product = row.product ? row.product.trim() : null;
      const isActive = parseBoolean(row.isActive, true);

      if (!code || !prizeType || !prizeDescription) {
        throw new Error('code, prizeType and prizeDescription are required');
      }

      if (!Number.isInteger(maxUses) || maxUses < 1) {
        throw new Error('maxUses must be an integer >= 1');
      }

      if (Number.isNaN(expirationDate.getTime())) {
        throw new Error('expirationDate must be a valid date');
      }

      if (seenCodes.has(code)) {
        throw new Error('duplicate code inside file');
      }

      seenCodes.add(code);

      const payload = {
        code,
        prize: {
          type: prizeType,
          description: prizeDescription,
        },
        maxUses,
        expirationDate,
        product,
        isActive,
      };

      const existing = await PromotionalCode.findOne({ code });

      if (existing && !upsert) {
        throw new Error('code already exists (use upsert=true to update)');
      }

      if (existing && upsert) {
        await PromotionalCode.updateOne({ _id: existing._id }, payload);
        updatedCount += 1;
        details.push({ row: rowNumber, code, status: 'updated' });
        continue;
      }

      await PromotionalCode.create(payload);
      createdCount += 1;
      details.push({ row: rowNumber, code, status: 'created' });
    } catch (rowError) {
      failedCount += 1;
      details.push({ row: rowNumber, status: 'failed', reason: rowError.message });
    }
  }

  logger.audit('admin_code_import_file', {
    adminId,
    source,
    totalRows: records.length,
    createdCount,
    updatedCount,
    failedCount,
    upsert,
  });

  return {
    summary: {
      totalRows: records.length,
      createdCount,
      updatedCount,
      failedCount,
    },
    details,
  };
};

export const importAdminCodesCsv = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'CSV file is required' });
    }

    const upsert = parseBoolean(req.query.upsert, false);
    const csvText = req.file.buffer.toString('utf8');
    const records = parse(csvText, {
      columns: true,
      delimiter: ';',
      bom: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!records.length) {
      return res.status(400).json({ success: false, message: 'CSV file has no rows' });
    }

    const result = await processImportRecords({
      records,
      upsert,
      adminId: req.admin.id,
      source: 'csv',
    });

    return res.status(200).json({
      success: true,
      message: 'CSV import processed',
      ...result,
    });
  } catch (error) {
    logger.error('Failed to import CSV codes', error, {
      adminId: req.admin?.id,
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const importAdminCodesExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Excel file is required' });
    }

    const upsert = parseBoolean(req.query.upsert, false);
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return res.status(400).json({ success: false, message: 'Excel file has no sheets' });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const records = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
      blankrows: false,
    });

    if (!records.length) {
      return res.status(400).json({ success: false, message: 'Excel file has no rows' });
    }

    const result = await processImportRecords({
      records,
      upsert,
      adminId: req.admin.id,
      source: 'xlsx',
    });

    return res.status(200).json({
      success: true,
      message: 'Excel import processed',
      ...result,
    });
  } catch (error) {
    logger.error('Failed to import Excel codes', error, {
      adminId: req.admin?.id,
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
