import axios, { AxiosInstance, AxiosError } from 'axios';
import { APIResponse, ImageMetadata, FormData, GeneratedResult } from '../types';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 60000, // 1 minute timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] ${response.status} ${response.config.url} (${response.config.method?.toUpperCase()})`);
        return response;
      },
      (error: AxiosError) => {
        console.error('[API] Response error:', error.message);
        
        if (error.response) {
          const data = error.response.data as any;
          const message = data?.error || data?.message || 'API request failed';
          throw new Error(message);
        } else if (error.request) {
          throw new Error('Network error: Unable to reach the server');
        } else {
          throw new Error('Request setup error');
        }
      }
    );
  }

  // Health check
  async checkHealth(): Promise<APIResponse> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Get supported platforms
  async getSupportedPlatforms(): Promise<APIResponse<{ platforms: Array<{ name: string; domain: string; id: string }> }>> {
    const response = await this.client.get('/supported-platforms');
    return response.data;
  }

  // Get supported AI providers
  async getSupportedProviders(): Promise<APIResponse<{ providers: Array<{ id: string; name: string; model: string }> }>> {
    const response = await this.client.get('/supported-providers');
    return response.data;
  }

  // Analyze URL and extract metadata
  async analyzeUrl(url: string): Promise<APIResponse<ImageMetadata>> {
    const response = await this.client.post('/analyze-url', { url });
    return response.data;
  }

  // Generate AI prompt from image data
  async generatePrompt(data: {
    provider: string;
    apiKey: string;
    imageData: ImageMetadata;
    promptStyle: string;
    targetPlatform?: string;
  }): Promise<APIResponse<any>> {
    const response = await this.client.post('/generate-prompt', data);
    return response.data;
  }

  // Combined endpoint: analyze and generate in one request
  async analyzeAndGenerate(formData: FormData): Promise<APIResponse<GeneratedResult>> {
    const response = await this.client.post('/analyze-and-generate', {
      url: formData.url,
      provider: formData.provider,
      apiKey: formData.apiKey,
      promptStyle: formData.promptStyle,
      targetPlatform: formData.targetPlatform,
    });
    return response.data;
  }

  // Validate API key
  async validateApiKey(provider: string, apiKey: string): Promise<APIResponse<{
    provider: string;
    isValid: boolean;
    details?: any;
  }>> {
    const response = await this.client.post('/validate-api-key', {
      provider,
      apiKey
    });
    return response.data;
  }

  // Get API statistics
  async getStats(): Promise<APIResponse<any>> {
    const response = await this.client.get('/stats');
    return response.data;
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Export convenience functions
export const analyzeURL = (url: string) => apiClient.analyzeUrl(url);

export const generatePrompt = (data: {
  provider: string;
  apiKey: string;
  imageData: ImageMetadata;
  promptStyle: string;
  targetPlatform?: string;
}) => apiClient.generatePrompt(data);

export const analyzeAndGenerate = (formData: FormData) => apiClient.analyzeAndGenerate(formData);

export const getSupportedPlatforms = () => apiClient.getSupportedPlatforms();

export const getSupportedProviders = () => apiClient.getSupportedProviders();

export const checkAPIHealth = () => apiClient.checkHealth();

export const validateApiKey = (provider: string, apiKey: string) => apiClient.validateApiKey(provider, apiKey);

export const getAPIStats = () => apiClient.getStats();

export default apiClient;