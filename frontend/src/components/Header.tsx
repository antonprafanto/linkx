import React, { useState } from 'react';
import { Settings, Github, HelpCircle, History, X } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import HistoryPanel from './HistoryPanel';

const Header: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎨</div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Stock Photo AI</h1>
                <p className="text-xs text-gray-500">Prompt Generator</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
              
              <button
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help</span>
              </button>
              
              <a
                href="https://github.com/your-username/stock-photo-ai-generator"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
              
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </nav>

            {/* Mobile menu */}
            <div className="md:hidden">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <SettingsPanel onClose={() => setShowSettings(false)} />
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Prompt History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <HistoryPanel onClose={() => setShowHistory(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Help & Documentation</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">How to Use</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">1</div>
                    <p>Copy a URL from any supported stock photo platform (Shutterstock, Freepik, Adobe Stock, etc.)</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">2</div>
                    <p>Choose your preferred AI provider (OpenAI, Gemini, or Claude) and enter your API key</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">3</div>
                    <p>Select the prompt style and target platform for optimization</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">4</div>
                    <p>Click "Generate AI Prompt" and wait for the analysis to complete</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Supported Platforms</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>• Shutterstock</div>
                  <div>• Adobe Stock</div>
                  <div>• Freepik</div>
                  <div>• Getty Images</div>
                  <div>• Dreamstime</div>
                  <div>• Iconscout</div>
                  <div>• Pond5</div>
                  <div>• Arabstock</div>
                  <div>• Vecteezy</div>
                  <div>• Creative Fabrica</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">API Keys</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• <strong>OpenAI:</strong> Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com</a></p>
                  <p>• <strong>Google Gemini:</strong> Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a></p>
                  <p>• <strong>Anthropic Claude:</strong> Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.anthropic.com</a></p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Privacy & Security</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Your API keys are encrypted and stored locally in your browser</p>
                  <p>• No API keys are sent to or stored on our servers</p>
                  <p>• Image data is temporarily processed for analysis only</p>
                  <p>• All requests are made directly from your browser to AI providers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;