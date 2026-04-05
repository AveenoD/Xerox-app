import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/multer.middleware.js'
import { analyzePDF, fixPDF } from '../utils/pdfProcessor.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import logger from '../utils/logger.js'

const router = Router()

// POST /api/files/upload - Analyze PDF for issues
router.post('/upload', 
    verifyJWT,
    upload.single('document'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new ApiError(400, 'No file uploaded')
        }

        // Check if file is PDF
        if (req.file.mimetype !== 'application/pdf') {
            throw new ApiError(400, 'Only PDF files are allowed')
        }

        try {
            const fs = await import('fs/promises')
            const pdfBuffer = await fs.readFile(req.file.path)
            
            const analysis = await analyzePDF(pdfBuffer)
            
            logger.info(`PDF analyzed: ${req.file.originalname} - ${analysis.totalPages} pages, issues: ${analysis.hasIssues}`)

            // Store file path in temp for potential fix operation
            req.app.locals.tempFiles = req.app.locals.tempFiles || {}
            req.app.locals.tempFiles[req.user._id] = {
                path: req.file.path,
                originalname: req.file.originalname,
                timestamp: Date.now()
            }

            return res.status(200).json(
                new ApiResponse(200, analysis, 'PDF analyzed successfully')
            )
        } catch (error) {
            logger.error('PDF upload analysis failed:', error)
            throw new ApiError(500, 'Failed to analyze PDF: ' + error.message)
        }
    })
)

// POST /api/files/fix - Fix PDF issues
router.post('/fix',
    verifyJWT,
    asyncHandler(async (req, res) => {
        const tempFiles = req.app.locals.tempFiles || {}
        const tempFile = tempFiles[req.user._id]

        if (!tempFile) {
            throw new ApiError(400, 'No file to fix. Please upload first.')
        }

        // Check if temp file is still valid (10 minutes)
        if (Date.now() - tempFile.timestamp > 10 * 60 * 1000) {
            // Clean up old file
            try {
                const fs = await import('fs/promises')
                await fs.unlink(tempFile.path)
            } catch (err) {
                logger.warn('Failed to clean up old temp file:', err)
            }
            delete tempFiles[req.user._id]
            throw new ApiError(400, 'File expired. Please upload again.')
        }

        try {
            const fs = await import('fs/promises')
            const pdfBuffer = await fs.readFile(tempFile.path)
            
            const fixedBuffer = await fixPDF(pdfBuffer)
            
            // Save fixed file
            const fixedPath = tempFile.path.replace('.pdf', '_fixed.pdf')
            await fs.writeFile(fixedPath, fixedBuffer)

            // Update temp file reference
            tempFiles[req.user._id] = {
                path: fixedPath,
                originalname: tempFile.originalname.replace('.pdf', '_fixed.pdf'),
                timestamp: Date.now(),
                fixed: true
            }

            logger.info(`PDF fixed: ${tempFile.originalname}`)

            return res.status(200).json(
                new ApiResponse(200, {
                    fixed: true,
                    path: fixedPath,
                    size: fixedBuffer.length
                }, 'PDF fixed successfully')
            )
        } catch (error) {
            logger.error('PDF fix failed:', error)
            throw new ApiError(500, 'Failed to fix PDF: ' + error.message)
        }
    })
)

// GET /api/files/temp/:userId - Get temp file (internal use)
router.get('/temp/:userId',
    verifyJWT,
    asyncHandler(async (req, res) => {
        // Only allow accessing own temp files
        if (req.params.userId !== req.user._id.toString()) {
            throw new ApiError(403, 'Unauthorized')
        }

        const tempFiles = req.app.locals.tempFiles || {}
        const tempFile = tempFiles[req.user._id]

        if (!tempFile) {
            throw new ApiError(404, 'No temp file found')
        }

        return res.status(200).json(
            new ApiResponse(200, {
                path: tempFile.path,
                originalname: tempFile.originalname,
                fixed: tempFile.fixed || false
            }, 'Temp file info')
        )
    })
)

export default router
