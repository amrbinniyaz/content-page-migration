import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper: delay for retry
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Analyzes content using Gemini AI
 * @param {string} content - The HTML or text content to analyze
 * @returns {Promise<Object>} - Analysis result
 */
export async function analyzeContent(content) {
    return await analyzeWithGemini(content);
}

async function analyzeWithGemini(content, retries = 3) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    // Use Gemini 2.5 Flash Lite (faster, lower cost)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const prompt = `
    You are a content migration and SEO expert. Analyze the following web page content and provide improved versions optimized for SEO and readability.

    Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
    {
      "seo": {
        "score": <number 0-10>,
        "issues": ["issue1", "issue2"]
      },
      "readability": {
        "score": <number 0-10>,
        "issues": ["issue1", "issue2"]
      },
      "accessibility": {
        "score": <number 0-10>,
        "issues": ["issue1", "issue2"]
      },
      "improved": {
        "title": "SEO-optimized page title (50-60 characters)",
        "metaDescription": "Compelling meta description with keywords (150-160 characters)",
        "bodyContent": "Improved, well-structured content with better readability and SEO optimization. Keep the same meaning but improve clarity, add relevant keywords naturally, and enhance engagement.",
        "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
        "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
      }
    }

    IMPORTANT:
    - The improved bodyContent should be a rewritten, enhanced version of the original content
    - Maintain the original meaning and key information
    - Improve structure, clarity, and SEO optimization
    - Make it more engaging and scannable

    Content to analyze:
    ${content.substring(0, 15000)}
  `;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            const isRetryable = error.status === 503 || 
                               error.message?.includes('overloaded') || 
                               error.message?.includes('fetch failed');
            
            console.error(`[Gemini] Attempt ${attempt}/${retries} failed:`, error.message);
            
            if (isRetryable && attempt < retries) {
                const waitTime = attempt * 2000; // 2s, 4s, 6s
                console.log(`[Gemini] Retrying in ${waitTime/1000}s...`);
                await delay(waitTime);
                continue;
            }
            
            throw new Error('Failed to analyze content with Gemini: ' + error.message);
        }
    }
}

