# Content Migration Tool - Production Implementation Guide

This document outlines how to transform the current prototype into a production-ready application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [JSON Schema Specifications](#json-schema-specifications)
3. [API Endpoints](#api-endpoints)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Integration](#frontend-integration)
6. [AI Integration](#ai-integration)
7. [Database Schema](#database-schema)
8. [Deployment Guide](#deployment-guide)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Vite)                        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Step 1   │  │   Step 2     │  │ Step 3   │  │ Step 4   │                │
│  │ URL Input│─▶│ Page Select  │─▶│ Review   │─▶│ Export   │                │
│  └──────────┘  └──────────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API (Node.js)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  /discover   │  │   /scrape    │  │  /analyze    │  │   /export    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │   Scraper    │  │   OpenAI     │  │  Database    │
            │   Service    │  │   API        │  │  (Postgres)  │
            └──────────────┘  └──────────────┘  └──────────────┘
```

---

## JSON Schema Specifications

### 1. Sitemap Discovery Response

When your scraper discovers pages from a sitemap, return **an array** with this structure:

```json
[
  {
    "id": 1,
    "url": "/about",
    "title": "About Us",
    "type": "content",
    "isParent": true,
    "children": [
      { "id": 101, "url": "/about/history", "title": "Our History", "type": "content" },
      { "id": 102, "url": "/about/mission", "title": "Mission & Vision", "type": "content" },
      { "id": 103, "url": "/about/leadership", "title": "Leadership Team", "type": "content" }
    ]
  },
  {
    "id": 2,
    "url": "/academics",
    "title": "Academics",
    "type": "content",
    "isParent": true,
    "children": [
      { "id": 201, "url": "/academics/elementary", "title": "Elementary School", "type": "content" },
      { "id": 202, "url": "/academics/middle", "title": "Middle School", "type": "content" },
      { "id": 203, "url": "/academics/high", "title": "High School", "type": "content" }
    ]
  },
  {
    "id": 3,
    "url": "/contact",
    "title": "Contact",
    "type": "contact",
    "isParent": true,
    "children": [
      { "id": 301, "url": "/contact/directory", "title": "Staff Directory", "type": "contact" },
      { "id": 302, "url": "/contact/locations", "title": "Locations", "type": "contact" }
    ]
  }
]
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique numeric identifier. Parent IDs: 1, 2, 3... Child IDs: 101, 102 (prefix with parent ID) |
| `url` | string | Yes | Relative path from root (e.g., `/about`, `/about/history`) |
| `title` | string | Yes | Page title extracted from `<title>` tag or `<h1>` |
| `type` | string | Yes | One of: `homepage`, `content`, `blog`, `contact` |
| `isParent` | boolean | Only on parents | Set to `true` for top-level section pages that have children |
| `children` | array | Only on parents | Array of child page objects (same structure, without `isParent` or `children`) |

#### ID Numbering Convention

- **Parent pages**: Sequential integers (1, 2, 3, 4...)
- **Child pages**: Parent ID × 100 + sequence (101, 102, 103 for parent 1's children)

#### Type Detection

| URL Pattern | Type |
|-------------|------|
| `/`, `/home` | `homepage` |
| `/blog/*`, `/news/*`, `/articles/*` | `blog` |
| `/contact/*` | `contact` |
| Everything else | `content` |

#### How to Build Hierarchy from Flat URLs

Your scraper should analyze URL structure to build hierarchy:

```javascript
function buildHierarchy(urls, baseUrl) {
  // Remove base URL, get relative paths
  const paths = urls.map(url => {
    return url.replace(baseUrl, '').replace(/\/$/, '') || '/';
  });

  // Group by first segment
  const groups = {};
  let parentId = 1;
  
  paths.forEach(path => {
    const segments = path.split('/').filter(Boolean);
    const parentKey = segments[0] || 'home';
    
    if (!groups[parentKey]) {
      groups[parentKey] = {
        id: parentId,
        url: `/${parentKey}`,
        title: formatTitle(parentKey),
        type: detectType(parentKey),
        isParent: true,
        children: []
      };
      parentId++;
    }
    
    if (segments.length > 1) {
      const parent = groups[parentKey];
      const childId = parent.id * 100 + parent.children.length + 1;
      parent.children.push({
        id: childId,
        url: path.startsWith('/') ? path : `/${path}`,
        title: formatTitle(segments[segments.length - 1]),
        type: detectType(parentKey)
      });
    }
  });

  return Object.values(groups);
}

function formatTitle(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function detectType(slug) {
  if (['blog', 'news', 'articles', 'posts'].includes(slug)) return 'blog';
  if (['contact', 'contact-us'].includes(slug)) return 'contact';
  if (['home', ''].includes(slug)) return 'homepage';
  return 'content';
}
```

---

### 2. Page Content Response (After Scraping)

When scraping individual page content:

```json
{
  "success": true,
  "data": {
    "pageId": "about",
    "url": "/about",
    "fullUrl": "https://example.com/about",
    "scrapedAt": "2025-12-17T11:30:00Z",
    "original": {
      "title": "About Us - Springfield Academy",
      "metaDescription": "Learn about our school.",
      "metaKeywords": ["school", "education"],
      "ogImage": "https://example.com/images/og-about.jpg",
      "h1": "About Springfield Academy",
      "headings": [
        { "level": 2, "text": "Our History" },
        { "level": 2, "text": "Mission Statement" },
        { "level": 3, "text": "Core Values" }
      ],
      "bodyContent": "Springfield Academy was founded in 1985...",
      "wordCount": 450,
      "images": [
        {
          "src": "https://example.com/images/campus.jpg",
          "alt": "Campus aerial view",
          "width": 1200,
          "height": 800
        }
      ],
      "internalLinks": [
        { "href": "/contact", "text": "Contact Us" },
        { "href": "/admissions", "text": "Apply Now" }
      ],
      "externalLinks": [
        { "href": "https://facebook.com/springfield", "text": "Facebook" }
      ]
    }
  }
}
```

---

### 3. AI Analysis Response

After AI processes the content:

```json
{
  "success": true,
  "data": {
    "pageId": "about",
    "analysis": {
      "seo": {
        "score": 6,
        "maxScore": 10,
        "issues": [
          "Title is too generic - add keywords",
          "Meta description is under 120 characters",
          "Missing structured data markup"
        ]
      },
      "readability": {
        "score": 7,
        "maxScore": 10,
        "fleschKincaid": 8.5,
        "issues": [
          "Some sentences exceed 25 words",
          "Consider adding bullet points for scannability"
        ]
      },
      "accessibility": {
        "score": 8,
        "maxScore": 10,
        "issues": [
          "2 images missing alt text",
          "Heading hierarchy skips H2 to H4"
        ]
      },
      "overall": 7
    },
    "improved": {
      "title": "About Springfield Academy | 40 Years of Educational Excellence",
      "metaDescription": "Discover Springfield Academy's 40-year legacy of academic excellence. Learn about our mission, values, and commitment to nurturing future leaders.",
      "headings": [
        "About Springfield Academy",
        "Our Rich 40-Year History",
        "Mission & Core Values",
        "Meet Our Leadership Team"
      ],
      "bodyContent": "For four decades, Springfield Academy has been the cornerstone of educational excellence in our community...",
      "keywords": ["Springfield Academy", "private school", "K-12 education", "academic excellence"]
    }
  }
}
```

---

### 4. Final Export Format

The export JSON for CMS import:

```json
{
  "exportedAt": "2025-12-17T12:00:00Z",
  "sourceUrl": "https://example.com",
  "totalPages": 15,
  "pages": [
    {
      "originalUrl": "https://example.com/about",
      "slug": "about",
      "menuName": "About Us",
      "pageTitle": "About Springfield Academy | 40 Years of Educational Excellence",
      "metaDescription": "Discover Springfield Academy's 40-year legacy...",
      "keywords": ["Springfield Academy", "private school"],
      "headerType": "image",
      "headerImage": "https://example.com/images/campus.jpg",
      "bodyContent": "<h1>About Springfield Academy</h1><p>For four decades...</p>",
      "aiScore": 7,
      "parent": null,
      "order": 1
    },
    {
      "originalUrl": "https://example.com/about/history",
      "slug": "about-history",
      "menuName": "Our History",
      "pageTitle": "Our History | Springfield Academy",
      "metaDescription": "Explore the rich history of Springfield Academy...",
      "keywords": ["school history", "founded 1985"],
      "headerType": "image",
      "headerImage": null,
      "bodyContent": "<h1>Our History</h1><p>Founded in 1985...</p>",
      "aiScore": 8,
      "parent": "about",
      "order": 1
    }
  ]
}
```

---

## API Endpoints

### Base URL
```
Production: https://api.yourdomain.com/v1
Development: http://localhost:3001/api
```

### Endpoints

#### POST /discover
Start sitemap discovery for a URL.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "disc_abc123",
  "status": "processing",
  "message": "Discovery started"
}
```

---

#### GET /discover/:jobId
Check discovery status and get results.

**Response (Processing):**
```json
{
  "success": true,
  "jobId": "disc_abc123",
  "status": "processing",
  "progress": 45,
  "message": "Scanning sitemap..."
}
```

**Response (Complete):**
```json
{
  "success": true,
  "jobId": "disc_abc123",
  "status": "complete",
  "data": {
    "sourceUrl": "https://example.com",
    "pages": [...]
  }
}
```

---

#### POST /scrape
Scrape selected pages.

**Request:**
```json
{
  "jobId": "disc_abc123",
  "pageIds": ["about", "about-history", "academics"]
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "scrape_xyz789",
  "status": "processing",
  "totalPages": 3
}
```

---

#### GET /scrape/:jobId
Check scraping status.

**Response:**
```json
{
  "success": true,
  "jobId": "scrape_xyz789",
  "status": "processing",
  "progress": {
    "completed": 2,
    "total": 3,
    "currentPage": "academics"
  }
}
```

---

#### POST /analyze
Send scraped content for AI analysis.

**Request:**
```json
{
  "scrapeJobId": "scrape_xyz789"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "analyze_def456",
  "status": "processing"
}
```

---

#### GET /export/:jobId
Download final export.

**Response:** JSON file download

---

## Backend Implementation

### Project Structure

```
backend/
├── src/
│   ├── index.js              # Express app entry
│   ├── routes/
│   │   ├── discover.js       # Discovery endpoints
│   │   ├── scrape.js         # Scraping endpoints
│   │   ├── analyze.js        # AI analysis endpoints
│   │   └── export.js         # Export endpoints
│   ├── services/
│   │   ├── scraper.js        # Your existing scraper
│   │   ├── sitemap.js        # Sitemap parser
│   │   ├── ai.js             # OpenAI integration
│   │   └── hierarchy.js      # URL hierarchy builder
│   ├── jobs/
│   │   ├── queue.js          # Bull queue setup
│   │   ├── discovery.job.js  # Discovery worker
│   │   └── scrape.job.js     # Scrape worker
│   ├── models/
│   │   ├── Job.js            # Job model
│   │   └── Page.js           # Page model
│   └── utils/
│       ├── logger.js
│       └── validators.js
├── package.json
└── .env
```

### Key Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "bull": "^4.12.0",
    "ioredis": "^5.3.2",
    "puppeteer": "^21.6.0",
    "cheerio": "^1.0.0-rc.12",
    "openai": "^4.24.0",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "winston": "^3.11.0",
    "zod": "^3.22.4"
  }
}
```

### Example: Sitemap Discovery Service

```javascript
// src/services/sitemap.js
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

export async function discoverPages(baseUrl) {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap-index.xml`,
  ];

  let urls = [];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await axios.get(sitemapUrl, { timeout: 10000 });
      const parsed = await parseStringPromise(response.data);
      
      // Handle sitemap index
      if (parsed.sitemapindex) {
        const sitemaps = parsed.sitemapindex.sitemap || [];
        for (const sm of sitemaps) {
          const subUrls = await fetchSitemap(sm.loc[0]);
          urls.push(...subUrls);
        }
      }
      
      // Handle regular sitemap
      if (parsed.urlset) {
        const entries = parsed.urlset.url || [];
        urls.push(...entries.map(u => u.loc[0]));
      }
      
      break; // Found valid sitemap
    } catch (err) {
      continue; // Try next sitemap URL
    }
  }

  // Build hierarchy from flat URL list
  return buildHierarchy(urls, baseUrl);
}
```

### Example: Express Route

```javascript
// src/routes/discover.js
import express from 'express';
import { v4 as uuid } from 'uuid';
import { discoveryQueue } from '../jobs/queue.js';
import { db } from '../db/index.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Validate URL
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'Invalid URL' });
    }

    // Create job record
    const jobId = `disc_${uuid().slice(0, 8)}`;
    await db.query(
      'INSERT INTO jobs (id, type, status, source_url) VALUES ($1, $2, $3, $4)',
      [jobId, 'discover', 'pending', url]
    );

    // Add to queue
    await discoveryQueue.add({ jobId, url });

    res.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Discovery started'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const result = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    const job = result.rows[0];

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({
      success: true,
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      data: job.result,
      error: job.error
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
```

---

## Frontend Integration

### Update MigrationContext.jsx

Replace mock data with real API calls:

```javascript
// src/context/MigrationContext.jsx
import { createContext, useContext, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function MigrationProvider({ children }) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [discoveredPages, setDiscoveredPages] = useState([]);
  const [scrapedContent, setScrapedContent] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState({ step: '', percent: 0 });

  const discoverPages = async (url) => {
    setIsLoading(true);
    setError(null);
    setSourceUrl(url);
    setProgress({ step: 'Starting discovery...', percent: 0 });

    try {
      // Start discovery
      const startRes = await fetch(`${API_BASE}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const startData = await startRes.json();
      
      if (!startData.success) throw new Error(startData.message);
      
      const jobId = startData.jobId;
      setJobId(jobId);

      // Poll for results
      let result;
      while (true) {
        await new Promise(r => setTimeout(r, 1000));
        
        const pollRes = await fetch(`${API_BASE}/discover/${jobId}`);
        result = await pollRes.json();
        
        setProgress({ 
          step: result.message || 'Discovering pages...', 
          percent: result.progress || 50 
        });
        
        if (result.status === 'complete') break;
        if (result.status === 'failed') throw new Error(result.error);
      }

      setDiscoveredPages(result.data.pages);
      setProgress({ step: 'Complete', percent: 100 });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const scrapeAndAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setProgress({ step: 'Preparing to scrape...', percent: 0 });

    try {
      // Get selected page IDs
      const selectedIds = [];
      discoveredPages.forEach(page => {
        if (page.selected) selectedIds.push(page.id);
        page.children?.forEach(child => {
          if (child.selected) selectedIds.push(child.id);
        });
      });

      if (selectedIds.length === 0) {
        throw new Error('No pages selected');
      }

      // Start scraping
      setProgress({ step: 'Scraping pages...', percent: 10 });
      const scrapeRes = await fetch(`${API_BASE}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, pageIds: selectedIds })
      });
      const scrapeData = await scrapeRes.json();
      
      if (!scrapeData.success) throw new Error(scrapeData.message);

      // Poll for scrape completion
      let scrapeResult;
      while (true) {
        await new Promise(r => setTimeout(r, 1500));
        
        const pollRes = await fetch(`${API_BASE}/scrape/${scrapeData.jobId}`);
        scrapeResult = await pollRes.json();
        
        const pct = Math.round((scrapeResult.progress?.completed / scrapeResult.progress?.total) * 40) + 10;
        setProgress({ 
          step: `Scraping: ${scrapeResult.progress?.currentPage || '...'}`, 
          percent: pct 
        });
        
        if (scrapeResult.status === 'complete') break;
        if (scrapeResult.status === 'failed') throw new Error(scrapeResult.error);
      }

      // Start AI analysis
      setProgress({ step: 'Analyzing with AI...', percent: 55 });
      const analyzeRes = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scrapeJobId: scrapeData.jobId })
      });
      const analyzeData = await analyzeRes.json();

      if (!analyzeData.success) throw new Error(analyzeData.message);

      // Poll for analysis completion
      let analyzeResult;
      while (true) {
        await new Promise(r => setTimeout(r, 2000));
        
        const pollRes = await fetch(`${API_BASE}/analyze/${analyzeData.jobId}`);
        analyzeResult = await pollRes.json();
        
        setProgress({ 
          step: 'AI analysis in progress...', 
          percent: 55 + (analyzeResult.progress || 0) * 0.4
        });
        
        if (analyzeResult.status === 'complete') break;
        if (analyzeResult.status === 'failed') throw new Error(analyzeResult.error);
      }

      setScrapedContent(analyzeResult.data);
      setProgress({ step: 'Complete', percent: 100 });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of context
}
```

### Create API Service Layer

```javascript
// src/api/migration.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const migrationApi = {
  async startDiscovery(url) {
    const res = await fetch(`${API_BASE}/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return res.json();
  },

  async getDiscoveryStatus(jobId) {
    const res = await fetch(`${API_BASE}/discover/${jobId}`);
    return res.json();
  },

  async startScraping(jobId, pageIds) {
    const res = await fetch(`${API_BASE}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, pageIds })
    });
    return res.json();
  },

  async getScrapingStatus(jobId) {
    const res = await fetch(`${API_BASE}/scrape/${jobId}`);
    return res.json();
  },

  async startAnalysis(scrapeJobId) {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scrapeJobId })
    });
    return res.json();
  },

  async getAnalysisStatus(jobId) {
    const res = await fetch(`${API_BASE}/analyze/${jobId}`);
    return res.json();
  },

  async downloadExport(jobId) {
    const res = await fetch(`${API_BASE}/export/${jobId}`);
    return res.blob();
  }
};
```

### Add Environment Variables

```env
# .env.local (development)
VITE_API_URL=http://localhost:3001/api
```

```env
# .env.production
VITE_API_URL=https://api.yourdomain.com/v1
```

---

## AI Integration

### OpenAI Service

```javascript
// src/services/ai.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeContent(pageContent) {
  const prompt = `You are an SEO and content optimization expert. Analyze this webpage content and provide:

1. SEO score (1-10) with specific actionable issues
2. Readability score (1-10) with specific issues
3. Accessibility score (1-10) with specific issues
4. An improved version of the title, meta description, and body content

Current content:
- Title: ${pageContent.title}
- Meta Description: ${pageContent.metaDescription || 'None'}
- H1: ${pageContent.h1 || 'None'}
- Body Content (first 2000 chars): ${pageContent.bodyContent?.substring(0, 2000) || 'None'}
- Word Count: ${pageContent.wordCount || 0}
- Images: ${pageContent.images?.length || 0} images

Respond ONLY with valid JSON in this exact format:
{
  "analysis": {
    "seo": { "score": number, "issues": ["issue1", "issue2"] },
    "readability": { "score": number, "issues": ["issue1", "issue2"] },
    "accessibility": { "score": number, "issues": ["issue1", "issue2"] },
    "overall": number
  },
  "improved": {
    "title": "improved title here",
    "metaDescription": "improved meta description here (150-160 chars)",
    "bodyContent": "improved body content here",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function batchAnalyze(pages, onProgress) {
  const results = {};
  let completed = 0;

  for (const page of pages) {
    try {
      results[page.pageId] = await analyzeContent(page.original);
      completed++;
      onProgress?.(completed, pages.length);
    } catch (error) {
      results[page.pageId] = {
        error: error.message,
        analysis: { seo: { score: 0 }, readability: { score: 0 }, accessibility: { score: 0 }, overall: 0 }
      };
    }
    
    // Rate limiting - wait 500ms between requests
    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}
```

