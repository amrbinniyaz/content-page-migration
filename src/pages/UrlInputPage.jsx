import { useState } from 'react'
import { ArrowRight, Loader2, Globe, Sparkles } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'

// Circular progress component
function CircularProgress({ value, max, label, color }) {
    const percentage = max > 0 ? (value / max) * 100 : 0
    const circumference = 2 * Math.PI * 45
    const strokeDashoffset = circumference - (percentage / 100) * circumference
    
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r="45"
                        stroke="#e5e7eb"
                        strokeWidth="6"
                        fill="none"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r="45"
                        stroke={color}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300"
                    />
                </svg>
            </div>
            <span className="text-xs text-gray-500 mt-2">{label}</span>
            <span className="text-lg font-bold text-gray-800">{value}</span>
        </div>
    )
}

export default function UrlInputPage({ onNext }) {
    const [url, setUrl] = useState('')
    const [error, setError] = useState('')
    const { discoverPages, isLoading, discoveryProgress } = useMigration()

    const validateUrl = (input) => {
        try {
            new URL(input)
            return true
        } catch {
            return false
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!url.trim()) {
            setError('Please enter a website URL')
            return
        }

        let normalizedUrl = url.trim()
        if (!normalizedUrl.startsWith('http')) {
            normalizedUrl = 'https://' + normalizedUrl
        }

        if (!validateUrl(normalizedUrl)) {
            setError('Please enter a valid URL')
            return
        }

        await discoverPages(normalizedUrl)
        onNext()
    }

    return (
        <div className="max-w-2xl mx-auto pt-8 animate-slide-up">
            {/* Hero Section */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 mb-6">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-indigo-600">AI-Powered Migration</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
                    Migrate your content
                </h1>
                <p className="text-lg text-gray-500 max-w-lg mx-auto">
                    Enter your website URL and let AI discover, analyze, and improve your content for migration.
                </p>
            </div>

            {/* Input Card */}
            <div className="card-elevated p-8 mb-8">
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Website URL
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Globe className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="w-full pl-12 pr-4 py-4 text-base input-clean"
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <p className="mt-3 text-sm text-red-500 font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`
              w-full mt-6 py-4 px-6 text-base
              flex items-center justify-center gap-3
              btn-primary
              ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}
            `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Discovering pages...
                            </>
                        ) : (
                            <>
                                Start Migration
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                {/* Progress Stats - Show when loading */}
                {isLoading && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex justify-center gap-8 mb-4">
                            {/* URLs Found - always show */}
                            <CircularProgress 
                                value={discoveryProgress.urlsFound} 
                                max={Math.max(discoveryProgress.urlsFound, 1)}
                                label="URLs Found" 
                                color="#3b82f6" 
                            />
                            
                            {/* Only show scraping progress during scraping phase */}
                            {discoveryProgress.phase === 'scraping' && (
                                <>
                                    <CircularProgress 
                                        value={discoveryProgress.processed} 
                                        max={Math.max(discoveryProgress.total, 1)}
                                        label="Scraped" 
                                        color="#f59e0b" 
                                    />
                                    <CircularProgress 
                                        value={Math.max(0, discoveryProgress.total - discoveryProgress.processed)} 
                                        max={Math.max(discoveryProgress.total, 1)}
                                        label="Remaining" 
                                        color="#10b981" 
                                    />
                                </>
                            )}
                        </div>
                        <p className="text-center text-sm text-gray-500 animate-pulse">
                            {discoveryProgress.currentAction || 'Initializing...'}
                        </p>
                    </div>
                )}

                {!isLoading && (
                    <p className="mt-5 text-center text-sm text-gray-400">
                        We'll scan your sitemap and discover all pages automatically
                    </p>
                )}
            </div>

        </div>
    )
}
