'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole } from '@/lib/auth';
import {
  Calendar,
  Clock,
  CheckSquare,
  FileText,
  Loader2,
  Search,
  XCircle,
  Video,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  PENDING:   { label: 'Pending',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  COMPLETED: { label: 'Completed', color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
  NO_SHOW:   { label: 'No show',   color: 'text-slate-400',   bg: 'bg-slate-800',      border: 'border-slate-700' },
};

function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function cleanPatientName(email: string) {
  if (!email) return 'Patient';
  const raw = email.split('@')[0];
  const parts = raw.split(/[._-]/);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (getUserRole() !== 'DOCTOR') { router.push('/login'); return; }
    api.get('/appointments/mine')
      .then(res => setAppointments(res.data.data || []))
      .finally(() => setLoading(false));
  }, [router]);

  const handleComplete = async (id: string) => {
    setCompleting(id);
    try {
      await api.patch(`/appointments/${id}/complete`);
      setAppointments(prev => prev.map((a: any) =>
        a.id === id ? { ...a, status: 'COMPLETED' } : a
      ));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to complete appointment');
    } finally {
      setCompleting(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      setAppointments(prev => prev.map((a: any) =>
        a.id === id ? { ...a, status: 'CANCELLED' } : a
      ));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  const filtered = appointments.filter(a => {
    const patientEmail = a.patient?.user?.email || '';
    const matchSearch = patientEmail.toLowerCase().includes(search.toLowerCase()) ||
      (a.notes || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || a.status === filter;
    return matchSearch && matchFilter;
  });

  const statusOptions = ['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'];
  const counts = statusOptions.reduce((acc: Record<string, number>, s) => {
    acc[s] = s === 'ALL' ? appointments.length : appointments.filter(a => a.status === s).length;
    return acc;
  }, {});

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-[#090d16]">
      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-full bg-[#090d16] text-slate-100">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Appointments</h1>
        <p className="text-slate-400 text-xs mt-1">{appointments.length} total recorded patient appointments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, email, or notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-[#090d16] border border-[#1f293d] focus:border-emerald-500 rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusOptions.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === s
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#162032] text-slate-400 border border-[#1f293d] hover:text-white hover:bg-[#1a263c]'
              }`}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      {/* Appointments list */}
      {filtered.length === 0 ? (
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-10 text-center">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
          <p className="text-slate-300 font-medium text-xs">No appointments found</p>
          <p className="text-slate-500 text-[11px] mt-0.5">Try adjusting your search query or status filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt: any) => {
            const patientEmail = appt.patient?.user?.email || '';
            const displayName = cleanPatientName(patientEmail);
            const cfg = statusConfig[appt.status] || statusConfig.NO_SHOW;
            const meetingUrl = appt.videoLink || `https://meet.google.com/doc4u-${appt.id.slice(0, 8)}`;

            return (
              <div key={appt.id} className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-semibold shrink-0">
                      {displayName.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white text-xs font-semibold tracking-tight">{displayName}</h3>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                        {appt.slot?.slotDate && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(appt.slot.slotDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {appt.slot?.startTime && (
                          <span className="flex items-center gap-1.5 tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatTime(appt.slot.startTime)} – {formatTime(appt.slot.endTime)}
                          </span>
                        )}
                      </div>

                      {appt.notes && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-300 bg-[#090d16] p-2.5 rounded-lg border border-[#1f293d]">
                          <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                          <span className="leading-relaxed">{appt.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-center sm:self-auto">
                    {appt.status === 'CONFIRMED' && (
                      <>
                        <a
                          href={meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 text-xs font-medium rounded-lg transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Call
                        </a>
                        <button
                          onClick={() => handleComplete(appt.id)}
                          disabled={completing === appt.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {completing === appt.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />}
                          Complete
                        </button>
                        <button
                          onClick={() => handleCancel(appt.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
