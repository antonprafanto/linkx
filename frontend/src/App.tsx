import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useAppContext } from './context/AppContext';
import Header from './components/Header';
import MainForm from './components/MainForm';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingOverlay from './components/LoadingOverlay';
import { getSupportedPlatforms, getSupportedProviders } from './api/client';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppContent: React.FC = () => {
  const { state, setSupportedPlatforms, setSupportedProviders, setLoadingStatus } = useAppContext();
  const hasLoadedData = useRef(false);

  // Load supported platforms and providers on app start
  useEffect(() => {
    // Prevent multiple calls by using ref guard
    if (hasLoadedData.current || state.loadingStatus.state === 'analyzing') {
      return;
    }
    
    const loadSupportedData = async () => {
      try {
        hasLoadedData.current = true;
        setLoadingStatus({ state: 'analyzing', message: 'Loading supported platforms...' });
        
        const [platformsResponse, providersResponse] = await Promise.all([
          getSupportedPlatforms(),
          getSupportedProviders(),
        ]);

        if (platformsResponse.success && platformsResponse.data) {
          setSupportedPlatforms(platformsResponse.data.platforms);
        }

        if (providersResponse.success && providersResponse.data) {
          setSupportedProviders(providersResponse.data.providers);
        }

        setLoadingStatus({ state: 'idle', message: '' });
      } catch (error) {
        console.error('Failed to load supported data:', error);
        
        // Provide fallback data when API is not available
        const fallbackPlatforms = [
          { id: 'shutterstock', name: 'Shutterstock', domain: 'shutterstock.com' },
          { id: 'freepik', name: 'Freepik', domain: 'freepik.com' },
          { id: 'adobe-stock', name: 'Adobe Stock', domain: 'stock.adobe.com' },
          { id: 'getty-images', name: 'Getty Images', domain: 'gettyimages.com' },
          { id: 'dreamstime', name: 'Dreamstime', domain: 'dreamstime.com' }
        ];
        
        const fallbackProviders = [
          { id: 'openai', name: 'OpenAI GPT', model: 'gpt-4-vision-preview' },
          { id: 'gemini', name: 'Google Gemini', model: 'gemini-pro-vision' },
          { id: 'claude', name: 'Anthropic Claude', model: 'claude-3-opus' }
        ];
        
        setSupportedPlatforms(fallbackPlatforms);
        setSupportedProviders(fallbackProviders);
        
        hasLoadedData.current = false; // Reset on error to allow retry
        setLoadingStatus({ 
          state: 'idle', 
          message: '' 
        });
      }
    };

    loadSupportedData();
  }, []); // Empty dependency array - we only want this to run once

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="text-4xl animate-float">🎨</div>
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                Stock Photo AI Prompt Generator
              </h1>
              <div className="text-4xl animate-float" style={{ animationDelay: '1s' }}>🚀</div>
            </div>
            
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto text-balance">
              Transform any stock photo URL into detailed AI prompts using OpenAI, Gemini, or Claude. 
              Support for 10+ major platforms including Shutterstock, Freepik, and Adobe Stock.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  {state.supportedPlatforms.length} Platforms Supported
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  {state.supportedProviders.length} AI Providers
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  Secure & Private
                </span>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <MainForm />

          {/* Results Display */}
          {state.results && <ResultsDisplay />}
          
          {/* Platform Support Section */}
          {state.supportedPlatforms.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-center mb-6">Supported Platforms</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {state.supportedPlatforms.map((platform) => (
                  <div 
                    key={platform.id} 
                    className="flex flex-col items-center p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className={`platform-badge ${platform.id} mb-2`}>
                      {platform.name}
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {platform.domain}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Loading Overlay */}
      <LoadingOverlay />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;