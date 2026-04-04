import { useAuthStore } from '@/store/auth.store';
import { PERMISSIONS } from '@/utils/constants';

/**
 * Permission hook for role-based access control
 */
export function usePermission() {
  const { user } = useAuthStore();

  const can = (permission: string): boolean => {
    if (!user) return false;
    const userPermissions = PERMISSIONS[user.role];
    return userPermissions.includes(permission as any);
  };

  return { can };
}
