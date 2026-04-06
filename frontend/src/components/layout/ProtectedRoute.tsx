import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { PERMISSIONS } from '@/utils/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const location = useLocation();

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && user && user.role) {
    const userPermissions = PERMISSIONS[user.role as keyof typeof PERMISSIONS];
    if (!userPermissions || !Array.isArray(userPermissions) || !userPermissions.includes(requiredPermission)) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
}
