const API_BASE_URL_KEY = 'qikpod_api_base_url';

export const saveApiBaseUrl = (url: string): void => {
  localStorage.setItem(API_BASE_URL_KEY, url);
};

export const getApiBaseUrl = (): string | null => {
  // First check localStorage
  const storedUrl = localStorage.getItem(API_BASE_URL_KEY);
  if (storedUrl) return storedUrl;
  
  // Fallback to environment variable if in production
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  
  return null;
};

export const hasApiBaseUrl = (): boolean => {
  return getApiBaseUrl() !== null;
};

export const clearApiBaseUrl = (): void => {
  localStorage.removeItem(API_BASE_URL_KEY);
};
