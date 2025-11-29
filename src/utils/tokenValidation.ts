// Token validation utilities

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

/**
 * Checks if the stored auth token has expired (1 week since login)
 * @returns true if token is valid and not expired, false otherwise
 */
export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('auth_token');
  const timestamp = localStorage.getItem('auth_token_timestamp');
  
  if (!token || !timestamp) {
    return false;
  }
  
  const loginTime = parseInt(timestamp, 10);
  const currentTime = Date.now();
  const timeDifference = currentTime - loginTime;
  
  // Check if more than 1 week has passed
  if (timeDifference > ONE_WEEK_IN_MS) {
    // Token has expired, clear it
    clearAuthToken();
    return false;
  }
  
  return true;
};

/**
 * Clears the authentication token and related data
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_token_timestamp');
  localStorage.removeItem('qikpod_user');
};

/**
 * Gets the remaining time until token expiry in milliseconds
 * @returns remaining time in ms, or 0 if expired/invalid
 */
export const getRemainingTokenTime = (): number => {
  const timestamp = localStorage.getItem('auth_token_timestamp');
  
  if (!timestamp) {
    return 0;
  }
  
  const loginTime = parseInt(timestamp, 10);
  const currentTime = Date.now();
  const timeDifference = currentTime - loginTime;
  const remaining = ONE_WEEK_IN_MS - timeDifference;
  
  return remaining > 0 ? remaining : 0;
};
