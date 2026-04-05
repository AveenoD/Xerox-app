import { PDFDocument, degrees, PageSizes } from 'pdf-lib'
import logger from './logger.js'

// A4 dimensions in points (1 inch = 72 points)
const A4_WIDTH = PageSizes.A4[0] // 595.28
const A4_HEIGHT = PageSizes.A4[1] // 841.89

// Threshold for blank page detection (in bytes)
const BLANK_PAGE_THRESHOLD = 100

// Size tolerance for A4 detection (±5%)
const SIZE_TOLERANCE = 0.05

/**
 * Analyze PDF for issues: landscape pages, non-A4 sizes, blank pages
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Object} Analysis results
 */
export const analyzePDF = async (pdfBuffer) => {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer)
        const pages = pdfDoc.getPages()
        const totalPages = pages.length

        const landscapePages = []
        const mixedSizePages = []
        const blankPages = []

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i]
            const { width, height } = page.getSize()

            // Check for landscape orientation
            if (width > height) {
                landscapePages.push({
                    page: i + 1,
                    width: Math.round(width),
                    height: Math.round(height)
                })
            }

            // Check for non-A4 sizes
            const isA4Width = Math.abs(width - A4_WIDTH) <= A4_WIDTH * SIZE_TOLERANCE
            const isA4Height = Math.abs(height - A4_HEIGHT) <= A4_HEIGHT * SIZE_TOLERANCE
            const isA4 = isA4Width && isA4Height

            if (!isA4) {
                mixedSizePages.push({
                    page: i + 1,
                    width: Math.round(width),
                    height: Math.round(height),
                    expected: 'A4 (595x842 pts)'
                })
            }

            // Note: Blank page detection is done at file level
            // Individual page content detection requires more complex logic
        }

        // Detect blank pages by analyzing page content streams
        const pdfBytes = await pdfDoc.save()
        const pageContents = await extractPageContents(pdfBytes)
        
        pageContents.forEach((content, index) => {
            if (content.byteLength < BLANK_PAGE_THRESHOLD) {
                blankPages.push({
                    page: index + 1,
                    size: content.byteLength
                })
            }
        })

        const hasIssues = landscapePages.length > 0 || 
                         mixedSizePages.length > 0 || 
                         blankPages.length > 0

        return {
            hasIssues,
            landscapePages,
            mixedSizePages,
            blankPages,
            totalPages
        }
    } catch (error) {
        logger.error('PDF analysis failed:', error)
        throw new Error('Failed to analyze PDF: ' + error.message)
    }
}

/**
 * Fix PDF issues: rotate landscape, normalize to A4, remove blank pages
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Buffer} Fixed PDF buffer
 */
export const fixPDF = async (pdfBuffer) => {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer)
        const pages = pdfDoc.getPages()
        const pagesToRemove = []

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i]
            const { width, height } = page.getSize()

            // Check if page is blank
            const isBlank = await isPageBlank(pdfDoc, i)
            if (isBlank) {
                pagesToRemove.push(i)
                continue
            }

            // Rotate landscape to portrait
            if (width > height) {
                page.setRotation(degrees(90))
                // Swap dimensions after rotation
                page.setSize(height, width)
            }

            // Normalize to A4 if significantly different
            const isA4Width = Math.abs(width - A4_WIDTH) <= A4_WIDTH * SIZE_TOLERANCE
            const isA4Height = Math.abs(height - A4_HEIGHT) <= A4_HEIGHT * SIZE_TOLERANCE
            
            if (!isA4Width || !isA4Height) {
                // Scale page to A4 while maintaining aspect ratio
                const scaleX = A4_WIDTH / width
                const scaleY = A4_HEIGHT / height
                const scale = Math.min(scaleX, scaleY)
                
                page.scale(scale, scale)
                page.setSize(A4_WIDTH, A4_HEIGHT)
            }
        }

        // Remove blank pages (in reverse order to maintain indices)
        for (let i = pagesToRemove.length - 1; i >= 0; i--) {
            pdfDoc.removePage(pagesToRemove[i])
        }

        const fixedPdfBytes = await pdfDoc.save()
        logger.info(`PDF fixed: removed ${pagesToRemove.length} blank pages, normalized ${pages.length - pagesToRemove.length} pages`)
        
        return Buffer.from(fixedPdfBytes)
    } catch (error) {
        logger.error('PDF fix failed:', error)
        throw new Error('Failed to fix PDF: ' + error.message)
    }
}

/**
 * Extract page contents for blank page detection
 * @param {Uint8Array} pdfBytes - PDF bytes
 * @returns {Array<Uint8Array>} Page content streams
 */
async function extractPageContents(pdfBytes) {
    try {
        const pdfDoc = await PDFDocument.load(pdfBytes)
        const pages = pdfDoc.getPages()
        const contents = []

        for (const page of pages) {
            // Get content stream
            const contentStream = page.node.Contents()
            if (contentStream) {
                const content = await contentStream.bytes()
                contents.push(content)
            } else {
                contents.push(new Uint8Array(0))
            }
        }

        return contents
    } catch (error) {
        logger.error('Page content extraction failed:', error)
        return []
    }
}

/**
 * Check if a page is blank by analyzing its content
 * @param {PDFDocument} pdfDoc - PDF document
 * @param {number} pageIndex - Page index
 * @returns {boolean} True if page is blank
 */
async function isPageBlank(pdfDoc, pageIndex) {
    try {
        const page = pdfDoc.getPage(pageIndex)
        const contentStream = page.node.Contents()
        
        if (!contentStream) return true

        const content = await contentStream.bytes()
        return content.byteLength < BLANK_PAGE_THRESHOLD
    } catch (error) {
        logger.warn(`Blank page check failed for page ${pageIndex}:`, error)
        return false
    }
}

/**
 * Get PDF page count
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {number} Page count
 */
export const getPageCount = async (pdfBuffer) => {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer)
        return pdfDoc.getPageCount()
    } catch (error) {
        logger.error('Page count failed:', error)
        throw new Error('Failed to get page count: ' + error.message)
    }
}

export default {
    analyzePDF,
    fixPDF,
    getPageCount
}
