import express from 'express';
import {
  getAdminRedemptions,
  getAdminWinners,
  getAdminDashboardSummary,
} from '../controllers/adminReportsController.js';
import { paginationValidation, handleValidationErrors } from '../middleware/adminValidation.js';
import { requireAdminAuth } from '../middleware/requireAdminAuth.js';

const router = express.Router();

router.use(requireAdminAuth);

router.get('/redemptions', paginationValidation, handleValidationErrors, getAdminRedemptions);
router.get('/winners', paginationValidation, handleValidationErrors, getAdminWinners);
router.get('/dashboard/summary', getAdminDashboardSummary);

export default router;
