# 🎨 Stock Photo AI Prompt Generator

Transform any stock photo URL into detailed AI prompts using OpenAI GPT-4 Vision, Google Gemini Pro, or Anthropic Claude. Supports 10+ major stock photo platforms with secure API key management and advanced customization options.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fstock-photo-ai-generator)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)
[![Docker](https://img.shields.io/badge/docker-ready-blue?logo=docker)](https://hub.docker.com/)

## ✨ Features

- 🚀 **10+ Supported Platforms**: Shutterstock, Freepik, Adobe Stock, Getty Images, Dreamstime, Iconscout, Pond5, Arabstock, Vecteezy, Creative Fabrica
- 🤖 **3 AI Providers**: OpenAI GPT-4 Vision, Google Gemini Pro Vision, Anthropic Claude 3 Sonnet
- 🔒 **Secure**: API keys encrypted locally, never stored on servers
- ⚡ **Fast**: Advanced web scraping with Puppeteer and Cheerio
- 🎯 **Customizable**: Multiple prompt styles and target platform optimization
- 📱 **Responsive**: Modern React UI with Tailwind CSS
- 📊 **History**: Save and manage your generated prompts
- 🔄 **Variations**: Get multiple prompt variations (OpenAI)
- 📤 **Export**: Download prompts as Markdown files

## 🏗️ Architecture

```
📱 Frontend (React + TypeScript)
    ↓ HTTPS Request
🔥 Backend API (Node.js + Express)
    ↓ Web Scraping
🌐 Stock Photo Platforms
    ↓ Image Analysis
🧠 AI Vision APIs (OpenAI/Gemini/Claude)
    ↓ Generated Prompts
📋 Results Display
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API key from at least one provider:
  - [OpenAI Platform](https://platform.openai.com/api-keys)
  - [Google AI Studio](https://makersuite.google.com/app/apikey) 
  - [Anthropic Console](https://console.anthropic.com/)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/your-username/stock-photo-ai-generator.git
cd stock-photo-ai-generator
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Frontend Setup** (new terminal)
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/api/health

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Clone and configure
git clone https://github.com/your-username/stock-photo-ai-generator.git
cd stock-photo-ai-generator

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Container Builds

```bash
# Build backend
docker build -t stock-photo-ai-backend ./backend

# Build frontend  
docker build -t stock-photo-ai-frontend ./frontend

# Run containers
docker run -d -p 3000:3000 --name backend stock-photo-ai-backend
docker run -d -p 5173:80 --name frontend stock-photo-ai-frontend
```

## ☁️ Cloud Deployment

### Frontend (Vercel)

1. Fork this repository
2. Import to Vercel
3. Set environment variables:
   - `VITE_API_URL`: Your backend API URL
4. Deploy automatically on push to main

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fstock-photo-ai-generator)

### Backend (Railway)

1. Fork this repository
2. Import to Railway
3. Set environment variables:
   - `NODE_ENV`: production
   - `FRONTEND_URL`: Your Vercel domain
4. Deploy from `/backend` folder

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### Alternative Platforms

- **Netlify**: Frontend deployment with build settings
- **Render**: Full-stack deployment with Docker
- **DigitalOcean App Platform**: Container deployment
- **AWS/GCP/Azure**: VM or container services

## 📚 API Documentation

### Core Endpoints

```http
GET /api/health
GET /api/supported-platforms  
GET /api/supported-providers
POST /api/analyze-url
POST /api/generate-prompt
POST /api/analyze-and-generate
```

### Example Usage

```javascript
// Analyze URL and generate prompt
const response = await fetch('/api/analyze-and-generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.shutterstock.com/image-photo/...',
    provider: 'openai',
    apiKey: 'sk-...',
    promptStyle: 'detailed',
    targetPlatform: 'midjourney'
  })
});

const result = await response.json();
console.log(result.data.generatedPrompt);
```

## 🔧 Configuration

### Backend Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional: Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Optional: Redis Cache  
REDIS_URL=redis://localhost:6379

# Optional: Monitoring
LOG_LEVEL=info
WEBHOOK_URL_ERROR=https://hooks.slack.com/...
```

### Frontend Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Optional: Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_PLAUSIBLE_DOMAIN=your-domain.com

# Optional: Feature Flags
VITE_ENABLE_HISTORY=true
VITE_MAX_HISTORY_ITEMS=100
```

## 🛡️ Security Features

- **API Key Encryption**: Client-side encryption using CryptoJS
- **Rate Limiting**: 100 requests/15min general, 5 requests/min for AI
- **Input Validation**: Joi schemas for all API endpoints  
- **Security Headers**: CORS, CSP, XSS protection
- **No Server Storage**: API keys never leave user's browser

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests  
cd frontend
npm test
npm run test:e2e

# Integration tests
npm run test:integration
```

## 📊 Monitoring

### Health Checks

```bash
# API health
curl http://localhost:3000/api/health

# Frontend health (Docker)
curl http://localhost:5173/health

# Detailed stats
curl http://localhost:3000/api/stats
```

### Performance Metrics

- **Analysis Time**: 5-15 seconds per URL
- **Generation Time**: 10-30 seconds per AI request  
- **Concurrent Users**: 100+ with rate limiting
- **Memory Usage**: ~200MB backend, ~50MB frontend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use ESLint and Prettier
- Write tests for new features
- Update documentation
- Follow semantic versioning

## 🐛 Troubleshooting

### Common Issues

**Backend not starting:**
```bash
# Check Node.js version
node --version  # Should be 18+

# Install dependencies
cd backend && npm install

# Check ports
lsof -i :3000
```

**Frontend build fails:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Vite config
npm run build --verbose
```

**Puppeteer issues:**
```bash
# Install Chromium
npm run postinstall

# Docker: Use provided Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

**AI API errors:**
- Verify API key format
- Check API quotas and billing
- Test with curl directly
- Review rate limiting

### Debug Mode

```bash
# Backend debug
DEBUG=* npm run dev

# Frontend debug  
VITE_LOG_LEVEL=debug npm run dev

# Docker debug
docker-compose up --build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

- 📧 **Email**: support@yourapp.com
- 💬 **Discord**: [Join our community](https://discord.gg/yourserver)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/stock-photo-ai-generator/issues)
- 📖 **Docs**: [Full Documentation](https://docs.yourapp.com)

## 🎯 Roadmap

- [ ] **Batch Processing**: Multiple URLs at once
- [ ] **API Rate Optimization**: Smart queuing system  
- [ ] **More Platforms**: Pinterest, Unsplash, Pexels
- [ ] **Advanced Prompting**: Custom templates and styles
- [ ] **Team Features**: Shared workspaces and collaboration
- [ ] **Mobile App**: React Native implementation
- [ ] **Plugin System**: Browser extensions
- [ ] **Analytics Dashboard**: Usage insights and metrics

## 🏆 Acknowledgments

- **OpenAI** for GPT-4 Vision API
- **Google** for Gemini Pro Vision API  
- **Anthropic** for Claude 3 API
- **Puppeteer** for web scraping capabilities
- **React** ecosystem for frontend framework
- **Node.js** community for backend tools

---

**Built with ❤️ by [Your Name](https://github.com/your-username)**

*If this project helped you, please consider ⭐ starring it on GitHub!*