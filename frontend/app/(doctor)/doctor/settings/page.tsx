'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole, getUserEmail } from '@/lib/auth';
import { Save, Loader2, AlertCircle, CheckCircle2, ShieldAlert, FileBadge, IndianRupee, RotateCcw } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    bio: '',
    experience: '',
    consultationFee: '',
  });
  const [initialForm, setInitialForm] = useState({
    name: '',
    bio: '',
    experience: '',
    consultationFee: '',
  });

  const email = getUserEmail() || '';

  const syncFormData = (data: any) => {
    const populated = {
      name: data.name || '',
      bio: data.bio || '',
      experience: data.experience?.toString() || '',
      consultationFee: data.consultationFee?.toString() || '',
    };
    setForm(populated);
    setInitialForm(populated);
  };

  useEffect(() => {
    if (getUserRole() !== 'DOCTOR') { router.push('/login'); return; }
    api.get('/doctors/me/profile')
      .then(res => {
        const data = res.data.data;
        setProfile(data);
        syncFormData(data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Default name is strictly email ID if no custom name has been set
  const displayName = profile?.name?.trim() ? profile.name : email;
  const avatarLetter = (displayName ? displayName.charAt(0) : 'D').toUpperCase();

  const isFormDirty =
    form.name !== initialForm.name ||
    form.bio !== initialForm.bio ||
    form.experience !== initialForm.experience ||
    form.consultationFee !== initialForm.consultationFee;

  const handleReset = () => {
    setForm(initialForm);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.put('/doctors/me/profile', {
        name: form.name.trim() || null,
        bio: form.bio,
        experience: form.experience ? parseInt(form.experience) : undefined,
        consultationFee: form.consultationFee ? parseInt(form.consultationFee) : undefined,
      });
      const updated = res.data.data;
      setProfile(updated);
      syncFormData(updated);
      setSuccess('Doctor profile updated successfully');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-transparent">
      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-full bg-transparent text-slate-100">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Account & Profile Settings</h1>
        <p className="text-slate-400 text-xs mt-1">Manage doctor credentials, display name, professional bio, and consultation fees</p>
      </div>

      {/* Pending verification notice if unverified */}
      {profile && !profile.isVerified && (
        <div className="max-w-3xl mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-medium text-amber-300">Account pending admin verification:</span> Your medical license ({profile.licenseNumber || 'Submitted'}) is currently under review by the administrator. You cannot open appointment slots until verified.
          </div>
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        {/* Main Settings Card */}
        <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-6 relative">
          {/* Practitioner Header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#1f293d]">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-semibold shrink-0">
              {avatarLetter}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-white text-base font-semibold tracking-tight">{displayName}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                  profile?.isVerified
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${profile?.isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {profile?.isVerified ? 'Verified practitioner' : 'Pending verification'}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">{profile?.specialization || 'Physician'}</p>
              <p className="text-slate-500 text-xs font-mono mt-0.5">{email}</p>
            </div>
          </div>

          {/* Read-Only Verified Credentials Grid */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <FileBadge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified credentials</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#162032] border border-[#1f293d] rounded-lg p-3">
                <p className="text-[11px] font-medium text-slate-400 mb-1">Specialization</p>
                <p className="text-white text-xs font-medium">{profile?.specialization || '—'}</p>
              </div>
              <div className="bg-[#162032] border border-[#1f293d] rounded-lg p-3">
                <p className="text-[11px] font-medium text-slate-400 mb-1">License number</p>
                <p className="text-white text-xs font-mono font-medium">{profile?.licenseNumber || '—'}</p>
              </div>
              <div className="bg-[#162032] border border-[#1f293d] rounded-lg p-3">
                <p className="text-[11px] font-medium text-slate-400 mb-1">Verification status</p>
                <p className={`text-xs font-medium ${profile?.isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {profile?.isVerified ? 'Verified practitioner' : 'Pending verification'}
                </p>
              </div>
              <div className="bg-[#162032] border border-[#1f293d] rounded-lg p-3">
                <p className="text-[11px] font-medium text-slate-400 mb-1">Clinical experience</p>
                <p className="text-white text-xs font-medium">
                  {profile?.experience ? `${profile.experience} years` : '—'}
                </p>
              </div>
            </div>

            {/* Standard Consultation Fee Tile */}
            <div className="bg-[#162032] border border-[#1f293d] rounded-lg p-3.5 mt-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-400 mb-0.5">Standard consultation fee</p>
                <p className="text-[11px] text-slate-500">Current fee charged per consultation slot</p>
              </div>
              <div className="flex items-center gap-0.5 text-emerald-400 text-lg font-semibold tabular-nums">
                <IndianRupee className="w-4 h-4" />
                <span>{profile?.consultationFee?.toLocaleString('en-IN') || '500'}</span>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {success && (
            <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs font-medium mb-5">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs font-medium mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Editable Profile Settings Form */}
          <div className="pt-5 border-t border-[#1f293d]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3.5">
              Public profile information
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Doctor Name Field */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Doctor display name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder={email}
                  className="w-full py-2 px-3.5 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-emerald-500 transition-colors placeholder:text-slate-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Default name is your registered email ID (<span className="text-slate-400 font-mono">{email}</span>). Leave empty to use default.
                </p>
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Professional bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  placeholder="Share details of your clinical practice..."
                  className="w-full py-2 px-3.5 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-emerald-500 resize-none transition-colors placeholder:text-slate-600"
                />
              </div>

              {/* Experience & Fee Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    value={form.experience}
                    onChange={e => setForm({ ...form, experience: e.target.value })}
                    className="w-full py-2 px-3.5 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Consultation fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={form.consultationFee}
                    onChange={e => setForm({ ...form, consultationFee: e.target.value })}
                    className="w-full py-2 px-3.5 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={saving || !isFormDirty}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save changes</span>
                </button>
                <button
                  type="button"
                  disabled={!isFormDirty}
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#162032] hover:bg-[#1a263c] border border-[#1f293d] text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
