# 🚀 Stock Photo AI Prompt Generator - Setup Guide

Quick setup guide untuk menjalankan aplikasi Stock Photo AI Prompt Generator.

## 📋 Prerequisites

- Node.js 18+ (`node --version`)
- npm atau yarn
- API key dari minimal satu provider AI:
  - OpenAI: https://platform.openai.com/api-keys
  - Gemini: https://makersuite.google.com/app/apikey
  - Claude: https://console.anthropic.com/

## ⚡ Quick Start (5 menit)

### 1. Clone Repository
```bash
git clone <repository-url>
cd stock-photo-ai-generator
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env jika diperlukan
npm run dev
```
✅ Backend running di: http://localhost:3000

### 3. Frontend Setup (terminal baru)
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit VITE_API_URL=http://localhost:3000/api
npm run dev
```
✅ Frontend running di: http://localhost:5173

### 4. Test Aplikasi
1. Buka http://localhost:5173
2. Paste URL stock photo (contoh Shutterstock)
3. Masukkan API key AI provider
4. Klik "Generate AI Prompt"

## 🐳 Docker Setup (Alternative)

```bash
# Quick start dengan Docker Compose
docker-compose up -d

# Cek status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🔧 Environment Configuration

### Backend (.env)
```bash
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)  
```bash
VITE_API_URL=http://localhost:3000/api
```

## 📱 Usage

### Supported Platforms (10)
- Shutterstock
- Freepik  
- Adobe Stock
- Getty Images
- Dreamstime
- Iconscout
- Pond5
- Arabstock
- Vecteezy
- Creative Fabrica

### AI Providers (3)
- OpenAI GPT-4 Vision
- Google Gemini Pro Vision  
- Anthropic Claude 3 Sonnet

### Prompt Styles (4)
- Detailed & Comprehensive
- Concise & Focused
- Artistic & Creative
- Technical & Precise

## 🚨 Troubleshooting

### Backend tidak start
```bash
# Cek port 3000
lsof -i :3000
kill -9 <PID>

# Install ulang dependencies
rm -rf node_modules package-lock.json
npm install
```

### Frontend tidak build
```bash
# Clear cache
rm -rf node_modules .next dist
npm install
```

### Puppeteer error (Docker)
```bash
# Update Dockerfile untuk include Chromium
# atau gunakan konfigurasi yang sudah ada
```

## ✅ Verification Checklist

- [ ] Backend API health: http://localhost:3000/api/health
- [ ] Frontend loading: http://localhost:5173
- [ ] Platform list: http://localhost:3000/api/supported-platforms
- [ ] AI providers: http://localhost:3000/api/supported-providers
- [ ] URL analysis working
- [ ] API key encryption working
- [ ] Prompt generation working
- [ ] History saving working
- [ ] Export functionality working

## 📊 Performance Tips

1. **Rate Limiting**: Max 5 AI requests per menit
2. **Image Size**: Otomatis resize ke 1024x1024
3. **Caching**: Browser cache untuk platform data
4. **Memory**: Backend ~200MB, Frontend ~50MB

## 🔐 Security Notes

- API keys dienkrip lokal dengan CryptoJS
- Tidak ada API key yang dikirim ke server
- Rate limiting untuk mencegah abuse
- CORS dan security headers sudah dikonfig

## 🎯 Next Steps

1. **Testing**: Test dengan berbagai platform
2. **Deployment**: Deploy ke Vercel + Railway
3. **Monitoring**: Setup error tracking
4. **Scaling**: Add Redis untuk caching
5. **Features**: Batch processing, more platforms

## 📞 Support

Jika ada masalah:
1. Cek logs di terminal
2. Pastikan semua dependencies terinstall
3. Verify API keys format
4. Check network connectivity
5. Restart development servers

---

**Happy Coding! 🎨✨**