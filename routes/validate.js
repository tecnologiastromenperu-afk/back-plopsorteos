import express from 'express';
import { validateCode, getHealth, getWinners } from '../controllers/validateCode.js';
import { validateCodeInput, winnersQueryValidation, validationErrorHandler } from '../middleware/validation.js';

const router = express.Router();

/**
 * POST /api/validate-code
 * Validates a promotional code and returns the associated prize if valid
 */
router.post('/validate-code', validateCodeInput, validateCode);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', getHealth);

/**
 * GET /api/winners
 * Lists winners with limited personal data
 */
router.get('/winners', winnersQueryValidation, validationErrorHandler, getWinners);

export default router;
