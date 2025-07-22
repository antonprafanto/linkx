import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { GeneratedResult, AppSettings, HistoryItem, LoadingStatus } from '../types';
import { SecureStorage } from '../utils/encryption';

interface AppState {
  results: GeneratedResult | null;
  loadingStatus: LoadingStatus;
  settings: AppSettings;
  history: HistoryItem[];
  supportedPlatforms: Array<{ name: string; domain: string; id: string }>;
  supportedProviders: Array<{ id: string; name: string; model: string }>;
}

type AppAction =
  | { type: 'SET_RESULTS'; payload: GeneratedResult }
  | { type: 'CLEAR_RESULTS' }
  | { type: 'SET_LOADING'; payload: LoadingStatus }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_TO_HISTORY'; payload: HistoryItem }
  | { type: 'REMOVE_FROM_HISTORY'; payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_SUPPORTED_PLATFORMS'; payload: Array<{ name: string; domain: string; id: string }> }
  | { type: 'SET_SUPPORTED_PROVIDERS'; payload: Array<{ id: string; name: string; model: string }> };

const defaultSettings: AppSettings = {
  apiKeys: {},
  defaultProvider: 'openai',
  defaultStyle: 'detailed',
  autoSaveResults: true,
  showVariations: true,
};

const initialState: AppState = {
  results: null,
  loadingStatus: { state: 'idle', message: '' },
  settings: defaultSettings,
  history: [],
  supportedPlatforms: [],
  supportedProviders: [],
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    
    case 'CLEAR_RESULTS':
      return { ...state, results: null };
    
    case 'SET_LOADING':
      return { ...state, loadingStatus: action.payload };
    
    case 'UPDATE_SETTINGS':
      const newSettings = { ...state.settings, ...action.payload };
      return { ...state, settings: newSettings };
    
    case 'ADD_TO_HISTORY':
      const newHistory = [action.payload, ...state.history.slice(0, 49)]; // Keep last 50 items
      return { ...state, history: newHistory };
    
    case 'REMOVE_FROM_HISTORY':
      return {
        ...state,
        history: state.history.filter(item => item.id !== action.payload)
      };
    
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    
    case 'SET_SUPPORTED_PLATFORMS':
      return { ...state, supportedPlatforms: action.payload };
    
    case 'SET_SUPPORTED_PROVIDERS':
      return { ...state, supportedProviders: action.payload };
    
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  setResults: (results: GeneratedResult) => void;
  clearResults: () => void;
  setLoadingStatus: (status: LoadingStatus) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addToHistory: (item: HistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  setSupportedPlatforms: (platforms: Array<{ name: string; domain: string; id: string }>) => void;
  setSupportedProviders: (providers: Array<{ id: string; name: string; model: string }>) => void;
  storeApiKey: (provider: string, apiKey: string) => void;
  getApiKey: (provider: string) => string | undefined;
  removeApiKey: (provider: string) => void;
  maskApiKey: (provider: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load settings and history on mount
  useEffect(() => {
    try {
      // Load settings
      const savedSettings = SecureStorage.getSettings(defaultSettings);
      dispatch({ type: 'UPDATE_SETTINGS', payload: savedSettings });

      // Load history from localStorage (non-encrypted for now)
      const savedHistory = localStorage.getItem('prompt_history');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        // Convert date strings back to Date objects
        const processedHistory = history.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
        processedHistory.forEach((item: HistoryItem) => {
          dispatch({ type: 'ADD_TO_HISTORY', payload: item });
        });
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    try {
      SecureStorage.storeSettings(state.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [state.settings]);

  // Save history when it changes
  useEffect(() => {
    try {
      localStorage.setItem('prompt_history', JSON.stringify(state.history));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }, [state.history]);

  const setResults = useCallback((results: GeneratedResult) => {
    dispatch({ type: 'SET_RESULTS', payload: results });
    
    // Add to history if auto-save is enabled
    if (state.settings.autoSaveResults) {
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        url: results.originalUrl,
        provider: results.metadata.provider,
        prompt: results.generatedPrompt,
        imageData: results.imageData,
        createdAt: new Date(),
      };
      dispatch({ type: 'ADD_TO_HISTORY', payload: historyItem });
    }
  }, [state.settings.autoSaveResults]);

  const clearResults = useCallback(() => {
    dispatch({ type: 'CLEAR_RESULTS' });
  }, []);

  const setLoadingStatus = useCallback((status: LoadingStatus) => {
    dispatch({ type: 'SET_LOADING', payload: status });
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const addToHistory = useCallback((item: HistoryItem) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: item });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FROM_HISTORY', payload: id });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
    localStorage.removeItem('prompt_history');
  }, []);

  const setSupportedPlatforms = useCallback((platforms: Array<{ name: string; domain: string; id: string }>) => {
    dispatch({ type: 'SET_SUPPORTED_PLATFORMS', payload: platforms });
  }, []);

  const setSupportedProviders = useCallback((providers: Array<{ id: string; name: string; model: string }>) => {
    dispatch({ type: 'SET_SUPPORTED_PROVIDERS', payload: providers });
  }, []);

  const storeApiKey = useCallback((provider: string, apiKey: string) => {
    SecureStorage.storeApiKey(provider, apiKey);
    // Update settings with masked key for display
    const apiKeys = { ...state.settings.apiKeys };
    apiKeys[provider as keyof typeof apiKeys] = apiKey;
    updateSettings({ apiKeys });
  }, [state.settings.apiKeys, updateSettings]);

  const getApiKey = useCallback((provider: string): string | undefined => {
    return SecureStorage.getApiKey(provider);
  }, []);

  const removeApiKey = useCallback((provider: string) => {
    SecureStorage.removeApiKey(provider);
    const apiKeys = { ...state.settings.apiKeys };
    delete apiKeys[provider as keyof typeof apiKeys];
    updateSettings({ apiKeys });
  }, [state.settings.apiKeys, updateSettings]);

  const maskApiKey = useCallback((provider: string): string => {
    const apiKey = getApiKey(provider);
    if (!apiKey) return '';
    
    if (apiKey.length < 8) return '****';
    const start = apiKey.substring(0, 8);
    const end = apiKey.substring(apiKey.length - 4);
    const masked = '*'.repeat(Math.max(apiKey.length - 12, 8));
    return `${start}${masked}${end}`;
  }, [getApiKey]);

  const contextValue: AppContextType = {
    state,
    setResults,
    clearResults,
    setLoadingStatus,
    updateSettings,
    addToHistory,
    removeFromHistory,
    clearHistory,
    setSupportedPlatforms,
    setSupportedProviders,
    storeApiKey,
    getApiKey,
    removeApiKey,
    maskApiKey,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};