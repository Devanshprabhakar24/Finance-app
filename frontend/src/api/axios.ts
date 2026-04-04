import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/utils/constants';

/**
 * Axios instance with interceptors for authentication and error handling
 */

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
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

        // Refresh failed - clear auth and redirect to login
        clearAuth();
        window.location.href = '/login';

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

// CSRF token helper
let getCsrfToken = (): string | null => {
  // Read CSRF token from cookie
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
