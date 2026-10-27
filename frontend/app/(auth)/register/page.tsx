'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import AppLogo from '@/components/AppLogo';
import {
  Heart,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  Award,
  FileText,
  DollarSign,
  Sparkles,
  ArrowRight,
  User,
  Activity,
  ArrowLeft
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
    bio: ''
  });
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
        phone: form.phone || undefined
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
      setError(err.response?.data?.error || 'Registration failed. Please review inputs.');
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

      <div className="w-full max-w-[450px]">
        {/* Logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <AppLogo isDark={true} onClick={() => router.push('/')} className="mb-2" />
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-205 dark:border-zinc-800 shadow-2xl dark:shadow-none p-8 transition-all duration-300">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Create your account</h1>
            <p className="text-slate-505 dark:text-zinc-400 text-xs font-medium mt-1">Join thousands managing their schedule and health smarter</p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400 font-medium mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role switch tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">I want to register as</label>
              <div className="flex gap-2 p-1 bg-slate-100/80 dark:bg-zinc-950 rounded-xl border border-slate-200/50 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'PATIENT' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${form.role === 'PATIENT'
                    ? 'bg-white dark:bg-zinc-900 text-slate-905 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-450 dark:hover:text-white hover:bg-white/40'
                    }`}
                >
                  <User className={`w-3.5 h-3.5 ${form.role === 'PATIENT' ? 'text-brand-600' : ''}`} />
                  <span>Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'DOCTOR' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${form.role === 'DOCTOR'
                    ? 'bg-white dark:bg-zinc-900 text-slate-905 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-450 dark:hover:text-white hover:bg-white/40'
                    }`}
                >
                  <Activity className={`w-3.5 h-3.5 ${form.role === 'DOCTOR' ? 'text-accent-600' : ''}`} />
                  <span>Doctor</span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-950 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400/80 dark:placeholder:text-zinc-650 text-slate-950 dark:text-zinc-100 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-950 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400/80 dark:placeholder:text-zinc-655 text-slate-950 dark:text-zinc-100 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Phone Number (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-950 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400/80 dark:placeholder:text-zinc-655 text-slate-950 dark:text-zinc-100 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </div>

            {/* Doctor Info Section */}
            {form.role === 'DOCTOR' && (
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-3 duration-250">
                <div className="bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30 rounded-xl p-3 flex items-start gap-2 text-xs text-brand-700 dark:text-brand-450 font-semibold leading-relaxed">
                  <Sparkles className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <span>Licensed medical registration is required. Accounts go live upon admin credentials verification.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Medical Specialization</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                      <Activity className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={form.specialization}
                      onChange={e => setForm({ ...form, specialization: e.target.value })}
                      placeholder="e.g. Cardiology, Pediatrics"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-950 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400/85 dark:placeholder:text-zinc-655 text-slate-950 dark:text-zinc-100 focus:ring-4 focus:ring-brand-500/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">License Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                        <Award className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={form.licenseNumber}
                        onChange={e => setForm({ ...form, licenseNumber: e.target.value })}
                        placeholder="MED-2026-###"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-950 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400/85 dark:placeholder:text-zinc-655 text-slate-955 dark:text-zinc-100 focus:ring-4 focus:ring-brand-500/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Session Fee (₹)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                        <DollarSign className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        required
                        value={form.consultationFee}
                        onChange={e => setForm({ ...form, consultationFee: e.target.value })}
                        placeholder="e.g. 500"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-950 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400/85 dark:placeholder:text-zinc-655 text-slate-955 dark:text-zinc-100 focus:ring-4 focus:ring-brand-500/10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none"
            >
              {loading ? (
                <span>Registering account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80 text-center">
            <p className="text-xs font-medium text-slate-505 dark:text-zinc-450">
              Already registered?{' '}
              <a href="/login" className="text-brand-605 hover:text-brand-705 font-bold hover:underline">
                Sign in instead
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}