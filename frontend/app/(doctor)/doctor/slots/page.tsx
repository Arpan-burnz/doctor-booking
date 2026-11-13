'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole } from '@/lib/auth';
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  ShieldAlert,
  RefreshCw,
  History,
  Clock,
  X,
  ArrowRight,
} from 'lucide-react';

export default function ManageSlots() {
  const router = useRouter();
  const [slots, setSlots] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active');
  const [reopenModalSlot, setReopenModalSlot] = useState<any | null>(null);
  const [reopenDate, setReopenDate] = useState('');
  const [reopenLoading, setReopenLoading] = useState(false);

  const [form, setForm] = useState({
    slotDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '09:30',
  });
  const [blockDate, setBlockDate] = useState({
    date: '',
    reason: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (getUserRole() !== 'DOCTOR') { router.push('/login'); return; }
    Promise.allSettled([
      api.get('/slots/my-slots?filter=all'),
      api.get('/doctors/me/profile'),
    ])
      .then(([slotsRes, profileRes]) => {
        if (slotsRes.status === 'fulfilled') {
          setSlots(slotsRes.value.data.data || []);
        }
        if (profileRes.status === 'fulfilled') {
          setDoctorProfile(profileRes.value.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const isVerified = doctorProfile?.isVerified ?? false;
  const isSuspended = Boolean(doctorProfile?.isSuspended);

  const isSlotExpiredClient = (slot: any) => {
    if (slot.isExpired !== undefined) return Boolean(slot.isExpired);
    const now = new Date();
    const slotD = new Date(slot.slotDate);
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDate = now.getDate();
    const slotYear = slotD.getFullYear();
    const slotMonth = slotD.getMonth();
    const slotDay = slotD.getDate();

    if (
      slotYear < nowYear ||
      (slotYear === nowYear && slotMonth < nowMonth) ||
      (slotYear === nowYear && slotMonth === nowMonth && slotDay < nowDate)
    ) {
      return true;
    }
    if (slotYear === nowYear && slotMonth === nowMonth && slotDay === nowDate) {
      const [endH, endM] = (slot.endTime || '00:00').split(':').map(Number);
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      return nowH > endH || (nowH === endH && nowM >= endM);
    }
    return false;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      setError('Doctor account is currently suspended. You are prohibited from adding slots.');
      return;
    }
    if (!isVerified) {
      setError('wait untill u get verified');
      return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/slots', { slots: [form] });
      setSlots(prev => [...prev, ...res.data.data]);
      setSuccess('Availability slot added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create slot');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPreset = async (preset: 'morning' | 'afternoon') => {
    if (isSuspended) {
      setError('Doctor account is currently suspended. You are prohibited from adding slots.');
      return;
    }
    if (!isVerified) {
      setError('wait untill u get verified');
      return;
    }
    setSaving(true); setError(''); setSuccess('');
    const targetDate = form.slotDate || new Date().toISOString().split('T')[0];
    const newSlots = preset === 'morning' ? [
      { slotDate: targetDate, startTime: '09:00', endTime: '09:30' },
      { slotDate: targetDate, startTime: '09:30', endTime: '10:00' },
      { slotDate: targetDate, startTime: '10:00', endTime: '10:30' },
      { slotDate: targetDate, startTime: '10:30', endTime: '11:00' },
      { slotDate: targetDate, startTime: '11:00', endTime: '11:30' },
      { slotDate: targetDate, startTime: '11:30', endTime: '12:00' },
    ] : [
      { slotDate: targetDate, startTime: '14:00', endTime: '14:30' },
      { slotDate: targetDate, startTime: '14:30', endTime: '15:00' },
      { slotDate: targetDate, startTime: '15:00', endTime: '15:30' },
      { slotDate: targetDate, startTime: '15:30', endTime: '16:00' },
      { slotDate: targetDate, startTime: '16:00', endTime: '16:30' },
      { slotDate: targetDate, startTime: '16:30', endTime: '17:00' },
    ];

    try {
      const res = await api.post('/slots', { slots: newSlots });
      setSlots(prev => [...prev, ...res.data.data]);
      setSuccess(`Added 6 ${preset} slots successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add preset slots');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isSuspended) {
      alert('Doctor account is currently suspended. You cannot modify slots.');
      return;
    }
    if (!confirm('Delete this availability slot?')) return;
    try {
      await api.delete(`/slots/${id}`);
      setSlots(prev => prev.filter((s: any) => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cannot delete booked slot');
    }
  };

  const handleOpenReopenModal = (slot: any) => {
    setReopenModalSlot(slot);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setReopenDate(tomorrow.toISOString().split('T')[0]);
  };

  const handleConfirmReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenModalSlot || !reopenDate) return;
    setReopenLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/slots/reopen', {
        slotId: reopenModalSlot.id,
        targetDate: reopenDate,
        startTime: reopenModalSlot.startTime,
        endTime: reopenModalSlot.endTime,
      });
      setSuccess(`Slot successfully re-opened for ${reopenDate}!`);
      setSlots(prev => [...prev, res.data.data]);
      setReopenModalSlot(null);
      setActiveTab('active');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to re-open slot');
    } finally {
      setReopenLoading(false);
    }
  };

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      setError('Doctor account is currently suspended. You are prohibited from blocking dates.');
      return;
    }
    if (!isVerified) {
      setError('wait untill u get verified');
      return;
    }
    if (!blockDate.date) return;
    setBlocking(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/slots/block-date', {
        date: blockDate.date,
        reason: blockDate.reason,
      });
      setSuccess(res.data.message || 'Date successfully blocked');
      // Refresh slots
      const refreshRes = await api.get('/slots/my-slots?filter=all');
      setSlots(refreshRes.data.data || []);
      setBlockDate({ date: '', reason: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to block date');
    } finally {
      setBlocking(false);
    }
  };

  const activeSlots = slots.filter((s: any) => !isSlotExpiredClient(s));
  const expiredSlots = slots.filter((s: any) => isSlotExpiredClient(s));

  const available = activeSlots.filter((s: any) => !s.isBooked);
  const booked = activeSlots.filter((s: any) => s.isBooked);

  const displaySlots = activeTab === 'active' ? activeSlots : expiredSlots;

  const slotsByDate = displaySlots.reduce((acc: Record<string, any[]>, slot: any) => {
    const dateKey = new Date(slot.slotDate).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(slotsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  function formatTime(t: string) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-transparent">
      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-full bg-transparent text-slate-100">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Schedule & Availability</h1>
        <p className="text-slate-400 text-xs mt-1">Manage consultation slots and calendar block dates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{available.length}</div>
            <div className="text-slate-400 text-xs mt-0.5">Available active slots</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tabular-nums text-sky-400 tracking-tight">{booked.length}</div>
            <div className="text-slate-400 text-xs mt-0.5">Booked upcoming slots</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tabular-nums text-slate-300 tracking-tight">{expiredSlots.length}</div>
            <div className="text-slate-400 text-xs mt-0.5">Expired / Finished slots</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400">
            <History className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Suspension Alert Banner */}
      {isSuspended && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-200 text-xs mb-6">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-200">Doctor Account Suspended</div>
            <p className="mt-0.5 text-rose-200/80 leading-relaxed">
              Your account has been suspended by an administrator. You are prohibited from adding slots, applying presets, or blocking dates. Any future unbooked slots have been purged.
            </p>
          </div>
        </div>
      )}

      {/* Verification Warning Banner */}
      {!isVerified && !isSuspended && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs mb-6">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-amber-300">Account pending admin verification</div>
            <p className="mt-0.5 text-amber-200/80 leading-relaxed">
              Your doctor account is awaiting administrative verification. You cannot open appointment slots or block dates until verified.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs font-medium mb-5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs font-medium mb-5">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid: Add Slot Form & Block Date Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Add Slot */}
        <div className="lg:col-span-8 bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1f293d]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Add availability slots</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickPreset('morning')}
                disabled={saving || !isVerified || isSuspended}
                title={isSuspended ? 'Account suspended' : !isVerified ? 'wait untill u get verified' : undefined}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#162032] hover:bg-[#1a263c] border border-[#1f293d] text-slate-300 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                + Morning (9-12)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('afternoon')}
                disabled={saving || !isVerified || isSuspended}
                title={isSuspended ? 'Account suspended' : !isVerified ? 'wait untill u get verified' : undefined}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#162032] hover:bg-[#1a263c] border border-[#1f293d] text-slate-300 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                + Afternoon (2-5)
              </button>
            </div>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                disabled={!isVerified || isSuspended}
                value={form.slotDate}
                onChange={e => setForm({ ...form, slotDate: e.target.value })}
                className="w-full py-2 px-3 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Start time
              </label>
              <input
                type="time"
                required
                disabled={!isVerified || isSuspended}
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="w-full py-2 px-3 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                End time
              </label>
              <input
                type="time"
                required
                disabled={!isVerified || isSuspended}
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="w-full py-2 px-3 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end mt-1">
              <button
                type="submit"
                disabled={saving || !isVerified || isSuspended}
                title={isSuspended ? 'Account suspended' : !isVerified ? 'wait untill u get verified' : undefined}
                className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add slot
              </button>
            </div>
          </form>
        </div>

        {/* Block a Date Card */}
        <div className="lg:col-span-4 bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1f293d]">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <CalendarX className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Block a date</h2>
          </div>

          <form onSubmit={handleBlockDate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target date
              </label>
              <input
                type="date"
                required
                disabled={!isVerified || isSuspended}
                value={blockDate.date}
                onChange={e => setBlockDate({ ...blockDate, date: e.target.value })}
                className="w-full py-2 px-3 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Reason (optional)
              </label>
              <input
                type="text"
                placeholder="Leave / Personal"
                disabled={!isVerified || isSuspended}
                value={blockDate.reason}
                onChange={e => setBlockDate({ ...blockDate, reason: e.target.value })}
                className="w-full py-2 px-3 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={blocking || !isVerified || isSuspended}
              title={isSuspended ? 'Account suspended' : !isVerified ? 'wait untill u get verified' : undefined}
              className="w-full py-2 px-3.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {blocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarX className="w-3.5 h-3.5" />}
              Block date
            </button>
          </form>
        </div>
      </div>

      {/* Slots list by date */}
      <div className="space-y-4">
        {/* Schedule Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f293d] pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'active'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#162032]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Active schedule</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums font-mono ${
                activeTab === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#1f293d] text-slate-400'
              }`}>
                {activeSlots.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('expired')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'expired'
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#162032]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Past / Expired</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums font-mono ${
                activeTab === 'expired' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[#1f293d] text-slate-400'
              }`}>
                {expiredSlots.length}
              </span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            {activeTab === 'active'
              ? 'Active and upcoming slots visible to patients. Expired slots are automatically removed.'
              : 'Past slots whose scheduled time has passed. Re-open any slot to make it available for future dates.'}
          </p>
        </div>

        {sortedDates.length === 0 ? (
          <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-10 text-center">
            {activeTab === 'active' ? (
              <>
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
                <p className="text-slate-300 text-xs font-medium">No active availability slots scheduled</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Use the form above to add slots for patient appointments</p>
              </>
            ) : (
              <>
                <History className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
                <p className="text-slate-300 text-xs font-medium">No expired slots in history</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Completed and past consultation slots will appear here with 1-click re-open</p>
              </>
            )}
          </div>
        ) : (
          sortedDates.map(dateKey => {
            const dateSlots = slotsByDate[dateKey];
            const d = new Date(dateKey);
            const isToday = d.toDateString() === new Date().toDateString();

            return (
              <div key={dateKey} className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#1f293d]">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white text-xs font-medium">{dateKey}</span>
                  {isToday && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Today
                    </span>
                  )}
                  <span className="text-slate-400 text-xs font-mono ml-auto">
                    {dateSlots.length} slot{dateSlots.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {dateSlots.map((slot: any) => {
                    if (activeTab === 'active') {
                      return (
                        <div
                          key={slot.id}
                          className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                            slot.isBooked
                              ? 'bg-sky-500/10 border-sky-500/25 text-sky-400'
                              : 'bg-[#162032] border-[#1f293d] hover:border-slate-600 text-slate-200'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-medium leading-tight tabular-nums">
                              {formatTime(slot.startTime)}
                            </div>
                            <div className="text-[10px] mt-0.5 opacity-80">
                              {slot.isBooked ? 'Booked' : 'Available'}
                            </div>
                          </div>

                          {!slot.isBooked && (
                            <button
                              onClick={() => handleDelete(slot.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    }

                    // Expired tab rendering
                    return (
                      <div
                        key={slot.id}
                        className="p-2.5 rounded-lg border border-[#1f293d] bg-[#121926] text-slate-300 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium leading-tight tabular-nums text-white">
                              {formatTime(slot.startTime)}
                            </span>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                              slot.isBooked
                                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                                : 'bg-slate-700/40 text-slate-400 border border-slate-700'
                            }`}>
                              {slot.isBooked ? 'Booked' : 'Expired'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-slate-500" />
                            <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenReopenModal(slot)}
                          disabled={!isVerified || isSuspended}
                          className="w-full mt-1 py-1 px-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 hover:border-emerald-500/40 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Re-open this time slot for a future date"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Re-open</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Re-open Slot Modal */}
      {reopenModalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827]/90 backdrop-blur-xl border border-[#1f293d]/80 rounded-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto p-5 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setReopenModalSlot(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Re-open Consultation Slot</h3>
                <p className="text-[11px] text-slate-400">Schedule this time slot for an upcoming date</p>
              </div>
            </div>

            <form onSubmit={handleConfirmReopen} className="space-y-4">
              <div className="p-3 bg-[#090d16] border border-[#1f293d] rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Slot Time:</span>
                  <span className="font-semibold text-white tabular-nums">
                    {formatTime(reopenModalSlot.startTime)} – {formatTime(reopenModalSlot.endTime)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Original Date:</span>
                  <span className="text-slate-300">
                    {new Date(reopenModalSlot.slotDate).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Previous Status:</span>
                  <span className={reopenModalSlot.isBooked ? 'text-sky-400' : 'text-slate-300'}>
                    {reopenModalSlot.isBooked ? 'Booked & Expired' : 'Unbooked Expired'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select new date to open this slot *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={reopenDate}
                  onChange={e => setReopenDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg text-xs outline-none bg-[#090d16] border border-[#1f293d] text-white focus:border-emerald-500 transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  The slot will become immediately available for patient booking on the selected date.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setReopenModalSlot(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-[#162032] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopenLoading || !reopenDate}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {reopenLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm & Re-open</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
