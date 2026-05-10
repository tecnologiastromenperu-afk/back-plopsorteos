import AdminUser from '../models/AdminUser.js';
import { logger } from './logger.js';
import { verifyAdminAccessToken } from '../utils/jwt.js';

export const requireAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing authorization token',
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const payload = verifyAdminAccessToken(token);

    if (payload.type !== 'admin_access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
      });
    }

    const admin = await AdminUser.findOne({
      _id: payload.sub,
      isActive: true,
    }).select('+passwordHash');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin user not found or inactive',
      });
    }

    req.admin = {
      id: admin._id.toString(),
      email: admin.email,
      fullName: admin.fullName,
      isActive: admin.isActive,
    };

    next();
  } catch (error) {
    logger.warn('Admin auth failed', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      reason: error.message,
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
