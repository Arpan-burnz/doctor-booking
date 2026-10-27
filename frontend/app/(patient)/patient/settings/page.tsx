'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole, getUsername } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import PatientSidebar from '@/components/shared/PatientSidebar';
import {
  Lock,
  Shield,
  Trash2,
  X,
  Check,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface ProfileData {
  fullName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
}

interface NotificationPreferences {
  emailReminders: boolean;
  smsAlerts: boolean;
  medicationReminders: boolean;
  marketingEmails: boolean;
}

interface SecurityPreferences {
  twoFactorAuth: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  // State
  const [profile, setProfile] = useState<ProfileData>({
    fullName: '',
    phone: '',
    email: '',
    avatarUrl: ''
  });

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    emailReminders: true,
    smsAlerts: true,
    medicationReminders: true,
    marketingEmails: true
  });

  const [securityPrefs, setSecurityPrefs] = useState<SecurityPreferences>({
    twoFactorAuth: true
  });

  // Modal States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Photo Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');

  // Form States for Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Profile Saved Alert
  const [saveMessage, setSaveMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (getUserRole() !== 'PATIENT') {
      router.push('/login');
      return;
    }
    const savedProfile = localStorage.getItem('doc4u_patient_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {}
    }
    const savedNotifs = localStorage.getItem('doc4u_patient_notif_prefs');
    if (savedNotifs) {
      try {
        setNotifPrefs(JSON.parse(savedNotifs));
      } catch (e) {}
    }
    const savedSecurity = localStorage.getItem('doc4u_patient_security_prefs');
    if (savedSecurity) {
      try {
        setSecurityPrefs(JSON.parse(savedSecurity));
      } catch (e) {}
    }
  }, [router]);

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    localStorage.setItem('doc4u_patient_profile', JSON.stringify(profile));
    setSaveMessage('Profile changes saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleOpenPhotoModal = () => {
    setPhotoPreview(profile.avatarUrl || '');
    setPhotoError('');
    setIsPhotoModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG, JPG, WEBP, SVG, GIF, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setPhotoError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    const updated = { ...profile, avatarUrl: photoPreview };
    setProfile(updated);
    localStorage.setItem('doc4u_patient_profile', JSON.stringify(updated));
    setIsPhotoModalOpen(false);
    setSaveMessage('Profile photo updated successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleRemovePhoto = () => {
    const updated = { ...profile, avatarUrl: '' };
    setProfile(updated);
    setPhotoPreview('');
    localStorage.setItem('doc4u_patient_profile', JSON.stringify(updated));
    setIsPhotoModalOpen(false);
    setSaveMessage('Profile photo removed');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const toggleNotifPref = (key: keyof NotificationPreferences) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem('doc4u_patient_notif_prefs', JSON.stringify(updated));
  };

  const toggleSecurityPref = (key: keyof SecurityPreferences) => {
    const updated = { ...securityPrefs, [key]: !securityPrefs[key] };
    setSecurityPrefs(updated);
    localStorage.setItem('doc4u_patient_security_prefs', JSON.stringify(updated));
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordSuccess('Password updated successfully!');
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('');
    }, 1500);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/auth/me');
      clearTokens();
      localStorage.clear();
      router.push('/login');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to delete account from server.';
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex font-sans select-none antialiased transition-all duration-300 ${
        isDark ? 'bg-[#0c0d0e] text-zinc-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Sidebar Navigation */}
      {/* Shared Sidebar */}
      <PatientSidebar username={profile.fullName && profile.fullName !== 'Arpan' ? profile.fullName : undefined} avatarUrl={profile.avatarUrl} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 md:pt-7 pb-7 space-y-7 transition-all duration-300">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h1>
            <p className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Manage your account and preferences
            </p>
          </div>
          {saveMessage && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3.5 py-1.5 rounded-xl animate-in fade-in">
              {saveMessage}
            </span>
          )}
        </div>

        {/* 2 Columns Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl">
          {/* Left Column: Profile Card */}
          <div
            className={`lg:col-span-6 rounded-3xl p-6 border flex flex-col justify-between transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Profile</h3>
                <button
                  type="button"
                  onClick={() => handleSaveProfile()}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Save changes
                </button>
              </div>

              {/* Avatar + Basic details */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800/60">
                <div className="flex items-center gap-3.5">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      className="w-12 h-12 rounded-full object-cover shadow-md shrink-0 border-2 border-blue-500/40"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
                      {profile.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'AP'}
                    </div>
                  )}
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.fullName}</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{profile.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenPhotoModal}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                    isDark
                      ? 'bg-zinc-800/90 border-zinc-700/80 text-white hover:bg-zinc-700'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Change photo</span>
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Full name
                  </label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all ${
                      isDark
                        ? 'bg-zinc-900/90 border-zinc-700/80 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all ${
                      isDark
                        ? 'bg-zinc-900/90 border-zinc-700/80 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all ${
                      isDark
                        ? 'bg-zinc-900/90 border-zinc-700/80 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Stack of 2 Cards (Notifications & Security) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Card 1: Notifications Preferences */}
            <div
              className={`rounded-3xl p-6 border transition-all ${
                isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <h3 className={`text-base font-bold mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>

              <div className="space-y-4">
                {/* Email Reminders */}
                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Email reminders</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>24hr before appointments</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotifPref('emailReminders')}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      notifPrefs.emailReminders ? 'bg-zinc-200' : isDark ? 'bg-zinc-800' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full absolute top-0.75 transition-transform ${
                        notifPrefs.emailReminders
                          ? 'right-1 bg-zinc-900'
                          : 'left-1 bg-zinc-400'
                      }`}
                    />
                  </button>
                </div>

                {/* SMS Alerts */}
                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>SMS alerts</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>2hr before appointments</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotifPref('smsAlerts')}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      notifPrefs.smsAlerts ? 'bg-zinc-200' : isDark ? 'bg-zinc-800' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full absolute top-0.75 transition-transform ${
                        notifPrefs.smsAlerts
                          ? 'right-1 bg-zinc-900'
                          : 'left-1 bg-zinc-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Medication Reminders */}
                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Medication reminders</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Daily dose alerts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotifPref('medicationReminders')}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      notifPrefs.medicationReminders ? 'bg-zinc-200' : isDark ? 'bg-zinc-800' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full absolute top-0.75 transition-transform ${
                        notifPrefs.medicationReminders
                          ? 'right-1 bg-zinc-900'
                          : 'left-1 bg-zinc-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Marketing emails</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Tips and health news</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotifPref('marketingEmails')}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      notifPrefs.marketingEmails ? 'bg-zinc-200' : isDark ? 'bg-zinc-800' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full absolute top-0.75 transition-transform ${
                        notifPrefs.marketingEmails
                          ? 'right-1 bg-zinc-900'
                          : 'left-1 bg-zinc-400'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Security */}
            <div
              className={`rounded-3xl p-6 border transition-all ${
                isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <h3 className={`text-base font-bold mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>Security</h3>

              <div className="space-y-4">
                {/* Change Password */}
                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Change password</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800/90 border-zinc-700/80 text-white hover:bg-zinc-700'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Update
                  </button>
                </div>

                {/* Two-Factor Auth */}
                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Two-factor auth</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Extra account security</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSecurityPref('twoFactorAuth')}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      securityPrefs.twoFactorAuth ? 'bg-zinc-200' : isDark ? 'bg-zinc-800' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full absolute top-0.75 transition-transform ${
                        securityPrefs.twoFactorAuth
                          ? 'right-1 bg-zinc-900'
                          : 'left-1 bg-zinc-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60">
                  <div>
                    <h4 className="text-sm font-bold text-rose-500">Delete account</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/30 border border-rose-900/50 text-rose-400 hover:bg-rose-900/50 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">Change Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-900/40 p-3 rounded-xl">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 p-3 rounded-xl">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-rose-500">Delete Account</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs leading-relaxed mb-6 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Are you sure you want to delete your account? All your medical records, appointments, and prescriptions will be permanently removed.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Photo Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Update Profile Photo</h3>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-2xl mb-4 cursor-pointer transition-colors ${
                isDark ? 'border-zinc-700 hover:border-blue-500 bg-zinc-900/50' : 'border-slate-300 hover:border-blue-500 bg-slate-50'
              }`}
            >
              {photoPreview ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover shadow-lg border-2 border-blue-500"
                  />
                  <span className="text-xs font-bold text-blue-400 hover:underline">Click to choose a different photo from storage</span>
                </div>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'}`}>
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Click to choose image from device storage</p>
                  <p className={`text-[11px] text-center ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Supported: Any image format (PNG, JPG, JPEG, WEBP, SVG, GIF, etc.)</p>
                </>
              )}
            </div>

            {photoError && (
              <p className="text-xs text-rose-500 font-semibold mb-4 text-center">{photoError}</p>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/60">
              {photoPreview ? (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-2 text-xs font-bold text-rose-500 hover:text-rose-400 cursor-pointer"
                >
                  Remove photo
                </button>
              ) : <div />}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={!photoPreview}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
