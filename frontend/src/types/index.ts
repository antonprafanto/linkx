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
}

export interface PlatformInfo {
  name: string;
  domain: string;
  id: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FormData {
  url: string;
  provider: 'openai' | 'gemini' | 'claude';
  apiKey: string;
  promptStyle: 'detailed' | 'concise' | 'artistic' | 'technical';
  targetPlatform?: 'midjourney' | 'dall-e' | 'stable-diffusion' | 'leonardo';
}

export interface GeneratedResult {
  originalUrl: string;
  imageData: ImageMetadata;
  generatedPrompt: string;
  variations: string[];
  metadata: {
    provider: string;
    style: string;
    platform?: string;
    confidence: number;
    processingTime: number;
    generatedAt: string;
  };
}

export interface AppSettings {
  apiKeys: {
    openai?: string;
    gemini?: string;
    claude?: string;
  };
  defaultProvider: 'openai' | 'gemini' | 'claude';
  defaultStyle: 'detailed' | 'concise' | 'artistic' | 'technical';
  defaultPlatform?: 'midjourney' | 'dall-e' | 'stable-diffusion' | 'leonardo';
  autoSaveResults: boolean;
  showVariations: boolean;
}

export interface HistoryItem {
  id: string;
  url: string;
  provider: string;
  prompt: string;
  imageData: ImageMetadata;
  createdAt: Date;
}

export type LoadingState = 'idle' | 'analyzing' | 'generating' | 'complete' | 'error';

export interface LoadingStatus {
  state: LoadingState;
  message: string;
  progress?: number;
}