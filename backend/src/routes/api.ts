import { Router, Request, Response } from 'express';
import { WebScrapingEngine } from '../core/scraper-engine';
import { AIProviderManager } from '../ai/ai-provider';
import { validateAnalyzeUrl, validateGeneratePrompt, validateApiKeyRequest, validateAnalyzeAndGenerate } from '../middleware/validation';
import { urlAnalysisRateLimit, aiGenerationRateLimit } from '../middleware/security';
import { APIResponse } from '../interfaces/types';

const router = Router();
const scrapingEngine = WebScrapingEngine.getInstance();
const aiManager = AIProviderManager.getInstance();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  const response: APIResponse = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
  res.json(response);
});

// Get supported platforms
router.get('/supported-platforms', (req: Request, res: Response) => {
  try {
    const platforms = scrapingEngine.getSupportedPlatforms();
    const response: APIResponse = {
      success: true,
      data: { platforms }
    };
    res.json(response);
  } catch (error: any) {
    const response: APIResponse = {
      success: false,
      error: 'Failed to retrieve supported platforms'
    };
    res.status(500).json(response);
  }
});

// Get supported AI providers
router.get('/supported-providers', (req: Request, res: Response) => {
  try {
    const providers = aiManager.getSupportedProviders();
    const response: APIResponse = {
      success: true,
      data: { providers }
    };
    res.json(response);
  } catch (error: any) {
    const response: APIResponse = {
      success: false,
      error: 'Failed to retrieve supported providers'
    };
    res.status(500).json(response);
  }
});

// Analyze URL and extract metadata
router.post('/analyze-url', 
  urlAnalysisRateLimit,
  validateAnalyzeUrl,
  async (req: Request, res: Response) => {
    try {
      console.log(`[API] Analyzing URL: ${req.body.url}`);
      
      const result = await scrapingEngine.scrapeStockURL(req.body.url);
      
      if (!result.success) {
        const response: APIResponse = {
          success: false,
          error: result.error || 'Failed to analyze URL'
        };
        return res.status(400).json(response);
      }
      
      const response: APIResponse<typeof result.data> = {
        success: true,
        data: result.data,
        message: `Successfully analyzed ${result.data?.platform} URL in ${result.processingTime}ms`
      };
      
      res.json(response);
      
    } catch (error: any) {
      console.error('[API] Error analyzing URL:', error);
      
      const response: APIResponse = {
        success: false,
        error: error.message || 'Internal server error while analyzing URL'
      };
      
      res.status(500).json(response);
    }
  }
);

// Generate AI prompt from image data
router.post('/generate-prompt',
  aiGenerationRateLimit,
  validateGeneratePrompt,
  async (req: Request, res: Response) => {
    try {
      const { provider, apiKey, imageData, promptStyle, targetPlatform } = req.body;
      
      console.log(`[API] Generating prompt with ${provider} for ${imageData.platform} image`);
      
      const result = await aiManager.generatePrompt(provider, apiKey, {
        imageBase64: imageData.imageBase64,
        metadata: imageData,
        promptStyle: promptStyle || 'detailed',
        targetPlatform
      });
      
      if (!result.success) {
        const response: APIResponse = {
          success: false,
          error: result.error || 'Failed to generate prompt'
        };
        return res.status(400).json(response);
      }
      
      const response: APIResponse = {
        success: true,
        data: {
          prompt: result.prompt,
          variations: result.variations,
          confidence: result.confidence,
          processingTime: result.processingTime,
          metadata: {
            provider,
            style: promptStyle,
            platform: targetPlatform,
            originalPlatform: imageData.platform,
            generatedAt: new Date().toISOString()
          }
        },
        message: `Successfully generated ${provider} prompt in ${result.processingTime}ms`
      };
      
      res.json(response);
      
    } catch (error: any) {
      console.error('[API] Error generating prompt:', error);
      
      const response: APIResponse = {
        success: false,
        error: error.message || 'Internal server error while generating prompt'
      };
      
      res.status(500).json(response);
    }
  }
);

