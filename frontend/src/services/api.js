import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000, // ✅ 30s timeout for cold starts
});

// ✅ REQUEST CACHE - prevents duplicate requests
const requestCache = new Map();
const CACHE_DURATION = 60000; // 1 minute

// ✅ REQUEST DEDUPLICATION - prevents multiple identical requests
const pendingRequests = new Map();

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Add cache key for GET requests
    if (config.method === 'get') {
      const cacheKey = `${config.url}?${JSON.stringify(config.params)}`;
      
      // Check cache
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

      // ✅ Deduplicate pending requests
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
    // ✅ Cache successful GET responses
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
    // ✅ Clear failed requests from pending
    if (error.config?.method === 'get') {
      const cacheKey = `${error.config.url}?${JSON.stringify(error.config.params)}`;
      pendingRequests.delete(cacheKey);
    }
    return Promise.reject(error);
  }
);

// ✅ Clear cache function (call after mutations)
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