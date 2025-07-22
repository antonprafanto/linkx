import React, { useState } from 'react';
import { 
  Key, 
  Save, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { validateApiKey, SecureStorage } from '../utils/encryption';
import toast from 'react-hot-toast';

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { 
    state, 
    updateSettings, 
    storeApiKey, 
    getApiKey, 
    removeApiKey, 
    maskApiKey,
    clearHistory
  } = useAppContext();

  const [apiKeys, setApiKeys] = useState({
    openai: getApiKey('openai') || '',
    gemini: getApiKey('gemini') || '',
    claude: getApiKey('claude') || ''
  });

  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    gemini: false,
    claude: false
  });

  // const [unsavedChanges, setUnsavedChanges] = useState(false);

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    // setUnsavedChanges(true);
  };

  const saveApiKey = (provider: string) => {
    const key = apiKeys[provider as keyof typeof apiKeys];
    if (!key) {
      removeApiKey(provider);
      toast.success(`${provider.toUpperCase()} API key removed`);
    } else if (validateApiKey(provider, key)) {
      storeApiKey(provider, key);
      toast.success(`${provider.toUpperCase()} API key saved securely`);
    } else {
      toast.error(`Invalid ${provider.toUpperCase()} API key format`);
      return;
    }
    // setUnsavedChanges(false);
  };

  const removeApiKeyHandler = (provider: string) => {
    removeApiKey(provider);
    setApiKeys(prev => ({ ...prev, [provider]: '' }));
    toast.success(`${provider.toUpperCase()} API key removed`);
  };

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider as keyof typeof showApiKeys]
    }));
  };

  const exportSettings = () => {
    const settings = {
      settings: state.settings,
      history: state.history,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-photo-ai-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Settings exported successfully');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.settings) {
          updateSettings(data.settings);
        }
        
        // Note: History import would need to be implemented in the context
        toast.success('Settings imported successfully');
      } catch (error) {
        toast.error('Invalid settings file format');
      }
    };
    reader.readAsText(file);
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      updateSettings({
        apiKeys: {},
        defaultProvider: 'openai',
        defaultStyle: 'detailed',
        defaultPlatform: undefined,
        autoSaveResults: true,
        showVariations: true,
      });
      
      SecureStorage.clearAllApiKeys();
      setApiKeys({ openai: '', gemini: '', claude: '' });
      
      toast.success('Settings reset to defaults');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* API Keys Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">API Keys</h3>
          <Shield className="w-4 h-4 text-green-600" />
        </div>
        
        <div className="space-y-4">
          {Object.entries(apiKeys).map(([provider, key]) => (
            <div key={provider} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium capitalize">
                  {provider} API Key
                  {getApiKey(provider) && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Saved
                    </span>
                  )}
                </label>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleApiKeyVisibility(provider)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKeys[provider as keyof typeof showApiKeys] ? 
                      <EyeOff className="w-4 h-4" /> : 
                      <Eye className="w-4 h-4" />
                    }
                  </button>
                  
                  {getApiKey(provider) && (
                    <button
                      onClick={() => removeApiKeyHandler(provider)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <input
                  type={showApiKeys[provider as keyof typeof showApiKeys] ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                  placeholder={getApiKey(provider) ? maskApiKey(provider) : `Enter ${provider} API key...`}
                  className="input w-full"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    {key && (
                      validateApiKey(provider, key) ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Valid format
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          Invalid format
                        </div>
                      )
                    )}
                  </div>
                  
                  <button
                    onClick={() => saveApiKey(provider)}
                    disabled={!key || !validateApiKey(provider, key)}
                    className="btn btn-primary text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <Shield className="w-4 h-4 inline mr-1" />
            API keys are encrypted and stored securely in your browser. They are never sent to our servers.
          </p>
        </div>
      </div>

      {/* General Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">General Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default AI Provider
            </label>
            <select
              value={state.settings.defaultProvider}
              onChange={(e) => updateSettings({ defaultProvider: e.target.value as any })}
              className="input"
            >
              <option value="openai">OpenAI GPT-4 Vision</option>
              <option value="gemini">Google Gemini Pro</option>
              <option value="claude">Anthropic Claude</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Prompt Style
            </label>
            <select
              value={state.settings.defaultStyle}
              onChange={(e) => updateSettings({ defaultStyle: e.target.value as any })}
              className="input"
            >
              <option value="detailed">Detailed & Comprehensive</option>
              <option value="concise">Concise & Focused</option>
              <option value="artistic">Artistic & Creative</option>
              <option value="technical">Technical & Precise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Target Platform
            </label>
            <select
              value={state.settings.defaultPlatform || ''}
              onChange={(e) => updateSettings({ defaultPlatform: e.target.value || undefined as any })}
              className="input"
            >
              <option value="">Any Platform</option>
              <option value="midjourney">Midjourney</option>
              <option value="dall-e">DALL-E</option>
              <option value="stable-diffusion">Stable Diffusion</option>
              <option value="leonardo">Leonardo AI</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={state.settings.autoSaveResults}
                onChange={(e) => updateSettings({ autoSaveResults: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Auto-save results to history</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={state.settings.showVariations}
                onChange={(e) => updateSettings({ showVariations: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Show prompt variations when available</span>
            </label>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Data Management</h3>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportSettings}
              className="btn btn-outline flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Settings
            </button>
            
            <label className="btn btn-outline flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Import Settings
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                  clearHistory();
                  toast.success('History cleared');
                }
              }}
              className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
            
            <button
              onClick={resetToDefaults}
              className="btn btn-outline text-orange-600 border-orange-300 hover:bg-orange-50 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p>History: {state.history.length} items stored</p>
            <p>Settings last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Settings are automatically saved
        </div>
        
        <button
          onClick={onClose}
          className="btn btn-primary"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;