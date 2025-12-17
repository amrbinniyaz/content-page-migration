import { useState } from 'react'
import { ArrowRight, Loader2, Globe, Sparkles } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'

export default function UrlInputPage({ onNext }) {
    const [url, setUrl] = useState('')
    const [error, setError] = useState('')
    const { discoverPages, isLoading } = useMigration()

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

                <p className="mt-5 text-center text-sm text-gray-400">
                    We'll scan your sitemap and discover all pages automatically
                </p>
            </div>

        </div>
    )
}
