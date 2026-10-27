'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole, clearTokens } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import AppLogo from '@/components/AppLogo';
import {
  Heart,
  LogOut,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  XSquare,
  Clock,
  User,
  FileText,
  Loader2,
  CheckSquare,
  Sparkles,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  CONFIRMED: { bg: 'bg-emerald-950/30', text: 'text-emerald-400', border: 'border-emerald-900/30' },
  COMPLETED: { bg: 'bg-blue-955/35', text: 'text-blue-400', border: 'border-blue-900/30' },
  CANCELLED: { bg: 'bg-rose-955/35', text: 'text-rose-400', border: 'border-rose-905/30' },
  NO_SHOW: { bg: 'bg-slate-100 dark:bg-zinc-800', text: 'text-slate-655 dark:text-zinc-405', border: 'border-slate-200 dark:border-zinc-700' },
};

const statusColorsLight: Record<string, { bg: string; text: string; border: string }> = {
  CONFIRMED: { bg: 'bg-emerald-50/80', text: 'text-emerald-700', border: 'border-emerald-255' },
  COMPLETED: { bg: 'bg-brand-50/80', text: 'text-brand-700', border: 'border-brand-205' },
  CANCELLED: { bg: 'bg-rose-50/80', text: 'text-rose-700', border: 'border-rose-205' },
  NO_SHOW: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

export default function DoctorDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { theme, setTheme, isDark } = useTheme();

  useEffect(() => {
    if (getUserRole() !== 'DOCTOR') { router.push('/login'); return; }
    api.get('/appointments/mine')
      .then(res => setAppointments(res.data.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await api.patch(`/appointments/${id}/complete`);
      setAppointments(prev => prev.map((a: any) => a.id === id ? { ...a, status: 'COMPLETED' } : a));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to complete session');
    }
  };

  const confirmed = appointments.filter((a: any) => a.status === 'CONFIRMED');
  const completed = appointments.filter((a: any) => a.status === 'COMPLETED');

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-400' : 'bg-slate-50 text-slate-500'}`}>
      <div className="text-center flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-accent-600 animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Loading board diagnostics...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-40 border-b px-6 py-4 md:px-12 flex items-center justify-between shadow-sm transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
        <div className="flex items-center gap-3">
          <AppLogo isDark={isDark} onClick={() => router.push('/doctor/dashboard')} />
          <span className={`text-[10px] font-bold uppercase tracking-wider border py-0.5 px-2.5 rounded-full select-none ml-2 ${isDark ? 'bg-accent-950/20 text-accent-400 border-accent-900/30' : 'bg-accent-50 text-accent-700 border-accent-100'
            }`}>
            Physician
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Global Theme select rows */}
          <div className={`hidden sm:flex gap-1 p-1 rounded-xl border mr-3 transition-all ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-slate-100 border-slate-200'
            }`}>
            {[
              { value: 'light', icon: <Sun className="w-3.5 h-3.5" /> },
              { value: 'dark', icon: <Moon className="w-3.5 h-3.5" /> }
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value as any)}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${theme === t.value
                  ? 'bg-accent-650 text-white shadow-sm font-bold scale-102'
                  : isDark
                    ? 'text-zinc-500 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-250/20'
                  }`}
                title={`${t.value} mode`}
              >
                {t.icon}
              </button>
            ))}
          </div>

          <button
            onClick={() => router.push('/doctor/slots')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 text-white text-xs font-bold rounded-xl shadow-md shadow-accent-500/10 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Manage Slots</span>
          </button>
          <button
            onClick={() => {
              clearTokens();
              router.push('/login');
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 border text-xs font-semibold rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${isDark
              ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white'
              : 'border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-955'
              }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className={`text-2xl font-bold tracking-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Physician Dashboard</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Total Logs', value: appointments.length, color: isDark ? 'text-zinc-200' : 'text-slate-700', icon: <FileSpreadsheet className="w-5 h-5 text-slate-500 dark:text-zinc-400" />, border: isDark ? 'border-zinc-800/80 bg-zinc-900' : 'border-slate-150 bg-white shadow-sm' },
            { label: 'Upcoming', value: confirmed.length, color: 'text-accent-400 dark:text-accent-400', icon: <Clock className="w-5 h-5 text-accent-500" />, border: isDark ? 'border-accent-950/30 bg-zinc-900' : 'border-accent-105 bg-white shadow-sm' },
            { label: 'Resolved', value: completed.length, color: 'text-blue-400 dark:text-blue-400', icon: <CheckCircle className="w-5 h-5 text-blue-500" />, border: isDark ? 'border-blue-950/30 bg-zinc-900' : 'border-blue-105 bg-white shadow-sm' },
            { label: 'Cancelled', value: appointments.filter((a: any) => a.status === 'CANCELLED').length, color: 'text-rose-400 dark:text-rose-400', icon: <XSquare className="w-5 h-5 text-rose-500" />, border: isDark ? 'border-rose-950/30 bg-zinc-900' : 'border-rose-105 bg-white shadow-sm' },
          ].map(s => (
            <div key={s.label} className={`border rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between ${s.border}`}>
              <div>
                <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {appointments.length === 0 ? (
          <div className={`border rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-accent-950/20 text-accent-400' : 'bg-accent-50 text-accent-600'
              }`}>
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No bookings recorded yet</h3>
            <p className={`text-sm leading-relaxed mb-6 max-w-xs mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Please register your availability schedule timings. Patients will be able to select sessions.
            </p>
            <button
              onClick={() => router.push('/doctor/slots')}
              className="px-6 py-3 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Add Availability Slots
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className={`text-xs font-bold uppercase tracking-widest inline-block px-3 py-1 rounded-full mb-2 ${isDark ? 'text-zinc-450 bg-zinc-900' : 'text-slate-700 bg-slate-200/50'
              }`}>Appointments Grid</h2>
            <div className="grid gap-4">
              {appointments.map((appt: any) => {
                const badgeStyle = isDark ? (statusColors[appt.status] || { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' }) : (statusColorsLight[appt.status] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' });
                return (
                  <div key={appt.id} className={`border p-5 transition-all rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? 'bg-zinc-900 border-zinc-800/80 hover:border-zinc-750' : 'bg-white border-slate-200 hover:border-slate-350 shadow-xs'
                    }`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-full border flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-zinc-950 border-zinc-800/80 text-zinc-500' : 'bg-slate-50 border-slate-100 text-slate-405'
                        }`}>
                        <User className="w-5 h-5 text-accent-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{appt.patient?.user?.email}</h4>
                          <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                            {appt.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap mt-2.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(appt.slot?.slotDate).toDateString()}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {appt.slot?.startTime} – {appt.slot?.endTime}
                          </span>
                        </div>

                        {appt.notes && (
                          <div className={`border rounded-xl p-2.5 mt-3 text-xs max-w-md ${isDark ? 'bg-zinc-950/60 border-zinc-850 text-zinc-400' : 'bg-slate-50 border-slate-150 text-slate-500'
                            }`}>
                            <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0 inline-block mr-1.5" />
                            <p className="leading-relaxed inline"><strong className={isDark ? 'text-zinc-300' : 'text-slate-700'}>Patient Note:</strong> {appt.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {appt.status === 'CONFIRMED' && (
                      <div className={`flex justify-end pt-3 md:pt-0 border-t md:border-0 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                        <button
                          onClick={() => handleComplete(appt.id)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          <CheckSquare className="w-4 h-4" />
                          <span>Mark Resolved</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}