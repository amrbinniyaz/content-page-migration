import { useState } from 'react'
import { ArrowRight, ArrowLeft, Search, Check, Loader2 } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'

export default function PageSelectionPage({ onNext, onBack }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const {
        discoveredPages,
        togglePageSelection,
        selectAllPages,
        scrapeAndAnalyze,
        isLoading,
        sourceUrl
    } = useMigration()

    const pageTypes = ['all', ...new Set(discoveredPages.map(p => p.type))]

    const filteredPages = discoveredPages.filter(page => {
        const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.url.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = filterType === 'all' || page.type === filterType
        return matchesSearch && matchesType
    })

    const selectedCount = discoveredPages.filter(p => p.selected).length
    const allSelected = filteredPages.length > 0 && filteredPages.every(p => p.selected)

    const handleContinue = async () => {
        await scrapeAndAnalyze()
        onNext()
    }

    return (
        <div className="max-w-4xl mx-auto animate-slide-up">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Select pages to migrate</h2>
                <p className="text-gray-500">
                    Found <span className="font-semibold text-indigo-600">{discoveredPages.length}</span> pages on {sourceUrl}
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
                        <div className="text-2xl font-bold text-gray-900">{discoveredPages.length}</div>
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

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search pages..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl input-clean text-sm"
                    />
                </div>

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-3.5 rounded-xl input-clean text-sm cursor-pointer min-w-[160px] font-medium"
                >
                    {pageTypes.map(type => (
                        <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Page List */}
            <div className="card overflow-hidden mb-8">
                <div className="max-h-[400px] overflow-y-auto">
                    {filteredPages.map((page, index) => (
                        <div
                            key={page.id}
                            onClick={() => togglePageSelection(page.id)}
                            className={`
                flex items-center gap-4 px-5 py-4 cursor-pointer
                transition-all duration-200 border-b border-gray-50 last:border-0
                ${page.selected ? 'selected-item' : 'hover:bg-gray-50/50'}
              `}
                        >
                            {/* Checkbox */}
                            <div className={`
                w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200
                ${page.selected
                                    ? 'checkbox-checked text-white'
                                    : 'border-2 border-gray-200 hover:border-gray-300'
                                }
              `}>
                                {page.selected && <Check className="w-4 h-4" strokeWidth={2.5} />}
                            </div>

                            {/* Page Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-medium text-gray-900 truncate">{page.title}</h3>
                                    <span className="badge flex-shrink-0">{page.type}</span>
                                </div>
                                <p className="text-sm text-gray-400 truncate mt-0.5">{page.url}</p>
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
