import express from 'express';
import {
  getAdminRedemptions,
  getAdminWinners,
  getAdminDashboardSummary,
  updateAdminWinnerDeliveryStatus,
} from '../controllers/adminReportsController.js';
import {
  paginationValidation,
  winnersReportValidation,
  updateWinnerDeliveryStatusValidation,
  handleValidationErrors,
} from '../middleware/adminValidation.js';
import { requireAdminAuth } from '../middleware/requireAdminAuth.js';

const router = express.Router();

router.use(requireAdminAuth);

router.get('/redemptions', paginationValidation, handleValidationErrors, getAdminRedemptions);
router.get('/winners', winnersReportValidation, handleValidationErrors, getAdminWinners);
router.patch(
  '/winners/:id/delivery-status',
  updateWinnerDeliveryStatusValidation,
  handleValidationErrors,
  updateAdminWinnerDeliveryStatus
);
router.get('/dashboard/summary', getAdminDashboardSummary);

export default router;
