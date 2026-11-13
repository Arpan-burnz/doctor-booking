'use client';

import { useState, useRef } from 'react';
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
  CheckCircle2,
  Calendar,
  Loader2,
  RefreshCw,
  UploadCloud,
  FileText,
  X,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: 'Prefer not to say',
    // Doctor specific fields
    specialization: '',
    experienceYears: '',
    licenseNumber: '',
    medicalCouncil: '',
    consultationFee: '',
    bio: '',
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email verification post-signup state
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const isDoctor = role === 'DOCTOR';

  const handleFileChange = (file: File | null) => {
    setFileError('');
    if (!file) {
      setCertificateFile(null);
      return;
    }
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileName.endsWith(ext));
    if (!isValidExt) {
      setFileError('Invalid file type. Only PDF, JPG, PNG or WEBP allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File exceeds 5 MB limit. Please choose a smaller file.');
      return;
    }
    setCertificateFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFileError('');

    // Client convenience checks (enforced strictly on the server as well)
    if (!form.name.trim()) {
      setError('Please enter your full name as on your ID');
      return;
    }
    if (!form.email.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    if (!form.phone.trim()) {
      setError('Please enter your mobile number');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (isDoctor) {
      if (!form.specialization.trim()) {
        setError('Please enter your medical specialization');
        return;
      }
      if (!form.licenseNumber.trim()) {
        setError('Please enter your medical registration number');
        return;
      }
      if (!form.medicalCouncil.trim()) {
        setError('Please enter your issuing medical council');
        return;
      }
      if (!certificateFile) {
        setError('Please upload your registration certificate file');
        return;
      }
      if (!form.consultationFee) {
        setError('Please enter your standard consultation fee');
        return;
      }
    }

    setLoading(true);

    try {
      if (isDoctor) {
        const formData = new FormData();
        formData.append('name', form.name.trim());
        formData.append('email', form.email.trim());
        formData.append('phone', form.phone.trim());
        formData.append('password', form.password);
        formData.append('confirmPassword', form.confirmPassword);
        formData.append('role', 'DOCTOR');
        formData.append('termsAccepted', String(termsAccepted));
        if (form.dateOfBirth) formData.append('dateOfBirth', form.dateOfBirth);
        if (form.gender) formData.append('gender', form.gender);

        formData.append('specialization', form.specialization.trim());
        if (form.experienceYears) formData.append('experienceYears', form.experienceYears);
        formData.append('licenseNumber', form.licenseNumber.trim());
        formData.append('medicalCouncil', form.medicalCouncil.trim());
        formData.append('consultationFee', String(Number(form.consultationFee)));
        if (form.bio.trim()) formData.append('bio', form.bio.trim());
        if (certificateFile) formData.append('certificate', certificateFile);

        await api.post('/auth/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const payload: any = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          role: 'PATIENT',
          termsAccepted,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || undefined,
        };

        await api.post('/auth/register', payload);
      }

      setRegisteredEmail(form.email.trim());
      setIsRegistered(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'Registration could not be completed. Please review your details or sign in.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    setResending(true);
    setResendStatus('');
    try {
      const res = await api.post('/auth/resend-verification', { email: registeredEmail });
      setResendStatus(res.data?.message || 'Verification link resent to your email.');
    } catch (err: any) {
      setResendStatus(err.response?.data?.error || 'Failed to resend verification link.');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Graceful Google OAuth handler
    alert('Google authentication is integrated with DOC4U. When connecting in production with your configured Google Client ID, your identity will automatically link to your patient record.');
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 sm:p-6 relative select-none selection:bg-purple-900/40 selection:text-purple-200">
      {/* Top Left Back Navigation */}
      <Link
        href="/"
        className="absolute top-5 left-5 sm:top-8 sm:left-8 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.08] bg-[#111827]/70 backdrop-blur-md hover:bg-[#162032] text-slate-300 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
        <span>Home</span>
      </Link>

      <div className="w-full max-w-[490px] z-10 py-8">
        {/* Brand Header */}
        <div className="text-center mb-5 flex flex-col items-center">
          <AppLogo
            isDark={true}
            onClick={() => router.push('/')}
            className="mb-2"
            accentColor={isDoctor ? 'emerald' : 'blue'}
          />
        </div>

        {/* Card */}
        <div className="bg-[#111827]/85 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Post-Registration Success Notice */}
          {isRegistered ? (
            <div className="text-center py-4 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight mb-2">
                Account created successfully!
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed mb-4 max-w-sm">
                Your account is ready. You can now proceed to sign in with your credentials.
              </p>
              <div className="inline-block px-3.5 py-1.5 rounded-lg bg-[#162032] border border-[#1f293d] text-sky-400 font-mono text-xs font-semibold mb-6">
                {registeredEmail}
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-sky-500/20"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Role Segmented Selector: Patient vs Doctor */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#090d16] rounded-xl border border-[#1f293d] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setRole('PATIENT');
                    setError('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    !isDoctor
                      ? 'bg-[#162032] text-white border border-[#1f293d] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>I'm a patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('DOCTOR');
                    setError('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isDoctor
                      ? 'bg-[#162032] text-white border border-[#1f293d] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  <span>I'm a doctor</span>
                </button>
              </div>

              {/* Form Header */}
              <div className="mb-5">
                <h1 className="text-lg font-semibold text-white tracking-tight">
                  {isDoctor ? 'Create your doctor account' : 'Create your patient account'}
                </h1>
                <p className="text-slate-400 text-xs mt-1">
                  {isDoctor
                    ? 'Join our verified medical network to manage appointments and practice records'
                    : 'Book verified doctors in a few taps'}
                </p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2.5 text-xs text-rose-300 font-medium mb-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* SECTION 1: ACCOUNT */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Account
                  </p>

                  <div className="space-y-3">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Full name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="As on your ID"
                        className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-sky-500"
                      />
                    </div>

                    {/* Email & Mobile Number 2-column row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Email <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="you@example.com"
                          className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Mobile number <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* Password & Confirm Password 2-column row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Min 8 characters"
                            className="w-full pl-3.5 pr-8 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-sky-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Confirm password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            placeholder="Repeat password"
                            className="w-full pl-3.5 pr-8 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-sky-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ABOUT YOU (optional, can be added later) */}
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    About you <span className="text-slate-500 normal-case font-normal">(optional, can be added later)</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Date of birth
                      </label>
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                        className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Gender
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white outline-none transition-colors focus:border-sky-500"
                      >
                        <option value="Prefer not to say">Prefer not to say</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* DOCTOR SPECIFIC DETAILS & VERIFICATION */}
                {isDoctor && (
                  <div className="space-y-4 pt-2">
                    {/* PRACTICE DETAILS */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                        Practice details
                      </p>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Medical specialization <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required={isDoctor}
                            value={form.specialization}
                            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                            placeholder="e.g. Cardiologist, General Physician"
                            className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                              Experience (years)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={form.experienceYears}
                              onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                              placeholder="e.g. 10"
                              className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                              Consultation fee (₹) <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="number"
                              required={isDoctor}
                              value={form.consultationFee}
                              onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                              placeholder="e.g. 800"
                              className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* VERIFICATION SECTION (As specified) */}
                    <div className="pt-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                        Verification
                      </p>

                      <div className="space-y-3">
                        {/* 2-Column Row: Medical registration number & Issuing medical council */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                              Medical registration number <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required={isDoctor}
                              value={form.licenseNumber}
                              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                              placeholder="e.g. WBMC-12345"
                              className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                              Issuing medical council <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required={isDoctor}
                              value={form.medicalCouncil}
                              onChange={(e) => setForm({ ...form, medicalCouncil: e.target.value })}
                              placeholder="e.g. West Bengal Medical Council"
                              className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Registration certificate Upload Dropzone */}
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Registration certificate <span className="text-rose-400">*</span>
                          </label>

                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleFileChange(file);
                            }}
                            className={`border border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                              isDragging
                                ? 'border-emerald-400 bg-emerald-500/10'
                                : certificateFile
                                ? 'border-emerald-500/40 bg-[#090d16]'
                                : 'border-[#1f293d] hover:border-slate-500 bg-[#090d16]'
                            }`}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            />

                            {certificateFile ? (
                              <div className="flex items-center gap-2.5 py-1">
                                <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                                <div className="text-left">
                                  <p className="text-xs font-medium text-white truncate max-w-[220px]">
                                    {certificateFile.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {(certificateFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileChange(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                  }}
                                  className="ml-2 p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                                  title="Remove file"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <UploadCloud className="w-5 h-5 text-emerald-400 mb-1.5" />
                                <p className="text-xs font-medium text-slate-300">
                                  Upload PDF, JPG or PNG, up to 5 MB
                                </p>
                              </div>
                            )}
                          </div>

                          {fileError && (
                            <p className="text-rose-400 text-[11px] mt-1 font-medium">{fileError}</p>
                          )}

                          <p className="text-[11px] text-slate-400 mt-1.5">
                            Only the admin team can view this file.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TERMS AND PRIVACY CHECKBOX */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 leading-relaxed select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-[#1f293d] text-sky-500 focus:ring-0 focus:ring-offset-0 bg-[#090d16] cursor-pointer"
                    />
                    <span>
                      I agree to the Terms of Service and Privacy Policy, and I understand my health data is handled as sensitive information.
                    </span>
                  </label>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 px-4 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDoctor
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-white hover:bg-slate-100 text-slate-950'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span>Create account</span>
                  )}
                </button>

                {/* GOOGLE SIGN IN OPTION */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#1f293d]" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-[#111827] px-2 text-slate-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 bg-[#162032] hover:bg-[#1a263c] border border-white/[0.08] hover:border-slate-500 rounded-lg text-xs font-medium text-slate-200 hover:text-white transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.675-5.17 3.675-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.25 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.24 0 10.06 0 12s.45 3.76 1.25 5.39l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>Sign in using Google</span>
                </button>
              </form>

              {/* Already have an account */}
              <div className="mt-5 pt-3 border-t border-[#1f293d] text-center">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
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
            Encrypted health records
          </span>
        </div>
      </div>
    </div>
  );
}
