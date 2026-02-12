import axios from 'axios';

// Set default base URL for all axios requests
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

// Enable cookies to be sent with requests
axios.defaults.withCredentials = true;

// REQUEST INTERCEPTOR - Adds token to every request automatically
axios.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR - Handle 401 errors globally
axios.interceptors.response.use(
  (response) => {
    // If request is successful, just return the response
    return response;
  },
  (error) => {
    // If we get 401 Unauthorized, token is invalid/expired
    if (error.response?.status === 401) {
      // Remove invalid token
      localStorage.removeItem('accessToken');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default axios;