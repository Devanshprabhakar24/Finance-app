import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/api/axios';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { identifier: string }) => {
      const response = await apiClient.post('/auth/forgot-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password reset OTP sent to your email and phone');
      navigate('/auth/reset-password', { state: { identifier } });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send reset OTP');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      toast.error('Please enter your email or phone number');
      return;
    }

    forgotPasswordMutation.mutate({ identifier: identifier.trim() });
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
          to="/login"
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Login</span>
        </Link>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Forgot Password?
            </h1>
            <p className="text-slate-400">
              Enter your email or phone number and we'll send you an OTP to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identifier Type Toggle */}
            <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg">
              <button
                type="button"
                onClick={() => setIdentifierType('email')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  identifierType === 'email'
                    ? 'bg-slate-700 text-sky-400 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setIdentifierType('phone')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  identifierType === 'phone'
                    ? 'bg-slate-700 text-sky-400 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <Phone className="w-4 h-4 inline mr-2" />
                Phone
              </button>
            </div>

            {/* Identifier Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {identifierType === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {identifierType === 'email' ? (
                    <Mail className="w-5 h-5 text-slate-400" />
                  ) : (
                    <Phone className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <input
                  type={identifierType === 'email' ? 'email' : 'tel'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    identifierType === 'email'
                      ? 'your.email@example.com'
                      : '+911234567890'
                  }
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  disabled={forgotPasswordMutation.isPending}
                />
              </div>
              {identifierType === 'phone' && (
                <p className="text-xs text-slate-400 mt-1">
                  Enter phone number in E.164 format (e.g., +911234567890)
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send Reset OTP'
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
          We'll send an OTP to verify your identity before resetting your password
        </p>
      </div>
    </div>
  );
}