---

## Database Schema

### PostgreSQL / Supabase

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table - tracks all async operations
CREATE TABLE jobs (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('discover', 'scrape', 'analyze', 'export')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  source_url TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discovered pages table
CREATE TABLE discovered_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE CASCADE,
  page_id VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  full_url TEXT NOT NULL,
  title VARCHAR(500),
  type VARCHAR(50) DEFAULT 'content',
  parent_id VARCHAR(255),
  depth INTEGER DEFAULT 0,
  selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, page_id)
);

-- Scraped content table
CREATE TABLE scraped_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE CASCADE,
  page_id VARCHAR(255) NOT NULL,
  original_content JSONB NOT NULL,
  analysis JSONB,
  improved_content JSONB,
  use_original BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, page_id)
);

-- Indexes for performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_discovered_pages_job ON discovered_pages(job_id);
CREATE INDEX idx_discovered_pages_parent ON discovered_pages(parent_id);
CREATE INDEX idx_scraped_content_job ON scraped_content(job_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scraped_content_updated_at
  BEFORE UPDATE ON scraped_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Deployment Guide

### Frontend (Netlify)

1. **Connect Repository**
   - Go to Netlify Dashboard → Add new site → Import from Git
   - Select your GitHub repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables**
   ```
   VITE_API_URL=https://api.yourdomain.com/v1
   ```

4. **Deploy**
   - Push to main branch triggers automatic deploy

### Backend (Railway)

1. **Create New Project**
   - railway.app → New Project → Deploy from GitHub

2. **Add Services**
   - Node.js service (your API)
   - PostgreSQL database
   - Redis (for job queue)

3. **Environment Variables**
   ```
   PORT=3001
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   OPENAI_API_KEY=sk-...
   CORS_ORIGIN=https://yourdomain.netlify.app
   ```

4. **Deploy**
   - Push to main branch triggers automatic deploy

### Alternative: Supabase + Netlify Functions

For a simpler setup without separate backend:

1. **Supabase**
   - Create project at supabase.com
   - Run SQL schema in SQL Editor
   - Get connection string

2. **Netlify Functions**
   - Create `netlify/functions/` directory
   - Each API endpoint becomes a serverless function

```javascript
// netlify/functions/discover.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function handler(event, context) {
  if (event.httpMethod === 'POST') {
    const { url } = JSON.parse(event.body);
    // ... discovery logic
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
}
```

---

## Implementation Roadmap

### Week 1-2: Backend Foundation
- [ ] Set up Express server with TypeScript
- [ ] Integrate existing scraper for sitemap discovery
- [ ] Implement URL hierarchy builder
- [ ] Add Bull queue for async job processing
- [ ] Set up PostgreSQL database with schema
- [ ] Create discovery and scraping endpoints
- [ ] Add request validation with Zod

### Week 2-3: Scraping & AI
- [ ] Implement page content scraping (Puppeteer/Cheerio)
- [ ] Add OpenAI integration for content analysis
- [ ] Create analysis prompts and tune for quality
- [ ] Implement batch processing with rate limiting
- [ ] Add caching for AI responses (cost optimization)
- [ ] Build export generator

### Week 3-4: Frontend Integration
- [ ] Create API service layer
- [ ] Replace mock data with real API calls
- [ ] Add loading states and progress indicators
- [ ] Implement error handling and retry logic
- [ ] Add real-time updates (polling or WebSocket)
- [ ] Test end-to-end flow

### Week 4-5: Production Ready
- [ ] Add authentication (JWT or session-based)
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add request logging (Winston)
- [ ] Set up error tracking (Sentry)
- [ ] Add health check endpoint
- [ ] Deploy frontend to Netlify
- [ ] Deploy backend to Railway/Render
- [ ] Configure custom domain and SSL
- [ ] Load testing and optimization

### Week 5-6: Polish & Launch
- [ ] Add usage analytics
- [ ] Create admin dashboard (optional)
- [ ] Write API documentation
- [ ] Create user guide
- [ ] Beta testing with real websites
- [ ] Bug fixes and refinements
- [ ] Production launch

---

## Environment Variables Summary

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend (.env)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/migration

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-...

# Security
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Quick Start Commands

```bash
# Frontend Development
cd content-page-migration
npm install
npm run dev

# Backend Development (once created)
cd backend
npm install
npm run dev

# Database (Docker)
docker run -d \
  --name migration-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=migration \
  postgres:15

# Redis (Docker)
docker run -d \
  --name migration-redis \
  -p 6379:6379 \
  redis:7

# Run database migrations
npm run db:migrate
```

---

## Security Checklist

- [ ] HTTPS everywhere (enforce in production)
- [ ] API rate limiting
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize output)
- [ ] CORS properly configured
- [ ] Sensitive data encrypted at rest
- [ ] API keys stored in environment variables
- [ ] Authentication on protected routes
- [ ] Logging without sensitive data

---

## Next Steps

1. **Create the backend folder** with Express boilerplate
2. **Integrate your existing scraper** into the discovery service
3. **Set up Supabase** for database hosting
4. **Update the frontend** to use real API calls
5. **Test locally** with a real website
6. **Deploy** and run end-to-end tests

---

*Last updated: December 2025*
