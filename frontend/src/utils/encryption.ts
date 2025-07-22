import CryptoJS from 'crypto-js';

// Use a combination of browser-specific data for encryption key
const getEncryptionKey = (): string => {
  const browserFingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    'stock-photo-ai-v1'
  ].join('|');
  
  return CryptoJS.SHA256(browserFingerprint).toString();
};

export const encryptApiKey = (apiKey: string): string => {
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(apiKey, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt API key');
  }
};

export const decryptApiKey = (encryptedApiKey: string): string => {
  try {
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedApiKey, key);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Decryption resulted in empty string');
    }
    
    return decryptedString;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt API key');
  }
};

export const validateApiKey = (provider: string, apiKey: string): boolean => {
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  // More liberal patterns for better compatibility
  const patterns = {
    openai: /^sk-[a-zA-Z0-9\-_\.]{10,}$/,  // More flexible for all OpenAI formats
    gemini: /^[A-Za-z0-9_-]{10,}$/,
    claude: /^sk-ant-[A-Za-z0-9_-]{10,}$/
  };

  const pattern = patterns[provider as keyof typeof patterns];
  if (!pattern) return false;

  return pattern.test(apiKey.trim());
};

export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) return '****';
  
  const start = apiKey.substring(0, 8);
  const end = apiKey.substring(apiKey.length - 4);
  const masked = '*'.repeat(Math.max(apiKey.length - 12, 8));
  
  return `${start}${masked}${end}`;
};

// Storage utilities with encryption
export const storeEncryptedData = (key: string, data: any): void => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = encryptApiKey(jsonString);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Failed to store encrypted data:', error);
  }
};

export const getEncryptedData = <T>(key: string, defaultValue: T): T => {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return defaultValue;
    
    const decrypted = decryptApiKey(encrypted);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error('Failed to get encrypted data:', error);
    return defaultValue;
  }
};

export const removeEncryptedData = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove encrypted data:', error);
  }
};

// Secure API key management
export class SecureStorage {
  private static readonly API_KEYS_KEY = 'encrypted_api_keys';
  private static readonly SETTINGS_KEY = 'encrypted_settings';
  
  static storeApiKey(provider: string, apiKey: string): void {
    const apiKeys = this.getApiKeys();
    apiKeys[provider] = apiKey;
    storeEncryptedData(this.API_KEYS_KEY, apiKeys);
  }
  
  static getApiKey(provider: string): string | undefined {
    const apiKeys = this.getApiKeys();
    return apiKeys[provider];
  }
  
  static getApiKeys(): Record<string, string> {
    return getEncryptedData(this.API_KEYS_KEY, {});
  }
  
  static removeApiKey(provider: string): void {
    const apiKeys = this.getApiKeys();
    delete apiKeys[provider];
    storeEncryptedData(this.API_KEYS_KEY, apiKeys);
  }
  
  static clearAllApiKeys(): void {
    removeEncryptedData(this.API_KEYS_KEY);
  }
  
  static storeSettings(settings: any): void {
    storeEncryptedData(this.SETTINGS_KEY, settings);
  }
  
  static getSettings<T>(defaultSettings: T): T {
    return getEncryptedData(this.SETTINGS_KEY, defaultSettings);
  }
  
  static clearSettings(): void {
    removeEncryptedData(this.SETTINGS_KEY);
  }
}