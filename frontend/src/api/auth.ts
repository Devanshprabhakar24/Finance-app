import apiClient from './axios';

export interface AvailabilityResponse {
  emailAvailable: boolean;
  phoneAvailable: boolean;
}

/**
 * Check email and phone availability
 */
export const checkAvailability = async (email?: string, phone?: string): Promise<AvailabilityResponse> => {
  const response = await apiClient.post('/auth/check-availability', {
    email,
    phone,
  });
  return response.data.data;
};