import { useState } from 'react'
import { ArrowRight, ArrowLeft, Search, Check, Loader2 } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'

export default function PageSelectionPage({ onNext, onBack }) {
    const [searchQuery, setSearchQuery] = useState('')
    const {
        discoveredPages,
        togglePageSelection,
        selectAllPages,
        scrapeAndAnalyze,
        isLoading,
        sourceUrl,
        countSelectedPages,
        countTotalPages
    } = useMigration()

    const selectedCount = countSelectedPages()
    const totalCount = countTotalPages()
    const allSelected = selectedCount === totalCount && totalCount > 0

    const handleContinue = async () => {
        await scrapeAndAnalyze()
        onNext()
    }

    const filterPages = (pages) => {
        if (!searchQuery) return pages
        return pages.filter(page => {
            const matchesParent = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                page.url.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesChildren = page.children?.some(child =>
                child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                child.url.toLowerCase().includes(searchQuery.toLowerCase())
            )
            return matchesParent || matchesChildren
        })
    }

    const filteredPages = filterPages(discoveredPages)

    return (
        <div className="max-w-6xl mx-auto animate-slide-up">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Select pages to migrate</h2>
                <p className="text-gray-500">
                    Found <span className="font-semibold text-indigo-600">{totalCount}</span> pages on {sourceUrl}
                </p>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-6">
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{selectedCount}</div>
                        <div className="text-sm text-gray-500">Selected</div>
                    </div>
                    <div className="h-10 w-px bg-gray-200"></div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
                        <div className="text-sm text-gray-500">Total Pages</div>
                    </div>
                </div>
                <button
                    onClick={() => selectAllPages(!allSelected)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                    {allSelected ? 'Deselect all' : 'Select all'}
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search pages..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl input-clean text-sm"
                    />
                </div>
            </div>

            {/* Sitemap Grid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
                <div className="text-center mb-10">
                    <h3 className="text-2xl font-serif italic text-gray-800 tracking-wide">SITEMAP</h3>
                    <div className="mt-3 w-16 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                    {filteredPages.map((page) => (
                        <div key={page.id} className="space-y-3">
                            {/* Parent Page */}
                            <div
                                onClick={() => togglePageSelection(page.id)}
                                className="flex items-start gap-2.5 cursor-pointer group py-1"
                            >
                                <div className={`
                                    w-4 h-4 mt-0.5 rounded-sm flex items-center justify-center flex-shrink-0 
                                    transition-all duration-200 border
                                    ${page.selected
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                        : 'border-gray-300 bg-white group-hover:border-indigo-400 group-hover:bg-indigo-50'
                                    }
                                `}>
                                    {page.selected && <Check className="w-3 h-3" strokeWidth={3} />}
                                </div>
                                <span className="font-semibold text-orange-600 group-hover:text-orange-700 transition-colors text-sm leading-tight">
                                    {page.title}
                                </span>
                            </div>

                            {/* Children Pages */}
                            <div className="space-y-2 ml-1 border-l-2 border-gray-100 pl-4">
                                {page.children?.map((child) => (
                                    <div
                                        key={child.id}
                                        onClick={() => togglePageSelection(child.id, true, page.id)}
                                        className="flex items-start gap-2.5 cursor-pointer group py-0.5"
                                    >
                                        <div className={`
                                            w-4 h-4 mt-0.5 rounded-sm flex items-center justify-center flex-shrink-0 
                                            transition-all duration-200 border
                                            ${child.selected
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                : 'border-gray-300 bg-white group-hover:border-indigo-400 group-hover:bg-indigo-50'
                                            }
                                        `}>
                                            {child.selected && <Check className="w-3 h-3" strokeWidth={3} />}
                                        </div>
                                        <span className="text-gray-600 group-hover:text-gray-900 transition-colors text-sm leading-tight">
                                            {child.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
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
                    onClick={handleContinue}
                    disabled={selectedCount === 0 || isLoading}
                    className={`
                        flex items-center gap-2 px-8 py-3 rounded-xl btn-primary text-sm
                        ${(selectedCount === 0 || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            Analyze with AI
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
