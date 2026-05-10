import { body, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Validation error',
    errors: errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    })),
  });
};

export const adminLoginValidation = [
  body('email').trim().isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').isString().isLength({ min: 6, max: 100 }).withMessage('Password must be 6-100 chars'),
];

export const createCodeValidation = [
  body('code').trim().notEmpty().withMessage('Code is required').isLength({ min: 3, max: 40 }).withMessage('Code must be 3-40 chars'),
  body('prize.type').trim().notEmpty().withMessage('Prize type is required'),
  body('prize.description').trim().notEmpty().withMessage('Prize description is required'),
  body('maxUses').isInt({ min: 1 }).withMessage('maxUses must be >= 1'),
  body('expirationDate').isISO8601().withMessage('expirationDate must be a valid ISO date'),
  body('product').optional().isString().isLength({ min: 2, max: 100 }).withMessage('product must be 2-100 chars'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

export const updateCodeValidation = [
  body('code').optional().trim().isLength({ min: 3, max: 40 }).withMessage('Code must be 3-40 chars'),
  body('prize.type').optional().trim().notEmpty().withMessage('Prize type cannot be empty'),
  body('prize.description').optional().trim().notEmpty().withMessage('Prize description cannot be empty'),
  body('maxUses').optional().isInt({ min: 1 }).withMessage('maxUses must be >= 1'),
  body('usedCount').optional().isInt({ min: 0 }).withMessage('usedCount must be >= 0'),
  body('expirationDate').optional().isISO8601().withMessage('expirationDate must be a valid ISO date'),
  body('product').optional().isString().isLength({ min: 2, max: 100 }).withMessage('product must be 2-100 chars'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be 1-200'),
];
