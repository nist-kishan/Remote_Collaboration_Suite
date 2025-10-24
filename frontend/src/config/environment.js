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
  TIMEOUT: parseInt(import.meta.env.VITE_SOCKET_TIMEOUT) || 20000,
  TRANSPORTS: import.meta.env.VITE_SOCKET_TRANSPORTS?.split(',') || ['websocket', 'polling'],
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
  ENABLE_HOT_RELOAD: import.meta.env.VITE_ENABLE_HOT_RELOAD === 'true',
  ENABLE_SOURCE_MAPS: import.meta.env.VITE_ENABLE_SOURCE_MAPS === 'true',
  
  // Chat features
  ENABLE_CHAT: import.meta.env.VITE_ENABLE_CHAT !== 'false',
  ENABLE_CHAT_NOTIFICATIONS: import.meta.env.VITE_ENABLE_CHAT_NOTIFICATIONS !== 'false',
  ENABLE_CHAT_TYPING_INDICATOR: import.meta.env.VITE_ENABLE_CHAT_TYPING_INDICATOR !== 'false',
  ENABLE_CHAT_MESSAGE_STATUS: import.meta.env.VITE_ENABLE_CHAT_MESSAGE_STATUS !== 'false',
  
  // Video call features
  ENABLE_VIDEO_CALLS: import.meta.env.VITE_ENABLE_VIDEO_CALLS !== 'false',
  ENABLE_SCREEN_SHARING: import.meta.env.VITE_ENABLE_SCREEN_SHARING !== 'false',
  ENABLE_CALL_RECORDING: import.meta.env.VITE_ENABLE_CALL_RECORDING === 'true',
  
  // Document features
  ENABLE_DOCUMENT_EDITING: import.meta.env.VITE_ENABLE_DOCUMENT_EDITING !== 'false',
  ENABLE_DOCUMENT_COLLABORATION: import.meta.env.VITE_ENABLE_DOCUMENT_COLLABORATION !== 'false',
  ENABLE_DOCUMENT_VERSIONING: import.meta.env.VITE_ENABLE_DOCUMENT_VERSIONING !== 'false',
  
  // Whiteboard features
  ENABLE_WHITEBOARD: import.meta.env.VITE_ENABLE_WHITEBOARD !== 'false',
  ENABLE_WHITEBOARD_COLLABORATION: import.meta.env.VITE_ENABLE_WHITEBOARD_COLLABORATION !== 'false',
  
  // Project management features
  ENABLE_PROJECT_MANAGEMENT: import.meta.env.VITE_ENABLE_PROJECT_MANAGEMENT !== 'false',
  ENABLE_TASK_MANAGEMENT: import.meta.env.VITE_ENABLE_TASK_MANAGEMENT !== 'false',
  ENABLE_KANBAN_BOARD: import.meta.env.VITE_ENABLE_KANBAN_BOARD !== 'false',
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

// WebRTC Configuration
export const WEBRTC_CONFIG = {
  ICE_SERVERS: import.meta.env.VITE_WEBRTC_ICE_SERVERS?.split(',') || [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302'
  ],
  CONFIGURATION: import.meta.env.VITE_WEBRTC_CONFIGURATION || '{}',
};

// Call Configuration
export const CALL_CONFIG = {
  TIMEOUT_MS: parseInt(import.meta.env.VITE_CALL_TIMEOUT_MS) || 45000,
  MAX_PARTICIPANTS: parseInt(import.meta.env.VITE_CALL_MAX_PARTICIPANTS) || 10,
  SCREEN_SHARING_ENABLED: import.meta.env.VITE_CALL_SCREEN_SHARING_ENABLED !== 'false',
};

// Real-time Configuration
export const REALTIME_CONFIG = {
  UPDATE_INTERVAL: parseInt(import.meta.env.VITE_REALTIME_UPDATE_INTERVAL) || 1000,
  TYPING_INDICATOR_TIMEOUT: parseInt(import.meta.env.VITE_TYPING_INDICATOR_TIMEOUT) || 3000,
  PRESENCE_UPDATE_INTERVAL: parseInt(import.meta.env.VITE_PRESENCE_UPDATE_INTERVAL) || 30000,
};

// UI/UX Configuration
export const UI_CONFIG = {
  DEFAULT_THEME: import.meta.env.VITE_DEFAULT_THEME || 'light',
  ENABLE_DARK_MODE: import.meta.env.VITE_ENABLE_DARK_MODE !== 'false',
  ENABLE_THEME_PERSISTENCE: import.meta.env.VITE_ENABLE_THEME_PERSISTENCE !== 'false',
  DEFAULT_LANGUAGE: import.meta.env.VITE_DEFAULT_LANGUAGE || 'en',
  ENABLE_I18N: import.meta.env.VITE_ENABLE_I18N !== 'false',
  SUPPORTED_LANGUAGES: import.meta.env.VITE_SUPPORTED_LANGUAGES?.split(',') || ['en'],
  ENABLE_ANIMATIONS: import.meta.env.VITE_ENABLE_ANIMATIONS !== 'false',
  ANIMATION_DURATION: parseInt(import.meta.env.VITE_ANIMATION_DURATION) || 300,
  REDUCED_MOTION: import.meta.env.VITE_REDUCED_MOTION === 'true',
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  ENABLE_BROWSER_NOTIFICATIONS: import.meta.env.VITE_ENABLE_BROWSER_NOTIFICATIONS !== 'false',
  PERMISSION_REQUEST: import.meta.env.VITE_NOTIFICATION_PERMISSION_REQUEST !== 'false',
  SOUND_ENABLED: import.meta.env.VITE_NOTIFICATION_SOUND_ENABLED !== 'false',
  VIBRATION_ENABLED: import.meta.env.VITE_NOTIFICATION_VIBRATION_ENABLED !== 'false',
  PUSH_NOTIFICATIONS_ENABLED: import.meta.env.VITE_PUSH_NOTIFICATIONS_ENABLED === 'true',
  PUSH_VAPID_PUBLIC_KEY: import.meta.env.VITE_PUSH_VAPID_PUBLIC_KEY,
};

// Third-party Services
export const SERVICES_CONFIG = {
  GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  GOOGLE_TAG_MANAGER_ID: import.meta.env.VITE_GOOGLE_TAG_MANAGER_ID,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  HOTJAR_ID: import.meta.env.VITE_HOTJAR_ID,
  MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN,
  
  // Social login providers
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID,
  MICROSOFT_CLIENT_ID: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
  GITHUB_CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID,
  
  // Payment providers
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  PAYPAL_CLIENT_ID: import.meta.env.VITE_PAYPAL_CLIENT_ID,
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
  WEBRTC_CONFIG,
  CALL_CONFIG,
  REALTIME_CONFIG,
  UI_CONFIG,
  NOTIFICATION_CONFIG,
  SERVICES_CONFIG,
  validateEnvironment,
};
