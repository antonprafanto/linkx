import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';

export class GettyImagesScraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Getty Images',
    domain: 'gettyimages.com',
    id: 'getty-images',
    requiresJS: false,
    selectors: {
      title: [
        'h1[data-testid="asset-title"]',
        'h1',
        'meta[property="og:title"]',
        '.asset-title',
        'title'
      ],
      description: [
        'meta[name="description"]',
        'meta[property="og:description"]',
        '.asset-caption'
      ],
      image: [
        'meta[property="og:image"]',
        '.gallery-asset__thumb img',
        '.asset-preview img',
        '.preview-image img'
      ],
      tags: [
        '.keyword-list .keyword',
        '.tag',
        '.keyword-tag',
        '.asset-keywords .keyword'
      ],
      category: [
        '.breadcrumb a:last-child',
        '.category-link:last-child'
      ]
    }
  };

  async extractMetadata(url: string): Promise<ImageMetadata> {
    try {
      const metadata = await this.extractGenericMetadata(url);
      
      // Clean Getty Images branding
      if (metadata.title) {
        metadata.title = metadata.title
          .replace(/\s*\|\s*Getty\s+Images\s*$/i, '')
          .replace(/\s*-\s*Getty\s+Images\s*$/i, '')
          .trim();
      }

      return metadata;
    } catch (error: any) {
      throw new Error(`Failed to scrape Getty Images: ${error.message}`);
    }
  }
}