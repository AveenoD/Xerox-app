import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { app, startJobs } from './app.js';
import connectDB from './config/database.js';
import { initializeSocket } from './socket/index.js';
import { logger } from './utils/logger.js';
import { SERVER_CONFIG } from './config/constants.js';

const PORT = SERVER_CONFIG.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();

    // Create HTTP server
    const server = createServer(app);

    // Initialize Socket.io
    initializeSocket(server);

    // Start background jobs
    startJobs();

    // Start server
    server.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🚀 XConnect API Server                             ║
║                                                      ║
║   Environment: ${SERVER_CONFIG.NODE_ENV.padEnd(25)}║
║   Port: ${PORT.toString().padEnd(43)}║
║   Base URL: ${SERVER_CONFIG.BASE_URL.padEnd(36)}║
║                                                      ║
║   Endpoints:                                         ║
║   • Health: http://localhost:${PORT}/health           ║
║   • API:     http://localhost:${PORT}/api            ║
║   • Terms:   http://localhost:${PORT}/terms          ║
║   • Privacy: http://localhost:${PORT}/privacy        ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`[Server] ${signal} received. Shutting down gracefully...`);

      server.close(() => {
        logger.info('[Server] HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('[Server] Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    logger.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

startServer();
