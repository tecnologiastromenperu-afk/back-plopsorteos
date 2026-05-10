import { body, validationResult } from 'express-validator';

const isRecaptchaBypassed = String(process.env.RECAPTCHA_SKIP_VALIDATION || 'false').toLowerCase() === 'true';

export const validateCodeInput = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Code must be between 3 and 20 characters'),
  
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Full name must be between 3 and 100 characters'),
  
  body('documentId')
    .trim()
    .notEmpty()
    .withMessage('Document ID is required')
    .isNumeric()
    .withMessage('Document ID must be numeric')
    .isLength({ min: 5, max: 20 })
    .withMessage('Document ID must be between 5 and 20 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isLength({ min: 7, max: 15 })
    .withMessage('Phone must be between 7 and 15 characters'),
  
  body('product')
    .trim()
    .notEmpty()
    .withMessage('Product is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Product must be between 3 and 100 characters'),
  
  body('recaptchaToken')
    .if(() => !isRecaptchaBypassed)
    .trim()
    .notEmpty()
    .withMessage('reCAPTCHA token is required')
    .isLength({ min: 10 })
    .withMessage('Invalid reCAPTCHA token'),
];

export const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};
