import apiClient from './axios';

/**
 * Send OTP for registration (email or phone)
 */
export async function sendRegistrationOtp(identifier: string): Promise<void> {
  await apiClient.post('/auth/send-registration-otp', { identifier });
}

/**
 * Verify registration OTP
 */
export async function verifyRegistrationOtp(
  identifier: string,
  otp: string
): Promise<{ success: boolean }> {
  // This is a mock verification - in real app, call backend
  // For now, just return success if OTP is 6 digits
  return { success: otp.length === 6 };
}
