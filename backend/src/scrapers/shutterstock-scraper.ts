import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';
import * as cheerio from 'cheerio';

export class ShutterstockScraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Shutterstock',
    domain: 'shutterstock.com',
    id: 'shutterstock',
    requiresJS: false,
    selectors: {
      title: [
        'h1[data-automation="AssetTitle"]',
        'h1[data-testid="asset-title"]',
        'h1',
        'meta[property="og:title"]',
        'title'
      ],
      description: [
        'meta[name="description"]',
        'meta[property="og:description"]',
        '[data-testid="asset-description"]'
      ],
      image: [
        'meta[property="og:image"]',
        'img[data-automation="mosaic-grid-cell-image"]',
        'img[data-testid="asset-preview-image"]',
        '.mosaic-asset-preview img',
        '.preview-asset img'
      ],
      tags: [
        '.MuiChip-label',
        '.keyword-tag',
        '[data-testid="keyword"]',
        '.tag-list .tag',
        '.keywords-list .keyword'
      ],
      category: [
        '.breadcrumb-item:last-child',
        '.breadcrumb a:last-child',
        '.category-breadcrumb .breadcrumb-link:last-child'
      ],
      stockId: [
        '[data-testid="asset-id"]',
        '.asset-id'
      ]
    }
  };

  async extractMetadata(url: string): Promise<ImageMetadata> {
    try {
      console.log(`[ShutterstockScraper] Extracting metadata from: ${url}`);

      // Try generic extraction first
      const metadata = await this.extractGenericMetadata(url);

      // Shutterstock specific enhancements
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      // Clean up title (remove Shutterstock branding)
      if (metadata.title) {
        metadata.title = metadata.title
          .replace(/\s*\|\s*Shutterstock\s*$/i, '')
          .replace(/\s*-\s*Shutterstock\s*$/i, '')
          .trim();
      }

      // Extract more specific data
      const imageAlt = $('img[data-testid="asset-preview-image"]').attr('alt') || 
                      $('img[data-automation="mosaic-grid-cell-image"]').attr('alt');
      
      if (!metadata.title && imageAlt) {
        metadata.title = this.cleanText(imageAlt);
      }

      // Look for keywords in JSON-LD structured data
      const jsonLd = $('script[type="application/ld+json"]').html();
      if (jsonLd) {
        try {
          const structured = JSON.parse(jsonLd);
          if (structured.keywords && Array.isArray(structured.keywords)) {
            metadata.tags = [...new Set([...metadata.tags, ...structured.keywords])];
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }

      // Try to get better image URL (larger version)
      const previewImg = $('img[data-testid="asset-preview-image"]').attr('src');
      if (previewImg && previewImg.includes('shutterstock.com')) {
        // Try to get a larger version by modifying URL parameters
        const largerImage = previewImg.replace(/\/\d+x\d+\//, '/1500x1500/').replace(/w_\d+/, 'w_1500');
        if (largerImage !== previewImg) {
          metadata.imageUrl = largerImage;
        }
      }

      console.log(`[ShutterstockScraper] Successfully extracted metadata: title="${metadata.title}", tags=${metadata.tags.length}`);

      return metadata;

    } catch (error: any) {
      console.error(`[ShutterstockScraper] Error: ${error.message}`);
      throw new Error(`Failed to scrape Shutterstock: ${error.message}`);
    }
  }
}