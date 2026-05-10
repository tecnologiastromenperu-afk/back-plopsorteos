import { validationResult } from 'express-validator';
import PromotionalCode from '../models/PromotionalCode.js';
import ValidationLog from '../models/ValidationLog.js';
import { validateRecaptcha } from '../utils/recaptchaValidator.js';
import { logger } from '../middleware/logger.js';

export const validateCode = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation input errors', {
        errors: errors.array(),
        email: req.body.email,
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array(),
      });
    }

    const { code, fullName, documentId, email, phone, product, recaptchaToken } = req.body;
    const userAgent = req.get('user-agent');
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Step 1: Validate reCAPTCHA
    logger.info('Starting validation process', { code: code.substring(0, 4) + '***', email });

    const recaptchaValidation = await validateRecaptcha(recaptchaToken);
    
    if (!recaptchaValidation.valid) {
      logger.audit('validation_attempt', {
        code,
        email,
        status: 'recaptcha_failed',
        reason: recaptchaValidation.reason,
      });

      await logValidationAttempt({
        code,
        email,
        documentId,
        fullName,
        phone,
        product,
        status: 'recaptcha_failed',
        reason: recaptchaValidation.reason,
        userAgent,
        ipAddress,
      });

      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA validation failed',
        reason: 'recaptcha_validation_failed',
      });
    }

    logger.info('reCAPTCHA validation passed', { score: recaptchaValidation.score });

    // Step 2: Find promotional code in database
    const promotionalCode = await PromotionalCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!promotionalCode) {
      logger.audit('validation_attempt', {
        code,
        email,
        status: 'not_found',
      });

      await logValidationAttempt({
        code,
        email,
        documentId,
        fullName,
        phone,
        product,
        status: 'not_found',
        reason: 'Code does not exist or is inactive',
        recaptchaScore: recaptchaValidation.score,
        userAgent,
        ipAddress,
      });

      return res.status(404).json({
        success: false,
        message: 'Promotional code not found',
        reason: 'invalid_code',
      });
    }

    // Step 3: Check if code has expired
    const now = new Date();
    if (promotionalCode.expirationDate < now) {
      logger.audit('validation_attempt', {
        code,
        email,
        status: 'expired',
      });

      await logValidationAttempt({
        code,
        email,
        documentId,
        fullName,
        phone,
        product,
        status: 'expired',
        reason: 'Code has expired',
        recaptchaScore: recaptchaValidation.score,
        userAgent,
        ipAddress,
      });

      return res.status(400).json({
        success: false,
        message: 'Promotional code has expired',
        reason: 'code_expired',
      });
    }

    // Step 4: Check if code has available uses
    if (promotionalCode.usedCount >= promotionalCode.maxUses) {
      logger.audit('validation_attempt', {
        code,
        email,
        status: 'max_uses_exceeded',
      });

      await logValidationAttempt({
        code,
        email,
        documentId,
        fullName,
        phone,
        product,
        status: 'max_uses_exceeded',
        reason: 'Code has reached maximum uses',
        recaptchaScore: recaptchaValidation.score,
        userAgent,
        ipAddress,
      });

      return res.status(400).json({
        success: false,
        message: 'Promotional code has reached maximum uses',
        reason: 'max_uses_exceeded',
      });
    }

    // Step 5: Increment used count
    promotionalCode.usedCount++;
    await promotionalCode.save();

    logger.audit('validation_attempt', {
      code,
      email,
      status: 'valid',
      prize: promotionalCode.prize.type,
    });

    // Step 6: Log successful validation
    await logValidationAttempt({
      code,
      email,
      documentId,
      fullName,
      phone,
      product,
      prize: promotionalCode.prize,
      status: 'valid',
      recaptchaScore: recaptchaValidation.score,
      userAgent,
      ipAddress,
    });

    logger.info('Code validation successful', {
      code: code.substring(0, 4) + '***',
      email,
      prize: promotionalCode.prize.type,
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: '¡Código válido! Has ganado un premio',
      prize: {
        type: promotionalCode.prize.type,
        description: promotionalCode.prize.description,
      },
    });
  } catch (error) {
    logger.error('Unexpected error during code validation', error, {
      code: req.body?.code,
      email: req.body?.email,
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      reason: 'server_error',
    });
  }
};

const logValidationAttempt = async (details) => {
  try {
    const log = new ValidationLog(details);
    await log.save();
  } catch (error) {
    logger.error('Failed to log validation attempt', error, details);
  }
};

export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
};
