import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/api/queryClient';
import { setTokenHelpers } from '@/api/axios';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore, initializeTheme } from '@/store/ui.store';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import toast from 'react-hot-toast';

// Lazy load pages
const LandingPage = lazy(() => import('@/pages/auth/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const RegisterCompletePage = lazy(() => import('@/pages/auth/RegisterCompletePage'));
const VerifyOtpPage = lazy(() => import('@/pages/auth/VerifyOtpPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const RecordsPage = lazy(() => import('@/pages/RecordsPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'));

// Loading component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  // Initialize on mount
  useEffect(() => {
    // Initialize theme
    initializeTheme();

    // Connect axios to auth store
    setTokenHelpers({
      getToken: () => useAuthStore.getState().accessToken,
      setToken: (token) => useAuthStore.getState().setAccessToken(token),
      clearAuth: () => useAuthStore.getState().logout(),
      showToast: (type, message) => {
        if (type === 'warning') {
          toast(message, { icon: '⚠️' });
        } else if (type === 'info') {
          toast(message, { icon: 'ℹ️' });
        } else {
          toast[type](message);
        }
      },
    });
  }, []);

  // Show loader while hydrating from localStorage
  if (!isHydrated) {
    return <PageLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing page - default route for non-authenticated users */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
            />
            
            {/* Public routes */}
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
            />
            <Route
              path="/register/complete"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterCompletePage />}
            />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route
              path="/auth/forgot-password"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
            />
            <Route
              path="/auth/reset-password"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route
                path="records"
                element={
                  <ProtectedRoute requiredPermission="view:records">
                    <RecordsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="analytics"
                element={
                  <ProtectedRoute requiredPermission="view:analytics">
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredPermission="view:users">
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Error pages */}
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="/404" element={<NotFoundPage />} />

            {/* 404 catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
