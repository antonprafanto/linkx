import sharp from 'sharp';
import axios from 'axios';
import { ImageMetadata, ScrapingResult } from '../interfaces/types';
import { PlatformScraper } from './base-scraper';

// Import platform scrapers (will be implemented next)
import { ShutterstockScraper } from '../scrapers/shutterstock-scraper';
import { FreepikScraper } from '../scrapers/freepik-scraper';
import { AdobeStockScraper } from '../scrapers/adobe-stock-scraper';
import { GettyImagesScraper } from '../scrapers/getty-images-scraper';
import { DreamstimeScraper } from '../scrapers/dreamstime-scraper';
import { IconscoutScraper } from '../scrapers/iconscout-scraper';
import { Pond5Scraper } from '../scrapers/pond5-scraper';
import { ArabstockScraper } from '../scrapers/arabstock-scraper';
import { VecteezyScraper } from '../scrapers/vecteezy-scraper';
import { CreativeFabricaScraper } from '../scrapers/creative-fabrica-scraper';
import { MockScraper } from '../scrapers/mock-scraper';

export class WebScrapingEngine {
  private platformScrapers: Map<string, PlatformScraper>;
  private static instance: WebScrapingEngine;

  constructor() {
    this.platformScrapers = new Map();
    this.initializePlatformScrapers();
  }

  static getInstance(): WebScrapingEngine {
    if (!WebScrapingEngine.instance) {
      WebScrapingEngine.instance = new WebScrapingEngine();
    }
    return WebScrapingEngine.instance;
  }

  private initializePlatformScrapers(): void {
    this.platformScrapers.set('shutterstock', new ShutterstockScraper());
    this.platformScrapers.set('freepik', new FreepikScraper());
    this.platformScrapers.set('adobe-stock', new AdobeStockScraper());
    this.platformScrapers.set('getty-images', new GettyImagesScraper());
    this.platformScrapers.set('dreamstime', new DreamstimeScraper());
    this.platformScrapers.set('iconscout', new IconscoutScraper());
    this.platformScrapers.set('pond5', new Pond5Scraper());
    this.platformScrapers.set('arabstock', new ArabstockScraper());
    this.platformScrapers.set('vecteezy', new VecteezyScraper());
    this.platformScrapers.set('creative-fabrica', new CreativeFabricaScraper());
    this.platformScrapers.set('mock', new MockScraper()); // For testing
  }

  async scrapeStockURL(url: string): Promise<ScrapingResult> {
    const startTime = Date.now();

    try {
      // 1. Validate URL
      if (!this.isValidURL(url)) {
        throw new Error('Invalid URL provided');
      }

      // 2. Identify platform from URL
      const platform = this.identifyPlatform(url);
      const scraper = this.platformScrapers.get(platform);

      if (!scraper) {
        throw new Error(`Unsupported platform: ${platform}. Supported platforms: ${Array.from(this.platformScrapers.keys()).join(', ')}`);
      }

      console.log(`[WebScrapingEngine] Scraping ${platform} URL: ${url}`);

      // 3. Extract metadata
      const metadata = await scraper.extractMetadata(url);

      if (!metadata.title && !metadata.imageUrl) {
        throw new Error('Failed to extract meaningful data from the URL. Please check if the URL is valid and accessible.');
      }

      // 4. Download and convert image if URL found
      if (metadata.imageUrl) {
        try {
          console.log(`[WebScrapingEngine] Downloading image: ${metadata.imageUrl}`);
          metadata.imageBase64 = await this.downloadAndConvertImage(metadata.imageUrl);
          console.log(`[WebScrapingEngine] Image converted to base64 successfully`);
        } catch (imageError) {
          console.warn(`[WebScrapingEngine] Failed to download image: ${imageError}`);
          // Continue without image - metadata is still valuable
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`[WebScrapingEngine] Scraping completed in ${processingTime}ms`);

      return {
        success: true,
        data: metadata,
        processingTime
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error(`[WebScrapingEngine] Scraping failed: ${error.message}`);

      return {
        success: false,
        error: error.message,
        processingTime
      };
    }
  }

  private isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private identifyPlatform(url: string): string {
    const platformPatterns: Record<string, RegExp> = {
      'shutterstock': /shutterstock\.com/i,
      'freepik': /freepik\.com/i,
      'adobe-stock': /stock\.adobe\.com/i,
      'getty-images': /gettyimages\.com/i,
      'dreamstime': /dreamstime\.com/i,
      'iconscout': /iconscout\.com/i,
      'pond5': /pond5\.com/i,
      'arabstock': /arabstock\.com/i,
      'vecteezy': /vecteezy\.com/i,
      'creative-fabrica': /creativefabrica\.com/i,
      'mock': /example\.com|test\.com|localhost/i
    };

    for (const [platform, pattern] of Object.entries(platformPatterns)) {
      if (pattern.test(url)) {
        return platform;
      }
    }

    throw new Error(`Unsupported platform URL. Supported domains: ${Object.values(platformPatterns).map(p => p.source.replace(/\\\./g, '.')).join(', ')}`);
  }

  private async downloadAndConvertImage(imageUrl: string): Promise<string> {
    try {
      console.log(`[WebScrapingEngine] Downloading image from: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.google.com/',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });

      console.log(`[WebScrapingEngine] Image downloaded, size: ${response.data.length} bytes`);

      // Process image with Sharp
      const processedImage = await sharp(response.data)
        .resize({ 
          width: 1024, 
          height: 1024, 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();

      console.log(`[WebScrapingEngine] Image processed, final size: ${processedImage.length} bytes`);

      return processedImage.toString('base64');
      
    } catch (error: any) {
      console.error(`[WebScrapingEngine] Image download/processing error: ${error.message}`);
      throw new Error(`Failed to download or process image: ${error.message}`);
    }
  }

  getSupportedPlatforms(): Array<{ name: string; domain: string; id: string }> {
    return [
      { name: 'Adobe Stock', domain: 'stock.adobe.com', id: 'adobe-stock' },
      { name: 'Shutterstock', domain: 'shutterstock.com', id: 'shutterstock' },
      { name: 'Freepik', domain: 'freepik.com', id: 'freepik' },
      { name: 'Getty Images', domain: 'gettyimages.com', id: 'getty-images' },
      { name: 'Dreamstime', domain: 'dreamstime.com', id: 'dreamstime' },
      { name: 'Iconscout', domain: 'iconscout.com', id: 'iconscout' },
      { name: 'Pond5', domain: 'pond5.com', id: 'pond5' },
      { name: 'Arabstock', domain: 'arabstock.com', id: 'arabstock' },
      { name: 'Vecteezy', domain: 'vecteezy.com', id: 'vecteezy' },
      { name: 'Creative Fabrica', domain: 'creativefabrica.com', id: 'creative-fabrica' },
      { name: 'Mock Platform (Testing)', domain: 'example.com', id: 'mock' }
    ];
  }

  async cleanup(): Promise<void> {
    // Close all browser instances
    for (const scraper of this.platformScrapers.values()) {
      if (typeof (scraper as any).closeBrowser === 'function') {
        await (scraper as any).closeBrowser();
      }
    }
  }
}