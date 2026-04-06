import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { refreshToken } from '@/api/auth.api';

/**
 * Simple JWT decoder without external dependencies
 */
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

/**
 * Hook to validate and refresh tokens on app startup
 * Prevents automatic logout due to expired tokens
 */
export const useTokenValidation = () => {
  const { accessToken, setAccessToken, logout, isHydrated } = useAuthStore();
  
  // Fix: Use ref to avoid memory leaks from interval recreation
  const tokenRef = useRef(accessToken);
  
  // Fix: Stabilize function references to prevent stale closures
  const logoutRef = useRef(logout);
  const setAccessTokenRef = useRef(setAccessToken);
  
  // Keep refs updated with latest values
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  useEffect(() => {
    setAccessTokenRef.current = setAccessToken;
  }, [setAccessToken]);

  useEffect(() => {
    if (!isHydrated || !accessToken) return;

    const validateToken = async () => {
      try {
        // Decode token to check expiration
        const decoded = decodeJWT(accessToken);
        if (!decoded || !decoded.exp) {
          logoutRef.current();
          return;
        }

        const currentTime = Date.now() / 1000;

        // If token expires in less than 5 minutes, refresh it
        if (decoded.exp - currentTime < 300) {
          console.log('Token expiring soon, refreshing...');
          
          try {
            const response = await refreshToken();
            setAccessTokenRef.current(response.data.accessToken);
            console.log('Token refreshed successfully');
          } catch (error) {
            // Only logout if token is actually expired
            const decoded = decodeJWT(accessToken);
            const isExpired = !decoded || decoded.exp < Date.now() / 1000;
            if (isExpired) logoutRef.current();
            // Otherwise do nothing — axios will handle 401s naturally
          }
        }
      } catch (error) {
        // Only logout if token is actually expired, not on network/parsing errors
        const decoded = decodeJWT(accessToken);
        const isExpired = !decoded || decoded.exp < Date.now() / 1000;
        if (isExpired) {
          console.log('Token expired or invalid, clearing auth');
          logoutRef.current();
        } else {
          console.log('Token validation error but token still valid, continuing');
        }
      }
    };

    validateToken();
  }, [accessToken, isHydrated]);

  // Set up periodic token refresh (every 20 minutes) - stable interval
  useEffect(() => {
    if (!isHydrated) return;

    const interval = setInterval(async () => {
      const token = tokenRef.current; // Always reads latest token
      if (!token) return;

      try {
        const decoded = decodeJWT(token);
        if (!decoded || !decoded.exp) return;

        const currentTime = Date.now() / 1000;

        // Refresh if token expires in less than 30 minutes
        if (decoded.exp - currentTime < 1800) {
          try {
            const response = await refreshToken();
            setAccessTokenRef.current(response.data.accessToken);
            console.log('Token refreshed automatically');
          } catch (error) {
            // Only logout if token is actually expired
            const decoded = decodeJWT(token);
            const isExpired = !decoded || decoded.exp < Date.now() / 1000;
            if (isExpired) logoutRef.current();
            // Otherwise do nothing — axios will handle 401s naturally
          }
        }
      } catch (error) {
        console.log('Automatic token refresh failed');
        // Don't logout on automatic refresh failure, let the axios interceptor handle it
      }
    }, 20 * 60 * 1000); // Every 20 minutes

    return () => clearInterval(interval);
  }, [isHydrated]); // Stable dependencies - no accessToken, setAccessToken, logout
};