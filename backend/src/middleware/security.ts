import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { APIResponse } from '../interfaces/types';

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for OPTIONS requests
      return req.method === 'OPTIONS';
    }
  });
};

// General API rate limit
export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Stricter rate limit for AI generation endpoints
export const aiGenerationRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  5, // limit each IP to 5 AI requests per minute
  'Too many AI generation requests. Please wait before making another request.'
);

// Rate limit for URL analysis
export const urlAnalysisRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // limit each IP to 10 URL analysis requests per minute
  'Too many URL analysis requests. Please wait before analyzing another URL.'
);

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Don't cache API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
};

// IP whitelist middleware (if needed)
export const ipWhitelist = (allowedIPs: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (allowedIPs.length === 0) {
      return next(); // Skip if no whitelist configured
    }

    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    if (!clientIP || !allowedIPs.includes(clientIP as string)) {
      const response: APIResponse = {
        success: false,
        error: 'Access denied from this IP address'
      };
      return res.status(403).json(response);
    }
    
    next();
  };
};

// API key sanitization middleware
export const sanitizeApiKey = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && req.body.apiKey) {
    // Trim whitespace and validate basic format
    req.body.apiKey = req.body.apiKey.trim();
    
    // Check for obviously invalid keys
    if (req.body.apiKey.includes(' ') || req.body.apiKey.length < 10) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid API key format'
      };
      return res.status(400).json(response);
    }
  }
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${clientIP}`);
  
  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

// Error handling middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ErrorHandler] ${error.name}: ${error.message}`);
  console.error(error.stack);
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response: APIResponse = {
    success: false,
    error: isDevelopment ? error.message : 'Internal server error'
  };
  
  res.status(500).json(response);
};

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:5174', // Alternative Vite port
      'http://localhost:3000', // Alternative dev port
      'http://127.0.0.1:5173', // localhost alternative
      'http://127.0.0.1:5174', // localhost alternative
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL || ''
    ].filter(url => url.length > 0);
    
    console.log(`[CORS] Request from origin: ${origin}`);
    console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`[CORS] Origin ${origin} allowed`);
      callback(null, true);
    } else {
      console.log(`[CORS] Origin ${origin} rejected`);
      // Don't throw error, just reject with false
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 86400 // 24 hours
};