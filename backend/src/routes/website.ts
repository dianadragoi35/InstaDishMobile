import express, { Request, Response } from 'express';
import * as cheerio from 'cheerio';

const router = express.Router();

export interface WebsiteApiResponse {
  success: boolean;
  content?: string;
  imageUrl?: string;
  error?: string;
}

/**
 * Validate if URL is properly formatted
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url.trim());
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Clean HTML content for recipe parsing
 */
function cleanHtmlForRecipe(html: string): string {
  // Remove script and style tags with their content
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');

  // Remove HTML tags but keep content
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Clean up whitespace and common non-recipe content
  return cleaned
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/^[\s\n]+|[\s\n]+$/g, '')
    .trim();
}

/**
 * Extract image URL from HTML using OpenGraph and Twitter meta tags
 */
function extractImageUrl(html: string): string | null {
  try {
    const $ = cheerio.load(html);

    // Try OpenGraph image first (most common for recipe sites)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && ogImage.trim()) {
      return ogImage.trim();
    }

    // Fall back to Twitter image
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage && twitterImage.trim()) {
      return twitterImage.trim();
    }

    // No image found
    return null;
  } catch (error) {
    console.warn('Failed to extract image URL:', error);
    return null;
  }
}

/**
 * POST /api/website/content
 * Fetch and clean website content for recipe parsing
 */
router.post('/content', async (req: Request, res: Response) => {
  try {
    const { websiteUrl } = req.body;

    console.log('🌐 Website Content API called:', {
      url: websiteUrl,
      timestamp: new Date().toISOString()
    });

    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        error: 'Website URL is required'
      } as WebsiteApiResponse);
    }

    // Validate URL format
    if (!isValidUrl(websiteUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      } as WebsiteApiResponse);
    }

    console.log('🔄 Fetching content from:', websiteUrl);

    // Fetch webpage content with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const urlObj = new URL(websiteUrl);
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9,nl;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': `${urlObj.protocol}//${urlObj.host}/`,
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('⚠️ Failed to fetch webpage:', response.status, response.statusText);

        // Provide more helpful error messages for common status codes
        let errorMessage = '';
        if (response.status === 403) {
          errorMessage = 'Website blocked the request (403 Forbidden). This website may have bot protection. Try copying the recipe text manually instead.';
        } else if (response.status === 404) {
          errorMessage = 'Recipe page not found (404). Please check the URL is correct.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests (429). Please wait a moment and try again.';
        } else {
          errorMessage = `Failed to fetch webpage: ${response.status} ${response.statusText}`;
        }

        return res.status(response.status).json({
          success: false,
          error: errorMessage
        } as WebsiteApiResponse);
      }

      const html = await response.text();

      if (!html || html.trim().length === 0) {
        console.warn('⚠️ Webpage returned empty content');
        return res.status(404).json({
          success: false,
          error: 'Webpage returned empty content'
        } as WebsiteApiResponse);
      }

      console.log('📄 HTML fetched, length:', html.length);

      // Extract image URL from HTML
      const imageUrl = extractImageUrl(html);
      if (imageUrl) {
        console.log('🖼️ Image extracted:', imageUrl);
      } else {
        console.log('⚠️ No image found in page');
      }

      // Clean HTML for recipe parsing
      const cleanedContent = cleanHtmlForRecipe(html);

      console.log('✨ Content cleaned, length:', cleanedContent.length);

      if (cleanedContent.length < 50) {
        console.warn('⚠️ Insufficient content found on webpage');
        return res.status(404).json({
          success: false,
          error: 'Insufficient content found on webpage'
        } as WebsiteApiResponse);
      }

      const apiResponse: WebsiteApiResponse = {
        success: true,
        content: cleanedContent,
        imageUrl: imageUrl || undefined
      };

      console.log('✅ Website content extraction successful');

      return res.json(apiResponse);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Website scraping API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Handle specific error cases
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('DNS')) {
      console.warn('🔍 DNS resolution failed');
      return res.status(404).json({
        success: false,
        error: 'Website not found or DNS resolution failed'
      } as WebsiteApiResponse);
    }

    if (errorMessage.includes('ECONNREFUSED')) {
      console.warn('🚫 Connection refused');
      return res.status(503).json({
        success: false,
        error: 'Connection refused by website'
      } as WebsiteApiResponse);
    }

    if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
      console.error('⏱️ Request timeout');
      return res.status(408).json({
        success: false,
        error: 'Request timeout - website took too long to respond'
      } as WebsiteApiResponse);
    }

    return res.status(500).json({
      success: false,
      error: `Failed to scrape website: ${errorMessage}`
    } as WebsiteApiResponse);
  }
});

export default router;
