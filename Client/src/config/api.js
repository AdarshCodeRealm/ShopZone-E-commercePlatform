// API configuration with dynamic base URL
const getApiBaseUrl = () => {
  // Check if we have environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback logic based on environment
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  if (isDevelopment) {
    return 'http://localhost:8000/api/v1';
  } else {
    return 'https://shopzone-e-commerceplatform.onrender.com/api/v1';
  }
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    AUTH: '/auth',
    USERS: '/users',
    PRODUCTS: '/products',
    CART: '/cart',
    ORDERS: '/orders',
    PAYMENTS: '/payments'
  }
};

// Helper function to build full endpoint URLs
export const buildEndpoint = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export default API_CONFIG;