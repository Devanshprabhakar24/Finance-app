import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/utils/constants';
import { APP_CONFIG } from '@/config/app.config';

/**
 * Axios instance with interceptors for authentication and error handling
 */

const baseURL = APP_CONFIG.URLS.BACKEND;

// Create axios instance
export const apiClient = axios.create({
  baseURL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for httpOnly cookies (refresh token)
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Request Interceptor
 * Attaches access token and CSRF token to all requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from auth store (will be set up in Step 6)
    const token = getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-mutating requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
      const csrfToken = getCsrfToken();
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles token refresh, errors, and response formatting
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return successful response
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry auth endpoints or CSRF errors to avoid infinite loops
      const errorMessage = (error.response?.data as any)?.message || '';
      if (originalRequest.url?.includes('/auth/') || errorMessage.toLowerCase().includes('csrf')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        // ✅ Manually attach CSRF token — raw axios bypasses the request interceptor
        const csrfCookie = document.cookie.match(/csrfToken=([^;]+)/);
        const csrfHeader = csrfCookie ? { 'X-CSRF-Token': csrfCookie[1] } : {};

        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: csrfHeader,
          }
        );

        const { accessToken } = response.data.data;

        // Update token in store
        setAccessToken(accessToken);

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);

        // Only logout if refresh token is actually invalid
        // Check the actual HTTP status code, not error message
        const status = (refreshError as AxiosError).response?.status;
        if (status === 401 || status === 403) {
          // Actual auth failure - clear auth and redirect to login
          clearAuth();
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            showToast('warning', 'Session expired. Please login again.');
            window.location.href = '/login';
          }
        } else {
          // For network errors or other issues, just show a warning but don't logout
          console.log('Token refresh failed with status:', status);
          showToast('warning', 'Connection issue. Please try again.');
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden - Insufficient permissions
    if (error.response?.status === 403) {
      showToast('error', "You don't have permission to perform this action");
    }

    // Handle 422 Unprocessable Entity - Validation errors
    if (error.response?.status === 422) {
      const validationErrors = error.response.data as {
        message: string;
        errors?: Record<string, string[]>;
      };

      if (validationErrors.errors) {
        // Return validation errors for form handling
        return Promise.reject({
          ...error,
          validationErrors: validationErrors.errors,
        });
      }
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      showToast('error', 'Something went wrong. Please try again later.');
    }

    // Handle network errors
    if (!error.response) {
      showToast('error', 'Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

/**
 * Helper functions for token management
 * Connected to Zustand auth store
 */
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

let getAccessToken = (): string | null => {
  return useAuthStore.getState().accessToken;
};

let setAccessToken = (token: string): void => {
  useAuthStore.getState().setAccessToken(token);
};

let clearAuth = (): void => {
  useAuthStore.getState().logout();
};

let showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string): void => {
  if (type === 'warning') {
    toast(message, { icon: '⚠️' });
  } else if (type === 'info') {
    toast(message, { icon: 'ℹ️' });
  } else {
    toast[type](message);
  }
};

// CSRF token — fetched from backend and stored in memory
// Cannot use document.cookie because the cookie is set on the backend domain (cross-origin)
let csrfTokenMemory: string | null = null;

export async function initCsrfToken(): Promise<void> {
  try {
    const res = await axios.get(`${baseURL}/csrf-token`, { withCredentials: true });
    csrfTokenMemory = res.data?.csrfToken || null;
  } catch {
    csrfTokenMemory = null;
  }
}

// CSRF token helper — reads from memory, falls back to cookie for same-origin dev
let getCsrfToken = (): string | null => {
  if (csrfTokenMemory) return csrfTokenMemory;
  // Fallback: try cookie (works in same-origin / local dev)
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * Export helper to update token management functions
 * Will be called from App.tsx on initialization
 */
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
