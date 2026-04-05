import { useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
    ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, 
    X, RotateCcw, FileWarning, Loader2, ChevronRight
} from 'lucide-react'
import api from '../../utils/axios.js'

/**
 * PDF Upload & Auto-Fix Screen
 * 
 * API Endpoints:
 * - POST /api/files/upload - Upload and analyze PDF
 *   Request: multipart/form-data { document: File }
 *   Response: { totalPages, hasIssues, issues: [{type, page, description}], fileSize }
 * 
 * - POST /api/files/fix - Fix detected PDF issues
 *   Response: { fixed: true, path, size }
 */

const ISSUE_ICONS = {
    landscape: RotateCcw,
    blank: FileWarning,
    nonA4: FileText
}

const ISSUE_LABELS = {
    landscape: 'Landscape pages detected',
    blank: 'Blank pages found',
    nonA4: 'Non-A4 page sizes'
}

const PDFUpload = () => {
    const [file, setFile] = useState(null)
    const [analysis, setAnalysis] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [fixing, setFixing] = useState(false)
    const [error, setError] = useState('')
    const [showFixModal, setShowFixModal] = useState(false)
    const [fixed, setFixed] = useState(false)
    
    const fileInputRef = useRef(null)
    const navigate = useNavigate()
    const { vendorId } = useParams()

    const handleFileSelect = useCallback(async (e) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        // Validate file type
        if (selectedFile.type !== 'application/pdf') {
            setError('Please upload a PDF file only')
            return
        }

        // Validate file size (max 50MB)
        if (selectedFile.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB')
            return
        }

        setFile(selectedFile)
        setError('')
        setAnalysis(null)
        setFixed(false)

        // Upload and analyze
        await uploadAndAnalyze(selectedFile)
    }, [])

    const uploadAndAnalyze = async (pdfFile) => {
        setUploading(true)
        
        try {
            const formData = new FormData()
            formData.append('document', pdfFile)

            const res = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const analysisData = res.data.data
            setAnalysis(analysisData)

            // Show fix modal if issues detected
            if (analysisData.hasIssues) {
                setShowFixModal(true)
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload PDF')
            setFile(null)
        } finally {
            setUploading(false)
        }
    }

    const handleFixPDF = async () => {
        setFixing(true)
        
        try {
            const res = await api.post('/files/fix')
            
            if (res.data.data.fixed) {
                setFixed(true)
                setShowFixModal(false)
                // Update file reference to fixed version
                setFile(prev => ({
                    ...prev,
                    name: prev.name.replace('.pdf', '_fixed.pdf'),
                    fixed: true
                }))
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fix PDF')
        } finally {
            setFixing(false)
        }
    }

    const handleSkipFix = () => {
        setShowFixModal(false)
    }

    const handleContinue = () => {
        // Navigate to order creation with file info
        navigate(`/create-order/${vendorId}`, {
            state: { 
                file,
                analysis,
                fixed
            }
        })
    }

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile && droppedFile.type === 'application/pdf') {
            const mockEvent = { target: { files: [droppedFile] } }
            handleFileSelect(mockEvent)
        } else {
            setError('Please drop a PDF file')
        }
    }, [handleFileSelect])

    return (
        <div className="min-h-screen safe-area-pb" style={{ backgroundColor: '#0F172A' }}>
            {/* Header */}
            <header className="sticky top-0 z-10 px-4 py-4 safe-area-pt"
                style={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
                }}>
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                        style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)' }}
                    >
                        <ArrowLeft size={20} color="#F1F5F9" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: '#F1F5F9' }}>
                            Upload Document
                        </h1>
                        <p className="text-xs" style={{ color: '#64748B' }}>
                            PDF files only, max 50MB
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6">
                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 rounded-xl flex items-center gap-3 animate-fade-in"
                        style={{ 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                        <AlertCircle size={20} color="#EF4444" />
                        <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
                    </div>
                )}

                {/* Upload Drop Zone */}
                {!file && (
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className="glass-card p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 active:scale-[0.98] hover:border-emerald-500/40"
                        style={{ 
                            minHeight: '280px',
                            borderStyle: 'dashed',
                            borderWidth: '2px'
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        
                        <div 
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                        >
                            <Upload size={36} color="#10B981" />
                        </div>
                        
                        <p className="text-base font-semibold mb-2" style={{ color: '#F1F5F9' }}>
                            Drop your PDF here
                        </p>
                        <p className="text-sm text-center" style={{ color: '#64748B' }}>
                            or tap to browse files
                        </p>
                        
                        <div className="flex items-center gap-4 mt-6">
                            <span className="text-xs px-3 py-1.5 rounded-full"
                                style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', color: '#94A3B8' }}>
                                Max 50MB
                            </span>
                            <span className="text-xs px-3 py-1.5 rounded-full"
                                style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', color: '#94A3B8' }}>
                                PDF only
                            </span>
                        </div>
                    </div>
                )}

                {/* Uploading State */}
                {uploading && (
                    <div className="glass-card p-8 flex flex-col items-center justify-center"
                        style={{ minHeight: '280px' }}>
                        <div className="relative mb-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                                <Loader2 size={32} color="#10B981" className="animate-spin" />
                            </div>
                        </div>
                        <p className="text-base font-semibold mb-2" style={{ color: '#F1F5F9' }}>
                            Analyzing PDF...
                        </p>
                        <p className="text-sm text-center" style={{ color: '#64748B' }}>
                            Checking for issues and page count
                        </p>
                    </div>
                )}

                {/* File Preview */}
                {file && !uploading && (
                    <div className="glass-card p-6 animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                                <FileText size={28} color="#10B981" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold truncate" style={{ color: '#F1F5F9' }}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            setFile(null)
                                            setAnalysis(null)
                                            setFixed(false)
                                            setError('')
                                        }}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                    >
                                        <X size={16} color="#EF4444" />
                                    </button>
                                </div>

                                {analysis && (
                                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-xl font-bold" style={{ color: '#10B981' }}>
                                                    {analysis.totalPages}
                                                </p>
                                                <p className="text-xs" style={{ color: '#64748B' }}>Pages</p>
                                            </div>
                                            
                                            {fixed && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                                                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                                                    <CheckCircle size={14} color="#10B981" />
                                                    <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                                                        Fixed
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Continue Button */}
                {file && analysis && !showFixModal && (
                    <button
                        onClick={handleContinue}
                        className="w-full mt-6 py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        style={{ 
                            backgroundColor: '#10B981',
                            color: '#ffffff',
                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        Continue
                        <ChevronRight size={18} />
                    </button>
                )}
            </main>

            {/* Fix Issues Modal */}
            {showFixModal && analysis?.hasIssues && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                        onClick={handleSkipFix}
                    />
                    
                    {/* Modal */}
                    <div className="relative w-full max-w-lg glass-card animate-slide-up"
                        style={{ maxHeight: '85vh', overflow: 'auto' }}>
                        {/* Header */}
                        <div className="p-6" style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                                    <AlertCircle size={20} color="#EF4444" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: '#F1F5F9' }}>
                                        Document Issues Detected
                                    </h2>
                                    <p className="text-xs" style={{ color: '#64748B' }}>
                                        We found {analysis.issues.length} issue{analysis.issues.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Issues List */}
                        <div className="p-6 space-y-3">
                            {analysis.issues.map((issue, index) => {
                                const Icon = ISSUE_ICONS[issue.type] || AlertCircle
                                return (
                                    <div key={index} 
                                        className="flex items-center gap-3 p-3 rounded-xl"
                                        style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                                        <Icon size={18} color="#F59E0B" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                                {ISSUE_LABELS[issue.type] || issue.description}
                                            </p>
                                            {issue.page && (
                                                <p className="text-xs" style={{ color: '#64748B' }}>
                                                    Page {issue.page}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Actions */}
                        <div className="p-6 space-y-3" style={{ borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
                            <button
                                onClick={handleFixPDF}
                                disabled={fixing}
                                className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                                style={{ 
                                    backgroundColor: '#10B981',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                {fixing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Fixing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={18} />
                                        Fix & Update
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={handleSkipFix}
                                disabled={fixing}
                                className="w-full py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
                                style={{ 
                                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                    color: '#94A3B8'
                                }}
                            >
                                Skip & Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PDFUpload