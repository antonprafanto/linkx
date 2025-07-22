import { AIAnalysisRequest, AIAnalysisResponse, ImageMetadata } from '../interfaces/types';

export interface AIProvider {
  analyzeAndGeneratePrompt(apiKey: string, request: AIAnalysisRequest): Promise<{
    prompt: string;
    variations?: string[];
    confidence: number;
  }>;
  
  validateApiKey(apiKey: string): Promise<{
    isValid: boolean;
    error?: string;
    details?: any;
  }>;
}

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private static instance: AIProviderManager;

  constructor() {
    // Dynamic imports will be used in the actual providers
    this.providers.set('openai', new (require('./openai-provider')).OpenAIProvider());
    this.providers.set('openai-fast', new (require('./openai-fast-provider')).OpenAIFastProvider());
    this.providers.set('gemini', new (require('./gemini-provider')).GeminiProvider());
    this.providers.set('claude', new (require('./claude-provider')).ClaudeProvider());
  }

  static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  async generatePrompt(
    provider: string,
    apiKey: string,
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResponse> {
    const startTime = Date.now();

    try {
      console.log(`[AIProviderManager] Generating prompt with ${provider} provider`);

      const aiProvider = this.providers.get(provider);
      if (!aiProvider) {
        throw new Error(`Unsupported AI provider: ${provider}. Supported providers: ${Array.from(this.providers.keys()).join(', ')}`);
      }

      // Validate API key
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('API key is required');
      }

      // Validate image data
      if (!request.imageBase64) {
        throw new Error('Image data is required for AI analysis');
      }

      const result = await aiProvider.analyzeAndGeneratePrompt(apiKey, request);

      const processingTime = Date.now() - startTime;
      console.log(`[AIProviderManager] Prompt generated successfully in ${processingTime}ms`);

      return {
        success: true,
        prompt: result.prompt,
        variations: result.variations || [],
        confidence: result.confidence,
        processingTime
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error(`[AIProviderManager] Error: ${error.message}`);

      return {
        success: false,
        prompt: '',
        confidence: 0,
        processingTime,
        error: error.message
      };
    }
  }

  protected buildSystemPrompt(style: string, targetPlatform?: string): string {
    const basePrompt = `You are an expert AI image prompt engineer. Your task is to analyze the provided image and its metadata to create highly effective prompts for AI image generation tools.

IMPORTANT GUIDELINES:
1. Focus on visual elements you can actually see in the image
2. Include specific details about colors, lighting, composition, and style
3. Use descriptive but concise language
4. Avoid copyright-protected terms or brand names
5. Make the prompt actionable for AI image generation`;

    const styleInstructions = {
      detailed: "Create a comprehensive, detailed prompt with specific descriptions of all visual elements, including colors, lighting, composition, mood, and artistic style. Aim for 100-150 words.",
      concise: "Create a focused, efficient prompt that captures the essential visual elements in 50-80 words. Prioritize the most important visual features.",
      artistic: "Emphasize artistic style, mood, aesthetic qualities, and creative elements. Include references to art movements, techniques, and visual atmosphere.",
      technical: "Include technical photography and artistic terms, such as camera angles, lighting techniques, composition rules, and specific visual characteristics."
    };

    const platformInstructions = {
      midjourney: "Format the prompt for Midjourney with clear descriptive phrases. Consider adding aspect ratio suggestions and quality parameters.",
      'dall-e': "Optimize for DALL-E with clear, descriptive language that avoids ambiguous terms. Focus on concrete visual elements.",
      'stable-diffusion': "Include quality enhancement tags and consider negative prompt suggestions. Use commonly understood artistic terms.",
      leonardo: "Format for Leonardo AI with emphasis on artistic styles and quality modifiers."
    };

    let prompt = basePrompt + "\n\n" + styleInstructions[style as keyof typeof styleInstructions];

    if (targetPlatform && platformInstructions[targetPlatform as keyof typeof platformInstructions]) {
      prompt += "\n\n" + platformInstructions[targetPlatform as keyof typeof platformInstructions];
    }

    return prompt;
  }

  protected buildUserPrompt(metadata: ImageMetadata): string {
    return `Please analyze this image and create an optimized AI generation prompt based on the following information:

**Original Title:** ${metadata.title || 'N/A'}
**Description:** ${metadata.description || 'N/A'}  
**Tags:** ${metadata.tags.length > 0 ? metadata.tags.join(', ') : 'N/A'}
**Category:** ${metadata.category || 'N/A'}
**Source Platform:** ${metadata.platform}

**Your Task:**
1. Carefully examine the image and identify key visual elements
2. Describe the composition, lighting, colors, and style
3. Create a prompt that would generate a similar image
4. Ensure the prompt is specific enough for accurate reproduction
5. Incorporate relevant information from the metadata where appropriate

**Output Format:**
Provide only the optimized prompt text, ready to use for AI image generation.`;
  }

  async validateApiKey(provider: string, apiKey: string): Promise<{
    success: boolean;
    isValid: boolean;
    error?: string;
    provider: string;
    details?: any;
  }> {
    try {
      console.log(`[AIProviderManager] Validating ${provider} API key`);

      const aiProvider = this.providers.get(provider);
      if (!aiProvider) {
        return {
          success: false,
          isValid: false,
          error: `Unsupported AI provider: ${provider}. Supported providers: ${Array.from(this.providers.keys()).join(', ')}`,
          provider
        };
      }

      // Validate API key format first
      const { validateApiKey: validateFormat } = require('../middleware/validation');
      const isValidFormat = validateFormat(provider, apiKey);
      
      if (!isValidFormat) {
        return {
          success: true,
          isValid: false,
          error: `Invalid ${provider} API key format`,
          provider,
          details: { issue: 'format_invalid' }
        };
      }

      // Validate with actual API call
      const result = await aiProvider.validateApiKey(apiKey);
      
      return {
        success: true,
        isValid: result.isValid,
        error: result.error,
        provider,
        details: result.details
      };

    } catch (error: any) {
      console.error(`[AIProviderManager] Validation error: ${error.message}`);
      return {
        success: false,
        isValid: false,
        error: error.message,
        provider
      };
    }
  }

  getSupportedProviders(): Array<{ id: string; name: string; model: string }> {
    return [
      { id: 'openai', name: 'OpenAI GPT-4 Turbo Vision', model: 'gpt-4-turbo' },
      { id: 'openai-fast', name: 'OpenAI GPT-4o Mini (Fastest)', model: 'gpt-4o-mini' },
      { id: 'gemini', name: 'Google Gemini Pro Vision', model: 'gemini-pro-vision' },
      { id: 'claude', name: 'Anthropic Claude 3 Sonnet', model: 'claude-3-sonnet-20240229' }
    ];
  }
}