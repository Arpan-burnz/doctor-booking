'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole, getUsername } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import PatientSidebar from '@/components/shared/PatientSidebar';
import {
  Plus,
  FileText,
  FileSpreadsheet,
  Pill,
  Bell,
  Search,
  Loader2,
  CheckCircle,
  Calendar,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  CONFIRMED: { bg: 'bg-emerald-950/30', text: 'text-emerald-400', border: 'border-emerald-900/30' },
  COMPLETED: { bg: 'bg-blue-950/30', text: 'text-blue-405', border: 'border-blue-900/30' },
  CANCELLED: { bg: 'bg-rose-950/30', text: 'text-rose-450', border: 'border-rose-900/30' },
  PENDING: { bg: 'bg-amber-955/35', text: 'text-amber-400', border: 'border-amber-900/30' },
  NO_SHOW: { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' },
};

export default function PatientDashboard() {
  const router = useRouter();

  // States
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meds, setMeds] = useState<any[]>([]);
  const [vitals, setVitals] = useState({
    bloodPressure: '--',
    bloodPressureStatus: 'Not recorded',
    bloodSugar: '--',
    bloodSugarStatus: 'Not recorded',
    heartRate: '--',
    heartRateStatus: 'Not recorded',
    weight: '--',
    weightStatus: 'Not recorded',
  });
  const [profile, setProfile] = useState<{ fullName: string; email: string; avatarUrl?: string }>({
    fullName: '',
    email: '',
    avatarUrl: ''
  });
  const [activeTab, setActiveTab] = useState('Dashboard');

  const { theme, setTheme, isDark } = useTheme();

  // Load selections
  useEffect(() => {
    if (getUserRole() !== 'PATIENT') { router.push('/login'); return; }
    
    Promise.all([
      api.get('/appointments/mine').then(res => res.data.data).catch(() => []),
      api.get('/prescriptions/patient/mine').then(res => res.data.data).catch(() => [])
    ]).then(([appts, prescs]) => {
      setAppointments(appts || []);
      setPrescriptions(prescs || []);
    }).catch(() => router.push('/login'))
      .finally(() => setLoading(false));

    // Load profile
    const savedProfile = localStorage.getItem('doc4u_patient_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.fullName === 'Arpan') {
          delete parsed.fullName;
        }
        setProfile(parsed);
      } catch (e) {}
    }

    // Load saved medications from localStorage
    const savedMeds = localStorage.getItem('doc4u_patient_medications');
    if (savedMeds) {
      try {
        const parsed = JSON.parse(savedMeds);
        setMeds(parsed.map((m: any) => ({
          id: m.id,
          name: `${m.name} ${m.doseAmount}`,
          time: `${m.period || 'Scheduled'} - ${m.scheduleTime}`,
          checked: !!m.checked
        })));
      } catch (e) {}
    } else {
      setMeds([]);
    }

    // Load saved vitals from localStorage
    const savedVitals = localStorage.getItem('doc4u_patient_vitals');
    if (savedVitals) {
      try {
        const parsed = JSON.parse(savedVitals);
        setVitals({
          bloodPressure: parsed.bloodPressure || '--',
          bloodPressureStatus: parsed.bloodPressureStatus || 'Not recorded',
          bloodSugar: parsed.bloodSugar || '--',
          bloodSugarStatus: parsed.bloodSugarStatus || 'Not recorded',
          heartRate: parsed.heartRate || '--',
          heartRateStatus: parsed.heartRateStatus || 'Not recorded',
          weight: parsed.weight || '--',
          weightStatus: parsed.weight && parsed.weight !== '--' ? 'Normal' : 'Not recorded',
        });
      } catch (e) {}
    }
  }, [router]);

  const handleToggleMed = (id: string | number) => {
    const saved = localStorage.getItem('doc4u_patient_medications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const updated = parsed.map((m: any) => m.id.toString() === id.toString() ? { ...m, checked: !m.checked } : m);
        localStorage.setItem('doc4u_patient_medications', JSON.stringify(updated));
      } catch (e) {}
    }
    setMeds(prev => prev.map(m => m.id.toString() === id.toString() ? { ...m, checked: !m.checked } : m));
  };

  const completedMeds = meds.filter(m => m.checked).length;
  const adherencePercent = meds.length > 0 ? Math.round((completedMeds / meds.length) * 100) : 0;

  // Split appointments into categories
  const booked = appointments.filter((a: any) => a.status === 'CONFIRMED');
  const future = appointments.filter((a: any) => a.status === 'PENDING');
  const previous = appointments.filter((a: any) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW');

  const medsDue = meds.filter(m => !m.checked).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
      <div className="text-center flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-zinc-550 text-xs font-semibold tracking-wider font-sans">Tethering diagnostics overview...</p>
      </div>
    </div>
  );

  const displayName = (profile.fullName && profile.fullName !== 'Arpan') ? profile.fullName : getUsername();

  return (
    <div className={`min-h-screen flex font-sans select-none antialiased transition-all duration-300 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'
      }`}>

      {/* Shared Sidebar */}
      <PatientSidebar username={displayName} avatarUrl={profile.avatarUrl} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 md:pt-7 pb-7 space-y-7 transition-all duration-300">

        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-905'}`}>{getGreeting()}, {displayName}</h1>
            <p className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Here's your health overview for today</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/patient/notifications')}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${isDark
                ? 'bg-zinc-900 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => router.push('/patient/doctors')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Book appointment</span>
            </button>
          </div>
        </div>

        {/* Stats Row Grid (4 columns) — all cards are clickable */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Upcoming', value: booked.length, icon: <Calendar className="w-5 h-5 text-blue-400" />, bg: 'bg-blue-600/10 border-blue-900/30', href: '/patient/appointments' },
            { label: 'Completed', value: previous.filter((p: any) => p.status === 'COMPLETED').length, icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-600/10 border-emerald-900/30', href: '/patient/appointments' },
            { label: 'Medications due', value: medsDue, icon: <Pill className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-600/10 border-amber-900/30', href: '/patient/medications' },
            { label: 'Prescriptions', value: prescriptions.length, icon: <FileText className="w-5 h-5 text-purple-400" />, bg: 'bg-purple-600/10 border-purple-900/30', href: '/patient/prescriptions' },
          ].map((s, idx) => (
            <button
              key={idx}
              onClick={() => router.push(s.href)}
              className={`rounded-xl p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all shadow-xs min-h-[110px] border text-left cursor-pointer active:scale-[0.98] ${isDark
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                {s.icon}
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</div>
                <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{s.label}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Main Dashboard Section Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Panel Card list (Categorized Appointments) */}
          <div className={`lg:col-span-7 rounded-3xl p-6 flex flex-col justify-between transition-all border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-205 shadow-sm'
            }`}>
            <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Appointments</h3>
                <button
                  onClick={() => router.push('/patient/appointments')}
                  className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className={`w-10 h-10 ${isDark ? 'text-zinc-700' : 'text-slate-300'} mx-auto mb-3`} />
                  <p className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-zinc-500' : 'text-slate-450'}`}>No appointments</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {booked.length > 0 && (
                    <div>
                      <h4 className={`text-[9px] font-bold uppercase tracking-wider pl-1 mb-2.5 ${isDark ? 'text-zinc-505' : 'text-slate-500'}`}>Booked Appointments</h4>
                      <div className="space-y-3">
                        {booked.map((appt: any) => (
                          <AppointmentListItem key={appt.id} appt={appt} isDark={isDark} />
                        ))}
                      </div>
                    </div>
                  )}
                  {future.length > 0 && (
                    <div>
                      <h4 className={`text-[9px] font-bold uppercase tracking-wider pl-1 mb-2.5 ${isDark ? 'text-zinc-505' : 'text-slate-500'}`}>Future Appointments</h4>
                      <div className="space-y-3">
                        {future.map((appt: any) => (
                          <AppointmentListItem key={appt.id} appt={appt} isDark={isDark} />
                        ))}
                      </div>
                    </div>
                  )}
                  {previous.length > 0 && (
                    <div>
                      <h4 className={`text-[9px] font-bold uppercase tracking-wider pl-1 mb-2.5 ${isDark ? 'text-zinc-505' : 'text-slate-500'}`}>Previous Appointments</h4>
                      <div className="space-y-3">
                        {previous.map((appt: any) => (
                          <AppointmentListItem key={appt.id} appt={appt} isDark={isDark} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Small Column (Quick Actions) */}
          <div className={`lg:col-span-5 rounded-3xl p-6 transition-all border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-205 shadow-sm'
            }`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-5`}>Quick actions</h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Find doctor', icon: <Search className="w-5 h-5 text-blue-500" />, action: () => router.push('/patient/doctors') },
                { label: 'Upload file', icon: <FileText className="w-5 h-5 text-purple-500" />, action: () => router.push('/patient/prescriptions') },
                { label: 'Health records', icon: <FileSpreadsheet className="w-5 h-5 text-emerald-500" />, action: () => router.push('/patient/health-records') },
                { label: 'Set reminder', icon: <Bell className="w-5 h-5 text-amber-500" />, action: () => router.push('/patient/medications') },
              ].map((act, idx) => (
                <button
                  key={idx}
                  onClick={act.action}
                  className={`flex flex-col items-center justify-center p-5 border rounded-2xl transition-all cursor-pointer text-center group active:scale-95 ${isDark
                    ? 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/80 text-zinc-300 hover:text-white'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600 hover:text-slate-950'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                    {act.icon}
                  </div>
                  <span className="text-[11px] font-bold tracking-wide">{act.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Secondary Row Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Medications checklist card */}
          <div className={`rounded-3xl p-6 flex flex-col justify-between transition-all border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-205 shadow-sm'
            }`}>
            <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Today's medications</h3>
                <button onClick={() => router.push('/patient/medications')} className="text-xs font-bold text-blue-500 hover:text-blue-400 cursor-pointer">
                  Manage
                </button>
              </div>

              <div className="space-y-3.5">
                {meds.length === 0 ? (
                  <div className="py-6 text-center flex flex-col items-center gap-3">
                    <Pill className={`w-8 h-8 ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
                    <p className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No medications added yet.</p>
                    <button
                      onClick={() => router.push('/patient/medications')}
                      className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Add medications</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  meds.map(med => (
                    <div
                      key={med.id}
                      onClick={() => handleToggleMed(med.id)}
                      className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all cursor-pointer ${isDark ? 'bg-zinc-950/40 border-zinc-805 hover:border-zinc-750' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div>
                        <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{med.name}</h4>
                        <p className={`text-[10px] tracking-wide mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-550'}`}>{med.time}</p>
                      </div>
                      {med.checked ? (
                        <CheckCircle2 className="w-5.5 h-5.5 text-blue-500" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border ${isDark ? 'border-zinc-700 bg-zinc-900' : 'border-slate-300 bg-white'}`} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-850/50 pt-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>Today's adherence</span>
                <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>{adherencePercent}%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden border ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-slate-100 border-slate-200'
                }`}>
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${adherencePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Vitals logs card */}
          <div className={`rounded-3xl p-6 transition-all border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-205 shadow-sm'
            }`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Health vitals</h3>
              <button onClick={() => router.push('/patient/health-records')} className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer">
                <span>Update</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* CTA banner when no vitals are logged */}
            {vitals.bloodPressure === '--' && vitals.bloodSugar === '--' && vitals.heartRate === '--' && vitals.weight === '--' && (
              <div className={`rounded-xl p-3.5 mb-4 flex items-center justify-between border ${isDark ? 'bg-blue-950/20 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}>
                <p className={`text-xs font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>No vitals logged yet — track your health metrics.</p>
                <button
                  onClick={() => router.push('/patient/health-records')}
                  className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                >
                  <span>Log now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className={`divide-y space-y-3.5 ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
              {[
                {
                  name: 'Blood pressure',
                  value: vitals.bloodPressure !== '--' ? `${vitals.bloodPressure} mmHg` : '--',
                  status: vitals.bloodPressureStatus,
                  color: vitals.bloodPressureStatus === 'Not recorded'
                    ? (isDark ? 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50' : 'bg-slate-100 text-slate-500 border border-slate-200')
                    : vitals.bloodPressureStatus === 'Normal'
                    ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                    : 'bg-amber-955/35 text-amber-500 border border-amber-900/30'
                },
                {
                  name: 'Blood sugar',
                  value: vitals.bloodSugar !== '--' ? `${vitals.bloodSugar} mg/dL` : '--',
                  status: vitals.bloodSugarStatus,
                  color: vitals.bloodSugarStatus === 'Not recorded'
                    ? (isDark ? 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50' : 'bg-slate-100 text-slate-500 border border-slate-200')
                    : vitals.bloodSugarStatus === 'Watch'
                    ? 'bg-amber-955/35 text-amber-500 border border-amber-900/30'
                    : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                },
                {
                  name: 'Heart rate',
                  value: vitals.heartRate !== '--' ? `${vitals.heartRate} bpm` : '--',
                  status: vitals.heartRateStatus,
                  color: vitals.heartRateStatus === 'Not recorded'
                    ? (isDark ? 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50' : 'bg-slate-100 text-slate-500 border border-slate-200')
                    : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                },
                {
                  name: 'Weight',
                  value: vitals.weight !== '--' ? `${vitals.weight} kg` : '--',
                  status: vitals.weightStatus,
                  color: vitals.weightStatus === 'Not recorded'
                    ? (isDark ? 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50' : 'bg-slate-100 text-slate-500 border border-slate-200')
                    : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                },
              ].map((v, idx) => (
                <div key={idx} onClick={() => router.push('/patient/health-records')} className={`flex justify-between items-center pt-3 cursor-pointer p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-zinc-850/15' : 'hover:bg-slate-50'
                  }`}>
                  <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{v.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{v.value}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md ${v.color}`}>
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Prescription and Docs Grid */}
        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-205 shadow-sm'
          }`}>
          <div className="flex justify-between items-center mb-5">
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent prescriptions and documents</h3>
            <button onClick={() => router.push('/patient/prescriptions')} className="text-xs font-bold text-blue-500 hover:text-blue-400 cursor-pointer">
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center col-span-1 md:col-span-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${isDark ? 'bg-zinc-800/80 text-zinc-400' : 'bg-slate-100 text-slate-400'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No prescriptions or documents</p>
                <p className={`text-[11px] max-w-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Prescriptions issued by your doctor or uploaded records will appear here.
                </p>
              </div>
            ) : (
              prescriptions.slice(0, 4).map((doc: any, idx: number) => {
                const docTitle = doc.diagnosis ? `Prescription — ${doc.diagnosis}` : (doc.appointment?.doctor?.specialization ? `Prescription — Dr. ${doc.appointment.doctor.specialization}` : 'Prescription Document');
                const docDate = doc.issuedAt ? new Date(doc.issuedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
                const fileUrl = doc.fileUrl?.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`;
                return (
                  <div key={doc.id || idx} className={`flex items-center justify-between p-4 border rounded-2xl transition-all select-none ${isDark ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-750' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                    }`}>
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isDark ? 'bg-rose-500/10 border-rose-900/30 text-rose-500' : 'bg-rose-50 border-rose-100 text-rose-600'
                        }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{docTitle}</h4>
                        <p className={`text-[9px] font-semibold mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{docDate}</p>
                      </div>
                    </div>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border cursor-pointer active:scale-95 transition-all ${isDark
                        ? 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm font-semibold'
                        }`}
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

function AppointmentListItem({ appt, isDark }: { appt: any; isDark: boolean }) {
  const styles = statusColors[appt.status] || { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' };
  const stylesLight = appt.status === 'CONFIRMED'
    ? { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-150' }
    : appt.status === 'PENDING'
      ? { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-150' }
      : { bg: 'bg-slate-100', text: 'text-slate-650', border: 'border-slate-200' };

  const badgeStyles = isDark ? styles : stylesLight;

  return (
    <div className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${isDark ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-750' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
      }`}>
      <div className="flex items-center gap-3.5">
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center select-none shrink-0 ${isDark ? 'bg-blue-650/10 border-blue-900/30 text-blue-405' : 'bg-blue-50 border-blue-100 text-blue-600'
          }`}>
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Dr. {appt.doctor?.specialization}</h4>
          <p className={`text-[10px] font-semibold mt-0.5 tracking-wide ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {appt.doctor?.bio ? `${appt.doctor.bio} — ` : ''}
            {new Date(appt.slot?.slotDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} - {appt.slot?.startTime}
          </p>
        </div>
      </div>
      <span className={`text-[9px] font-extrabold uppercase tracking-wider py-1 px-2.5 rounded-lg border shrink-0 ${badgeStyles.bg} ${badgeStyles.text} ${badgeStyles.border}`}>
        {appt.status}
      </span>
    </div>
  );
}