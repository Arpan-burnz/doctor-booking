'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppLogo from '@/components/AppLogo';
import {
  Mail,
  Lock,
  Phone,
  AlertCircle,
  Award,
  ArrowRight,
  User,
  ArrowLeft,
  Eye,
  EyeOff,
  Briefcase,
  IndianRupee,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'PATIENT',
    phone: '',
    specialization: '',
    experienceYears: '',
    licenseNumber: '',
    consultationFee: '',
    bio: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
      };
      if (form.role === 'DOCTOR') {
        payload.specialization = form.specialization;
        payload.experienceYears = form.experienceYears ? parseInt(form.experienceYears, 10) : undefined;
        payload.licenseNumber = form.licenseNumber;
        payload.consultationFee = Number(form.consultationFee);
        payload.bio = form.bio || undefined;
      }
      await api.post('/auth/register', payload);
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = form.role === 'DOCTOR';

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

      <div className="w-full max-w-[460px] z-10 py-8">
        {/* Logo Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <AppLogo
            isDark={true}
            onClick={() => router.push('/')}
            className="mb-2"
            accentColor={isDoctor ? 'emerald' : 'blue'}
          />
          <p className="text-xs text-slate-400">
            Create your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111827]/85 backdrop-blur-md border border-[#1f293d]/80 rounded-xl p-6 sm:p-7 shadow-2xl">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-white tracking-tight">Get started with DOC4U</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {isDoctor
                ? 'Join our verified medical network to manage appointments and clinical consultations'
                : 'Book consultations, track medical records, and consult verified doctors online'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2.5 text-xs text-rose-300 font-medium mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" />
              <span className="leading-tight">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Role switch tabs */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Register as
              </label>
              <div className="flex gap-1 p-1 bg-[#090d16] rounded-lg border border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'PATIENT' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    !isDoctor
                      ? 'bg-sky-500 text-slate-950 font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'DOCTOR' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isDoctor
                      ? 'bg-emerald-500 text-slate-950 font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Doctor</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email address
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
                  placeholder="you@example.com"
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
                  placeholder="Minimum 8 characters"
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

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Phone number (optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-slate-500"
                />
              </div>
            </div>

            {/* Doctor-Specific Professional Details */}
            {isDoctor && (
              <div className="pt-3 border-t border-[#1f293d] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <Award className="w-3.5 h-3.5" />
                  <span>Medical credentials</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Medical specialization
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={form.specialization}
                      onChange={e => setForm({ ...form, specialization: e.target.value })}
                      placeholder="e.g. Cardiologist, Dermatologist"
                      className="w-full pl-9 pr-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Medical license number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Award className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={form.licenseNumber}
                      onChange={e => setForm({ ...form, licenseNumber: e.target.value })}
                      placeholder="e.g. MCI-2023-8849"
                      className="w-full pl-9 pr-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.experienceYears}
                      onChange={e => setForm({ ...form, experienceYears: e.target.value })}
                      placeholder="e.g. 8"
                      className="w-full px-3 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Fee (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <IndianRupee className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="number"
                        required
                        value={form.consultationFee}
                        onChange={e => setForm({ ...form, consultationFee: e.target.value })}
                        placeholder="e.g. 500"
                        className="w-full pl-9 pr-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-3 py-2 px-4 font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
                isDoctor
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
              }`}
            >
              {loading ? (
                <span>Registering account...</span>
              ) : (
                <>
                  <span>Create {isDoctor ? 'doctor' : 'patient'} account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-[#1f293d] text-center">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>

        {/* Verification Footer Badges */}
        <div className="flex justify-center items-center gap-4 mt-5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Admin-verified practitioners
          </span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Secure patient records
          </span>
        </div>
      </div>
    </div>
  );
}
