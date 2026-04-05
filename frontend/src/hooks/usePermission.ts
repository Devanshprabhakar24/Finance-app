import { useAuthStore } from '@/store/auth.store';
import { PERMISSIONS } from '@/utils/constants';

/**
 * Permission hook for role-based access control
 */
export function usePermission() {
  const { user, isAuthenticated } = useAuthStore();

  const can = (permission: string): boolean => {
    // If not authenticated, no permissions
    if (!isAuthenticated || !user) {
      return false;
    }
    
    // If user has no role, default to no permissions
    if (!user.role) {
      return false;
    }
    
    // Get permissions for user's role
    const userPermissions = PERMISSIONS[user.role as keyof typeof PERMISSIONS];
    
    // If role doesn't exist in permissions mapping, no permissions
    if (!userPermissions || !Array.isArray(userPermissions)) {
      return false;
    }
    
    // Check if user has the required permission
    return userPermissions.includes(permission);
  };

  return { can };
}
