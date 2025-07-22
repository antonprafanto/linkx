import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';

export class IconscoutScraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Iconscout',
    domain: 'iconscout.com',
    id: 'iconscout',
    requiresJS: false,
    selectors: {
      title: [
        'h1',
        'meta[property="og:title"]',
        '.asset-title',
        'title'
      ],
      description: [
        'meta[name="description"]',
        'meta[property="og:description"]'
      ],
      image: [
        'meta[property="og:image"]',
        '.preview-image img',
        '.asset-preview img',
        '.main-preview img'
      ],
      tags: [
        '.tag-list .tag',
        '.keyword',
        '.tag'
      ],
      category: [
        '.breadcrumb a:last-child',
        '.category-breadcrumb .category:last-child'
      ]
    }
  };

  async extractMetadata(url: string): Promise<ImageMetadata> {
    try {
      const metadata = await this.extractGenericMetadata(url);
      
      if (metadata.title) {
        metadata.title = metadata.title
          .replace(/\s*\|\s*Iconscout\s*$/i, '')
          .replace(/\s*-\s*Iconscout\s*$/i, '')
          .trim();
      }

      return metadata;
    } catch (error: any) {
      throw new Error(`Failed to scrape Iconscout: ${error.message}`);
    }
  }
}