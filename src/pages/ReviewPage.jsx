import { useState } from 'react'
import { ArrowRight, ArrowLeft, ChevronDown, ChevronRight, Sparkles, FileText, TrendingUp } from 'lucide-react'
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

function PageCard({ page, content, onToggle }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const { analysis, original, improved, useOriginal } = content

    const improvement = (8.5 - analysis.overall).toFixed(1)

    return (
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
                                <span className={`px-2.5 py-1 rounded-lg text-xs ${analysis.overall >= 7 ? 'score-high' : analysis.overall >= 5 ? 'score-medium' : 'score-low'
                                    }`}>
                                    {analysis.overall.toFixed(1)}
                                </span>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Title</label>
                                    <p className="text-gray-800 mt-1.5 font-medium">{original.title}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Meta Description</label>
                                    <p className="text-gray-600 mt-1.5 text-sm leading-relaxed">{original.metaDescription}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Content Preview</label>
                                    <p className="text-gray-600 mt-1.5 text-sm leading-relaxed line-clamp-3">{original.bodyContent}</p>
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
                                <span className="px-2.5 py-1 rounded-lg text-xs score-high">
                                    8.5
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
                        </div>
                    </div>
                </div>
            )}
        </div>
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
