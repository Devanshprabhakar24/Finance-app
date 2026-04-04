import apiClient from './axios';
import type { User } from '../types/index';

/**
 * User Management API calls (Admin only)
 */

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UpdateUserPayload {
  name?: string;
  role?: 'ADMIN' | 'ANALYST' | 'VIEWER';
  status?: 'ACTIVE' | 'INACTIVE';
}

/**
 * Get paginated list of users (Admin only)
 */
export async function getUsers(filters?: UserFilters) {
  const response = await apiClient.get('/users', {
    params: filters,
  });
  return response.data;
}

/**
 * Get user statistics (Admin only)
 */
export async function getUserStats() {
  const response = await apiClient.get('/users/stats');
  return response.data;
}

/**
 * Get single user by ID (Admin only)
 */
export async function getUser(id: string): Promise<{ data: User }> {
  const response = await apiClient.get<{ data: User }>(`/users/${id}`);
  return response.data;
}

/**
 * Update user role (Admin only)
 */
export async function updateUserRole(
  id: string,
  role: 'ADMIN' | 'ANALYST' | 'VIEWER'
): Promise<{ data: User }> {
  const response = await apiClient.patch<{ data: User }>(`/users/${id}/role`, { role });
  return response.data;
}

/**
 * Update user status (Admin only)
 */
export async function updateUserStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE'
): Promise<{ data: User }> {
  const response = await apiClient.patch<{ data: User }>(`/users/${id}/status`, { status });
  return response.data;
}

/**
 * Update user (Admin only) - Combined role and status update
 */
export async function updateUser(
  id: string,
  data: UpdateUserPayload
): Promise<{ data: User }> {
  // If both role and status are provided, update them separately
  if (data.role && data.status) {
    await updateUserRole(id, data.role);
    return updateUserStatus(id, data.status);
  }
  // If only role is provided
  if (data.role) {
    return updateUserRole(id, data.role);
  }
  // If only status is provided
  if (data.status) {
    return updateUserStatus(id, data.status);
  }
  // If neither, just return current user
  return getUser(id);
}

/**
 * Delete user (Admin only) - Note: Backend doesn't have delete endpoint
 * This is a placeholder for future implementation
 */
export async function deleteUser(id: string): Promise<void> {
  // Backend doesn't have delete endpoint yet
  // For now, we can deactivate the user instead
  await updateUserStatus(id, 'INACTIVE');
}

/**
 * Get own profile
 */
export async function getProfile(): Promise<{ data: User }> {
  const response = await apiClient.get<{ data: User }>('/users/profile');
  return response.data;
}

/**
 * Update own profile
 */
export async function updateProfile(id: string, data: { name?: string; phone?: string }): Promise<{ data: User }> {
  const response = await apiClient.patch<{ data: User }>('/users/me', data);
  return response.data;
}

/**
 * Change password
 */
export async function changePassword(data: ChangePasswordPayload): Promise<void> {
  await apiClient.post('/users/change-password', data);
}

/**
 * Upload profile avatar
 */
export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<{ data: { url: string } }>(
    '/users/upload-avatar',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
}
