import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Key, Image, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { analyzeAndGenerate, validateApiKey as validateApiKeyAPI } from '../api/client';
import { FormData } from '../types';
import { validateApiKey } from '../utils/encryption';
import toast from 'react-hot-toast';

const MainForm: React.FC = () => {
  const { 
    state, 
    setResults, 
    setLoadingStatus, 
    storeApiKey, 
    getApiKey, 
    maskApiKey,
    updateSettings 
  } = useAppContext();
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [rememberApiKey, setRememberApiKey] = useState(true);
  const [validationStatus, setValidationStatus] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    message?: string;
    provider?: string;
  }>({ status: 'idle' });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      provider: state.settings.defaultProvider,
      promptStyle: state.settings.defaultStyle,
      targetPlatform: state.settings.defaultPlatform,
      apiKey: ''
    }
  });

  const watchedProvider = watch('provider');

  // Load saved API key when provider changes
  React.useEffect(() => {
    const savedApiKey = getApiKey(watchedProvider);
    if (savedApiKey) {
      setValue('apiKey', savedApiKey);
    } else {
      setValue('apiKey', '');
    }
  }, [watchedProvider]); // Remove getApiKey and setValue from dependencies since they're now stable

  // Reset validation status when provider or API key changes
  React.useEffect(() => {
    setValidationStatus({ status: 'idle' });
  }, [watchedProvider, watch('apiKey')]);

  const handleValidateApiKey = async () => {
    const currentApiKey = watch('apiKey');
    const currentProvider = watch('provider');

    if (!currentApiKey || currentApiKey.trim().length === 0) {
      toast.error('Please enter an API key first');
      return;
    }

    // First check format
    if (!validateApiKey(currentProvider, currentApiKey)) {
      setValidationStatus({
        status: 'invalid',
        message: `Invalid ${currentProvider.toUpperCase()} API key format`,
        provider: currentProvider
      });
      return;
    }

    setValidationStatus({ status: 'validating', provider: currentProvider });

    try {
      const response = await validateApiKeyAPI(currentProvider, currentApiKey);

      if (response.success && response.data?.isValid) {
        setValidationStatus({
          status: 'valid',
          message: `${currentProvider.toUpperCase()} API key is valid`,
          provider: currentProvider
        });
        toast.success(`${currentProvider.toUpperCase()} API key is valid!`);
      } else {
        setValidationStatus({
          status: 'invalid',
          message: response.error || response.data?.details?.error || 'API key validation failed',
          provider: currentProvider
        });
        toast.error(response.error || 'API key validation failed');
      }
    } catch (error: any) {
      setValidationStatus({
        status: 'invalid',
        message: error.message || 'Network error while validating API key',
        provider: currentProvider
      });
      toast.error(error.message || 'Validation failed');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Validate API key format
      if (!validateApiKey(data.provider, data.apiKey)) {
        toast.error(`Invalid ${data.provider.toUpperCase()} API key format`);
        return;
      }

      // Save API key if remember is checked
      if (rememberApiKey && data.apiKey) {
        storeApiKey(data.provider, data.apiKey);
      }

      // Update default settings
      updateSettings({
        defaultProvider: data.provider,
        defaultStyle: data.promptStyle,
        defaultPlatform: data.targetPlatform
      });

      setLoadingStatus({ state: 'analyzing', message: 'Analyzing stock photo URL...' });

      const result = await analyzeAndGenerate(data);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to process request');
      }

      setLoadingStatus({ state: 'complete', message: 'Analysis complete!' });
      setResults(result.data);
      
      toast.success('AI prompt generated successfully!');

    } catch (error: any) {
      console.error('Form submission error:', error);
      setLoadingStatus({ state: 'error', message: error.message });
      toast.error(error.message || 'An error occurred while processing your request');
    }
  };

  const getProviderInfo = (provider: string) => {
    const providerData = state.supportedProviders.find(p => p.id === provider);
    return providerData || { name: provider, model: 'Unknown' };
  };

  const isLoading = state.loadingStatus.state === 'analyzing' || state.loadingStatus.state === 'generating';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Image className="inline w-4 h-4 mr-1" />
            Stock Photo URL
          </label>
          <input
            {...register('url', {
              required: 'URL is required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Please enter a valid HTTP/HTTPS URL'
              },
              validate: (value) => {
                const supportedDomains = state.supportedPlatforms.map(p => p.domain);
                const urlDomain = new URL(value).hostname.replace('www.', '');
                const isSupported = supportedDomains.some(domain => 
                  urlDomain.includes(domain) || domain.includes(urlDomain)
                );
                return isSupported || `URL must be from supported platforms: ${supportedDomains.slice(0, 3).join(', ')}...`;
              }
            })}
            type="url"
            placeholder="https://www.shutterstock.com/image-photo/..."
            className={`input ${errors.url ? 'error-border' : ''}`}
            disabled={isLoading}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.url.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Supported: {state.supportedPlatforms.map(p => p.name).join(', ')}
          </p>
        </div>

        {/* Provider and Settings Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AI Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <select
              {...register('provider', { required: true })}
              className="input"
              disabled={isLoading}
            >
              {state.supportedProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Model: {getProviderInfo(watchedProvider).model}
            </p>
          </div>

          {/* Prompt Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Style
            </label>
            <select
              {...register('promptStyle')}
              className="input"
              disabled={isLoading}
            >
              <option value="detailed">Detailed & Comprehensive</option>
              <option value="concise">Concise & Focused</option>
              <option value="artistic">Artistic & Creative</option>
              <option value="technical">Technical & Precise</option>
            </select>
          </div>

          {/* Target Platform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Platform
            </label>
            <select
              {...register('targetPlatform')}
              className="input"
              disabled={isLoading}
            >
              <option value="">Any Platform</option>
              <option value="midjourney">Midjourney</option>
              <option value="dall-e">DALL-E</option>
              <option value="stable-diffusion">Stable Diffusion</option>
              <option value="leonardo">Leonardo AI</option>
            </select>
          </div>
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Key className="inline w-4 h-4 mr-1" />
            {getProviderInfo(watchedProvider).name} API Key
            {getApiKey(watchedProvider) && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Saved
              </span>
            )}
          </label>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                {...register('apiKey', { 
                  required: 'API Key is required',
                  validate: (value) => validateApiKey(watchedProvider, value) || 
                    `Invalid ${watchedProvider.toUpperCase()} API key format`
                })}
                type={showApiKey ? 'text' : 'password'}
                placeholder={getApiKey(watchedProvider) ? 
                  maskApiKey(watchedProvider) : 
                  `Enter your ${watchedProvider} API key...`
                }
                className={`input pr-10 ${errors.apiKey ? 'error-border' : ''} ${
                  validationStatus.status === 'valid' ? 'border-green-500' : 
                  validationStatus.status === 'invalid' ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleValidateApiKey}
              disabled={isLoading || validationStatus.status === 'validating' || !watch('apiKey')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
            >
              {validationStatus.status === 'validating' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : validationStatus.status === 'valid' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : validationStatus.status === 'invalid' ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              {validationStatus.status === 'validating' ? 'Validating...' : 'Validate'}
            </button>
          </div>
          
          {errors.apiKey && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.apiKey.message}
            </p>
          )}

          {validationStatus.status !== 'idle' && !errors.apiKey && (
            <p className={`mt-1 text-sm flex items-center gap-1 ${
              validationStatus.status === 'valid' ? 'text-green-600' : 
              validationStatus.status === 'invalid' ? 'text-red-600' : 
              'text-blue-600'
            }`}>
              {validationStatus.status === 'validating' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : validationStatus.status === 'valid' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {validationStatus.message}
            </p>
          )}

          <div className="mt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={rememberApiKey}
                onChange={(e) => setRememberApiKey(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Remember API key (encrypted locally)
            </label>
            
            <div className="text-xs text-gray-500">
              <a 
                href={getProviderApiKeyUrl(watchedProvider)}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Get API Key
              </a>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-xl font-medium text-white transition-all duration-300 flex items-center justify-center gap-3 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="loading-dots">Processing</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate AI Prompt
            </>
          )}
        </motion.button>

        {/* Loading Status */}
        {state.loadingStatus.state !== 'idle' && (
          <div className={`mt-4 p-4 rounded-lg border ${
            state.loadingStatus.state === 'error' 
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center gap-2">
              {state.loadingStatus.state === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              <span className="text-sm font-medium">
                {state.loadingStatus.message}
              </span>
            </div>
          </div>
        )}
      </form>
    </motion.div>
  );
};

const getProviderApiKeyUrl = (provider: string): string => {
  const urls = {
    openai: 'https://platform.openai.com/api-keys',
    gemini: 'https://makersuite.google.com/app/apikey',
    claude: 'https://console.anthropic.com/'
  };
  return urls[provider as keyof typeof urls] || '#';
};

export default MainForm;