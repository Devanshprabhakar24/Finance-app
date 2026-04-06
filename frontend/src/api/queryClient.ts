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
 * 🔒 SECURITY: All query keys MUST include userId to prevent cache collisions between users
 * This ensures User A's cached data is never shown to User B
 */
export const queryKeys = {
  // Auth
  auth: {
    me: (userId: string) => ['auth', 'me', userId] as const,
  },

  // Dashboard - userId required for proper cache scoping
  dashboard: {
    all: (userId: string) => ['dashboard', userId] as const,
    summary: (userId: string, year?: number) => ['dashboard', 'summary', userId, year] as const,
    trends: (userId: string, year?: number) => ['dashboard', 'trends', userId, year] as const,
    categories: (userId: string, year?: number) => ['dashboard', 'categories', userId, year] as const,
    recent: (userId: string) => ['dashboard', 'recent', userId] as const,
  },

  // Records - userId required for proper cache scoping
  records: {
    all: (userId: string) => ['records', userId] as const,
    lists: (userId: string) => ['records', 'list', userId] as const,
    list: (userId: string, filters?: Record<string, unknown>) => ['records', 'list', userId, filters] as const,
    detail: (userId: string, id: string) => ['records', 'detail', userId, id] as const,
  },

  // Users - admin/analyst only, but still scoped by requesting user
  users: {
    all: (userId: string) => ['users', userId] as const,
    lists: (userId: string) => ['users', 'list', userId] as const,
    list: (userId: string, filters?: Record<string, unknown>) => ['users', 'list', userId, filters] as const,
    detail: (userId: string, id: string) => ['users', 'detail', userId, id] as const,
    stats: (userId: string) => ['users', 'stats', userId] as const,
  },

  // Profile - userId required
  profile: {
    me: (userId: string) => ['profile', 'me', userId] as const,
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
