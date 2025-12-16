import { useState } from 'react'
import { ArrowLeft, Download, Copy, Check, RefreshCw, FileJson, Sparkles, Clock, TrendingUp } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'

export default function ExportPage({ onBack, onStartNew }) {
    const [copied, setCopied] = useState(false)
    const [downloaded, setDownloaded] = useState(false)
    const { generateExport, getSelectedPages, scrapedContent } = useMigration()

    const exportData = generateExport()
    const exportJson = JSON.stringify(exportData, null, 2)
    const selectedPages = getSelectedPages()
    const aiImprovedCount = selectedPages.filter(p => scrapedContent[p.id] && !scrapedContent[p.id].useOriginal).length

    const handleCopy = async () => {
        await navigator.clipboard.writeText(exportJson)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const blob = new Blob([exportJson], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sprxcms-migration-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setDownloaded(true)
    }

    const stats = [
        { icon: FileJson, label: 'Pages', value: selectedPages.length, color: 'from-blue-500 to-cyan-500' },
        { icon: Sparkles, label: 'AI Improved', value: aiImprovedCount, color: 'from-indigo-500 to-purple-500' },
        { icon: TrendingUp, label: 'Avg Score', value: '8.5', color: 'from-emerald-500 to-teal-500' },
        { icon: Clock, label: 'Time Saved', value: '~5m', color: 'from-purple-500 to-pink-500' },
    ]

    return (
        <div className="max-w-3xl mx-auto animate-slide-up">
            {/* Success Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl success-icon mb-6">
                    <Check className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Ready to export!</h2>
                <p className="text-gray-500 text-lg">Your content has been processed and is ready for SprXcms</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="card p-5 text-center">
                        <div className={`
              w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center
              bg-gradient-to-br ${stat.color}
            `}>
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Export Card */}
            <div className="card-elevated overflow-hidden mb-8">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <FileJson className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Export Data</h3>
                            <p className="text-sm text-gray-400">SprXcms-ready JSON format</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${copied
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'btn-secondary'
                                }
              `}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={handleDownload}
                            className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                ${downloaded
                                    ? 'bg-emerald-500 text-white'
                                    : 'btn-primary'
                                }
              `}
                        >
                            {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            {downloaded ? 'Downloaded!' : 'Download JSON'}
                        </button>
                    </div>
                </div>

                {/* JSON Preview */}
                <div className="p-6 bg-gradient-to-b from-gray-50 to-white max-h-[280px] overflow-auto">
                    <pre className="text-sm text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
                        {exportJson}
                    </pre>
                </div>
            </div>

            {/* Pages Preview */}
            <div className="card mb-8">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Exported Pages</h3>
                </div>
                <div className="divide-y divide-gray-50 max-h-[220px] overflow-y-auto">
                    {exportData.map((page, index) => (
                        <div key={index} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <div>
                                    <p className="font-medium text-gray-900">{page.menuName}</p>
                                    <p className="text-sm text-gray-400 truncate max-w-md">{page.pageTitle}</p>
                                </div>
                            </div>
                            <span className={`
                px-2.5 py-1 rounded-lg text-xs font-semibold
                ${page.aiScore >= 7 ? 'score-high' : 'score-medium'}
              `}>
                                {page.aiScore}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl btn-secondary text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onStartNew}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl btn-primary text-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Start New Migration
                </button>
            </div>
        </div>
    )
}
