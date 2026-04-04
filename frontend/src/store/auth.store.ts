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

  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,

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
        }),

      // Update access token (used by axios interceptor)
      setAccessToken: (accessToken) =>
        set({
          accessToken,
        }),

      // Logout - clear all auth data
      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),

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
    }),
    {
      name: STORAGE_KEYS.AUTH, // localStorage key
      partialize: (state) => ({
        // Only persist user data, NOT the access token (security)
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set hydrated flag after rehydration completes
        state?.setHydrated();
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
