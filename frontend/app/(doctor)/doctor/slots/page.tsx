'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole, clearTokens } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import AppLogo from '@/components/AppLogo';
import {
  Heart,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarCheck,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';

export default function ManageSlots() {
  const router = useRouter();
  const [slots, setSlots] = useState<any[]>([]);
  const [form, setForm] = useState({ slotDate: '', startTime: '', endTime: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { theme, setTheme, isDark } = useTheme();

  useEffect(() => {
    if (getUserRole() !== 'DOCTOR') { router.push('/login'); return; }
    api.get('/slots/my-slots')
      .then(res => setSlots(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await api.post('/slots', { slots: [form] });
      setSlots(prev => [...prev, ...res.data.data]);
      setForm({ slotDate: '', startTime: '', endTime: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create slot');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) return;
    try {
      await api.delete(`/slots/${id}`);
      setSlots(prev => prev.filter((s: any) => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cannot delete booked slot');
    }
  };

  const available = slots.filter((s: any) => !s.isBooked);
  const booked = slots.filter((s: any) => s.isBooked);

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-400' : 'bg-slate-50 text-slate-500'}`}>
      <div className="text-center flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-accent-600 animate-spin" />
        <p className="text-xs font-semibold tracking-wide">Loading availability data...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-40 border-b px-6 py-4 md:px-12 flex items-center justify-between shadow-sm transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
        <AppLogo isDark={isDark} onClick={() => router.push('/doctor/dashboard')} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/doctor/dashboard')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border text-xs font-semibold rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${isDark
              ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white'
              : 'border-slate-202 hover:bg-slate-50 text-slate-600 hover:text-slate-950'
              }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className={`text-2xl font-bold tracking-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Manage Availability</h1>

        {/* Add slot form */}
        <div className={`border rounded-3xl p-6 shadow-sm mb-6 transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-5 h-5 text-accent-605" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Add New Active Slot</h3>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-205 dark:border-rose-900/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400 font-semibold mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] w-full">
              <label className="block text-xs font-semibold text-slate-750 dark:text-zinc-305 uppercase tracking-wider mb-2">Slot Date</label>
              <input
                type="date"
                required
                value={form.slotDate}
                onChange={e => setForm({ ...form, slotDate: e.target.value })}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium outline-none transition-all cursor-pointer ${isDark
                  ? 'bg-zinc-950 border border-zinc-800 text-zinc-150 focus:border-accent-505 focus:ring-4 focus:ring-accent-500/10'
                  : 'bg-slate-50 border border-slate-200 text-slate-950 focus:border-accent-500 focus:bg-white focus:ring-4 focus:ring-accent-500/10'
                  }`}
              />
            </div>

            <div className="w-full sm:w-[130px]">
              <label className="block text-xs font-semibold text-slate-750 dark:text-zinc-305 uppercase tracking-wider mb-2">Start Time</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium outline-none transition-all cursor-pointer ${isDark
                  ? 'bg-zinc-950 border border-zinc-800 text-zinc-150 focus:border-accent-505 focus:ring-4 focus:ring-accent-500/10'
                  : 'bg-slate-50 border border-slate-200 text-slate-955 focus:border-accent-500 focus:bg-white focus:ring-4 focus:ring-accent-500/10'
                  }`}
              />
            </div>

            <div className="w-full sm:w-[130px]">
              <label className="block text-xs font-semibold text-slate-755 dark:text-zinc-305 uppercase tracking-wider mb-2">End Time</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium outline-none transition-all cursor-pointer ${isDark
                  ? 'bg-zinc-950 border border-zinc-800 text-zinc-150 focus:border-accent-505 focus:ring-4 focus:ring-accent-500/10'
                  : 'bg-slate-50 border border-slate-200 text-slate-955 focus:border-accent-500 focus:bg-white focus:ring-4 focus:ring-accent-500/10'
                  }`}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 text-white text-xs font-bold rounded-xl shadow-md shadow-accent-500/20 hover:shadow-accent-500/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-97 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Active Slot</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Slot stats */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          <div className={`border rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between ${isDark ? 'bg-zinc-900 border-accent-950/30' : 'bg-white border-accent-100'
            }`}>
            <div>
              <div className={`text-2xl font-extrabold ${isDark ? 'text-accent-400' : 'text-accent-700'}`}>{available.length}</div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider mt-1">Available Slots</div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-accent-50 border-accent-100/50'
              }`}>
              <Calendar className="w-5 h-5 text-accent-600" />
            </div>
          </div>

          <div className={`border rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between ${isDark ? 'bg-zinc-900 border-brand-955/20' : 'bg-white border-brand-100'
            }`}>
            <div>
              <div className={`text-2xl font-extrabold ${isDark ? 'text-brand-400' : 'text-brand-700'}`}>{booked.length}</div>
              <div className="text-[10px] font-bold text-slate-405 dark:text-zinc-550 uppercase tracking-wider mt-1">Booked Slots</div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-brand-50 border-brand-100/50'
              }`}>
              <Clock className="w-5 h-5 text-brand-650" />
            </div>
          </div>
        </div>

        {/* Slot list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
            <p className="text-slate-500 dark:text-zinc-450 text-xs font-semibold">Tethering slot registries...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className={`border rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse ${isDark ? 'bg-zinc-950 text-zinc-600' : 'bg-slate-100 text-slate-400'
              }`}>
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>No availability logs registered</h3>
            <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Use the form widgets above to host new open sessions for patient bookings.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className={`text-xs font-bold uppercase tracking-widest inline-block px-3 py-1 rounded-full mb-1 ${isDark ? 'text-zinc-450 bg-zinc-900' : 'text-slate-700 bg-slate-202/50'
              }`}>Active Slots</h2>
            <div className="grid gap-3">
              {slots.map((slot: any) => (
                <div key={slot.id} className={`border rounded-xl p-4 flex justify-between items-center shadow-2xs transition-all ${isDark
                  ? 'bg-zinc-900 border-zinc-800/80 hover:border-zinc-750'
                  : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xs'
                  }`}>
                  <div className="flex gap-4 items-center">
                    <div className="flex flex-col gap-1">
                      <div className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                        <Calendar className="w-4 h-4 text-slate-405" />
                        <span>{new Date(slot.slotDate).toDateString()}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-455" />
                        <span>{slot.startTime} – {slot.endTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-bold uppercase tracking-wider py-1 px-3 rounded-full border ${slot.isBooked
                      ? isDark
                        ? 'bg-brand-950/30 text-brand-400 border-brand-900/30'
                        : 'bg-brand-50/80 text-brand-700 border-brand-200'
                      : isDark
                        ? 'bg-accent-950/20 text-accent-400 border-accent-900/30'
                        : 'bg-accent-50/80 text-accent-700 border-accent-200'
                      }`}>
                      {slot.isBooked ? 'Booked' : 'Available'}
                    </span>
                    {!slot.isBooked && (
                      <button
                        onClick={() => handleDelete(slot.id)}
                        className={`flex items-center gap-1 p-2 border rounded-lg transition-all duration-205 active:scale-95 cursor-pointer ${isDark
                          ? 'bg-transparent hover:bg-rose-955/20 border-zinc-800 hover:border-rose-900 text-zinc-500 hover:text-rose-400'
                          : 'bg-transparent hover:bg-rose-50 border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600'
                          }`}
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}