import { useState } from 'react'
import { ArrowRight, ArrowLeft, ChevronDown, ChevronRight, Sparkles, FileText, TrendingUp, X, Maximize2, Copy, Check } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'

function ScoreBadge({ label, score }) {
    const getScoreClass = (score) => {
        if (score >= 7) return 'score-high'
        if (score >= 5) return 'score-medium'
        return 'score-low'
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">{label}</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs ${getScoreClass(score)}`}>
                {score.toFixed(1)}
            </span>
        </div>
    )
}

function ContentModal({ isOpen, onClose, original, improved, analysis, pageTitle }) {
    const [activeTab, setActiveTab] = useState('original')
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const currentContent = activeTab === 'original' ? original : improved
    const overallScore = ((analysis.seo?.score || 0) + (analysis.readability?.score || 0) + (analysis.accessibility?.score || 0)) / 3
    const improvedScore = Math.min(10, overallScore + 2)

    const handleCopy = async () => {
        const textToCopy = `Title: ${currentContent.title}\n\nMeta Description: ${currentContent.metaDescription || 'N/A'}\n\nContent:\n${currentContent.bodyContent}`
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{pageTitle}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Full content view</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                    <button
                        onClick={() => setActiveTab('original')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'original'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Original
                        <span className={`px-2 py-0.5 rounded text-xs ${overallScore >= 7 ? 'score-high' : overallScore >= 5 ? 'score-medium' : 'score-low'}`}>
                            {overallScore.toFixed(1)}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('improved')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'improved'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        AI Improved
                        <span className={`px-2 py-0.5 rounded text-xs ${improvedScore >= 7 ? 'score-high' : improvedScore >= 5 ? 'score-medium' : 'score-low'}`}>
                            {improvedScore.toFixed(1)}
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Title */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Title</label>
                            <p className="text-gray-900 mt-2 font-medium text-lg">{currentContent.title}</p>
                        </div>

                        {/* Meta Description */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Meta Description</label>
                            <p className="text-gray-700 mt-2 leading-relaxed">
                                {currentContent.metaDescription || <span className="text-gray-400 italic">No meta description</span>}
                            </p>
                        </div>

                        {/* Body Content */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Full Content</label>
                            <div className="mt-3 prose prose-sm max-w-none">
                                <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed font-sans bg-white p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                                    {currentContent.bodyContent}
                                </pre>
                            </div>
                        </div>

                        {/* Keywords (AI Improved only) */}
                        {activeTab === 'improved' && improved.keywords && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Suggested Keywords</label>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {improved.keywords.map((keyword, i) => (
                                        <span key={i} className="px-3 py-1.5 text-sm rounded-lg bg-white text-indigo-600 font-medium shadow-sm">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hashtags (AI Improved only) */}
                        {activeTab === 'improved' && improved.hashtags && (
                            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4">
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Hashtag Strategy</label>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {improved.hashtags.map((hashtag, i) => (
                                        <span key={i} className="px-3 py-1.5 text-sm rounded-lg bg-white text-pink-600 font-medium shadow-sm">
                                            {hashtag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Issues (Original only) */}
                        {activeTab === 'original' && analysis.seo?.issues && (
                            <div className="bg-amber-50 rounded-xl p-4">
                                <label className="text-xs text-amber-600 uppercase tracking-wider font-semibold">Issues Found</label>
                                <ul className="mt-3 space-y-2">
                                    {analysis.seo.issues.map((issue, i) => (
                                        <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function PageCard({ page, content, onToggle }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { analysis, original, improved, useOriginal } = content

    // Calculate overall score from individual scores
    const overallScore = ((analysis.seo?.score || 0) + (analysis.readability?.score || 0) + (analysis.accessibility?.score || 0)) / 3

    // Calculate improved score (average + 2 points improvement cap at 10)
    const improvedScore = Math.min(10, overallScore + 2).toFixed(1)
    const improvement = (improvedScore - overallScore).toFixed(1)

    return (
        <>
            <div className="card overflow-hidden">
                {/* Card Header */}
                <div
                    className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-4">
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center transition-all
                            ${isExpanded ? 'icon-container text-white' : 'bg-gray-100 text-gray-500'}
                        `}>
                            {isExpanded ? (
                                <ChevronDown className="w-5 h-5" />
                            ) : (
                                <ChevronRight className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{page.title}</h3>
                            <p className="text-sm text-gray-400 mt-0.5">{page.url}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="hidden lg:flex items-center gap-4">
                            <ScoreBadge label="SEO" score={analysis.seo.score} />
                            <ScoreBadge label="Read" score={analysis.readability.score} />
                            <ScoreBadge label="A11y" score={analysis.accessibility.score} />
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-semibold text-emerald-600">+{improvement}</span>
                        </div>
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="border-t border-gray-100 p-6 bg-gradient-to-b from-gray-50/50 to-white animate-fade-in">
                        {/* Toggle */}
                        <div className="toggle-group inline-flex mx-auto mb-6 w-full justify-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); if (!useOriginal) onToggle(page.id); }}
                                className={`
                                    flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all
                                    ${useOriginal ? 'toggle-active text-gray-900' : 'text-gray-500 hover:text-gray-700'}
                                `}
                            >
                                <FileText className="w-4 h-4" />
                                Original
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (useOriginal) onToggle(page.id); }}
                                className={`
                                    flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all
                                    ${!useOriginal ? 'toggle-active text-gray-900' : 'text-gray-500 hover:text-gray-700'}
                                `}
                            >
                                <Sparkles className="w-4 h-4" />
                                AI Improved
                            </button>
                        </div>

                        {/* Content Comparison */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Original */}
                            <div className={`
                                rounded-2xl p-6 transition-all border-2
                                ${useOriginal
                                    ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-100/50'
                                    : 'bg-white border-transparent'
                                }
                            `}>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-semibold text-gray-500">Original</span>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs ${overallScore >= 7 ? 'score-high' : overallScore >= 5 ? 'score-medium' : 'score-low'
                                        }`}>
                                        {overallScore.toFixed(1)}
                                    </span>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Title</label>
                                        <p className="text-gray-800 mt-1.5 font-medium">{original.title}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Meta Description</label>
                                        <p className="text-gray-600 mt-1.5 text-sm leading-relaxed">{original.metaDescription || <span className="text-gray-400 italic">No meta description</span>}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Content Preview</label>
                                        <p className="text-gray-600 mt-1.5 text-sm leading-relaxed line-clamp-3">{original.bodyContent}</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                            className="flex items-center gap-1.5 mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                        >
                                            <Maximize2 className="w-3.5 h-3.5" />
                                            View full content
                                        </button>
                                    </div>
                                </div>

                                {/* Issues */}
                                <div className="mt-5 pt-5 border-t border-gray-100">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Issues Found</span>
                                    <ul className="mt-3 space-y-2">
                                        {analysis.seo.issues.slice(0, 2).map((issue, i) => (
                                            <li key={i} className="text-sm text-amber-600 flex items-start gap-2 bg-amber-50 px-3 py-2 rounded-lg">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                                {issue}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* AI Improved */}
                            <div className={`
                                rounded-2xl p-6 transition-all border-2
                                ${!useOriginal
                                    ? 'bg-white border-emerald-200 shadow-lg shadow-emerald-100/50'
                                    : 'bg-white border-transparent'
                                }
                            `}>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm font-semibold text-emerald-600">AI Improved</span>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs ${improvedScore >= 7 ? 'score-high' : improvedScore >= 5 ? 'score-medium' : 'score-low'}`}>
                                        {improvedScore}
                                    </span>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Title</label>
                                        <p className="text-gray-800 mt-1.5 font-medium">{improved.title}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Meta Description</label>
                                        <p className="text-gray-600 mt-1.5 text-sm leading-relaxed">{improved.metaDescription}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Content Preview</label>
                                        <p className="text-gray-600 mt-1.5 text-sm leading-relaxed line-clamp-3">{improved.bodyContent}</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                            className="flex items-center gap-1.5 mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                        >
                                            <Maximize2 className="w-3.5 h-3.5" />
                                            View full content
                                        </button>
                                    </div>
                                </div>

                                {/* Keywords */}
                                <div className="mt-5 pt-5 border-t border-gray-100">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Suggested Keywords</span>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {improved.keywords?.map((keyword, i) => (
                                            <span key={i} className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 font-medium">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Hashtags */}
                                {improved.hashtags && (
                                    <div className="mt-4">
                                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Hashtag Strategy</span>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {improved.hashtags.map((hashtag, i) => (
                                                <span key={i} className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-pink-50 to-rose-50 text-pink-600 font-medium">
                                                    {hashtag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Full Content Modal */}
            <ContentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                original={original}
                improved={improved}
                analysis={analysis}
                pageTitle={page.title}
            />
        </>
    )
}

export default function ReviewPage({ onNext, onBack }) {
    const { getSelectedPages, scrapedContent, toggleUseOriginal } = useMigration()
    const selectedPages = getSelectedPages()
    const pagesWithContent = selectedPages.filter(p => scrapedContent[p.id])
    const aiSelectedCount = pagesWithContent.filter(p => !scrapedContent[p.id]?.useOriginal).length

    return (
        <div className="max-w-5xl mx-auto animate-slide-up">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Review your content</h2>
                <p className="text-gray-500">Compare original and AI-improved versions for each page</p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mb-8 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                <div className="text-center">
                    <div className="text-3xl font-bold gradient-text">{pagesWithContent.length}</div>
                    <div className="text-sm text-gray-500 mt-1">Pages</div>
                </div>
                <div className="h-12 w-px bg-gray-200"></div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-500">{aiSelectedCount}</div>
                    <div className="text-sm text-gray-500 mt-1">Using AI</div>
                </div>
                <div className="h-12 w-px bg-gray-200"></div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-gray-400">{pagesWithContent.length - aiSelectedCount}</div>
                    <div className="text-sm text-gray-500 mt-1">Original</div>
                </div>
            </div>

            {/* Page Cards */}
            <div className="space-y-4 mb-8">
                {pagesWithContent.map(page => (
                    <PageCard
                        key={page.id}
                        page={page}
                        content={scrapedContent[page.id]}
                        onToggle={toggleUseOriginal}
                    />
                ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl btn-secondary text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onNext}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl btn-primary text-sm"
                >
                    Continue to Export
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
