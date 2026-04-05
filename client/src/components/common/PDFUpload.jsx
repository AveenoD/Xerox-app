import { useState, useRef, useCallback } from 'react'
import { FileText, Upload, AlertCircle, CheckCircle, X } from 'lucide-react'
import api from '../../utils/axios.js'
import PDFFixPrompt from './PDFFixPrompt.jsx'

const PDFUpload = ({ onFileSelect, onFileAnalyzed, vendorId }) => {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [pdfAnalysis, setPdfAnalysis] = useState(null)
    const [showFixPrompt, setShowFixPrompt] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const analyzePDF = async (file) => {
        setIsUploading(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('document', file)

            const response = await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            const analysis = response.data.data
            setPdfAnalysis(analysis)

            if (analysis.hasIssues) {
                setShowFixPrompt(true)
            } else {
                // No issues, proceed with file
                onFileAnalyzed?.({
                    file,
                    analysis,
                    fixed: false
                })
            }

            onFileSelect?.(file)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to analyze PDF')
        } finally {
            setIsUploading(false)
        }
    }

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            const file = files[0]
            if (file.type === 'application/pdf') {
                setSelectedFile(file)
                analyzePDF(file)
            } else {
                setError('Please upload a PDF file')
            }
        }
    }, [])

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.type === 'application/pdf') {
                setSelectedFile(file)
                analyzePDF(file)
            } else {
                setError('Please upload a PDF file')
            }
        }
    }

    const handleFixPDF = async () => {
        setIsUploading(true)
        setError('')

        try {
            const response = await api.post('/files/fix')
            const result = response.data.data

            setShowFixPrompt(false)
            onFileAnalyzed?.({
                file: selectedFile,
                analysis: pdfAnalysis,
                fixed: true,
                fixedPath: result.path
            })
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fix PDF')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSkipFix = () => {
        setShowFixPrompt(false)
        onFileAnalyzed?.({
            file: selectedFile,
            analysis: pdfAnalysis,
            fixed: false
        })
    }

    const clearFile = () => {
        setSelectedFile(null)
        setPdfAnalysis(null)
        setShowFixPrompt(false)
        setError('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="w-full">
            {/* Upload Area */}
            {!selectedFile ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                        isDragging
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-600 hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: '#1A1D27' }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center gap-3">
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#0D2B1F' }}
                        >
                            <Upload size={24} color="#10B981" />
                        </div>

                        <div className="text-center">
                            <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                Drop your PDF here, or click to browse
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                                Maximum file size: 10MB
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Selected File Display */
                <div
                    className="p-4 rounded-2xl flex items-center gap-3"
                    style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}
                >
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#0D2B1F' }}
                    >
                        <FileText size={20} color="#10B981" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#F1F5F9' }}>
                            {selectedFile.name}
                        </p>
                        <p className="text-xs" style={{ color: '#64748B' }}>
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            {pdfAnalysis && ` • ${pdfAnalysis.totalPages} pages`}
                        </p>
                    </div>

                    {isUploading ? (
                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: '#10B981' }} />
                    ) : (
                        <button
                            onClick={clearFile}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-700"
                        >
                            <X size={16} color="#64748B" />
                        </button>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-3 p-3 rounded-xl flex items-center gap-2"
                    style={{ backgroundColor: '#2D1515', border: '1px solid #EF4444' }}>
                    <AlertCircle size={16} color="#EF4444" />
                    <p className="text-sm" style={{ color: '#EF4444' }}>
                        {error}
                    </p>
                </div>
            )}

            {/* PDF Fix Prompt Modal */}
            {showFixPrompt && pdfAnalysis && (
                <PDFFixPrompt
                    analysis={pdfAnalysis}
                    onFix={handleFixPDF}
                    onSkip={handleSkipFix}
                    isProcessing={isUploading}
                />
            )}
        </div>
    )
}

export default PDFUpload
