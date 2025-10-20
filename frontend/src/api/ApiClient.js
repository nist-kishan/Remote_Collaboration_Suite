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

// Request interceptor
ApiClient.interceptors.request.use(
  (config) => {
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: Date.now() };
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
    
    // Performance monitoring
    if (FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING && duration > 5000) {
      console.warn(`⚠️ Slow API response: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
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
