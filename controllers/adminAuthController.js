import AdminUser from '../models/AdminUser.js';
import { comparePassword } from '../utils/password.js';
import { signAdminAccessToken } from '../utils/jwt.js';
import { logger } from '../middleware/logger.js';

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminUser.findOne({ email: email.toLowerCase().trim(), isActive: true }).select('+passwordHash');

    if (!admin) {
      logger.audit('admin_login_failed', {
        email,
        reason: 'admin_not_found',
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isValidPassword = await comparePassword(password, admin.passwordHash);
    if (!isValidPassword) {
      logger.audit('admin_login_failed', {
        email,
        reason: 'invalid_password',
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = signAdminAccessToken(admin);

    logger.audit('admin_login_success', {
      adminId: admin._id,
      email: admin.email,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (error) {
    logger.error('Admin login failed with server error', error, {
      email: req.body?.email,
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAdminMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin,
  });
};
