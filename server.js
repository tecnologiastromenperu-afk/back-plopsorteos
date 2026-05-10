import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDatabase from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import validateRoutes from './routes/validate.js';
import adminAuthRoutes from './routes/adminAuth.js';
import adminCodesRoutes from './routes/adminCodes.js';
import adminReportsRoutes from './routes/adminReports.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ADMIN_FRONTEND_URL = process.env.ADMIN_FRONTEND_URL || 'https://admin.plopsorteos.com';
const CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS || '';
const ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS
  ? CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [FRONTEND_URL, ADMIN_FRONTEND_URL];

// ============================================
// MIDDLEWARE - Security & Parsing
// ============================================

// Helmet - Set security HTTP headers
app.use(helmet());

// CORS - Enable requests from frontend
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Body parser - Parse JSON requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  },
});

app.use(limiter);

// ============================================
// LOGGING MIDDLEWARE
// ============================================

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ============================================
// DATABASE CONNECTION
// ============================================

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // ============================================
    // ROUTES
    // ============================================

    // API Routes
    app.use('/api', validateRoutes);
    app.use('/api/admin/auth', adminAuthRoutes);
    app.use('/api/admin/codes', adminCodesRoutes);
    app.use('/api/admin/reports', adminReportsRoutes);

    // Health check on root
    app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'PLOP Sorteos Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });

    // ============================================
    // ERROR HANDLING
    // ============================================

    // 404 handler
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    // ============================================
    // SERVER STARTUP
    // ============================================

    app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        frontendUrl: FRONTEND_URL,
        adminFrontendUrl: ADMIN_FRONTEND_URL,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', reason, {
    promise: promise.toString(),
  });
  process.exit(1);
});
