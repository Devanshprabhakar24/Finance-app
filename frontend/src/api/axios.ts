import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/utils/constants';
import { APP_CONFIG } from '@/config/app.config';

/**
 * Axios instance with interceptors for authentication and error handling.
 * Auth is handled via Authorization: Bearer <token> header only.
 * CSRF middleware is disabled on the backend — JWT Bearer auth is CSRF-safe.
 */

const baseURL = APP_CONFIG.URLS.BACKEND;

export const apiClient = axios.create({
  baseURL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // needed for httpOnly refresh-token cookie
});

// Token refresh queue — prevents multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

/**
 * Request Interceptor — attaches Bearer token to every request
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Response Interceptor — handles token refresh and error toasts
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 — try to refresh the access token once
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry auth endpoints (login, verify-otp, etc.)
      if (originalRequest.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        setAccessToken(accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);

        const status = (refreshError as AxiosError).response?.status;
        if (status === 401 || status === 403) {
          clearAuth();
          if (!window.location.pathname.includes('/login')) {
            showToast('warning', 'Session expired. Please login again.');
            window.location.href = '/login';
          }
        } else {
          showToast('warning', 'Connection issue. Please try again.');
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 — insufficient permissions
    if (error.response?.status === 403) {
      showToast('error', "You don't have permission to perform this action");
    }

    // 422 — validation errors (return for form handling)
    if (error.response?.status === 422) {
      const validationErrors = error.response.data as {
        message: string;
        errors?: Record<string, string[]>;
      };
      if (validationErrors.errors) {
        return Promise.reject({ ...error, validationErrors: validationErrors.errors });
      }
    }

    // 500 — server error
    if (error.response?.status === 500) {
      showToast('error', 'Something went wrong. Please try again later.');
    }

    // Network error
    if (!error.response) {
      showToast('error', 'Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

/**
 * Token management helpers — wired to Zustand auth store
 */
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

let getAccessToken = (): string | null => useAuthStore.getState().accessToken;
let setAccessToken = (token: string): void => { useAuthStore.getState().setAccessToken(token); };
let clearAuth = (): void => { useAuthStore.getState().logout(); };
let showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string): void => {
  if (type === 'warning') toast(message, { icon: '⚠️' });
  else if (type === 'info') toast(message, { icon: 'ℹ️' });
  else toast[type](message);
};

export function setTokenHelpers(helpers: {
  getToken: () => string | null;
  setToken: (token: string) => void;
  clearAuth: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}) {
  getAccessToken = helpers.getToken;
  setAccessToken = helpers.setToken;
  clearAuth = helpers.clearAuth;
  showToast = helpers.showToast;
}

export default apiClient;