// Combined endpoint: analyze URL and generate prompt in one request
router.post('/analyze-and-generate',
  aiGenerationRateLimit,
  validateAnalyzeAndGenerate,
  async (req: Request, res: Response) => {
    try {
      const { url, provider, apiKey, promptStyle, targetPlatform } = req.body;
      
      console.log(`[API] Combined request: analyzing ${url} and generating ${provider} prompt`);
      
      // Step 1: Analyze URL with timeout wrapper
      console.log(`[API] Starting URL analysis...`);
      const analysisResult = await Promise.race([
        scrapingEngine.scrapeStockURL(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('URL analysis timed out after 45 seconds')), 45000)
        )
      ]) as any;
      
      if (!analysisResult.success || !analysisResult.data) {
        const response: APIResponse = {
          success: false,
          error: analysisResult.error || 'Failed to analyze URL'
        };
        return res.status(400).json(response);
      }
      
      console.log(`[API] Analysis completed, generating prompt...`);
      
      // Step 2: Generate prompt with timeout
      const promptResult = await Promise.race([
        aiManager.generatePrompt(provider, apiKey, {
          imageBase64: analysisResult.data.imageBase64!,
          metadata: analysisResult.data,
          promptStyle: promptStyle || 'detailed',
          targetPlatform
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI prompt generation timed out after 30 seconds')), 30000)
        )
      ]) as any;
      
      // Remove old code
      
      if (!promptResult.success) {
        const response: APIResponse = {
          success: false,
          error: promptResult.error || 'Failed to generate prompt'
        };
        return res.status(400).json(response);
      }
      
      const totalTime = analysisResult.processingTime + promptResult.processingTime;
      
      const response: APIResponse = {
        success: true,
        data: {
          originalUrl: url,
          imageData: analysisResult.data,
          generatedPrompt: promptResult.prompt,
          variations: promptResult.variations,
          metadata: {
            provider,
            style: promptStyle,
            platform: targetPlatform,
            confidence: promptResult.confidence,
            analysisTime: analysisResult.processingTime,
            generationTime: promptResult.processingTime,
            totalTime,
            generatedAt: new Date().toISOString()
          }
        },
        message: `Successfully completed analysis and prompt generation in ${totalTime}ms`
      };
      
      res.json(response);
      
    } catch (error: any) {
      console.error('[API] Error in combined endpoint:', error);
      
      const response: APIResponse = {
        success: false,
        error: error.message || 'Internal server error'
      };
      
      res.status(500).json(response);
    }
  }
);

// Validate API key endpoint
router.post('/validate-api-key',
  aiGenerationRateLimit,
  validateApiKeyRequest,
  async (req: Request, res: Response) => {
    try {
      const { provider, apiKey } = req.body;
      
      console.log(`[API] Validating ${provider} API key`);
      
      const result = await aiManager.validateApiKey(provider, apiKey);
      
      const response: APIResponse = {
        success: result.success,
        data: {
          provider: result.provider,
          isValid: result.isValid,
          details: result.details
        },
        error: result.error,
        message: result.isValid 
          ? `${provider} API key is valid` 
          : `${provider} API key validation failed`
      };
      
      // Return appropriate HTTP status
      const status = result.success ? (result.isValid ? 200 : 400) : 500;
      res.status(status).json(response);
      
    } catch (error: any) {
      console.error('[API] Error validating API key:', error);
      
      const response: APIResponse = {
        success: false,
        error: error.message || 'Internal server error while validating API key'
      };
      
      res.status(500).json(response);
    }
  }
);

// Get usage statistics (if needed)
router.get('/stats', (req: Request, res: Response) => {
  const response: APIResponse = {
    success: true,
    data: {
      supportedPlatforms: scrapingEngine.getSupportedPlatforms().length,
      supportedProviders: aiManager.getSupportedProviders().length,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    }
  };
  res.json(response);
});

export default router;