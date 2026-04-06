import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/utils/constants';
import type { User, UserRole, UserStatus } from '../types/index';

/**
 * Auth Store
 * Manages authentication state, user data, and tokens
 */

// Re-export types for convenience
export type { User, UserRole, UserStatus };

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  _hasHydrated: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setHydrated: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,
      _hasHydrated: false,

      // Set user data
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      // Set both tokens (refreshToken stored in httpOnly cookie by backend)
      setTokens: (accessToken, _refreshToken) =>
        set({
          accessToken,
          isAuthenticated: true,
        }),

      // Update access token (used by axios interceptor)
      setAccessToken: (accessToken) =>
        set({
          accessToken,
          isAuthenticated: true,
        }),

      // Logout - clear all auth data AND React Query cache
      logout: () => {
        // 🔒 SECURITY: Clear React Query cache FIRST before clearing state
        // This prevents race conditions where queries might refetch with old token
        if (typeof window !== 'undefined') {
          try {
            // Try to get queryClient from window if already loaded
            const queryClient = (window as any).__REACT_QUERY_CLIENT__;
            if (queryClient) {
              queryClient.clear();
            }
          } catch (error) {
            console.warn('Failed to clear query cache on logout:', error);
          }
        }
        
        // Clear auth state
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
        
        // Also clear localStorage manually to ensure clean state
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(STORAGE_KEYS.AUTH);
          } catch (error) {
            console.warn('Failed to clear localStorage:', error);
          }
        }
      },

      // Update user data (e.g., after profile update)
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      // Set hydrated flag
      setHydrated: () => set({ isHydrated: true }),

      // Set has hydrated flag
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: STORAGE_KEYS.AUTH, // localStorage key
      partialize: (state) => ({
        // Persist user data AND access token for longer sessions
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set hydrated flag after rehydration completes
        state?.setHydrated();
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Selectors for optimized re-renders
 */
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectAccessToken = (state: AuthState) => state.accessToken;
export const selectIsHydrated = (state: AuthState) => state.isHydrated;
export const selectHasHydrated = (state: AuthState) => state._hasHydrated;

/**
 * Hook to ensure store is hydrated before using auth data
 */
export const useAuthStoreHydrated = () => {
  const isHydrated = useAuthStore(selectIsHydrated);
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  
  return {
    isHydrated,
    user: isHydrated ? user : null,
    isAuthenticated: isHydrated ? isAuthenticated : false,
  };
};
