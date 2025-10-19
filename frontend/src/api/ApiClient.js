import axios from "axios";
import { API_CONFIG, LOGGING_CONFIG, FEATURE_FLAGS } from "../config/environment";
import toast from "react-hot-toast";

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
  "/auth/refresh_token",
];

// Request interceptor
ApiClient.interceptors.request.use(
  (config) => {
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: Date.now() };
    
    // Log requests in development
    if (LOGGING_CONFIG.ENABLE_CONSOLE_LOGS && import.meta.env.DEV) {
      console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling
ApiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - response.config.metadata.startTime;
    
    // Log successful responses in development
    if (LOGGING_CONFIG.ENABLE_CONSOLE_LOGS && import.meta.env.DEV) {
      console.log(`📥 API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, response.data);
    }
    
    // Performance monitoring
    if (FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING && duration > 5000) {
      console.warn(`⚠️ Slow API response: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Calculate request duration
    const duration = originalRequest?.metadata ? Date.now() - originalRequest.metadata.startTime : 0;
    
    // Log errors
    if (LOGGING_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.error(`📥 API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} (${duration}ms)`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
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
          toast.error('Session expired. Please log in again.');
          // Clear any stored auth data
          localStorage.removeItem('user');
          // Redirect to login page
          window.location.href = '/auth/signin';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other HTTP errors
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    switch (status) {
      case 400:
        toast.error(message || 'Bad request. Please check your input.');
        break;
      case 403:
        toast.error('Access denied. You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('Resource not found.');
        break;
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        if (message) {
          toast.error(message);
        }
    }

    return Promise.reject(error);
  }
);

export default ApiClient;
