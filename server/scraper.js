import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import fs from 'fs';
import path from 'path';

// Ensure data directory exists
const DATA_DIR = new URL('./data', import.meta.url).pathname;
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Save scraped data to JSON file
function saveToJson(baseUrl, pages) {
  const domain = new URL(baseUrl).hostname.replace(/\./g, '-');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${domain}_${timestamp}.json`;
  const filepath = path.join(DATA_DIR, filename);
  
  const data = {
    sourceUrl: baseUrl,
    scrapedAt: new Date().toISOString(),
    totalPages: countPagesInResult(pages),
    pages
  };
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`[SAVE] Saved to ${filepath}`);
  return filepath;
}

// Count pages in result
function countPagesInResult(pages) {
  let count = 0;
  for (const page of pages) {
    count++;
    if (page.children) count += page.children.length;
  }
  return count;
}

// Browser-like headers to avoid being blocked
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Cache-Control': 'max-age=0'
};

// Helper to delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with retry logic
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: BROWSER_HEADERS,
        ...options
      });
      return response;
    } catch (error) {
      if (error.response?.status === 429 && i < retries - 1) {
        console.log(`[RETRY] Rate limited, waiting ${(i + 1) * 2}s before retry...`);
        await delay((i + 1) * 2000);
        continue;
      }
      throw error;
    }
  }
}

// Discover sitemap and build hierarchical page structure
export async function discoverSitemap(baseUrl, onProgress = null) {
  // Normalize base URL
  baseUrl = baseUrl.replace(/\/$/, '');
  
  // Progress tracking
  const progress = {
    type: 'progress',
    phase: 'discovering',
    urlsFound: 0,
    processed: 0,
    queue: 0,
    total: 0,
    currentAction: 'Looking for sitemap...'
  };
  
  const emitProgress = () => {
    if (onProgress) onProgress({ ...progress });
  };
  
  // Emit initial progress
  emitProgress();
  
  // Try to find sitemap
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap-index.xml`,
    `${baseUrl}/wp-sitemap.xml`,
  ];

  let urls = [];

  // Try each sitemap URL
  for (const sitemapUrl of sitemapUrls) {
    try {
      progress.currentAction = `Checking ${sitemapUrl.split('/').pop()}...`;
      emitProgress();
      
      console.log(`[SITEMAP] Trying: ${sitemapUrl}`);
      const response = await fetchWithRetry(sitemapUrl);
      
      const parsed = await parseStringPromise(response.data);
      
      // Handle sitemap index (contains links to other sitemaps)
      if (parsed.sitemapindex) {
        console.log('[SITEMAP] Found sitemap index');
        progress.currentAction = 'Found sitemap index, fetching sub-sitemaps...';
        emitProgress();
        
        const sitemaps = parsed.sitemapindex.sitemap || [];
        progress.queue = sitemaps.length;
        emitProgress();
        
        for (const sm of sitemaps) {
          try {
            const subUrls = await fetchSitemapUrls(sm.loc[0]);
            urls.push(...subUrls);
            progress.urlsFound = urls.length;
            progress.processed++;
            emitProgress();
          } catch (e) {
            console.log(`[SITEMAP] Could not fetch sub-sitemap: ${sm.loc[0]}`);
            progress.processed++;
            emitProgress();
          }
        }
      }
      
      // Handle regular sitemap
      if (parsed.urlset) {
        console.log('[SITEMAP] Found urlset');
        const entries = parsed.urlset.url || [];
        urls.push(...entries.map(u => u.loc[0]));
        progress.urlsFound = urls.length;
        progress.currentAction = `Found ${urls.length} URLs in sitemap`;
        emitProgress();
      }
      
      if (urls.length > 0) {
        console.log(`[SITEMAP] Found ${urls.length} URLs`);
        break;
      }
    } catch (err) {
      console.log(`[SITEMAP] Not found at: ${sitemapUrl}`);
      continue;
    }
  }

  // If no sitemap found, try to crawl homepage for links
  if (urls.length === 0) {
    console.log('[SITEMAP] No sitemap found, crawling homepage...');
    progress.currentAction = 'No sitemap found, crawling homepage...';
    emitProgress();
    urls = await crawlHomepageLinks(baseUrl);
    progress.urlsFound = urls.length;
    progress.currentAction = `Found ${urls.length} links on homepage`;
    emitProgress();
  }

  // Build hierarchy from URLs
  progress.phase = 'building';
  progress.currentAction = 'Building page hierarchy...';
  emitProgress();
  
  const hierarchy = buildHierarchy(urls, baseUrl);
  
  // Scrape content for all pages
  progress.phase = 'scraping';
  progress.processed = 0;
  const totalPages = countPages(hierarchy);
  progress.queue = totalPages;
  progress.total = totalPages;
  progress.currentAction = `Starting to scrape ${totalPages} pages...`;
  emitProgress();
  
  const pagesWithContent = await scrapeAllContent(hierarchy, baseUrl, (scraped) => {
    progress.processed = scraped;
    progress.currentAction = `Scraped ${scraped} of ${progress.queue} pages`;
    emitProgress();
  });
  
  // Save to JSON file
  progress.currentAction = 'Saving data...';
  emitProgress();
  const savedPath = saveToJson(baseUrl, pagesWithContent);
  console.log(`[DISCOVER] Data saved to: ${savedPath}`);
  
  return pagesWithContent;
}

