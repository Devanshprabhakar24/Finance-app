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
  
  // Keep ref updated with latest token
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    if (!isHydrated || !accessToken) return;

    const validateToken = async () => {
      try {
        // Decode token to check expiration
        const decoded = decodeJWT(accessToken);
        if (!decoded || !decoded.exp) {
          logout();
          return;
        }

        const currentTime = Date.now() / 1000;

        // If token expires in less than 5 minutes, refresh it
        if (decoded.exp - currentTime < 300) {
          console.log('Token expiring soon, refreshing...');
          
          try {
            const response = await refreshToken();
            setAccessToken(response.data.accessToken);
            console.log('Token refreshed successfully');
          } catch (error) {
            // Don't logout on refresh failure - let axios interceptor handle it
            // Only logout if token is actually expired/invalid
            const currentDecoded = decodeJWT(accessToken);
            const now = Date.now() / 1000;
            if (!currentDecoded || currentDecoded.exp < now) {
              console.log('Token genuinely expired, logging out');
              logout();
            } else {
              console.log('Token refresh failed but token still valid, continuing');
            }
          }
        }
      } catch (error) {
        // Invalid token format, clear it
        console.log('Invalid token format, clearing auth');
        logout();
      }
    };

    validateToken();
  }, [accessToken, setAccessToken, logout, isHydrated]);

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
            setAccessToken(response.data.accessToken);
            console.log('Token refreshed automatically');
          } catch (error) {
            // Don't logout on refresh failure - let axios interceptor handle it
            // Only logout if token is actually expired/invalid
            const currentDecoded = decodeJWT(token);
            const now = Date.now() / 1000;
            if (!currentDecoded || currentDecoded.exp < now) {
              logout(); // Token is genuinely expired
            }
            // Otherwise silently fail — axios interceptor will handle 401s
          }
        }
      } catch (error) {
        console.log('Automatic token refresh failed');
        // Don't logout on automatic refresh failure, let the axios interceptor handle it
      }
    }, 20 * 60 * 1000); // Every 20 minutes

    return () => clearInterval(interval);
  }, [isHydrated, setAccessToken, logout]); // Stable dependencies - no accessToken
};