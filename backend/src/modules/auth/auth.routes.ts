import { Router } from 'express';
import * as authController from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter, otpLimiter, availabilityLimiter } from '../../middleware/rateLimiter';
import { noCache } from '../../middleware/cacheControl';
import { userRegistrationSchema } from '../users/user.schema';
import {
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';

const router = Router();

// Section 2.1: No caching for auth routes
router.use(noCache);

// Public routes with rate limiting
router.post(
  '/register',
  authLimiter,
  validateBody(userRegistrationSchema),
  authController.register
);

// Check email/phone availability
router.post(
  '/check-availability',
  availabilityLimiter,
  authController.checkAvailability
);

router.post(
  '/verify-otp',
  authLimiter,
  validateBody(verifyOtpSchema),
  authController.verifyOtp
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

router.post(
  '/resend-otp',
  otpLimiter,
  validateBody(resendOtpSchema),
  authController.resendOtp
);

router.post(
  '/send-registration-otp',
  otpLimiter,
  authController.sendRegistrationOtp
);

router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

router.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// Test email endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  router.post('/test-email', authController.testEmail);
}

// Protected routes
router.post('/logout', authenticate, authController.logout);

export default router;
