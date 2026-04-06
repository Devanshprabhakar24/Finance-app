import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { setTokenHelpers, initCsrfToken } from '@/api/axios';
import { useAuthStore, selectHasHydrated } from '@/store/auth.store';
import { initializeTheme } from '@/store/ui.store';
import { useTokenValidation } from '@/hooks/useTokenValidation';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthPageSkeleton } from '@/components/loading/AuthPageSkeleton';
import { DashboardPageSkeleton } from '@/components/loading/DashboardPageSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
  const _hasHydrated = useAuthStore(selectHasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize token validation to prevent automatic logout
  useTokenValidation();

  // Initialize on mount - MUST be before any conditional returns
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

    // ✅ Fetch CSRF token from backend and store in memory (cross-origin safe)
    initCsrfToken();
  }, []);

  // Show loading spinner until store is hydrated
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ErrorBoundary>
        <Suspense fallback={<AuthPageSkeleton />}>
          <Routes>
          {/* Auth routes — light skeleton */}
          <Route 
            path="/" 
            element={
              <Suspense fallback={<AuthPageSkeleton />}>
                {isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
              </Suspense>
            } 
          />
          
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<AuthPageSkeleton />}>
                {isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
              </Suspense>
            }
          />
          <Route
            path="/register"
            element={
              <Suspense fallback={<AuthPageSkeleton />}>
                {isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
              </Suspense>
            }
          />
          <Route
            path="/register/complete"
            element={
              <Suspense fallback={<AuthPageSkeleton />}>
                {isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterCompletePage />}
              </Suspense>
            }
          />
          <Route 
            path="/verify-otp" 
            element={
              <Suspense fallback={<AuthPageSkeleton />}>
                <VerifyOtpPage />
              </Suspense>
            } 
          />
          <Route
            path="/auth/forgot-password"
            element={
              <Suspense fallback={<AuthPageSkeleton />}>
                {isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
              </Suspense>
            }
          />
          <Route
            path="/auth/reset-password"
            element={
              <Suspense fallback={<AuthPageSkeleton />}>
                {isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
              </Suspense>
            }
          />

          {/* Dashboard routes — layout-aware skeleton */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route 
              index 
              element={
                <Suspense fallback={<DashboardPageSkeleton />}>
                  <DashboardPage />
                </Suspense>
              } 
            />
            <Route
              path="records"
              element={
                <ProtectedRoute requiredPermission="view:records">
                  <Suspense fallback={<DashboardPageSkeleton />}>
                    <RecordsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <ProtectedRoute requiredPermission="view:analytics">
                  <Suspense fallback={<DashboardPageSkeleton />}>
                    <AnalyticsPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute requiredPermission="view:users">
                  <Suspense fallback={<DashboardPageSkeleton />}>
                    <UsersPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route 
              path="profile" 
              element={
                <Suspense fallback={<DashboardPageSkeleton />}>
                  <ProfilePage />
                </Suspense>
              } 
            />
          </Route>

          {/* Error pages */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>

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
    </BrowserRouter>
  );
}

export default App;
