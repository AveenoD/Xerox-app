import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, '../../public/temp');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    logger.info('Created directory:', tempDir);
}

// Allowed MIME types for uploads
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// File filter for strict MIME type validation
const fileFilter = (req, file, cb) => {
    // Check MIME type
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        logger.warn(`Rejected file upload: Invalid MIME type ${file.mimetype}`);
        return cb(new Error(`Invalid file type. Allowed types: JPG, PNG, WEBP, PDF`), false);
    }

    // Additional extension check for extra security
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    
    if (!allowedExtensions.includes(ext)) {
        logger.warn(`Rejected file upload: Invalid extension ${ext}`);
        return cb(new Error(`Invalid file extension. Allowed: .jpg, .jpeg, .png, .webp, .pdf`), false);
    }

    // Validate MIME type matches extension
    const mimeToExt = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'application/pdf': ['.pdf']
    };

    const expectedExts = mimeToExt[file.mimetype];
    if (expectedExts && !expectedExts.includes(ext)) {
        logger.warn(`Rejected file upload: MIME type ${file.mimetype} does not match extension ${ext}`);
        return cb(new Error('File extension does not match content type'), false);
    }

    logger.info(`Accepted file upload: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
};

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Sanitize filename - remove special characters
        const sanitizedName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 100);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + sanitizedName);
    }
});

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
        files: 1, // Only 1 file per request
        fields: 20 // Max 20 form fields
    }
});

// Specific upload configurations for different use cases
export const uploadAvatar = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            return cb(new Error('Only image files (JPG, PNG, WEBP) are allowed for avatars'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for avatars
        files: 1
    }
});

export const uploadDocument = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
            return cb(new Error('Only PDF files are allowed for documents'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for documents
        files: 1
    }
});