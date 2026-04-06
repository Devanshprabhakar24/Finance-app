import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { verifyOtp, resendOtp } from '@/api/auth.api';
import { OtpInput } from '@/components/auth/OtpInput';
import { useAuthStore } from '@/store/auth.store';
import { ArrowLeft, Shield, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { OTP_CONFIG } from '@/utils/constants';
import toast from 'react-hot-toast';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setTokens } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const { identifier, purpose } = location.state || {};

  useEffect(() => {
    if (!identifier || !purpose) {
      navigate('/login');
    }
  }, [identifier, purpose, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const verifyMutation = useMutation({
    mutationFn: (payload: { identifier: string; otp: string; purpose: string }) =>
      verifyOtp(payload),
    onSuccess: (data) => {
      const { user, accessToken, refreshToken } = data.data;
      setUser(user);
      setTokens(accessToken, refreshToken);
      toast.success('Login successful!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      setError(true);
      setOtp('');
      toast.error(error.response?.data?.message || 'Invalid OTP');
      setTimeout(() => setError(false), 500);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendOtp(identifier, purpose),
    onSuccess: () => {
      toast.success('OTP resent successfully');
      setCountdown(OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
      setCanResend(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    },
  });

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === OTP_CONFIG.LENGTH) {
      verifyMutation.mutate({ identifier, otp: value, purpose });
    }
  };

  const handleResend = () => {
    if (canResend && !resendMutation.isPending) {
      resendMutation.mutate();
    }
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
        <button
          onClick={() => navigate('/login')}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to login</span>
        </button>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify OTP</h1>
            <p className="text-slate-400">
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-mono text-sky-300 mt-2 font-semibold">
              {identifier}
            </p>
          </div>

          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-4 text-center">
                Enter OTP
              </label>
              <OtpInput
                value={otp}
                onChange={handleOtpChange}
                error={error}
                disabled={verifyMutation.isPending}
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-300 font-medium">Email OTP</p>
                  <p className="text-xs text-blue-400 mt-1">Check your inbox for the verification code</p>
                  {import.meta.env.DEV && (
                    <p className="text-xs text-yellow-400 mt-1 font-medium">
                      💡 Test Mode: Use "123456"
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3 mt-3 pt-3 border-t border-blue-500/20">
                <MessageSquare className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-300 font-medium">SMS OTP</p>
                  <p className="text-xs text-blue-400 mt-1">Check your phone for the verification code</p>
                  {import.meta.env.DEV && (
                    <p className="text-xs text-yellow-400 mt-1 font-medium">
                      💡 Test Mode: Use "123456"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Resend Section */}
            <div className="text-center space-y-2">
              {!canResend ? (
                <p className="text-sm text-slate-400">
                  Resend OTP in <span className="font-mono font-semibold text-sky-400">{countdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendMutation.isPending}
                  className="text-sm text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                >
                  {resendMutation.isPending ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>

            {/* Loading State */}
            {verifyMutation.isPending && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Text */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Didn't receive the code? Check your spam folder or try resending
        </p>
      </div>
    </div>
  );
}
