export interface ImageMetadata {
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  imageBase64?: string;
  category: string;
  dimensions?: { width: number; height: number };
  fileSize?: string;
  stockId?: string;
  platform: string;
  scrapedAt: Date;
}

export interface ScrapingResult {
  success: boolean;
  data?: ImageMetadata;
  error?: string;
  processingTime: number;
}

export interface AIProviderConfig {
  name: 'openai' | 'gemini' | 'claude';
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AIAnalysisRequest {
  imageBase64: string;
  metadata: ImageMetadata;
  promptStyle: 'detailed' | 'concise' | 'artistic' | 'technical';
  targetPlatform?: 'midjourney' | 'dall-e' | 'stable-diffusion' | 'leonardo';
}

export interface AIAnalysisResponse {
  success: boolean;
  prompt: string;
  variations?: string[];
  confidence: number;
  processingTime: number;
  error?: string;
  metadata?: {
    provider: string;
    style: string;
    platform?: string;
    originalPlatform?: string;
    generatedAt: string;
  };
}

export interface PlatformInfo {
  name: string;
  domain: string;
  id: string;
  requiresJS?: boolean;
  selectors: {
    title: string[];
    description: string[];
    image: string[];
    tags: string[];
    category?: string[];
    stockId?: string[];
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestWithValidation extends Request {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
}