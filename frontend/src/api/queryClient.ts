import { QueryClient } from '@tanstack/react-query';
import { API_CONFIG } from '@/utils/constants';

/**
 * React Query Client Configuration
 * Centralized configuration for all queries and mutations
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh (5 minutes for better performance)
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time - how long unused data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed requests
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 1;
      },

      // Refetch on window focus (disabled for better performance)
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 0, // Don't retry mutations by default
    },
  },
});

// 🔒 SECURITY: Make queryClient globally accessible for logout function
// This allows synchronous cache clearing to prevent data leakage
if (typeof window !== 'undefined') {
  (window as any).__REACT_QUERY_CLIENT__ = queryClient;
}

/**
 * Query Keys Factory
 * Centralized query key management for better cache control
 */
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    summary: (year?: number) => ['dashboard', 'summary', year] as const,
    trends: (year?: number) => ['dashboard', 'trends', year] as const,
    categories: (year?: number) => ['dashboard', 'categories', year] as const,
    recent: () => ['dashboard', 'recent'] as const,
  },

  // Records
  records: {
    all: ['records'] as const,
    lists: () => ['records', 'list'] as const,
    list: (filters?: Record<string, unknown>) => ['records', 'list', filters] as const,
    detail: (id: string) => ['records', 'detail', id] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (filters?: Record<string, unknown>) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    stats: () => ['users', 'stats'] as const,
  },

  // Profile
  profile: {
    me: ['profile', 'me'] as const,
  },
} as const;

/**
 * Helper to invalidate related queries
 */
export const invalidateQueries = {
  dashboard: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  },
  records: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.records.all });
  },
  users: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },
  all: () => {
    queryClient.invalidateQueries();
  },
};
