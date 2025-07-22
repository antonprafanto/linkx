import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';

export class CreativeFabricaScraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Creative Fabrica',
    domain: 'creativefabrica.com',
    id: 'creative-fabrica',
    requiresJS: false,
    selectors: {
      title: [
        'h1',
        'meta[property="og:title"]',
        '.product-title',
        'title'
      ],
      description: [
        'meta[name="description"]',
        'meta[property="og:description"]',
        '.product-description'
      ],
      image: [
        'meta[property="og:image"]',
        '.product-image img',
        '.preview-image img'
      ],
      tags: [
        '.tag-list .tag',
        '.keyword',
        '.product-tags .tag'
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
          .replace(/\s*\|\s*Creative\s+Fabrica\s*$/i, '')
          .replace(/\s*-\s*Creative\s+Fabrica\s*$/i, '')
          .trim();
      }

      return metadata;
    } catch (error: any) {
      throw new Error(`Failed to scrape Creative Fabrica: ${error.message}`);
    }
  }
}