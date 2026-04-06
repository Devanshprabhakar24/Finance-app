import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/api/axios';
import { registerSchema } from '@/schemas/auth.schema';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const identifierFromState = location.state?.identifier || '';

  const [identifier, setIdentifier] = useState(identifierFromState);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { identifier: string; otp: string; newPassword: string }) => {
      const response = await apiClient.post('/auth/reset-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password reset successfully! Please login with your new password.');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  // Test email function (development only)
  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.post('/auth/test-email', { email });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Test email sent! Check your inbox.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    },
  });

  // Request OTP for password reset
  const requestOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.post('/auth/forgot-password', { identifier: email });
      return response.data;
    },
    onSuccess: () => {
      toast.success('OTP sent to your email!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    },
  });

  const handleTestEmail = () => {
    if (!identifier.includes('@')) {
      toast.error('Please enter a valid email address to test');
      return;
    }
    testEmailMutation.mutate(identifier);
  };

  const handleRequestOtp = () => {
    if (!identifier.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    requestOtpMutation.mutate(identifier);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Please enter your email or phone number');
      return;
    }

    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Use shared password validation from auth schema
    const result = registerSchema.shape.password.safeParse(newPassword);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    resetPasswordMutation.mutate({
      identifier: identifier.trim(),
      otp: otp.trim(),
      newPassword,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0F1E] via-slate-900 to-[#0A0F1E] flex items-center justify-center p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <Link
          to="/auth/forgot-password"
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Forgot Password</span>
        </Link>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Reset Password
            </h1>
            <p className="text-slate-400">
              Enter the OTP sent to your email/phone and set a new password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identifier Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="your.email@example.com or +911234567890"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                disabled={resetPasswordMutation.isPending}
              />
              {/* Test Email Button (Development Only) */}
              {import.meta.env.DEV && identifier.includes('@') && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testEmailMutation.isPending}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    {testEmailMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-3 h-3" />
                        Test Email
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={requestOtpMutation.isPending}
                    className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    {requestOtpMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        Request OTP
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                OTP Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all text-center text-2xl tracking-widest"
                maxLength={6}
                disabled={resetPasswordMutation.isPending}
              />
              <p className="text-xs text-slate-400 mt-1">
                Check your email and phone for the OTP code
                {import.meta.env.DEV && (
                  <span className="block text-sky-400 font-medium mt-1">
                    💡 Development Mode: You can use "123456" as test OTP
                  </span>
                )}
              </p>
            </div>

            {/* New Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  disabled={resetPasswordMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&#)
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  disabled={resetPasswordMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-center text-sm text-slate-500 mt-6">
          After resetting, you'll be redirected to login with your new password
        </p>
      </div>
    </div>
  );
}
