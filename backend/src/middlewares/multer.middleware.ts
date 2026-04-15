import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FILE_CONFIG, SUBSCRIPTION_PLANS } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';

// Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = FILE_CONFIG.ALLOWED_MIME_TYPES;

  if (allowedMimes.includes(file.mimetype as typeof allowedMimes[number])) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type. Allowed: ${allowedMimes.join(', ')}`
      ) as unknown as Error
    );
  }
};

// Default upload middleware (10MB limit)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_CONFIG.MAX_FILE_SIZE_TRIAL,
  },
});

// Get file size limit based on vendor plan
export const getFileSizeLimit = (plan: string): number => {
  switch (plan) {
    case 'starter':
      return FILE_CONFIG.MAX_FILE_SIZE_STARTER;
    case 'growth':
      return FILE_CONFIG.MAX_FILE_SIZE_GROWTH;
    case 'premium':
      return FILE_CONFIG.MAX_FILE_SIZE_PREMIUM;
    default:
      return FILE_CONFIG.MAX_FILE_SIZE_TRIAL;
  }
};

// Upload with custom size limit
export const uploadWithLimit = (maxSizeMB: number) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  });
};
