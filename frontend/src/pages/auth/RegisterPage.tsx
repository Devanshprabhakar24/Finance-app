import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, CheckCircle, ArrowLeft, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email format');
const phoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format (e.g., +911234567890)');

export default function RegisterPage() {
  const navigate = useNavigate();

  // Email fields
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailValidated, setEmailValidated] = useState(false);

  // Phone fields
  const [phone, setPhone] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [phoneValidated, setPhoneValidated] = useState(false);

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [confirmEmailError, setConfirmEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [confirmPhoneError, setConfirmPhoneError] = useState('');

  // Live email validation
  const validateEmail = (value: string) => {
    try {
      emailSchema.parse(value);
      setEmailError('');
      return true;
    } catch (error: any) {
      setEmailError(error.errors[0]?.message || 'Invalid email');
      return false;
    }
  };

  const validateConfirmEmail = (value: string) => {
    if (value !== email) {
      setConfirmEmailError('Emails do not match');
      return false;
    }
    setConfirmEmailError('');
    return true;
  };

  // Live phone validation
  const validatePhone = (value: string) => {
    try {
      phoneSchema.parse(value);
      setPhoneError('');
      return true;
    } catch (error: any) {
      setPhoneError(error.errors[0]?.message || 'Invalid phone');
      return false;
    }
  };

  const validateConfirmPhone = (value: string) => {
    if (value !== phone) {
      setConfirmPhoneError('Phone numbers do not match');
      return false;
    }
    setConfirmPhoneError('');
    return true;
  };

  const handleValidateEmail = () => {
    if (!validateEmail(email) || !validateConfirmEmail(confirmEmail)) {
      toast.error('Please enter valid matching emails');
      return;
    }
    setEmailValidated(true);
    toast.success('Email validated!');
  };

  const handleValidatePhone = () => {
    if (!validatePhone(phone) || !validateConfirmPhone(confirmPhone)) {
      toast.error('Please enter valid matching phone numbers');
      return;
    }
    setPhoneValidated(true);
    toast.success('Phone validated!');
  };

  const handleContinue = () => {
    if (!emailValidated) {
      toast.error('Please validate your email first');
      return;
    }
    if (!phoneValidated) {
      toast.error('Please validate your phone number first');
      return;
    }
    // Navigate to step 2 with validated email and phone
    navigate('/register/complete', {
      state: { email, phone },
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
      <div className="relative z-10 w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to home</span>
        </button>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-slate-400">Step 1: Validate your email and phone</p>
          </div>

          <div className="space-y-6">
            {/* Email Validation Section */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-sky-400" />
                <h2 className="text-lg font-semibold text-white">Email Address</h2>
                {emailValidated && <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateEmail(e.target.value);
                      if (emailValidated) setEmailValidated(false);
                    }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="john@example.com"
                    disabled={emailValidated}
                  />
                  {emailError && <p className="text-sm text-red-400 mt-2">{emailError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Email</label>
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => {
                      setConfirmEmail(e.target.value);
                      validateConfirmEmail(e.target.value);
                      if (emailValidated) setEmailValidated(false);
                    }}
                    onBlur={(e) => validateConfirmEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="john@example.com"
                    disabled={emailValidated}
                  />
                  {confirmEmailError && <p className="text-sm text-red-400 mt-2">{confirmEmailError}</p>}
                </div>

                {!emailValidated && (
                  <button
                    onClick={handleValidateEmail}
                    disabled={!email || !confirmEmail || !!emailError || !!confirmEmailError}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Validate Email
                  </button>
                )}

                {emailValidated && (
                  <button
                    onClick={() => {
                      setEmailValidated(false);
                      setEmail('');
                      setConfirmEmail('');
                    }}
                    className="w-full py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all duration-300"
                  >
                    Change Email
                  </button>
                )}
              </div>
            </div>

            {/* Phone Validation Section */}
            <div className={`bg-slate-800/50 border border-slate-700 rounded-xl p-6 transition-opacity ${!emailValidated ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-sky-400" />
                <h2 className="text-lg font-semibold text-white">Phone Number</h2>
                {phoneValidated && <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      validatePhone(e.target.value);
                      if (phoneValidated) setPhoneValidated(false);
                    }}
                    onBlur={(e) => validatePhone(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="+911234567890"
                    disabled={phoneValidated || !emailValidated}
                  />
                  {phoneError && <p className="text-sm text-red-400 mt-2">{phoneError}</p>}
                  <p className="text-xs text-slate-500 mt-2">Format: +[country code][number] (e.g., +911234567890)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Phone Number</label>
                  <input
                    type="tel"
                    value={confirmPhone}
                    onChange={(e) => {
                      setConfirmPhone(e.target.value);
                      validateConfirmPhone(e.target.value);
                      if (phoneValidated) setPhoneValidated(false);
                    }}
                    onBlur={(e) => validateConfirmPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="+911234567890"
                    disabled={phoneValidated || !emailValidated}
                  />
                  {confirmPhoneError && <p className="text-sm text-red-400 mt-2">{confirmPhoneError}</p>}
                </div>

                {!phoneValidated && emailValidated && (
                  <button
                    onClick={handleValidatePhone}
                    disabled={!phone || !confirmPhone || !!phoneError || !!confirmPhoneError}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Validate Phone
                  </button>
                )}

                {phoneValidated && (
                  <button
                    onClick={() => {
                      setPhoneValidated(false);
                      setPhone('');
                      setConfirmPhone('');
                    }}
                    className="w-full py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all duration-300"
                  >
                    Change Phone
                  </button>
                )}
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!emailValidated || !phoneValidated}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Complete Registration
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
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
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
