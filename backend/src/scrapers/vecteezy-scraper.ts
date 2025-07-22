import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';

export class VecteezyScraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Vecteezy',
    domain: 'vecteezy.com',
    id: 'vecteezy',
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
        '.asset-image img'
      ],
      tags: [
        '.tag-list .tag',
        '.keyword',
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
          .replace(/\s*\|\s*Vecteezy\s*$/i, '')
          .replace(/\s*-\s*Vecteezy\s*$/i, '')
          .trim();
      }

      return metadata;
    } catch (error: any) {
      throw new Error(`Failed to scrape Vecteezy: ${error.message}`);
    }
  }
}