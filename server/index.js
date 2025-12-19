import express from 'express';
import cors from 'cors';
import { discoverSitemap, scrapePages, saveAnalyzedData } from './scraper.js';
import { analyzeContent } from './ai.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SSE endpoint for real-time discovery progress
app.get('/api/discover/stream', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Progress callback
  const onProgress = (progress) => {
    res.write(`data: ${JSON.stringify(progress)}\n\n`);
  };

  try {
    console.log(`[DISCOVER] Starting discovery for: ${url}`);
    const pages = await discoverSitemap(url, onProgress);
    console.log(`[DISCOVER] Found ${pages.length} top-level pages`);

    // Send final result
    res.write(`data: ${JSON.stringify({ type: 'complete', pages })}\n\n`);
    res.end();
  } catch (error) {
    console.error('[DISCOVER] Error:', error.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

// Discover sitemap endpoint (non-streaming fallback)
app.post('/api/discover', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`[DISCOVER] Starting discovery for: ${url}`);
    const pages = await discoverSitemap(url);
    console.log(`[DISCOVER] Found ${pages.length} top-level pages`);

    res.json({ success: true, pages });
  } catch (error) {
    console.error('[DISCOVER] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Scrape content for specific pages
app.post('/api/scrape', async (req, res) => {
  try {
    const { baseUrl, urls } = req.body;

    if (!baseUrl || !urls || !Array.isArray(urls)) {
      return res.status(400).json({
        success: false,
        error: 'baseUrl and urls array are required'
      });
    }

    console.log(`[SCRAPE] Scraping ${urls.length} pages from ${baseUrl}`);
    const content = await scrapePages(baseUrl, urls);

    res.json({ success: true, content });
  } catch (error) {
    console.error('[SCRAPE] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clean and analyze content
app.post('/api/analyze', async (req, res) => {
  try {
    const { content, provider } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    console.log(`[ANALYZE] Analyzing content with ${provider || 'gemini'}...`);
    const analysis = await analyzeContent(content, provider);

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('[ANALYZE] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save analyzed content to JSON file
app.post('/api/save-analysis', async (req, res) => {
  try {
    const { sourceUrl, analyzedContent } = req.body;

    if (!sourceUrl || !analyzedContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'sourceUrl and analyzedContent are required' 
      });
    }

    console.log(`[SAVE] Saving analyzed data for: ${sourceUrl}`);
    const { filepath, filename } = saveAnalyzedData(sourceUrl, analyzedContent);

    res.json({ success: true, filepath, filename });
  } catch (error) {
    console.error('[SAVE] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Content Migration Server running on http://localhost:${PORT}`);
  console.log(`   POST /api/discover      - Discover sitemap`);
  console.log(`   POST /api/scrape        - Scrape page content`);
  console.log(`   POST /api/analyze       - Analyze content (AI)`);
  console.log(`   POST /api/save-analysis - Save analyzed data\n`);
});
