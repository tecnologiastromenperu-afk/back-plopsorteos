import { logger } from './logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.stack }),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
};
