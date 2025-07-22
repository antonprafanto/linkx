import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { 
  generalRateLimit, 
  securityHeaders, 
  requestLogger, 
  errorHandler,
  corsOptions,
  sanitizeApiKey
} from './middleware/security';
import { validateContentType, validateRequestSize } from './middleware/validation';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for correct IP addresses in production
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://generativelanguage.googleapis.com", "https://api.anthropic.com"],
    },
  },
}));

// CORS configuration
app.use(cors(corsOptions));

// Custom security headers
app.use(securityHeaders);

// Request logging
app.use(requestLogger);

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    // Additional JSON validation
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Content type validation
app.use(validateContentType);

// Request size validation
app.use(validateRequestSize(50)); // 50MB max for base64 images

// API key sanitization
app.use(sanitizeApiKey);

// Rate limiting
app.use('/api', generalRateLimit);

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Stock Photo AI Prompt Generator API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      platforms: '/api/supported-platforms',
      providers: '/api/supported-providers',
      analyze: '/api/analyze-url',
      generate: '/api/generate-prompt',
      combined: '/api/analyze-and-generate',
      stats: '/api/stats'
    },
    documentation: 'https://github.com/your-username/stock-photo-ai-generator'
  });
});

// Handle 404 for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// Graceful shutdown handling
const server = app.listen(PORT, () => {
  console.log(`
🚀 Stock Photo AI Prompt Generator API is running!

📍 Server: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/api/health
📚 Platforms: ${10} supported stock photo platforms
🤖 AI Providers: ${3} supported AI providers
🛡️  Security: Rate limiting, CORS, Helmet enabled
📊 Environment: ${process.env.NODE_ENV || 'development'}

Ready to generate AI prompts from stock photos! 🎨
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Cleanup resources
    try {
      const { WebScrapingEngine } = await import('./core/scraper-engine');
      const engine = WebScrapingEngine.getInstance();
      await engine.cleanup();
      console.log('Scraping engine cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
    
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('Force closing server...');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.emit('SIGTERM');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit process in production, just log
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;