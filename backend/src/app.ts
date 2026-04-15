import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import routes
import authRoutes from './routes/auth.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import orderRoutes from './routes/order.routes.js';
import walletRoutes from './routes/wallet.routes.js';

// Import middlewares
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';

// Import jobs
import { startSlaCheckerJob } from './jobs/slaChecker.job.js';
import { startFileExpiryJob } from './jobs/fileExpiry.job.js';
import { startChallengeCheckerJob } from './jobs/challengeChecker.job.js';

import { logger } from './utils/logger.js';
import { SERVER_CONFIG } from './config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: SERVER_CONFIG.CLIENT_URL,
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/temp')));

// API limiter
app.use('/api', apiLimiter);

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'XConnect API',
      version: '1.0.0',
      description: 'Print-on-demand marketplace API (Zepto/Swiggy/Ola style)',
      contact: { name: 'XConnect Support', email: 'support@xconnect.app' },
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development' },
      { url: 'https://api.xconnect.app/api', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'accessToken' },
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./openapi.yml'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: SERVER_CONFIG.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);

// Legal pages (served as HTML)
app.get('/terms', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/legal/terms.html'));
});

app.get('/privacy', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/legal/privacy.html'));
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start background jobs
const startJobs = (): void => {
  try {
    startSlaCheckerJob();
    startFileExpiryJob();
    startChallengeCheckerJob();
    logger.info('[Jobs] All background jobs started');
  } catch (error) {
    logger.error('[Jobs] Error starting background jobs:', error);
  }
};

// Export for testing
export { app, startJobs };

export default app;
