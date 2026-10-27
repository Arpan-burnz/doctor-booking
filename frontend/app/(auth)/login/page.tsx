'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { saveTokens, getUserRole } from '@/lib/auth';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, ArrowLeft, User, Stethoscope } from 'lucide-react';
import AppLogo from '@/components/AppLogo';

export default function LoginPage() {
  const router = useRouter();
  const [loginRole, setLoginRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      const { accessToken, refreshToken, user } = res.data.data;
      saveTokens(accessToken, refreshToken, user);
      const role = getUserRole();
      if (role === 'DOCTOR') router.push('/doctor/dashboard');
      else if (role === 'ADMIN') router.push('/admin/dashboard');
      else router.push('/patient/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-slate-50 to-accent-50/70 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 flex items-center justify-center p-6 relative overflow-hidden transition-all duration-300">
      {/* Top Left Back Button */}
      <button
        type="button"
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4 text-blue-500" />
        <span>Back to home</span>
      </button>

      {/* Decorative Blur Circles */}
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-brand-350/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-accent-350/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-[430px]">
        {/* Logo and Headings */}
        <div className="text-center mb-8 flex flex-col items-center">
          <AppLogo isDark={true} onClick={() => router.push('/')} className="mb-2.5" />
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tracking-wide uppercase">Your Health, Your Schedule</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-205 dark:border-zinc-800 shadow-2xl dark:shadow-none p-8 transition-all duration-300">
          {/* Role Selection Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginRole('PATIENT');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                loginRole === 'PATIENT'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Patient Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginRole('DOCTOR');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                loginRole === 'DOCTOR'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Login</span>
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {loginRole === 'PATIENT' ? 'Patient Portal Sign In' : 'Doctor Portal Sign In'}
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 text-xs font-medium mt-1">
              {loginRole === 'PATIENT'
                ? 'Sign in to access your bookings, prescriptions, and health vitals'
                : 'Sign in to manage your practice schedule, patient slots, and prescriptions'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400 font-medium mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                {loginRole === 'PATIENT' ? 'Patient Email' : 'Doctor Email'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder={loginRole === 'PATIENT' ? 'patient@doc4u.com' : 'doctor@doc4u.com'}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-950 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400/80 dark:placeholder:text-zinc-650 text-slate-950 dark:text-zinc-100 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-950 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400/80 dark:placeholder:text-zinc-650 text-slate-955 dark:text-zinc-100 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign in as {loginRole === 'PATIENT' ? 'Patient' : 'Doctor'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>



          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80 text-center">
            <p className="text-xs font-medium text-slate-505 dark:text-zinc-450">
              New to DOC4U?{' '}
              <a href="/register" className="text-brand-605 hover:text-brand-705 font-bold hover:underline">
                Create a free account
              </a>
            </p>
          </div>
        </div>

        {/* Verification badges */}
        <div className="flex justify-center items-center gap-5 mt-6 text-[11px] font-semibold text-slate-500 dark:text-zinc-450">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-600" />
            500+ Verified Doctors
          </span>
          <span className="w-1 h-1 bg-slate-350 dark:bg-zinc-800 rounded-full" />
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-600" />
            10k+ Patient Bookings
          </span>
        </div>
      </div>
    </div>
  );
}