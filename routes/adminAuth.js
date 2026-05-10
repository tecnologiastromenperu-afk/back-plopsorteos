import express from 'express';
import rateLimit from 'express-rate-limit';
import { adminLogin, getAdminMe } from '../controllers/adminAuthController.js';
import { adminLoginValidation, handleValidationErrors } from '../middleware/adminValidation.js';
import { requireAdminAuth } from '../middleware/requireAdminAuth.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
  },
});

router.post('/login', loginLimiter, adminLoginValidation, handleValidationErrors, adminLogin);
router.get('/me', requireAdminAuth, getAdminMe);

export default router;
