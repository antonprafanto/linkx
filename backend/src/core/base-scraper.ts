import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';

export abstract class PlatformScraper {
  protected browser?: puppeteer.Browser;
  protected abstract platformInfo: PlatformInfo;

  abstract extractMetadata(url: string): Promise<ImageMetadata>;

  protected async initBrowser(): Promise<puppeteer.Page> {
    try {
      // Always create a new browser instance for better reliability
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ],
        ignoreDefaultArgs: ['--disable-extensions'],
        timeout: 30000
      });

      const page = await this.browser.newPage();
      
      // Set error handlers to prevent crashes
      page.on('error', (error) => {
        console.error('[Puppeteer] Page error:', error.message);
      });
      
      page.on('pageerror', (error) => {
        console.error('[Puppeteer] Page script error:', error.message);
      });

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Set shorter timeouts for faster failures
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(15000);
      
      // Block unnecessary resources to speed up loading significantly
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        const url = request.url();
        
        // Block more resources for faster loading
        if (['stylesheet', 'font', 'media', 'image', 'other', 'websocket', 'manifest'].includes(resourceType)) {
          request.abort();
        } else if (url.includes('analytics') || url.includes('tracking') || url.includes('ads')) {
          request.abort();
        } else {
          request.continue().catch(() => {
            // Ignore abort errors
          });
        }
      });

      return page;
      
    } catch (error: any) {
      console.error('[Puppeteer] Failed to initialize browser:', error.message);
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  protected async fetchHTML(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch HTML: ${error.message}`);
    }
  }

  protected extractWithSelectors($: cheerio.Root, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const content = element.attr('content') || element.text().trim();
        if (content) return content;
      }
    }
    return '';
  }

  protected extractArrayWithSelectors($: cheerio.Root, selectors: string[]): string[] {
    const results: string[] = [];
    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && !results.includes(text)) {
          results.push(text);
        }
      });
    }
    return results;
  }

  protected extractStockId(url: string): string {
    // Common patterns for extracting stock IDs from URLs
    const patterns = [
      /\/(\d+)(?:\?|$|\/)/,           // Generic: /123456 or /123456?query or /123456/
      /image-(\d+)/,                  // Shutterstock: image-123456
      /photo-(\d+)/,                  // Generic: photo-123456
      /id[=:](\d+)/,                  // Query param: id=123456 or id:123456
      /stock[_-]?id[=:](\d+)/,        // stock_id=123456 or stock-id:123456
      /-(\d{6,})/,                    // Long number with dash: -123456789
      /(\d{7,})/                      // Just a long number: 1234567890
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return '';
  }

  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/^\W+|\W+$/g, '')
      .trim();
  }

  protected async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        const pages = await this.browser.pages();
        await Promise.all(pages.map(page => page.close().catch(() => {})));
        await this.browser.close();
      } catch (error) {
        console.error('[Puppeteer] Error closing browser:', error);
        // Force kill browser process if normal close fails
        try {
          this.browser.process()?.kill();
        } catch {}
      } finally {
        this.browser = undefined;
      }
    }
  }

  // Generic extraction method that can be used by simple scrapers
  protected async extractGenericMetadata(url: string): Promise<ImageMetadata> {
    const html = await this.fetchHTML(url);
    const $ = cheerio.load(html);

    const title = this.cleanText(
      this.extractWithSelectors($, this.platformInfo.selectors.title)
    );

    const description = this.cleanText(
      this.extractWithSelectors($, this.platformInfo.selectors.description)
    );

    const imageUrl = this.extractWithSelectors($, this.platformInfo.selectors.image);

    const tags = this.extractArrayWithSelectors($, this.platformInfo.selectors.tags)
      .map(tag => this.cleanText(tag))
      .filter(tag => tag.length > 0);

    const category = this.platformInfo.selectors.category ? 
      this.cleanText(this.extractWithSelectors($, this.platformInfo.selectors.category)) : '';

    const stockId = this.platformInfo.selectors.stockId ? 
      this.extractWithSelectors($, this.platformInfo.selectors.stockId) || this.extractStockId(url) :
      this.extractStockId(url);

    return {
      title,
      description,
      tags,
      imageUrl,
      category,
      stockId,
      platform: this.platformInfo.id,
      scrapedAt: new Date()
    };
  }
}