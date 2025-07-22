import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../interfaces/types';

// Validation schemas
const analyzeUrlSchema = Joi.object({
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.uri': 'Please provide a valid HTTP/HTTPS URL',
      'any.required': 'URL is required'
    })
});

const validateApiKeySchema = Joi.object({
  provider: Joi.string()
    .valid('openai', 'openai-fast', 'gemini', 'claude')
    .required()
    .messages({
      'any.only': 'Provider must be one of: openai, openai-fast, gemini, claude',
      'any.required': 'AI provider is required'
    }),
  
  apiKey: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.min': 'API key must be at least 10 characters long',
      'any.required': 'API key is required'
    })
});

const generatePromptSchema = Joi.object({
  provider: Joi.string()
    .valid('openai', 'openai-fast', 'gemini', 'claude')
    .required()
    .messages({
      'any.only': 'Provider must be one of: openai, openai-fast, gemini, claude',
      'any.required': 'AI provider is required'
    }),
  
  apiKey: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.min': 'API key must be at least 10 characters long',
      'any.required': 'API key is required'
    }),
    
  imageData: Joi.object({
    title: Joi.string().allow(''),
    description: Joi.string().allow(''),
    tags: Joi.array().items(Joi.string()),
    imageUrl: Joi.string().uri().allow(''),
    imageBase64: Joi.string().required().messages({
      'any.required': 'Image data is required'
    }),
    category: Joi.string().allow(''),
    stockId: Joi.string().allow(''),
    platform: Joi.string().required(),
    scrapedAt: Joi.date()
  }).required(),
  
  promptStyle: Joi.string()
    .valid('detailed', 'concise', 'artistic', 'technical')
    .default('detailed'),
    
  targetPlatform: Joi.string()
    .valid('midjourney', 'dall-e', 'stable-diffusion', 'leonardo')
    .optional()
});

const analyzeAndGenerateSchema = Joi.object({
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.uri': 'Please provide a valid HTTP/HTTPS URL',
      'any.required': 'URL is required'
    }),
    
  provider: Joi.string()
    .valid('openai', 'openai-fast', 'gemini', 'claude')
    .required()
    .messages({
      'any.only': 'Provider must be one of: openai, openai-fast, gemini, claude',
      'any.required': 'AI provider is required'
    }),
  
  apiKey: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.min': 'API key must be at least 10 characters long',
      'any.required': 'API key is required'
    }),
  
  promptStyle: Joi.string()
    .valid('detailed', 'concise', 'artistic', 'technical')
    .default('detailed'),
    
  targetPlatform: Joi.string()
    .valid('midjourney', 'dall-e', 'stable-diffusion', 'leonardo')
    .optional()
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      const response: APIResponse = {
        success: false,
        error: `Validation error: ${errorMessages.join(', ')}`
      };
      return res.status(400).json(response);
    }

    // Attach validated data to request
    req.body = value;
    next();
  };
};

// Specific validation middleware
export const validateAnalyzeUrl = validate(analyzeUrlSchema);
export const validateGeneratePrompt = validate(generatePromptSchema);
export const validateApiKeyRequest = validate(validateApiKeySchema);
export const validateAnalyzeAndGenerate = validate(analyzeAndGenerateSchema);

// URL parameter validation
export const validateUrlParam = (req: Request, res: Response, next: NextFunction) => {
  const url = req.query.url as string;
  
  if (!url) {
    const response: APIResponse = {
      success: false,
      error: 'URL parameter is required'
    };
    return res.status(400).json(response);
  }

  try {
    new URL(url);
    next();
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Invalid URL format'
    };
    return res.status(400).json(response);
  }
};

// Security validation for API keys
export const validateApiKey = (provider: string, apiKey: string): boolean => {
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  const patterns = {
    openai: /^sk-[a-zA-Z0-9\-_\.]{10,}$/,  // More flexible for all OpenAI formats
    gemini: /^[A-Za-z0-9_-]{10,}$/,
    claude: /^sk-ant-[A-Za-z0-9_-]{10,}$/
  };

  const pattern = patterns[provider as keyof typeof patterns];
  if (!pattern) return false;

  const isValid = pattern.test(apiKey.trim());
  console.log(`[Validation] ${provider} key format check: ${isValid} for pattern: ${pattern}`);
  
  return isValid;
};

// Content validation middleware
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    const response: APIResponse = {
      success: false,
      error: 'Content-Type must be application/json'
    };
    return res.status(400).json(response);
  }
  next();
};

// Request size validation
export const validateRequestSize = (maxSizeMB: number = 10) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (contentLength > maxSizeBytes) {
      const response: APIResponse = {
        success: false,
        error: `Request too large. Maximum size is ${maxSizeMB}MB`
      };
      return res.status(413).json(response);
    }
    next();
  };
};