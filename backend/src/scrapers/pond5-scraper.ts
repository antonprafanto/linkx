import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';

export class Pond5Scraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Pond5',
    domain: 'pond5.com',
    id: 'pond5',
    requiresJS: false,
    selectors: {
      title: [
        'h1',
        'meta[property="og:title"]',
        '.title',
        'title'
      ],
      description: [
        'meta[name="description"]',
        'meta[property="og:description"]',
        '.description'
      ],
      image: [
        'meta[property="og:image"]',
        '.preview img',
        '.thumbnail img'
      ],
      tags: [
        '.keywords .keyword',
        '.tag',
        '.keyword-list .keyword'
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
          .replace(/\s*\|\s*Pond5\s*$/i, '')
          .replace(/\s*-\s*Pond5\s*$/i, '')
          .trim();
      }

      return metadata;
    } catch (error: any) {
      throw new Error(`Failed to scrape Pond5: ${error.message}`);
    }
  }
}