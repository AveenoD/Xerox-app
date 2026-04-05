import { useEffect, useState, useRef } from 'react'
import { AlertTriangle, RotateCcw, FileText, X, CheckCircle, Loader } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const PDFFixPrompt = ({ analysis, onFix, onSkip, isProcessing }) => {
    const [previewUrl, setPreviewUrl] = useState(null)
    const canvasRef = useRef(null)

    useEffect(() => {
        // Generate preview of first page
        const generatePreview = async () => {
            try {
                // This would need the actual PDF file to render preview
                // For now, we'll show a placeholder
                setPreviewUrl(null)
            } catch (error) {
                console.error('Preview generation failed:', error)
            }
        }

        generatePreview()
    }, [])

    const getIssueSummary = () => {
        const issues = []
        if (analysis.landscapePages?.length > 0) {
            issues.push(`${analysis.landscapePages.length} landscape page(s) will be rotated`)
        }
        if (analysis.mixedSizePages?.length > 0) {
            issues.push(`${analysis.mixedSizePages.length} non-A4 page(s) will be normalized`)
        }
        if (analysis.blankPages?.length > 0) {
            issues.push(`${analysis.blankPages.length} blank page(s) will be removed`)
        }
        return issues
    }

    const issues = getIssueSummary()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
            
            <div className="w-full max-w-md rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}>
                
                {/* Header */}
                <div className="p-4 flex items-center justify-between"
                    style={{ borderBottom: '1px solid #2E3148' }}>
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} color="#EAB308" />
                        <h3 className="text-base font-semibold" style={{ color: '#F1F5F9' }}>
                            PDF Issues Detected
                        </h3>
                    </div>
                    <button
                        onClick={onSkip}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-700"
                    >
                        <X size={16} color="#64748B" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Preview Area */}
                    <div className="aspect-[3/4] max-h-48 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#0F1117', border: '1px solid #2E3148' }}>
                        {previewUrl ? (
                            <canvas ref={canvasRef} className="max-w-full max-h-full" />
                        ) : (
                            <div className="text-center">
                                <FileText size={48} color="#2E3148" className="mx-auto mb-2" />
                                <p className="text-xs" style={{ color: '#64748B' }}>
                                    {analysis.totalPages} pages detected
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Issues List */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>
                            We found the following issues:
                        </p>
                        
                        {issues.map((issue, index) => (
                            <div key={index}
                                className="flex items-start gap-2 p-2 rounded-lg"
                                style={{ backgroundColor: '#0F1117' }}>
                                <AlertTriangle size={14} color="#EAB308" className="mt-0.5 flex-shrink-0" />
                                <p className="text-sm" style={{ color: '#F1F5F9' }}>
                                    {issue}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Details */}
                    {(analysis.landscapePages?.length > 0 || analysis.mixedSizePages?.length > 0) && (
                        <div className="p-3 rounded-lg text-xs space-y-1"
                            style={{ backgroundColor: '#0D1B2B', color: '#3B82F6' }}>
                            {analysis.landscapePages?.length > 0 && (
                                <p>Landscape pages: {analysis.landscapePages.map(p => p.page).join(', ')}</p>
                            )}
                            {analysis.mixedSizePages?.length > 0 && (
                                <p>Non-A4 pages: {analysis.mixedSizePages.map(p => `#${p.page} (${p.width}x${p.height})`).join(', ')}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 flex gap-3"
                    style={{ borderTop: '1px solid #2E3148' }}>
                    <button
                        onClick={onSkip}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                        style={{ backgroundColor: '#2E3148', color: '#F1F5F9' }}
                    >
                        Skip
                    </button>
                    
                    <button
                        onClick={onFix}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ backgroundColor: '#10B981', color: '#ffffff' }}
                    >
                        {isProcessing ? (
                            <>
                                <Loader size={16} className="animate-spin" />
                                Fixing...
                            </>
                        ) : (
                            <>
                                <RotateCcw size={16} />
                                Fix & Update
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PDFFixPrompt
