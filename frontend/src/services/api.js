import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const apiRequest = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiRequest.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401 responses
apiRequest.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/auth/refresh`,
            { refreshToken }
          );

          const { token } = response.data.data;
          localStorage.setItem('token', token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiRequest(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor for logging
apiRequest.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiRequest.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error);
    
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout - please try again');
    } else if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          toast.error(data.error || 'Invalid request');
          break;
        case 401:
          toast.error('Unauthorized access');
          break;
        case 403:
          toast.error('Access forbidden');
          break;
        case 404:
          toast.error(data.error || 'Resource not found');
          break;
        case 429:
          toast.error('Too many requests - please wait');
          break;
        case 500:
          toast.error('Server error - please try again');
          break;
        default:
          toast.error(data.error || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error - check your connection');
    } else {
      // Other error
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Export apiRequest as named export for other services
export { apiRequest };

// API helper functions
export const api = {
  get: (url, config = {}) => apiRequest.get(url, config),
  post: (url, data = {}, config = {}) => apiRequest.post(url, data, config),
  put: (url, data = {}, config = {}) => apiRequest.put(url, data, config),
  delete: (url, config = {}) => apiRequest.delete(url, config),
};

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await apiRequest.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('API health check failed');
  }
};

// Error handling utility
export const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);
  
  if (customMessage) {
    toast.error(customMessage);
    return customMessage;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export default apiRequest;
