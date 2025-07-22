import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';

export class FreepikScraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Freepik',
    domain: 'freepik.com',
    id: 'freepik',
    requiresJS: true, // Freepik heavily relies on JavaScript
    selectors: {
      title: [
        'h1',
        '[data-testid="resource-title"]',
        'meta[property="og:title"]',
        '.resource-title',
        'title'
      ],
      description: [
        'meta[name="description"]',
        'meta[property="og:description"]',
        '.resource-description'
      ],
      image: [
        '.preview-image img',
        '[data-testid="preview-image"]',
        'meta[property="og:image"]',
        '.resource-preview img',
        '.main-preview img'
      ],
      tags: [
        '.tag',
        '.keyword',
        '[data-testid="tag"]',
        '.tag-list .tag-item',
        '.resource-tags .tag'
      ],
      category: [
        '.breadcrumb a:last-child',
        '.category-breadcrumb .breadcrumb-item:last-child',
        '.nav-breadcrumb .breadcrumb-item:last-child'
      ]
    }
  };

  async extractMetadata(url: string): Promise<ImageMetadata> {
    let page: any = null;
    
    try {
      console.log(`[FreepikScraper] Extracting metadata from: ${url}`);

      // Freepik requires JavaScript rendering
      page = await this.initBrowser();
      
      try {
        console.log(`[FreepikScraper] Navigating to URL...`);
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 15000 
        });

        console.log(`[FreepikScraper] Page loaded, checking for content...`);
        
        // Quick check for basic content - don't wait long
        try {
          await page.waitForSelector('title, h1, meta[property="og:title"]', { 
            timeout: 5000,
            visible: false 
          });
          console.log(`[FreepikScraper] Basic content found`);
        } catch (e) {
          console.warn(`[FreepikScraper] Basic content check failed, proceeding with extraction anyway`);
        }

        // Extract data using browser JavaScript
        const data = await page.evaluate(() => {
          // Extract title
          const titleSelectors = [
            'h1',
            '[data-testid="resource-title"]', 
            '.resource-title',
            'meta[property="og:title"]'
          ];
          let title = '';
          for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              title = element.textContent?.trim() || element.getAttribute('content') || '';
              if (title) break;
            }
          }

          // Extract description
          const descSelectors = [
            'meta[name="description"]',
            'meta[property="og:description"]',
            '.resource-description'
          ];
          let description = '';
          for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              description = element.getAttribute('content') || element.textContent?.trim() || '';
              if (description) break;
            }
          }

          // Extract image URL
          const imgSelectors = [
            '.preview-image img',
            '[data-testid="preview-image"]',
            '.resource-preview img',
            '.main-preview img',
            'meta[property="og:image"]'
          ];
          let imageUrl = '';
          for (const selector of imgSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              imageUrl = element.getAttribute('src') || element.getAttribute('content') || '';
              if (imageUrl && imageUrl.startsWith('http')) break;
            }
          }

          // Extract tags
          const tagSelectors = [
            '.tag', 
            '.keyword', 
            '[data-testid="tag"]',
            '.tag-list .tag-item',
            '.resource-tags .tag'
          ];
          const tags: string[] = [];
          for (const selector of tagSelectors) {
            document.querySelectorAll(selector).forEach(el => {
              const text = el.textContent?.trim();
              if (text && !tags.includes(text)) {
                tags.push(text);
              }
            });
          }

          // Extract category
          const categorySelectors = [
            '.breadcrumb a:last-child',
            '.category-breadcrumb .breadcrumb-item:last-child',
            '.nav-breadcrumb .breadcrumb-item:last-child'
          ];
          let category = '';
          for (const selector of categorySelectors) {
            const element = document.querySelector(selector);
            if (element) {
              category = element.textContent?.trim() || '';
              if (category) break;
            }
          }

          return { title, description, imageUrl, tags, category };
        });

        // Clean up title (remove Freepik branding)
        let cleanTitle = data.title
          .replace(/\s*\|\s*Free.*?Vector\s*$/i, '')
          .replace(/\s*\|\s*Freepik\s*$/i, '')
          .replace(/\s*-\s*Freepik\s*$/i, '')
          .trim();

        const metadata: ImageMetadata = {
          title: cleanTitle || 'Untitled',
          description: data.description || '',
          tags: data.tags.filter((tag: string) => tag.length > 0),
          imageUrl: data.imageUrl || '',
          category: data.category || '',
          stockId: this.extractStockId(url),
          platform: this.platformInfo.id,
          scrapedAt: new Date()
        };

        console.log(`[FreepikScraper] Successfully extracted metadata: title="${metadata.title}", tags=${metadata.tags.length}`);

        return metadata;

      } catch (error: any) {
        console.error(`[FreepikScraper] Error during page operations: ${error.message}`);
        throw error;
      } finally {
        // Clean up page
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            console.warn(`[FreepikScraper] Error closing page: ${closeError}`);
          }
        }
      }

    } catch (error: any) {
      console.error(`[FreepikScraper] Error: ${error.message}`);
      throw new Error(`Failed to scrape Freepik: ${error.message}`);
    } finally {
      // Ensure browser is closed
      try {
        await this.closeBrowser();
      } catch (browserError) {
        console.warn(`[FreepikScraper] Error closing browser: ${browserError}`);
      }
    }
  }
}