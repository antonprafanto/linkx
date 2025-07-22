import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';

export class ArabstockScraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Arabstock',
    domain: 'arabstock.com',
    id: 'arabstock',
    requiresJS: false,
    selectors: {
      title: [
        'h1',
        'meta[property="og:title"]',
        '.image-title',
        'title'
      ],
      description: [
        'meta[name="description"]',
        'meta[property="og:description"]'
      ],
      image: [
        'meta[property="og:image"]',
        '.preview-image img',
        '.main-image img'
      ],
      tags: [
        '.keywords .keyword',
        '.tag-list .tag',
        '.tag'
      ],
      category: [
        '.breadcrumb a:last-child'
      ]
    }
  };

  async extractMetadata(url: string): Promise<ImageMetadata> {
    try {
      const metadata = await this.extractGenericMetadata(url);
      
      if (metadata.title) {
        metadata.title = metadata.title
          .replace(/\s*\|\s*Arabstock\s*$/i, '')
          .replace(/\s*-\s*Arabstock\s*$/i, '')
          .trim();
      }

      return metadata;
    } catch (error: any) {
      throw new Error(`Failed to scrape Arabstock: ${error.message}`);
    }
  }
}