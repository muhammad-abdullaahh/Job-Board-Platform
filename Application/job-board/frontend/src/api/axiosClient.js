import axios from 'axios';

// Use environment variable VITE_API_URL if provided, else fallback to relative path /api/v1
const rawBaseUrl = import.meta.env.VITE_API_URL;
const baseURL = rawBaseUrl
  ? `${rawBaseUrl.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let inMemoryToken = null;

export const setMemoryToken = (token) => {
  inMemoryToken = token;
};

export const getMemoryToken = () => inMemoryToken;

// Interceptor to attach Bearer token from in-memory state
axiosClient.interceptors.request.use(
  (config) => {
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to automatically handle token refresh on 401 Unauthorized
// and auto-retry idempotent GET requests once on transient network/timeout errors
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 1. Handle 401 Unauthorized token refresh
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const res = await axiosClient.post('/auth/refresh');
        if (res.data && res.data.access_token) {
          const newToken = res.data.access_token;
          setMemoryToken(newToken);
          window.dispatchEvent(new CustomEvent('auth_token_refreshed', { detail: res.data }));
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        setMemoryToken(null);
        window.dispatchEvent(new Event('auth_logout'));
        return Promise.reject(refreshError);
      }
    }

    // 2. Auto-retry idempotent GET requests once on transient errors (network timeout, 502, 503, 504)
    const isGet = (originalRequest.method || 'get').toLowerCase() === 'get';
    const isTransient =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      [502, 503, 504].includes(error.response?.status);

    if (isGet && isTransient && !originalRequest._isRetry) {
      originalRequest._isRetry = true;
      // Brief wait for cold-start or connection stabilization before re-trying
      await new Promise((resolve) => setTimeout(resolve, 750));
      return axiosClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
