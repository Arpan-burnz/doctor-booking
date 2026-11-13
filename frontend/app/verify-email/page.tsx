'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppLogo from '@/components/AppLogo';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  ArrowRight,
  RefreshCw,
  Home,
} from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('No verification token provided in URL. Please click the link sent to your email.');
      return;
    }

    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setSuccess(true);
        setError('');
      })
      .catch((err) => {
        setError(
          err.response?.data?.error ||
          'Verification failed. The link may have expired or is invalid.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    setResendMessage('');
    try {
      const res = await api.post('/auth/resend-verification', { email: resendEmail });
      setResendMessage(
        res.data?.message ||
        'If an unverified account exists with this email, a new verification link has been sent.'
      );
    } catch (err: any) {
      setResendMessage(
        err.response?.data?.error || 'Failed to request new verification link. Please try again.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] z-10 py-8">
      {/* Brand Header */}
      <div className="text-center mb-6 flex flex-col items-center">
        <AppLogo isDark={true} onClick={() => router.push('/')} className="mb-2" />
        <p className="text-xs text-slate-400">Account Security & Verification</p>
      </div>

      <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl">
        {loading ? (
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <h2 className="text-base font-semibold text-white">Validating email verification link...</h2>
            <p className="text-xs text-slate-400">Please wait while we confirm your credentials.</p>
          </div>
        ) : success ? (
          <div className="text-center flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mb-2">
              Email Verified Successfully!
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-6 max-w-sm">
              Your email has been confirmed and your account is now fully active. You can sign in and begin scheduling consultations.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
            >
              <span>Sign in to your account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col py-2">
            <div className="text-center flex flex-col items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight mb-1">
                Verification Required
              </h1>
              <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 w-full mt-2">
                {error}
              </p>
            </div>

            {/* Request a New Link Form */}
            <div className="pt-4 border-t border-white/[0.08]">
              <h2 className="text-xs font-semibold text-slate-200 mb-1">Request a new verification link</h2>
              <p className="text-[11px] text-slate-400 mb-3">
                Enter your registered email address to receive a fresh verification email.
              </p>

              {resendMessage && (
                <div className="p-3 mb-3 rounded-lg text-xs font-medium bg-sky-500/10 border border-sky-500/20 text-sky-300">
                  {resendMessage}
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3.5 py-2 bg-[#090d16]/80 border border-white/[0.08] focus:border-sky-500 rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full py-2 px-3.5 bg-[#162032] hover:bg-[#1a263c] border border-white/[0.08] hover:border-slate-500 text-slate-200 hover:text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {resending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span>Resend verification email</span>
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-between items-center text-xs">
              <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium">
                Back to Sign in
              </Link>
              <Link href="/" className="text-slate-400 hover:text-slate-200 flex items-center gap-1">
                <Home className="w-3 h-3" />
                <span>Home</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 sm:p-6 relative select-none antialiased">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            <span>Loading verification status...</span>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}

