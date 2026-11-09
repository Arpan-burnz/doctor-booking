'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole } from '@/lib/auth';
import {
  Upload,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  ExternalLink,
} from 'lucide-react';

function cleanPatientName(email: string) {
  if (!email) return 'Patient';
  const raw = email.split('@')[0];
  const parts = raw.split(/[._-]/);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ appointmentId: '', diagnosis: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (getUserRole() !== 'DOCTOR') { router.push('/login'); return; }
    api.get('/appointments/mine')
      .then(res => setAppointments(res.data.data || []))
      .finally(() => setLoading(false));
  }, [router]);

  // All appointments that have prescriptions or are completed
  const eligibleAppts = appointments.filter(a => a.status === 'COMPLETED' || (a.prescriptions && a.prescriptions.length > 0) || a.status === 'CONFIRMED');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileRef.current?.files?.[0]) {
      setError('Please select a file to upload');
      return;
    }
    setUploading(true); setError(''); setSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', fileRef.current.files[0]);
      formData.append('appointmentId', form.appointmentId);
      if (form.diagnosis) formData.append('diagnosis', form.diagnosis);
      await api.post('/prescriptions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Prescription uploaded successfully');
      setForm({ appointmentId: '', diagnosis: '' });
      if (fileRef.current) fileRef.current.value = '';
      // Refresh
      const res = await api.get('/appointments/mine');
      setAppointments(res.data.data || []);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filtered = eligibleAppts.filter(a => {
    const email = a.patient?.user?.email || '';
    const name = cleanPatientName(email);
    return email.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-[#090d16]">
      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-full bg-[#090d16] text-slate-100">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Prescriptions management</h1>
        <p className="text-slate-400 text-xs mt-1">Upload and review digital prescriptions issued to patients</p>
      </div>

      {/* Upload Form */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1f293d]">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Upload className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Issue digital prescription (Rx)</h2>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs font-medium mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs font-medium mb-4">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select patient session
            </label>
            <select
              required
              value={form.appointmentId}
              onChange={e => setForm({ ...form, appointmentId: e.target.value })}
              className="w-full py-2 px-3 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-emerald-500 transition-colors"
            >
              <option value="">Choose appointment</option>
              {appointments.slice(0, 20).map((a: any) => (
                <option key={a.id} value={a.id}>
                  {cleanPatientName(a.patient?.user?.email)} · {a.slot?.slotDate ? new Date(a.slot.slotDate).toLocaleDateString() : ''} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Clinical diagnosis
            </label>
            <input
              type="text"
              placeholder="e.g. Mild hypertension, stage 1"
              value={form.diagnosis}
              onChange={e => setForm({ ...form, diagnosis: e.target.value })}
              className="w-full py-2 px-3 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-emerald-500 transition-colors placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Prescription file (PDF / image)
            </label>
            <input
              type="file"
              required
              ref={fileRef}
              accept=".pdf,image/*"
              className="w-full text-xs text-slate-400 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 transition-colors cursor-pointer"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end pt-1">
            <button
              type="submit"
              disabled={uploading}
              className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload prescription
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Prescription records</h2>
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by patient..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#090d16] border border-[#1f293d] focus:border-emerald-500 rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-10 text-center">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
            <p className="text-slate-300 text-xs font-medium">No prescription records found</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((appt: any) => {
              const pName = cleanPatientName(appt.patient?.user?.email);
              const pCount = appt.prescriptions?.length || 0;

              return (
                <div key={appt.id} className="bg-[#111827] border border-[#1f293d] rounded-xl p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-semibold shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-white text-xs font-medium">{pName}</h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {appt.slot?.slotDate ? new Date(appt.slot.slotDate).toLocaleDateString() : ''} · {appt.notes || 'General consultation'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {pCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        {appt.prescriptions.map((pr: any, i: number) => (
                          <a
                            key={pr.id || i}
                            href={pr.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#162032] hover:bg-[#1a263c] border border-[#1f293d] text-emerald-400 text-xs font-medium rounded-lg transition-colors"
                          >
                            <span>Rx #{i + 1}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs">Pending upload</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
