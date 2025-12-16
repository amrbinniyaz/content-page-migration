export default function Header() {
    return (
        <header className="border-b border-black/[0.04] sticky top-0 z-50 header-blur">
            <div className="container mx-auto px-6 py-4 max-w-5xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img
                        src="/images/SprXcms-Logo.svg"
                        alt="SprXcms Logo"
                        className="h-9 w-auto"
                    />
                    <div className="hidden sm:block h-6 w-px bg-gray-200"></div>
                    <span className="hidden sm:block text-sm font-medium text-gray-500">Content Migration</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600">
                        Beta
                    </span>
                </div>
            </div>
        </header>
    )
}
