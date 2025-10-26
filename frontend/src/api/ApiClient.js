import axios from "axios";
import { API_CONFIG, LOGGING_CONFIG, FEATURE_FLAGS } from "../config/environment";
import toast from "react-hot-toast";
import { navigateToLogin } from "../utils/navigation";

const ApiClient = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api/v1`,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const skipRefreshEndpoints = [
  "/auth/signin",
  "/auth/signup", 
  "/auth/login",
  "/auth/refresh_token",
];

// Track if user just logged out to prevent showing refresh token errors
let isLoggedOut = false;

// Function to set logout state
export const setLoggedOut = (loggedOut) => {
  isLoggedOut = loggedOut;
  // Reset the flag after a short delay
  if (loggedOut) {
    setTimeout(() => {
      isLoggedOut = false;
    }, 2000);
  }
};

// Endpoints that should skip global error toasts (handled by hooks)
const skipErrorToastEndpoints = [
  "/auth/signin",
  "/auth/signup", 
  "/auth/login",
  "/auth/refresh_token",
  "/auth/logout",
  "/auth/reset_password",
  "/auth/password_change",
  "/auth/password_change_link",
  "/auth/send_otp",
  "/auth/otp_verification",
  "/auth/update-profile",
  "/auth/update_avatar",
  "/auth/theme",
];

// Request deduplication for specific endpoints
const pendingRequests = new Map();

const generateRequestKey = (config) => {
  return `${config.method}_${config.url}_${JSON.stringify(config.params || {})}`;
};

// Request interceptor
ApiClient.interceptors.request.use(
  (config) => {
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: Date.now() };
    
    // Deduplicate requests for /auth/me endpoint
    if (config.url.includes('/auth/me')) {
      const requestKey = generateRequestKey(config);
      
      // If there's already a pending request with the same key, return that promise
      if (pendingRequests.has(requestKey)) {
        const controller = new AbortController();
        config.signal = controller.signal;
        controller.abort('Duplicate request cancelled');
        return config;
      }
      
      // Store this request as pending
      pendingRequests.set(requestKey, true);
      
      // Clean up after request completes
      const cleanup = () => {
        pendingRequests.delete(requestKey);
      };
      
      config.metadata.cleanup = cleanup;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling
ApiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - response.config.metadata.startTime;
    
    // Clean up pending request tracking
    if (response.config.metadata?.cleanup) {
      response.config.metadata.cleanup();
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Clean up pending request tracking on error
    if (originalRequest?.metadata?.cleanup) {
      originalRequest.metadata.cleanup();
    }

    // Handle network errors
    if (!error.response) {
      // Skip errors from aborted/cancelled requests (deduplication)
      if (error.code === 'ERR_CANCELED' || 
          error.message?.includes('cancelled') || 
          error.message?.includes('aborted')) {
        return Promise.reject(error);
      }
      
      // Only show network error toast if no specific error message is available
      const message = error?.message;
      if (message) {
        toast.error(message);
      }
      return Promise.reject(error);
    }

    // Handle authentication errors
    if (skipRefreshEndpoints.some((url) => originalRequest.url.includes(url))) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.get(
          `${API_CONFIG.BASE_URL}/api/v1/auth/refresh_token`,
          { withCredentials: true }
        );
        return ApiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (refreshError.response?.status === 401) {
          // Don't show error if user just logged out
          if (!isLoggedOut) {
            const message = refreshError.response?.data?.message || 'Session expired. Please log in again.';
            toast.error(message);
            // Redirect to login page using navigation utility
            navigateToLogin();
          }
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle rate limiting (429) errors
    if (error.response?.status === 429) {
      // Don't show toast for rate limit errors on /auth/me - they're handled by query config
      if (!originalRequest.url.includes('/auth/me')) {
        toast.error('Too many requests. Please slow down and try again.');
      }
      return Promise.reject(error);
    }

    // Handle other HTTP errors
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    // Skip error toasts for authentication endpoints (handled by hooks)
    const shouldSkipToast = skipErrorToastEndpoints.some((url) => originalRequest.url.includes(url));
    
    if (!shouldSkipToast) {
      // Only show toast if there's a message from the backend
      if (message) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

export default ApiClient;
