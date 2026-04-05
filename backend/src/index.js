import dotenv from 'dotenv'
dotenv.config()

import connectDB from './database/index.js'
import { app } from './app.js'
import { startSLAChecker } from './utils/slaChecker.js'
import { startFileExpiryCron } from './utils/fileExpiry.js'
import { setupIndexes } from './utils/setupIndexes.js'
import logger from './utils/logger.js'

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
        name: err.name,
        message: err.message,
        stack: err.stack
    });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', {
        name: err.name,
        message: err.message,
        stack: err.stack
    });
    // Close server & exit process
    server.close(() => {
        process.exit(1);
    });
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Process terminated!');
    });
});

let server;

connectDB()
    .then(async () => {
        // Setup indexes first
        await setupIndexes()

        // Start cron jobs
        startSLAChecker()
        startFileExpiryCron()

        server = app.listen(process.env.PORT || 5000, () => {
            logger.info(`Server running on http://localhost:${process.env.PORT || 5000}`)
        })
    })
    .catch((err) => {
        logger.error('DB connection failed:', err)
        process.exit(1)
    })