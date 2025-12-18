import { createContext, useContext, useState } from 'react'

const MigrationContext = createContext()

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Mock data for prototype - nested hierarchical structure (fallback)
const mockDiscoveredPages = [
    {
        id: 1,
        url: '/about',
        title: 'About Us',
        type: 'content',
        selected: false,
        isParent: true,
        children: [
            { id: 101, url: '/about/history', title: 'Our History', type: 'content', selected: false },
            { id: 102, url: '/about/mission', title: 'Mission & Vision', type: 'content', selected: false },
            { id: 103, url: '/about/leadership', title: 'Leadership Team', type: 'content', selected: false },
            { id: 104, url: '/about/accreditation', title: 'Accreditation', type: 'content', selected: false },
        ]
    },
    {
        id: 2,
        url: '/academics',
        title: 'Academics',
        type: 'content',
        selected: false,
        isParent: true,
        children: [
            { id: 201, url: '/academics/elementary', title: 'Elementary School', type: 'content', selected: false },
            { id: 202, url: '/academics/middle', title: 'Middle School', type: 'content', selected: false },
            { id: 203, url: '/academics/high', title: 'High School', type: 'content', selected: false },
            { id: 204, url: '/academics/curriculum', title: 'Curriculum', type: 'content', selected: false },
            { id: 205, url: '/academics/honors', title: 'Honors Program', type: 'content', selected: false },
        ]
    },
    {
        id: 3,
        url: '/admissions',
        title: 'Admissions',
        type: 'content',
        selected: false,
        isParent: true,
        children: [
            { id: 301, url: '/admissions/apply', title: 'How to Apply', type: 'content', selected: false },
            { id: 302, url: '/admissions/tuition', title: 'Tuition & Fees', type: 'content', selected: false },
            { id: 303, url: '/admissions/financial-aid', title: 'Financial Aid', type: 'content', selected: false },
            { id: 304, url: '/admissions/visit', title: 'Schedule a Visit', type: 'content', selected: false },
        ]
    },
    {
        id: 4,
        url: '/student-life',
        title: 'Student Life',
        type: 'content',
        selected: false,
        isParent: true,
        children: [
            { id: 401, url: '/student-life/athletics', title: 'Athletics', type: 'content', selected: false },
            { id: 402, url: '/student-life/arts', title: 'Arts & Culture', type: 'content', selected: false },
            { id: 403, url: '/student-life/clubs', title: 'Clubs & Organizations', type: 'content', selected: false },
            { id: 404, url: '/student-life/events', title: 'Events Calendar', type: 'content', selected: false },
        ]
    },
    {
        id: 5,
        url: '/news',
        title: 'News & Media',
        type: 'blog',
        selected: false,
        isParent: true,
        children: [
            { id: 501, url: '/news/announcements', title: 'Announcements', type: 'blog', selected: false },
            { id: 502, url: '/news/stories', title: 'Stories', type: 'blog', selected: false },
            { id: 503, url: '/news/press', title: 'Press Releases', type: 'blog', selected: false },
        ]
    },
    {
        id: 6,
        url: '/community',
        title: 'Community',
        type: 'content',
        selected: false,
        isParent: true,
        children: [
            { id: 601, url: '/community/parents', title: 'Parent Portal', type: 'content', selected: false },
            { id: 602, url: '/community/alumni', title: 'Alumni', type: 'content', selected: false },
            { id: 603, url: '/community/giving', title: 'Support & Giving', type: 'content', selected: false },
        ]
    },
    {
        id: 7,
        url: '/contact',
        title: 'Contact',
        type: 'contact',
        selected: false,
        isParent: true,
        children: [
            { id: 701, url: '/contact/directory', title: 'Staff Directory', type: 'contact', selected: false },
            { id: 702, url: '/contact/locations', title: 'Locations', type: 'contact', selected: false },
        ]
    },
    {
        id: 8,
        url: '/resources',
        title: 'Resources',
        type: 'content',
        selected: false,
        isParent: true,
        children: [
            { id: 801, url: '/resources/forms', title: 'Forms & Documents', type: 'content', selected: false },
            { id: 802, url: '/resources/faq', title: 'FAQ', type: 'content', selected: false },
            { id: 803, url: '/resources/policies', title: 'Policies', type: 'content', selected: false },
        ]
    },
]

