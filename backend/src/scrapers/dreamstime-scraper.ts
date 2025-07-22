import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';

export class DreamstimeScraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Dreamstime',
    domain: 'dreamstime.com',
    id: 'dreamstime',
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
        'meta[property="og:description"]',
        '.image-description'
      ],
      image: [
        'meta[property="og:image"]',
        '.preview-image img',
        '.main-image img',
        '#preview-image'
      ],
      tags: [
        '.keywords a',
        '.tag',
        '.keyword-link'
      ],
      category: [
        '.breadcrumb a:last-child',
        '.category:last-child'
      ]
    }
  };

  async extractMetadata(url: string): Promise<ImageMetadata> {
    try {
      const metadata = await this.extractGenericMetadata(url);
      
      if (metadata.title) {
        metadata.title = metadata.title
          .replace(/\s*\|\s*Dreamstime\s*$/i, '')
          .replace(/\s*-\s*Dreamstime\s*$/i, '')
          .trim();
      }

      return metadata;
    } catch (error: any) {
      throw new Error(`Failed to scrape Dreamstime: ${error.message}`);
    }
  }
}