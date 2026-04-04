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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {/* Card */}
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Forgot Password?
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Enter your email or phone number and we'll send you an OTP to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identifier Type Toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setIdentifierType('email')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  identifierType === 'email'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
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
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Phone className="w-4 h-4 inline mr-2" />
                Phone
              </button>
            </div>

            {/* Identifier Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {identifierType === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                  className="input-field pl-10"
                  disabled={forgotPasswordMutation.isPending}
                />
              </div>
              {identifierType === 'phone' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter phone number in E.164 format (e.g., +911234567890)
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
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
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
