import { User } from "@/types";

// POD name extraction and storage from URL
export const extractPodNameFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  
  if (id && id.startsWith('POD-')) {
    const podName = id.substring(4); // Remove 'POD-' prefix
    localStorage.setItem('qikpod_pod_name', podName);
    return podName;
  }
  
  return null;
};

export const getPodName = (): string | null => {
  return localStorage.getItem('qikpod_pod_name');
};

export const clearPodName = (): void => {
  localStorage.removeItem('qikpod_pod_name');
};

// Legacy POD extraction (keeping for compatibility)
export const extractPodFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  
  if (id && id.startsWith('POD-')) {
    const podValue = id.substring(4); // Remove 'POD-' prefix
    localStorage.setItem('qikpod_pod_value', podValue);
    return podValue;
  }
  
  return null;
};

export const getPodValue = (): string | null => {
  return localStorage.getItem('qikpod_pod_value');
};

export const clearPodValue = (): void => {
  localStorage.removeItem('qikpod_pod_value');
};

// User data storage
export const saveUserData = (user: User): void => {
  localStorage.setItem('qikpod_user', JSON.stringify(user));
};

export const setUserData = saveUserData; // Alias for consistency

export const getUserData = (): User | null => {
  const userData = localStorage.getItem('qikpod_user');
  return userData ? JSON.parse(userData) : null;
};

export const clearUserData = (): void => {
  localStorage.removeItem('qikpod_user');
};

export const isLoggedIn = (): boolean => {
  return getUserData() !== null;
};

// Location storage
export const saveLastLocation = (locationName: string): void => {
  localStorage.setItem('qikpod_last_location', locationName);
};

export const getLastLocation = (): string | null => {
  return localStorage.getItem('qikpod_last_location');
};

// Location ID storage
export const saveLocationId = (locationId: string): void => {
  localStorage.setItem('current_location_id', locationId);
};

export const getLocationId = (): string | null => {
  return localStorage.getItem('current_location_id');
};

// Location name storage
export const saveLocationName = (locationName: string): void => {
  localStorage.setItem('current_location_name', locationName);
};

export const getLocationName = (): string | null => {
  return localStorage.getItem('current_location_name');
};

// Save both location ID and name together
export const saveLocation = (locationId: string, locationName: string): void => {
  saveLocationId(locationId);
  saveLocationName(locationName);
};