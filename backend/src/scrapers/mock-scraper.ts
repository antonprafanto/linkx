import { PlatformScraper } from '../core/base-scraper';
import { ImageMetadata, PlatformInfo } from '../interfaces/types';

export class MockScraper extends PlatformScraper {
  protected platformInfo: PlatformInfo = {
    name: 'Mock Platform',
    domain: 'example.com',
    id: 'mock',
    requiresJS: false,
    selectors: {
      title: ['title'],
      description: ['meta[name="description"]'],
      image: ['meta[property="og:image"]'],
      tags: [],
      category: []
    }
  };

  async extractMetadata(url: string): Promise<ImageMetadata> {
    console.log(`[MockScraper] Quick extraction from: ${url}`);
    
    // Simulate a quick successful scrape for testing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const metadata: ImageMetadata = {
      title: 'Mock Stock Photo Title',
      description: 'A beautiful mock stock photo for testing purposes',
      tags: ['test', 'mock', 'stock', 'photo'],
      imageUrl: 'https://via.placeholder.com/800x600.jpg',
      imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AoU6kinMYLl2UmMUQqjk2jrx3vOPFRDKnIjnJbKFJC+gYj6CRcq8zPJGSZSx+YHjKmRwmcFbWzJqbNzGOa0Dn4TT8TGNrVEa8vJUpppPxXJGhJjMUYqQy2SSiWqVNIhZjK9NnZcZfxZKXGDGGdlQySSKDNnZSaKNJQqIRQ+t',
      category: 'Testing',
      stockId: 'mock-123456',
      platform: this.platformInfo.id,
      scrapedAt: new Date()
    };

    console.log(`[MockScraper] Successfully created mock metadata`);
    return metadata;
  }
}