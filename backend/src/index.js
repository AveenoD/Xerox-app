import dotenv from 'dotenv'
dotenv.config()

import connectDB from './database/index.js'
import { app } from './app.js'
import { startSLAChecker } from './utils/slaChecker.js'
import { startFileExpiryCron } from './utils/fileExpiry.js'
import { setupIndexes } from './utils/setupIndexes.js'
import logger from './utils/logger.js'

connectDB()
    .then(async () => {
        // Setup indexes first
        await setupIndexes()

        // Start cron jobs
        startSLAChecker()
        startFileExpiryCron()

        app.listen(process.env.PORT || 5000, () => {
            logger.info(`✅ Server running on http://localhost:${process.env.PORT || 5000}`)
        })
    })
    .catch((err) => {
        logger.error('DB connection failed:', err)
        process.exit(1)
    })