import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';
import * as cheerio from 'cheerio';

export class AdobeStockScraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Adobe Stock',
    domain: 'stock.adobe.com',
    id: 'adobe-stock',
    requiresJS: false,
    selectors: {
      title: [
        'h1',
        'meta[property="og:title"]',
        '.asset-title',
        '[data-testid="asset-title"]',
        'title'
      ],
      description: [
        'meta[property="og:description"]',
        'meta[name="description"]',
        '.asset-description'
      ],
      image: [
        'meta[property="og:image"]',
        '.preview-asset img',
        '.asset-preview img',
        '[data-testid="asset-preview"]',
        '.thumbnail img'
      ],
      tags: [
        '.search-keyword',
        '.keyword-link',
        '.tag',
        '.asset-keywords .keyword',
        '.keywords-list .keyword-item'
      ],
      category: [
        '.breadcrumb-link:last-child',
        '.breadcrumb a:last-child',
        '.category-breadcrumb .breadcrumb-item:last-child'
      ],
      stockId: [
        '[data-asset-id]',
        '.asset-id'
      ]
    }
  };

  async extractMetadata(url: string): Promise<ImageMetadata> {
    try {
      console.log(`[AdobeStockScraper] Extracting metadata from: ${url}`);

      // Try generic extraction first
      const metadata = await this.extractGenericMetadata(url);
      
      // Adobe Stock specific enhancements
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      // Clean up title (remove Adobe Stock branding)
      if (metadata.title) {
        metadata.title = metadata.title
          .replace(/\s*\|\s*Adobe\s+Stock\s*$/i, '')
          .replace(/\s*-\s*Adobe\s+Stock\s*$/i, '')
          .replace(/\s*Adobe\s+Stock\s*-\s*/i, '')
          .trim();
      }

      // Adobe Stock often has asset ID in data attributes
      const assetElement = $('[data-asset-id]').first();
      if (assetElement.length > 0) {
        const assetId = assetElement.attr('data-asset-id');
        if (assetId) {
          metadata.stockId = assetId;
        }
      }

      // Try to extract from URL if no asset ID found
      if (!metadata.stockId) {
        metadata.stockId = this.extractStockId(url);
      }

      // Look for better image quality
      const previewImg = $('.preview-asset img').attr('src') || $('meta[property="og:image"]').attr('content');
      if (previewImg && previewImg.includes('adobe.com')) {
        // Adobe Stock URLs often have size parameters we can modify
        const largerImage = previewImg.replace(/\/\d+x\d+\//, '/1000x1000/');
        if (largerImage !== previewImg) {
          metadata.imageUrl = largerImage;
        }
      }

      // Extract additional metadata from JSON-LD if available
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonData = JSON.parse($(element).html() || '{}');
          if (jsonData['@type'] === 'ImageObject' || jsonData['@type'] === 'CreativeWork') {
            if (jsonData.keywords && Array.isArray(jsonData.keywords)) {
              metadata.tags = [...new Set([...metadata.tags, ...jsonData.keywords])];
            }
            if (jsonData.name && !metadata.title) {
              metadata.title = this.cleanText(jsonData.name);
            }
            if (jsonData.description && !metadata.description) {
              metadata.description = this.cleanText(jsonData.description);
            }
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      });

      console.log(`[AdobeStockScraper] Successfully extracted metadata: title="${metadata.title}", tags=${metadata.tags.length}`);

      return metadata;

    } catch (error: any) {
      console.error(`[AdobeStockScraper] Error: ${error.message}`);
      throw new Error(`Failed to scrape Adobe Stock: ${error.message}`);
    }
  }
}