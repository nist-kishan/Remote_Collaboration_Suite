import { testBackendConnection, resetPassword } from '../api/authApi';
import { API_CONFIG } from '../config/environment';

/**
 * Debug utility to test API connections and endpoints
 */
export const debugApiConnection = async () => {
  console.log('🔧 API Debug Information:');
  console.log('Base URL:', API_CONFIG.BASE_URL);
  console.log('Full API URL:', `${API_CONFIG.BASE_URL}/api/v1`);
  console.log('Environment:', import.meta.env.MODE);
  
  try {
    // Test basic connection
    console.log('\n1. Testing basic backend connection...');
    const healthResponse = await testBackendConnection();
    console.log('✅ Backend is reachable:', healthResponse);
    
    // Test reset password endpoint
    console.log('\n2. Testing reset password endpoint...');
    const testData = { email: 'test@example.com' };
    const resetResponse = await resetPassword(testData);
    console.log('✅ Reset password endpoint working:', resetResponse);
    
    return {
      success: true,
      healthResponse,
      resetResponse
    };
  } catch (error) {
    console.error('❌ API Debug failed:', error);
    return {
      success: false,
      error: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`
      }
    };
  }
};

/**
 * Test specific endpoint
 */
export const testEndpoint = async (endpoint, method = 'GET', data = null) => {
  try {
    console.log(`🔍 Testing ${method} ${endpoint}...`);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined
    });
    
    const responseData = await response.json();
    
    console.log(`📥 Response (${response.status}):`, responseData);
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData
    };
  } catch (error) {
    console.error('❌ Endpoint test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Make it available globally for console debugging
if (import.meta.env.DEV) {
  window.debugApi = debugApiConnection;
  window.testEndpoint = testEndpoint;
}
