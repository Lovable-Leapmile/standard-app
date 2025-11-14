const API_BASE_URL_KEY = 'qikpod_api_base_url';

export const saveApiBaseUrl = (url: string): void => {
  localStorage.setItem(API_BASE_URL_KEY, url);
};

export const getApiBaseUrl = (): string | null => {
  return localStorage.getItem(API_BASE_URL_KEY);
};

export const hasApiBaseUrl = (): boolean => {
  return getApiBaseUrl() !== null;
};

export const clearApiBaseUrl = (): void => {
  localStorage.removeItem(API_BASE_URL_KEY);
};
