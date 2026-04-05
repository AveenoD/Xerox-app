import dotenv  from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import logger from './utils/logger.js';
import { ApiError } from './utils/ApiError.js';

// Load OpenAPI specification
const swaggerDocument = YAML.load('./openapi.yml');

const app = express();

// Security middleware - Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) 
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400
}));

// Body parsing middleware
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});


// Routes
import authRouter from './routes/auth.routes.js'
app.use('/api/auth', authRouter)

import userRouter from './routes/user.routes.js'
app.use('/api/user', userRouter)

import vendorRouter from './routes/vendor.routes.js'
app.use('/api/vendor', vendorRouter)

import orderRouter from './routes/orders.routes.js'
app.use('/api/orders', orderRouter)
import ratingRouter from './routes/rating.routes.js'
app.use('/api/rating', ratingRouter)

import WalletRouter from './routes/Wallet.routes.js'
app.use('/api/wallet', WalletRouter)

import ReferralRouter from './routes/Referral.routes.js'
app.use('/api/referral', ReferralRouter)

import DisputeRouter from './routes/Dispute.routes.js'
app.use('/api/dispute', DisputeRouter)

import fileRouter from './routes/file.routes.js'
app.use('/api/files', fileRouter)

import vendorPlanRouter from './routes/vendorPlan.routes.js'
app.use('/api/vendor-plans', vendorPlanRouter)

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'XConnect API Documentation'
}));

// API Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// 404 Handler - Route not found
app.use((req, res, next) => {
    const error = new ApiError(404, `Route ${req.originalUrl} not found`);
    next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
    // Log error
    logger.error(`${err.name}: ${err.message}`, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        stack: err.stack
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            statusCode: 400,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            statusCode: 400,
            message: `Invalid ${err.path}: ${err.value}`
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            statusCode: 409,
            message: `${field} already exists`
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            statusCode: 401,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            statusCode: 401,
            message: 'Token expired'
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    return res.status(statusCode).json({
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

export { app };