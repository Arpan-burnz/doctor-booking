'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { saveTokens, getUserRole } from '@/lib/auth';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  User,
  Stethoscope,
} from 'lucide-react';
import AppLogo from '@/components/AppLogo';

export default function LoginPage() {
  const router = useRouter();
  const [loginRole, setLoginRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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

  const isDoctor = loginRole === 'DOCTOR';

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 sm:p-6 relative select-none selection:bg-purple-900/40 selection:text-purple-200">
      {/* Top Left Back Navigation */}
      <Link
        href="/"
        className="absolute top-5 left-5 sm:top-8 sm:left-8 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#1f293d]/80 bg-[#111827]/85 backdrop-blur-md hover:bg-[#162032] text-slate-300 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
        <span>Home</span>
      </Link>

      <div className="w-full max-w-[420px] z-10">
        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <AppLogo
            isDark={true}
            onClick={() => router.push('/')}
            className="mb-2"
            accentColor={isDoctor ? 'emerald' : 'blue'}
          />
          <p className="text-xs text-slate-400">
            Clinical precision and verified healthcare
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111827]/85 backdrop-blur-md border border-[#1f293d]/80 rounded-xl p-6 sm:p-7 shadow-2xl">
          {/* Role Segmented Selector */}
          <div className="flex gap-1 p-1 bg-[#090d16] rounded-lg border border-[#1f293d] mb-5">
            <button
              type="button"
              onClick={() => {
                setLoginRole('PATIENT');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                loginRole === 'PATIENT'
                  ? 'bg-sky-500 text-slate-950 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginRole('DOCTOR');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                loginRole === 'DOCTOR'
                  ? 'bg-emerald-500 text-slate-950 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor portal</span>
            </button>
          </div>

          <div className="mb-5">
            <h1 className="text-lg font-semibold text-white tracking-tight">
              {loginRole === 'PATIENT' ? 'Patient sign in' : 'Doctor sign in'}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {loginRole === 'PATIENT'
                ? 'Sign in to access your consultations, prescriptions, and records'
                : 'Sign in to manage practice availability, patients, and clinical slots'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-xs text-rose-300 font-medium mb-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" />
                <span className="leading-tight">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {loginRole === 'PATIENT' ? 'Patient email' : 'Doctor email'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder={loginRole === 'PATIENT' ? 'patient@doc4u.com' : 'doctor@doc4u.com'}
                  className="w-full pl-9 pr-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-2 px-4 font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
                isDoctor
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
              }`}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign in as {loginRole === 'PATIENT' ? 'patient' : 'doctor'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#1f293d] text-center">
            <p className="text-xs text-slate-400">
              New to DOC4U?{' '}
              <Link href="/register" className="text-sky-400 hover:text-sky-300 font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Verification Footer Badges */}
        <div className="flex justify-center items-center gap-4 mt-5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified medical specialists
          </span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            HIPAA-compliant security
          </span>
        </div>
      </div>
    </div>
  );
}
