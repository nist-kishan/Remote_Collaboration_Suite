/**
 * Environment Configuration
 * Handles environment variables with fallbacks and validation
 */

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const mode = import.meta.env.MODE;

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
};

// WebSocket Configuration
export const SOCKET_CONFIG = {
  URL: import.meta.env.VITE_SOCKET_URL || API_CONFIG.BASE_URL,
  RECONNECTION_ATTEMPTS: parseInt(import.meta.env.VITE_SOCKET_RECONNECTION_ATTEMPTS) || 5,
  RECONNECTION_DELAY: parseInt(import.meta.env.VITE_SOCKET_RECONNECTION_DELAY) || 1000,
};

// Application Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Remote Work Collaboration Suite',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'Real-time collaboration platform for remote teams',
  AUTHOR: import.meta.env.VITE_APP_AUTHOR || 'Your Name',
  CONTACT_EMAIL: import.meta.env.VITE_APP_CONTACT_EMAIL || 'contact@example.com',
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG_MODE: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
  ENABLE_PERFORMANCE_MONITORING: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
  ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: parseInt(import.meta.env.VITE_DEBOUNCE_DELAY) || 300,
  THROTTLE_DELAY: parseInt(import.meta.env.VITE_THROTTLE_DELAY) || 100,
  CACHE_DURATION: parseInt(import.meta.env.VITE_CACHE_DURATION) || 5 * 60 * 1000, // 5 minutes
};

// Security Configuration
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24 hours
  MAX_LOGIN_ATTEMPTS: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
  PASSWORD_MIN_LENGTH: parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH) || 8,
};

// Logging Configuration
export const LOGGING_CONFIG = {
  LEVEL: import.meta.env.VITE_LOG_LEVEL || (isProduction ? 'error' : 'debug'),
  ENABLE_CONSOLE_LOGS: import.meta.env.VITE_ENABLE_CONSOLE_LOGS !== 'false',
  ENABLE_REMOTE_LOGGING: import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true',
};

// Third-party Services
export const SERVICES_CONFIG = {
  GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  HOTJAR_ID: import.meta.env.VITE_HOTJAR_ID,
};

// Environment validation
export const validateEnvironment = () => {
  const errors = [];
  
  // Check required environment variables
  if (!API_CONFIG.BASE_URL) {
    errors.push('VITE_API_BASE_URL is required');
  }
  
  // Validate URLs
  try {
    new URL(API_CONFIG.BASE_URL);
  } catch {
    errors.push('VITE_API_BASE_URL must be a valid URL');
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:', errors);
    if (isProduction) {
      throw new Error('Environment validation failed');
    }
  }
  
  return errors.length === 0;
};

// Initialize environment validation
if (isProduction) {
  validateEnvironment();
}

// Development helpers
if (isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    mode,
    API_CONFIG,
    SOCKET_CONFIG,
    APP_CONFIG,
    FEATURE_FLAGS,
  });
}

// Export all configuration
export default {
  isDevelopment,
  isProduction,
  mode,
  API_CONFIG,
  SOCKET_CONFIG,
  APP_CONFIG,
  FEATURE_FLAGS,
  UPLOAD_CONFIG,
  PERFORMANCE_CONFIG,
  SECURITY_CONFIG,
  LOGGING_CONFIG,
  SERVICES_CONFIG,
  validateEnvironment,
};