// Count total pages in hierarchy
function countPages(pages) {
  let count = 0;
  for (const page of pages) {
    count++;
    if (page.children) {
      count += page.children.length;
    }
  }
  return count;
}

// Fetch URLs from a single sitemap
async function fetchSitemapUrls(sitemapUrl) {
  const response = await fetchWithRetry(sitemapUrl);
  const parsed = await parseStringPromise(response.data);
  
  if (parsed.urlset) {
    return (parsed.urlset.url || []).map(u => u.loc[0]);
  }
  return [];
}

// Crawl homepage for links if no sitemap exists
async function crawlHomepageLinks(baseUrl) {
  try {
    const response = await fetchWithRetry(baseUrl);
    
    const $ = cheerio.load(response.data);
    const links = new Set();
    
    // Find all internal links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        // Handle relative URLs
        if (href.startsWith('/') && !href.startsWith('//')) {
          links.add(`${baseUrl}${href}`);
        }
        // Handle absolute URLs on same domain
        else if (href.startsWith(baseUrl)) {
          links.add(href);
        }
      }
    });
    
    // Filter out non-page URLs
    const pageUrls = Array.from(links).filter(url => {
      const path = url.replace(baseUrl, '');
      return !path.match(/\.(jpg|jpeg|png|gif|svg|pdf|css|js|ico|woff|woff2|ttf)$/i) &&
             !path.includes('#') &&
             !path.includes('?');
    });
    
    console.log(`[CRAWL] Found ${pageUrls.length} links on homepage`);
    return pageUrls;
  } catch (error) {
    console.error('[CRAWL] Error crawling homepage:', error.message);
    return [baseUrl];
  }
}

// Build hierarchical structure from flat URLs
function buildHierarchy(urls, baseUrl) {
  const groups = {};
  let parentId = 1;
  
  // Normalize and dedupe URLs
  const normalizedUrls = [...new Set(urls.map(url => {
    return url.replace(baseUrl, '').replace(/\/$/, '') || '/';
  }))];
  
  normalizedUrls.forEach(path => {
    const segments = path.split('/').filter(Boolean);
    
    // Handle homepage
    if (segments.length === 0) {
      if (!groups['home']) {
        groups['home'] = {
          id: parentId++,
          url: '/',
          title: 'Home',
          type: 'homepage',
          isParent: true,
          children: []
        };
      }
      return;
    }
    
    const parentKey = segments[0];
    
    // Create parent if doesn't exist
    if (!groups[parentKey]) {
      groups[parentKey] = {
        id: parentId++,
        url: `/${parentKey}`,
        title: formatTitle(parentKey),
        type: detectType(parentKey),
        isParent: true,
        children: []
      };
    }
    
    // Add as child if deeper than 1 level
    if (segments.length > 1) {
      const parent = groups[parentKey];
      const childId = parent.id * 100 + parent.children.length + 1;
      const childPath = '/' + segments.join('/');
      
      // Avoid duplicates
      if (!parent.children.some(c => c.url === childPath)) {
        parent.children.push({
          id: childId,
          url: childPath,
          title: formatTitle(segments[segments.length - 1]),
          type: detectType(parentKey)
        });
      }
    }
  });

  return Object.values(groups);
}

