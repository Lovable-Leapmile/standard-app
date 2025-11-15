const API_BASE_URL_KEY = 'qikpod_api_base_url';

export const saveApiBaseUrl = (url: string): void => {
  localStorage.setItem(API_BASE_URL_KEY, url);
};

export const getApiBaseUrl = (): string | null => {
  const environment = import.meta.env.VITE_ENVIRONMENT;
  
  console.log("LOADED ENV:", environment);
  
  // In production: ALWAYS use the env variable
  if (environment === 'production') {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    console.log("Production mode - using env URL:", envUrl);
    return envUrl || null;
  }
  
  // In staging: ONLY use localStorage (from popup)
  const storedUrl = localStorage.getItem(API_BASE_URL_KEY);
  console.log("Staging mode - using stored URL:", storedUrl);
  return storedUrl;
};

export const hasApiBaseUrl = (): boolean => {
  return getApiBaseUrl() !== null;
};

export const clearApiBaseUrl = (): void => {
  localStorage.removeItem(API_BASE_URL_KEY);
};