const mockScrapedContent = {
    1: {
        original: {
            title: 'Welcome to Springfield Academy',
            metaDescription: 'Springfield Academy is a school.',
            headings: ['Welcome', 'Why Choose Us', 'Programs'],
            bodyContent: 'Springfield Academy has been educating students since 1985. We offer quality education.',
        },
        analysis: {
            seo: { score: 5, issues: ['Title too short', 'Meta description lacks keywords', 'Missing H1 structure'] },
            readability: { score: 6, issues: ['Sentences too short', 'Lacks engaging content'] },
            accessibility: { score: 7, issues: ['Some images missing alt text'] },
            overall: 6,
        },
        improved: {
            title: 'Springfield Academy | Premier K-12 Education in Springfield',
            metaDescription: 'Discover exceptional K-12 education at Springfield Academy. Our innovative curriculum, experienced faculty, and nurturing environment prepare students for lifelong success.',
            headings: ['Welcome to Springfield Academy', 'Why Families Choose Springfield', 'Our Academic Programs', 'Student Success Stories'],
            bodyContent: 'For nearly four decades, Springfield Academy has been the cornerstone of educational excellence in our community. Our dedicated faculty, innovative curriculum, and supportive environment nurture every student\'s potential. From rigorous academics to enriching extracurricular activities, we prepare students not just for college, but for life.',
            keywords: ['K-12 education', 'Springfield Academy', 'private school', 'academic excellence'],
        },
        useOriginal: false,
    },
    2: {
        original: {
            title: 'About Us',
            metaDescription: 'Learn about our school.',
            headings: ['About', 'History', 'Mission'],
            bodyContent: 'We are a school dedicated to education. Our mission is to teach students.',
        },
        analysis: {
            seo: { score: 4, issues: ['Generic title', 'Vague meta description', 'Weak keyword usage'] },
            readability: { score: 5, issues: ['Content too brief', 'Lacks storytelling'] },
            accessibility: { score: 8, issues: ['Good heading structure'] },
            overall: 5.5,
        },
        improved: {
            title: 'About Springfield Academy | Our History, Mission & Vision',
            metaDescription: 'Learn about Springfield Academy\'s 40-year legacy of academic excellence. Discover our mission to inspire lifelong learners and our vision for educational innovation.',
            headings: ['About Springfield Academy', 'Our Rich History', 'Mission & Core Values', 'Meet Our Leadership'],
            bodyContent: 'Springfield Academy was founded in 1985 with a bold vision: to create a learning environment where every student can thrive. Today, we continue that legacy with innovative teaching methods, a diverse curriculum, and a commitment to developing the whole child. Our experienced educators, state-of-the-art facilities, and vibrant community make Springfield Academy a place where students discover their passions and reach their full potential.',
            keywords: ['about us', 'school history', 'educational mission', 'school values'],
        },
        useOriginal: false,
    },
    3: {
        original: {
            title: 'Admissions',
            metaDescription: 'Apply to our school.',
            headings: ['Admissions', 'How to Apply', 'Tuition'],
            bodyContent: 'We welcome new students. Please fill out an application form to apply.',
        },
        analysis: {
            seo: { score: 5, issues: ['Title needs expansion', 'Meta lacks call-to-action'] },
            readability: { score: 6, issues: ['Needs more detail on process'] },
            accessibility: { score: 7, issues: ['Add descriptive link text'] },
            overall: 6,
        },
        improved: {
            title: 'Admissions | Apply to Springfield Academy Today',
            metaDescription: 'Begin your journey at Springfield Academy. Learn about our simple admissions process, schedule a tour, and discover financial aid options. Apply now for Fall 2025!',
            headings: ['Join the Springfield Family', 'Admissions Process', 'Tuition & Financial Aid', 'Schedule a Campus Visit'],
            bodyContent: 'Taking the first step toward a Springfield Academy education is easier than you think. Our admissions team is here to guide you through every stage of the process. From your initial inquiry to enrollment day, we\'re committed to making your transition seamless. Schedule a campus tour, meet our faculty, and discover why families choose Springfield Academy for their children\'s education.',
            keywords: ['school admissions', 'apply to school', 'tuition', 'financial aid'],
        },
        useOriginal: false,
    },
}

