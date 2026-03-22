import { Order } from '../models/order.models.js'
import { User } from '../models/user.models.js'
import VendorProfile from '../models/vendorProfile.models.js'
import logger from './logger.js'

// Helper — drop index if exists then recreate
const safeCreateIndex = async (collection, indexSpec, options = {}) => {
    try {
        await collection.createIndex(indexSpec, options)
    } catch (err) {
        if (err.code === 85) {
            // IndexOptionsConflict — drop and recreate
            const indexName = Object.keys(indexSpec)
                .map(k => `${k}_${indexSpec[k]}`).join('_')
            try {
                await collection.dropIndex(indexName)
                await collection.createIndex(indexSpec, options)
            } catch (dropErr) {
                logger.error(`Index drop/recreate failed: ${dropErr.message}`)
            }
        } else if (err.code === 86) {
            // IndexKeySpecsConflict — skip, already exists correctly
        } else {
            throw err
        }
    }
}

export const setupIndexes = async () => {
    try {
        // Order indexes
        await safeCreateIndex(Order.collection, { customerId: 1, createdAt: -1 })
        await safeCreateIndex(Order.collection, { vendorId: 1, status: 1, createdAt: -1 })
        await safeCreateIndex(Order.collection, { status: 1, createdAt: 1 })
        await safeCreateIndex(Order.collection, { pickupToken: 1 })

        // User indexes
        await safeCreateIndex(User.collection, { email: 1 }, { unique: true })
        await safeCreateIndex(User.collection, { referralCode: 1 }, { unique: true, sparse: true })
        await safeCreateIndex(User.collection, { phone: 1 }, { unique: true, sparse: true })

        // Vendor indexes
        await safeCreateIndex(VendorProfile.collection, { userId: 1 }, { unique: true })
        await safeCreateIndex(VendorProfile.collection, { isOpen: 1, 'rating.average': -1 })

        // 2dsphere — only if location field exists in model
        try {
            await VendorProfile.collection.createIndex({ location: '2dsphere' })
        } catch (geoErr) {
            logger.error(`2dsphere index skipped: ${geoErr.message}`)
        }

        logger.info('✅ MongoDB indexes setup complete')
    } catch (err) {
        logger.error(`Index setup error: ${err.message}`)
    }
}