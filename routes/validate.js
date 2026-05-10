import express from 'express';
import { validateCode, getHealth } from '../controllers/validateCode.js';
import { validateCodeInput } from '../middleware/validation.js';

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

export default router;