export function MigrationProvider({ children }) {
    const [sourceUrl, setSourceUrl] = useState('')
    const [discoveredPages, setDiscoveredPages] = useState([])
    const [scrapedContent, setScrapedContent] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [discoveryProgress, setDiscoveryProgress] = useState({
        phase: 'discovering',
        urlsFound: 0,
        processed: 0,
        queue: 0,
        total: 0,
        currentAction: ''
    })

    const discoverPages = async (url) => {
        setIsLoading(true)
        setSourceUrl(url)
        setDiscoveryProgress({ phase: 'discovering', urlsFound: 0, processed: 0, queue: 0, total: 0, currentAction: 'Connecting...' })
        
        try {
            // Use SSE for real-time progress
            const eventSource = new EventSource(`${API_BASE}/discover/stream?url=${encodeURIComponent(url)}`)
            
            await new Promise((resolve, reject) => {
                eventSource.onmessage = (event) => {
                    const data = JSON.parse(event.data)
                    
                    if (data.type === 'progress') {
                        setDiscoveryProgress({
                            phase: data.phase || 'discovering',
                            urlsFound: data.urlsFound || 0,
                            processed: data.processed || 0,
                            queue: data.queue || 0,
                            total: data.total || 0,
                            currentAction: data.currentAction || ''
                        })
                    } else if (data.type === 'complete') {
                        eventSource.close()
                        if (data.pages) {
                            const pagesWithSelection = data.pages.map(page => ({
                                ...page,
                                selected: false,
                                children: page.children?.map(child => ({ ...child, selected: false })) || []
                            }))
                            setDiscoveredPages(pagesWithSelection)
                        }
                        resolve()
                    } else if (data.type === 'error') {
                        eventSource.close()
                        console.error('Discovery error:', data.error)
                        setDiscoveredPages(mockDiscoveredPages)
                        resolve()
                    }
                }
                
                eventSource.onerror = () => {
                    eventSource.close()
                    console.error('SSE connection failed, using fallback')
                    setDiscoveredPages(mockDiscoveredPages)
                    resolve()
                }
            })
        } catch (error) {
            console.error('API Error:', error)
            setDiscoveredPages(mockDiscoveredPages)
        }
        
        setIsLoading(false)
    }

    // Helper function to analyze content with AI
    const analyzeWithAI = async (pageContent, pageTitle) => {
        try {
            console.log(`🤖 [AI] Starting analysis for: ${pageTitle}`)

            const contentToAnalyze = `
Title: ${pageContent.title || ''}
Meta Description: ${pageContent.metaDescription || ''}
H1: ${pageContent.h1 || ''}
Content: ${pageContent.bodyContent || ''}
            `.trim()

            const response = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: contentToAnalyze })
            })

            if (!response.ok) {
                throw new Error('AI analysis failed')
            }

            const data = await response.json()

            if (data.success) {
                console.log(`✅ [AI] Analysis complete for: ${pageTitle}`, data.analysis)
                return data.analysis
            }
            return null
        } catch (error) {
            console.error(`❌ [AI] Analysis Error for ${pageTitle}:`, error)
            return null
        }
    }

    const scrapeAndAnalyze = async () => {
        setIsLoading(true)

        // Collect all pages to analyze
        const pagesToAnalyze = []

        discoveredPages.forEach(page => {
            if (page.selected && page.content) {
                pagesToAnalyze.push({ id: page.id, content: page.content, title: page.title })
            }
            page.children?.forEach(child => {
                if (child.selected && child.content) {
                    pagesToAnalyze.push({ id: child.id, content: child.content, title: child.title })
                }
            })
        })

        // If no pages to analyze, fallback to mock
        if (pagesToAnalyze.length === 0) {
            console.log('⚠️ No pages selected, using mock data')
            setScrapedContent(mockScrapedContent)
            setIsLoading(false)
            return
        }

        console.log(`🚀 [AI] Starting AI analysis for ${pagesToAnalyze.length} pages...`)

        // Build initial content and analyze with AI
        const content = {}

        // Process pages in batches to avoid overwhelming the API
        const batchSize = 3
        for (let i = 0; i < pagesToAnalyze.length; i += batchSize) {
            const batch = pagesToAnalyze.slice(i, i + batchSize)

            await Promise.all(batch.map(async (page) => {
                const originalTitle = page.content.title || page.title
                const originalMeta = page.content.metaDescription || ''
                const originalBody = page.content.bodyContent || ''

                // Call AI for analysis
                const aiAnalysis = await analyzeWithAI(page.content, page.title)

                content[page.id] = {
                    original: {
                        title: originalTitle,
                        metaDescription: originalMeta,
                        h1: page.content.h1 || '',
                        bodyContent: originalBody,
                        images: page.content.images || [],
                        wordCount: page.content.wordCount || 0
                    },
                    analysis: aiAnalysis ? {
                        seo: aiAnalysis.seo || { score: 5, issues: [] },
                        readability: aiAnalysis.readability || { score: 5, issues: [] },
                        accessibility: aiAnalysis.accessibility || { score: 5, issues: [] },
                        overall: aiAnalysis.seo && aiAnalysis.readability && aiAnalysis.accessibility
                            ? ((aiAnalysis.seo.score + aiAnalysis.readability.score + aiAnalysis.accessibility.score) / 3).toFixed(1)
                            : 5
                    } : {
                        seo: { score: 5, issues: ['AI analysis unavailable'] },
                        readability: { score: 5, issues: ['AI analysis unavailable'] },
                        accessibility: { score: 5, issues: ['AI analysis unavailable'] },
                        overall: 5
                    },
                    improved: aiAnalysis?.improved ? {
                        title: aiAnalysis.improved.title || `${originalTitle} | Optimized`,
                        metaDescription: aiAnalysis.improved.metaDescription || originalMeta,
                        bodyContent: aiAnalysis.improved.bodyContent || originalBody,
                        keywords: aiAnalysis.improved.keywords || []
                    } : {
                        title: `${originalTitle} | Optimized`,
                        metaDescription: originalMeta || 'AI analysis unavailable',
                        bodyContent: originalBody,
                        keywords: []
                    },
                    useOriginal: false // Default to AI improved version
                }
            }))

            // Update state progressively so user sees results as they come
            setScrapedContent({ ...content })
        }

        setIsLoading(false)
    }

    const togglePageSelection = (pageId, isChild = false, parentId = null) => {
        setDiscoveredPages(pages =>
            pages.map(page => {
                if (isChild && page.id === parentId) {
                    return {
                        ...page,
                        children: page.children?.map(child =>
                            child.id === pageId ? { ...child, selected: !child.selected } : child
                        )
                    }
                }
                if (!isChild && page.id === pageId) {
                    const newSelected = !page.selected
                    return {
                        ...page,
                        selected: newSelected,
                        children: page.children?.map(child => ({ ...child, selected: newSelected }))
                    }
                }
                return page
            })
        )
    }

    const selectAllPages = (selected) => {
        setDiscoveredPages(pages =>
            pages.map(page => ({
                ...page,
                selected,
                children: page.children?.map(child => ({ ...child, selected }))
            }))
        )
    }

    const countSelectedPages = () => {
        let count = 0
        discoveredPages.forEach(page => {
            if (page.selected) count++
            page.children?.forEach(child => {
                if (child.selected) count++
            })
        })
        return count
    }

    const countTotalPages = () => {
        let count = 0
        discoveredPages.forEach(page => {
            count++
            count += page.children?.length || 0
        })
        return count
    }

    const toggleUseOriginal = (pageId) => {
        setScrapedContent(content => ({
            ...content,
            [pageId]: {
                ...content[pageId],
                useOriginal: !content[pageId]?.useOriginal
            }
        }))
    }

    const getSelectedPages = () => discoveredPages.filter(p => p.selected)

    const generateExport = () => {
        const selectedPages = getSelectedPages()
        return selectedPages.map(page => {
            const content = scrapedContent[page.id]
            const data = content?.useOriginal ? content?.original : content?.improved
            return {
                originalUrl: `${sourceUrl}${page.url}`,
                menuName: page.title.substring(0, 50),
                pageTitle: data?.title || page.title,
                description: data?.metaDescription || '',
                headerType: 'image',
                bodyContent: data?.bodyContent || '',
                keywords: data?.keywords || [],
                aiScore: content?.analysis?.overall || 0,
            }
        })
    }

    return (
        <MigrationContext.Provider value={{
            sourceUrl,
            discoveredPages,
            scrapedContent,
            isLoading,
            discoveryProgress,
            discoverPages,
            scrapeAndAnalyze,
            togglePageSelection,
            selectAllPages,
            toggleUseOriginal,
            getSelectedPages,
            generateExport,
            countSelectedPages,
            countTotalPages,
        }}>
            {children}
        </MigrationContext.Provider>
    )
}

export function useMigration() {
    const context = useContext(MigrationContext)
    if (!context) {
        throw new Error('useMigration must be used within MigrationProvider')
    }
    return context
}
