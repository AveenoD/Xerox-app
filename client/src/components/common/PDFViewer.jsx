import { useState, useEffect, useRef } from 'react'
import { Printer, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import api from '../../utils/axios.js'
import { useAuth } from '../../context/AuthContext.jsx'

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const PDFViewer = ({ fileUrl, orderId, customerId, onClose, onPrintStart }) => {
    const [pdf, setPdf] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [scale, setScale] = useState(1.0)
    const [isLoading, setIsLoading] = useState(true)
    const [isPrinting, setIsPrinting] = useState(false)
    const [error, setError] = useState('')
    
    const canvasRef = useRef(null)
    const { user } = useAuth()
    const isVendor = user?.role === 'vendor'

    useEffect(() => {
        loadPDF()
    }, [fileUrl])

    useEffect(() => {
        if (pdf && currentPage) {
            renderPage()
        }
    }, [pdf, currentPage, scale])

    const loadPDF = async () => {
        try {
            setIsLoading(true)
            setError('')

            // Fetch PDF with auth
            const response = await api.get(fileUrl, {
                responseType: 'blob'
            })

            const blob = new Blob([response.data], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)

            const loadingTask = pdfjsLib.getDocument(url)
            const pdfDoc = await loadingTask.promise

            setPdf(pdfDoc)
            setTotalPages(pdfDoc.numPages)
            setCurrentPage(1)
        } catch (err) {
            setError('Failed to load PDF')
            console.error('PDF load error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const renderPage = async () => {
        if (!pdf || !canvasRef.current) return

        try {
            const page = await pdf.getPage(currentPage)
            const canvas = canvasRef.current
            const context = canvas.getContext('2d')

            const viewport = page.getViewport({ scale })
            canvas.height = viewport.height
            canvas.width = viewport.width

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            }

            await page.render(renderContext).promise
        } catch (err) {
            console.error('Page render error:', err)
        }
    }

    const handlePrint = async () => {
        if (!isVendor) return

        setIsPrinting(true)
        try {
            // 1. Update order status to printing
            await api.patch(`/orders/${orderId}/status`, { status: 'printing' })

            // 2. Send notification to customer
            await sendNotification(customerId, {
                title: 'Printing Started',
                body: 'Your document is being printed 🖨️'
            })

            // 3. Trigger callback
            onPrintStart?.()

            // 4. Open print dialog
            const printWindow = window.open(fileUrl, '_blank')
            if (printWindow) {
                printWindow.addEventListener('load', () => {
                    setTimeout(() => {
                        printWindow.print()
                    }, 1000)
                })
            }
        } catch (err) {
            setError('Failed to start printing')
            console.error('Print error:', err)
        } finally {
            setIsPrinting(false)
        }
    }

    const sendNotification = async (userId, notification) => {
        try {
            // This would integrate with your notification service
            // For now, we'll just log it
            console.log(`Notification to ${userId}:`, notification)
            
            // Actual implementation would be:
            // await api.post('/notifications/send', {
            //     userId,
            //     ...notification
            // })
        } catch (err) {
            console.error('Notification failed:', err)
        }
    }

    const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3.0))
    const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5))
    
    const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1))
    const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1))

    const handleDownload = async () => {
        try {
            const response = await api.get(fileUrl, {
                responseType: 'blob'
            })
            const blob = new Blob([response.data], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            
            const link = document.createElement('a')
            link.href = url
            link.download = `document-${orderId}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (err) {
            setError('Failed to download PDF')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: '#0F1117' }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: '#1A1D27', borderBottom: '1px solid #2E3148' }}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#2E3148' }}
                    >
                        <X size={18} color="#F1F5F9" />
                    </button>
                    <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                        PDF Viewer
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <button
                        onClick={handleZoomOut}
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#2E3148' }}
                    >
                        <ZoomOut size={16} color="#F1F5F9" />
                    </button>
                    <span className="text-sm w-16 text-center" style={{ color: '#94A3B8' }}>
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#2E3148' }}
                    >
                        <ZoomIn size={16} color="#F1F5F9" />
                    </button>

                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#2E3148' }}
                    >
                        <Download size={16} color="#F1F5F9" />
                    </button>

                    {/* Print Button - Vendors Only */}
                    {isVendor && (
                        <button
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                            style={{ backgroundColor: '#10B981', color: '#ffffff' }}
                        >
                            <Printer size={16} />
                            {isPrinting ? 'Printing...' : 'Print Document'}
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 py-2 text-sm text-center"
                    style={{ backgroundColor: '#2D1515', color: '#EF4444' }}>
                    {error}
                </div>
            )}

            {/* PDF Canvas */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4"
                style={{ backgroundColor: '#0F1117' }}>
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: '#10B981' }} />
                        <p className="text-sm" style={{ color: '#64748B' }}>
                            Loading PDF...
                        </p>
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        className="shadow-2xl"
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                )}
            </div>

            {/* Footer - Page Navigation */}
            <div className="flex items-center justify-center gap-4 px-4 py-3"
                style={{ backgroundColor: '#1A1D27', borderTop: '1px solid #2E3148' }}>
                <button
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40"
                    style={{ backgroundColor: '#2E3148' }}
                >
                    <ChevronLeft size={18} color="#F1F5F9" />
                </button>

                <span className="text-sm" style={{ color: '#F1F5F9' }}>
                    Page {currentPage} of {totalPages}
                </span>

                <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40"
                    style={{ backgroundColor: '#2E3148' }}
                >
                    <ChevronRight size={18} color="#F1F5F9" />
                </button>
            </div>
        </div>
    )
}

export default PDFViewer
