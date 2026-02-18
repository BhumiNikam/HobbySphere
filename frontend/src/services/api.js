import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

const requestCache = new Map();
const CACHE_DURATION = 60000;
const pendingRequests = new Map();

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === 'get') {
      const cacheKey = `${config.url}?${JSON.stringify(config.params)}`;
      
      const cached = requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (Cached)',
          headers: {},
          config,
        });
        return config;
      }

      if (pendingRequests.has(cacheKey)) {
        config.adapter = () => pendingRequests.get(cacheKey);
        return config;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = `${response.config.url}?${JSON.stringify(response.config.params)}`;
      requestCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      pendingRequests.delete(cacheKey);
    }
    return response;
  },
  (error) => {
    if (error.config?.method === 'get') {
      const cacheKey = `${error.config.url}?${JSON.stringify(error.config.params)}`;
      pendingRequests.delete(cacheKey);
    }

    // ✅ Auto logout on 401 (expired/invalid token)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const clearCache = (pattern) => {
  if (!pattern) {
    requestCache.clear();
    return;
  }
  
  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key);
    }
  }
};

export default API;