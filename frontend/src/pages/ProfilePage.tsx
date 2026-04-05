import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/auth.store';
import { User, Mail, Phone, Shield, Calendar, Edit2, Save, X, Lock, Upload, Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/api/axios';
import { formatDate } from '@/utils/format';
import { requestPasswordChangeOtp, changePasswordWithOtp } from '@/api/users.api';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: '',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const response = await apiClient.patch('/users/me', data);
      return response.data;
    },
    onSuccess: (data) => {
      setUser(data.data);
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiClient.patch('/users/me/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        otp: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  // Request OTP for password change
  const requestOtpMutation = useMutation({
    mutationFn: requestPasswordChangeOtp,
    onSuccess: () => {
      toast.success('OTP sent to your email');
      setShowOtpStep(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    },
  });

  // Change password with OTP
  const changePasswordWithOtpMutation = useMutation({
    mutationFn: changePasswordWithOtp,
    onSuccess: () => {
      toast.success('Password changed successfully');
      setIsChangingPassword(false);
      setShowOtpStep(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        otp: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiClient.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setUser(data.data);
      toast.success('Avatar updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!profileForm.phone.trim()) {
      toast.error('Phone is required');
      return;
    }
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (!passwordForm.newPassword) {
      toast.error('New password is required');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (showOtpStep) {
      // Verify OTP and change password
      if (!passwordForm.otp) {
        toast.error('OTP is required');
        return;
      }
      changePasswordWithOtpMutation.mutate({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        otp: passwordForm.otp,
      });
    } else {
      // Request OTP first
      requestOtpMutation.mutate();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    uploadAvatarMutation.mutate(file);
  };

  if (!user) {
    return (
      <div>
        <PageHeader title="Profile" subtitle="Manage your account" />
        <div className="card">
          <p className="text-center py-8">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account settings" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Basic Info */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full cursor-pointer transition-colors shadow-lg"
                >
                  {uploadAvatarMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploadAvatarMutation.isPending}
                />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {user.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {user.email}
              </p>

              {/* Role Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                {user.role}
              </div>

              {/* Status */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    user.status === 'ACTIVE' ? 'bg-success-500' : 'bg-slate-400'
                  }`} />
                  <span className="text-slate-600 dark:text-slate-400">
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Editable Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Profile Information
              </h3>
              {!isEditingProfile && (
                <button
                  onClick={() => {
                    setIsEditingProfile(true);
                    setProfileForm({ name: user.name, phone: user.phone });
                  }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="input-field"
                    placeholder="+911234567890"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Enter phone number in E.164 format
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    className="input-field bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Full Name</p>
                    <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                    <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                    <p className="font-medium text-slate-900 dark:text-white">{user.phone}</p>
                  </div>
                </div>

                {user.lastLogin && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Last Login</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDate(user.lastLogin)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Change Password
              </h3>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input-field"
                    placeholder="Enter current password"
                    disabled={showOtpStep}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input-field"
                    placeholder="Enter new password"
                    disabled={showOtpStep}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Must be at least 8 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input-field"
                    placeholder="Confirm new password"
                    disabled={showOtpStep}
                  />
                </div>

                {showOtpStep && (
                  <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <KeyRound className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      <h4 className="font-medium text-sky-900 dark:text-sky-100">Email Verification Required</h4>
                    </div>
                    <p className="text-sm text-sky-700 dark:text-sky-300 mb-3">
                      We've sent a 6-digit OTP to your email address for security verification.
                      {process.env.NODE_ENV === 'development' && (
                        <span className="block text-yellow-600 dark:text-yellow-400 font-medium mt-1">
                          💡 Test Mode: You can use "123456"
                        </span>
                      )}
                    </p>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-sky-900 dark:text-sky-100">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={passwordForm.otp}
                        onChange={(e) => setPasswordForm({ ...passwordForm, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        className="input-field"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setShowOtpStep(false);
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                        otp: '',
                      });
                    }}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestOtpMutation.isPending || changePasswordWithOtpMutation.isPending}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {(requestOtpMutation.isPending || changePasswordWithOtpMutation.isPending) ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {showOtpStep ? 'Changing...' : 'Sending OTP...'}
                      </>
                    ) : (
                      <>
                        {showOtpStep ? (
                          <>
                            <Save className="w-4 h-4" />
                            Change Password
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            Send OTP
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-slate-600 dark:text-slate-400">
                Keep your account secure by using a strong password and changing it regularly.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
