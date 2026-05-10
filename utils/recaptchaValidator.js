import axios from 'axios';
import { RECAPTCHA_CONFIG } from '../config/recaptcha.js';
import { logger } from '../middleware/logger.js';

export const validateRecaptcha = async (recaptchaToken) => {
  try {
    if (RECAPTCHA_CONFIG.skipValidation) {
      logger.warn('reCAPTCHA validation skipped by configuration', {
        environment: process.env.NODE_ENV || 'development',
      });
      return {
        valid: true,
        score: 1,
        action: 'bypassed_local',
      };
    }

    if (!recaptchaToken) {
      return {
        valid: false,
        reason: 'No recaptcha token provided',
      };
    }

    const response = await axios.post(RECAPTCHA_CONFIG.verifyUrl, null, {
      params: {
        secret: RECAPTCHA_CONFIG.secretKey,
        response: recaptchaToken,
      },
    });

    console.log("captcha:", response.data );
    

    const { success, score, action } = response.data;

    if (!success) {
      logger.warn('reCAPTCHA validation failed', {
        success,
        action,
      });
      return {
        valid: false,
        reason: 'reCAPTCHA validation failed',
      };
    }

    if (score < RECAPTCHA_CONFIG.minScore) {
      logger.warn('reCAPTCHA score too low', {
        score,
        minScore: RECAPTCHA_CONFIG.minScore,
      });
      return {
        valid: false,
        reason: 'reCAPTCHA score too low',
        score,
      };
    }

    return {
      valid: true,
      score,
      action,
    };
  } catch (error) {
    logger.error('reCAPTCHA validation error', error, {
      recaptchaToken: recaptchaToken ? recaptchaToken.substring(0, 20) + '...' : 'none',
    });
    return {
      valid: false,
      reason: 'reCAPTCHA service error',
    };
  }
};