// Format slug to title
function formatTitle(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Detect page type from URL
function detectType(slug) {
  const blogPatterns = ['blog', 'news', 'articles', 'posts', 'stories'];
  const contactPatterns = ['contact', 'contact-us', 'get-in-touch'];
  
  if (blogPatterns.includes(slug.toLowerCase())) return 'blog';
  if (contactPatterns.includes(slug.toLowerCase())) return 'contact';
  return 'content';
}

// Scrape content for all pages in hierarchy
async function scrapeAllContent(hierarchy, baseUrl, onProgress = null) {
  const results = [];
  let scraped = 0;
  
  for (const page of hierarchy) {
    // Scrape parent page
    const parentContent = await scrapeSinglePage(baseUrl, page.url);
    scraped++;
    if (onProgress) onProgress(scraped);
    
    const pageWithContent = {
      ...page,
      title: parentContent.title || page.title,
      content: parentContent
    };
    
    // Scrape children
    if (page.children && page.children.length > 0) {
      pageWithContent.children = [];
      for (const child of page.children) {
        const childContent = await scrapeSinglePage(baseUrl, child.url);
        scraped++;
        if (onProgress) onProgress(scraped);
        
        pageWithContent.children.push({
          ...child,
          title: childContent.title || child.title,
          content: childContent
        });
      }
    }
    
    results.push(pageWithContent);
  }
  
  return results;
}

// Scrape a single page's content
async function scrapeSinglePage(baseUrl, path) {
  const url = path === '/' ? baseUrl : `${baseUrl}${path}`;
  
  try {
    console.log(`[SCRAPE] Fetching: ${url}`);
    await delay(500); // Small delay between page requests
    const response = await fetchWithRetry(url);
    
    const $ = cheerio.load(response.data);
    
    // Remove script, style, nav, footer, header elements for cleaner content
    $('script, style, nav, footer, header, aside, .sidebar, .navigation, .menu').remove();
    
    // Extract metadata
    const title = $('title').text().trim() || $('h1').first().text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').first().text().trim();
    
    // Extract main content
    let bodyContent = '';
    const mainSelectors = ['main', 'article', '.content', '.main-content', '#content', '#main'];
    
    for (const selector of mainSelectors) {
      const content = $(selector).html();
      if (content && content.length > 100) {
        bodyContent = content;
        break;
      }
    }
    
    // Fallback to body if no main content found
    if (!bodyContent) {
      bodyContent = $('body').html() || '';
    }
    
    // Clean up the content
    bodyContent = bodyContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract images
    const images = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      if (src && !src.startsWith('data:')) {
        images.push({ 
          src: src.startsWith('http') ? src : `${baseUrl}${src}`,
          alt 
        });
      }
    });
    
    return {
      title: title.split('|')[0].split('-')[0].trim() || h1,
      metaDescription,
      h1,
      bodyContent: bodyContent.substring(0, 50000), // Limit content size
      images: images.slice(0, 20), // Limit images
      wordCount: bodyContent.replace(/<[^>]*>/g, '').split(/\s+/).length
    };
  } catch (error) {
    console.error(`[SCRAPE] Error scraping ${url}:`, error.message);
    return {
      title: formatTitle(path.split('/').pop() || 'Home'),
      metaDescription: '',
      h1: '',
      bodyContent: '',
      images: [],
      wordCount: 0,
      error: error.message
    };
  }
}

// Scrape specific pages (for selective scraping)
export async function scrapePages(baseUrl, urls) {
  const results = {};
  
  for (const url of urls) {
    results[url] = await scrapeSinglePage(baseUrl, url);
  }
  
  return results;
}
