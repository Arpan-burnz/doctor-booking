'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole, getUsername } from '@/lib/auth';
import PatientSidebar from '@/components/shared/PatientSidebar';
import {
  Plus,
  FileText,
  FileSpreadsheet,
  Pill,
  Bell,
  Search,
  Loader2,
  Calendar,
  ChevronRight,
  ArrowRight,
  Download,
  Activity,
  Heart,
  Stethoscope,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  CONFIRMED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  COMPLETED: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  CANCELLED: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  NO_SHOW: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export default function PatientDashboard() {
  const router = useRouter();

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
    avatarUrl: '',
  });

  useEffect(() => {
    if (getUserRole() !== 'PATIENT') {
      router.push('/login');
      return;
    }

    Promise.all([
      api.get('/appointments/mine').then(res => res.data.data).catch(() => []),
      api.get('/prescriptions/patient/mine').then(res => res.data.data).catch(() => []),
    ])
      .then(([appts, prescs]) => {
        setAppointments(appts || []);
        setPrescriptions(prescs || []);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));

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

    const savedMeds = localStorage.getItem('doc4u_patient_medications');
    if (savedMeds) {
      try {
        const parsed = JSON.parse(savedMeds);
        setMeds(
          parsed.map((m: any) => ({
            id: m.id,
            name: `${m.name} ${m.doseAmount}`,
            time: `${m.period || 'Scheduled'} - ${m.scheduleTime}`,
            checked: !!m.checked,
          }))
        );
      } catch (e) {}
    } else {
      setMeds([]);
    }

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
        const updated = parsed.map((m: any) =>
          m.id.toString() === id.toString() ? { ...m, checked: !m.checked } : m
        );
        localStorage.setItem('doc4u_patient_medications', JSON.stringify(updated));
      } catch (e) {}
    }
    setMeds(prev =>
      prev.map(m => (m.id.toString() === id.toString() ? { ...m, checked: !m.checked } : m))
    );
  };

  const completedMeds = meds.filter(m => m.checked).length;
  const adherencePercent = meds.length > 0 ? Math.round((completedMeds / meds.length) * 100) : 0;

  const booked = appointments.filter((a: any) => a.status === 'CONFIRMED');
  const future = appointments.filter((a: any) => a.status === 'PENDING');
  const previous = appointments.filter(
    (a: any) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW'
  );

  const medsDue = meds.filter(m => !m.checked).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-400">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-slate-500 text-xs font-medium font-sans">
            Loading patient overview...
          </p>
        </div>
      </div>
    );
  }

  const displayName =
    profile.fullName && profile.fullName !== 'Arpan' ? profile.fullName : getUsername();

  return (
    <div className="min-h-screen flex font-sans antialiased bg-transparent text-slate-100 selection:bg-purple-900/40 selection:text-purple-200">
      {/* Shared Sidebar */}
      <PatientSidebar username={displayName} avatarUrl={profile.avatarUrl} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 md:px-10 pt-16 md:pt-8 pb-10 space-y-6 max-w-7xl">
        {/* Header: Grounded Context Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Patient Overview
            </h1>
            <p className="text-xs font-normal text-slate-400 mt-1">
              Active consultations and clinical records for {displayName}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push('/patient/notifications')}
              className="w-9 h-9 rounded-xl border border-[#1f293d] bg-[#111827] hover:bg-[#162032] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/patient/doctors')}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book appointment</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards: Quiet Chrome, Sentence Case Labels, Tabular Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Upcoming consultations',
              value: booked.length,
              icon: <Calendar className="w-4 h-4 text-sky-400" />,
              href: '/patient/appointments',
            },
            {
              label: 'Completed visits',
              value: previous.filter((p: any) => p.status === 'COMPLETED').length,
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
              href: '/patient/appointments',
            },
            {
              label: 'Medications due',
              value: medsDue,
              icon: <Pill className="w-4 h-4 text-amber-400" />,
              href: '/patient/medications',
            },
            {
              label: 'Prescriptions on file',
              value: prescriptions.length,
              icon: <FileText className="w-4 h-4 text-sky-400" />,
              href: '/patient/prescriptions',
            },
          ].map((s, idx) => (
            <button
              key={idx}
              onClick={() => router.push(s.href)}
              className="rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-[#1f293d] bg-[#111827] hover:border-slate-700 transition-colors text-left cursor-pointer min-h-[110px]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#1f293d] bg-[#162032]">
                {s.icon}
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold tracking-tight text-white tabular-nums">{s.value}</div>
                <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                  {s.label}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Main Split: Appointments and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Appointments */}
          <div className="lg:col-span-7 rounded-2xl p-6 border border-[#1f293d] bg-[#111827] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-[#1f293d]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-semibold text-white">Your appointments</h3>
                </div>
                <button
                  onClick={() => router.push('/patient/appointments')}
                  className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#1f293d] rounded-xl">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-300">No scheduled appointments</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Search for certified practitioners and reserve an open time slot.
                  </p>
                  <button
                    onClick={() => router.push('/patient/doctors')}
                    className="mt-3.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Find a doctor
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {booked.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-medium text-slate-400 mb-2">
                        Confirmed appointments
                      </h4>
                      <div className="space-y-2">
                        {booked.map((appt: any) => (
                          <AppointmentListItem key={appt.id} appt={appt} />
                        ))}
                      </div>
                    </div>
                  )}

                  {future.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-medium text-slate-400 mb-2">
                        Pending review
                      </h4>
                      <div className="space-y-2">
                        {future.map((appt: any) => (
                          <AppointmentListItem key={appt.id} appt={appt} />
                        ))}
                      </div>
                    </div>
                  )}

                  {previous.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-medium text-slate-400 mb-2">
                        Previous visits
                      </h4>
                      <div className="space-y-2">
                        {previous.slice(0, 3).map((appt: any) => (
                          <AppointmentListItem key={appt.id} appt={appt} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Navigation Tiles */}
          <div className="lg:col-span-5 rounded-2xl p-6 border border-[#1f293d] bg-[#111827] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3.5 border-b border-[#1f293d]">
                <Activity className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-semibold text-white">Quick actions</h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    label: 'Find doctor',
                    desc: 'Browse specialties',
                    icon: <Search className="w-4 h-4 text-sky-400" />,
                    action: () => router.push('/patient/doctors'),
                  },
                  {
                    label: 'Prescriptions',
                    desc: 'Official Rx records',
                    icon: <FileText className="w-4 h-4 text-sky-400" />,
                    action: () => router.push('/patient/prescriptions'),
                  },
                  {
                    label: 'Health records',
                    desc: 'Clinical history',
                    icon: <FileSpreadsheet className="w-4 h-4 text-sky-400" />,
                    action: () => router.push('/patient/health-records'),
                  },
                  {
                    label: 'Medications',
                    desc: 'Scheduled dosage',
                    icon: <Bell className="w-4 h-4 text-sky-400" />,
                    action: () => router.push('/patient/medications'),
                  },
                ].map((act, idx) => (
                  <button
                    key={idx}
                    onClick={act.action}
                    className="flex flex-col items-start p-3.5 border border-[#1f293d] rounded-xl bg-[#162032] hover:border-slate-700 transition-colors cursor-pointer text-left"
                  >
                    <div className="w-7 h-7 rounded-lg border border-[#1f293d] bg-[#090d16] flex items-center justify-center mb-2">
                      {act.icon}
                    </div>
                    <span className="text-xs font-semibold text-white">{act.label}</span>
                    <span className="text-[11px] font-normal text-slate-400 mt-0.5">{act.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preparation notice */}
            <div className="mt-5 p-3.5 rounded-xl bg-[#162032] border border-[#1f293d] flex items-start gap-2.5">
              <Stethoscope className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-200">Consultation preparation</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Have previous lab reports and active prescription files accessible before your appointment begins.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Row: Medications & Vitals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Medications checklist */}
          <div className="rounded-2xl p-6 border border-[#1f293d] bg-[#111827] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-3.5 border-b border-[#1f293d]">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-semibold text-white">Daily medications</h3>
                </div>
                <button
                  onClick={() => router.push('/patient/medications')}
                  className="text-xs font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
                >
                  Manage
                </button>
              </div>

              <div className="space-y-2.5">
                {meds.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-[#1f293d] rounded-xl">
                    <Pill className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs font-normal text-slate-400">No active medications scheduled</p>
                  </div>
                ) : (
                  meds.map(med => (
                    <div
                      key={med.id}
                      onClick={() => handleToggleMed(med.id)}
                      className="flex items-center justify-between p-3 border border-[#1f293d] rounded-xl bg-[#162032] hover:border-slate-700 transition-colors cursor-pointer"
                    >
                      <div>
                        <h4 className="text-xs font-medium text-white">{med.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{med.time}</p>
                      </div>
                      {med.checked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 bg-[#090d16]" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-[#1f293d] pt-3.5">
              <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5">
                <span>Adherence</span>
                <span className="font-semibold text-slate-200 tabular-nums">{adherencePercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-[#090d16]">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${adherencePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Vitals Table: Quiet tabular format */}
          <div className="rounded-2xl p-6 border border-[#1f293d] bg-[#111827]">
            <div className="flex justify-between items-center mb-4 pb-3.5 border-b border-[#1f293d]">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-semibold text-white">Clinical vitals</h3>
              </div>
              <button
                onClick={() => router.push('/patient/health-records')}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
              >
                Update
              </button>
            </div>

            <div className="divide-y divide-[#1f293d]">
              {[
                { name: 'Blood pressure', value: vitals.bloodPressure !== '--' ? `${vitals.bloodPressure} mmHg` : '--', status: vitals.bloodPressureStatus },
                { name: 'Blood sugar', value: vitals.bloodSugar !== '--' ? `${vitals.bloodSugar} mg/dL` : '--', status: vitals.bloodSugarStatus },
                { name: 'Heart rate', value: vitals.heartRate !== '--' ? `${vitals.heartRate} bpm` : '--', status: vitals.heartRateStatus },
                { name: 'Body weight', value: vitals.weight !== '--' ? `${vitals.weight} kg` : '--', status: vitals.weightStatus },
              ].map((v, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push('/patient/health-records')}
                  className="flex justify-between items-center py-2.5 cursor-pointer hover:bg-[#162032] px-2 rounded-lg transition-colors"
                >
                  <span className="text-xs text-slate-400">{v.name}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium text-white tabular-nums">{v.value}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#162032] text-slate-300 border border-[#1f293d]">
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prescriptions and Documents */}
        <div className="rounded-2xl p-6 border border-[#1f293d] bg-[#111827]">
          <div className="flex justify-between items-center mb-4 pb-3.5 border-b border-[#1f293d]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-semibold text-white">Recent prescriptions</h3>
            </div>
            <button
              onClick={() => router.push('/patient/prescriptions')}
              className="text-xs font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {prescriptions.length === 0 ? (
              <div className="py-8 text-center col-span-1 md:col-span-2 border border-dashed border-[#1f293d] rounded-xl">
                <FileText className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400">No prescriptions on file</p>
              </div>
            ) : (
              prescriptions.slice(0, 4).map((doc: any, idx: number) => {
                const docTitle = doc.diagnosis
                  ? `Prescription: ${doc.diagnosis}`
                  : doc.appointment?.doctor?.specialization
                  ? `Prescription: Dr. ${doc.appointment.doctor.specialization}`
                  : 'Official Prescription';
                const docDate = doc.issuedAt
                  ? new Date(doc.issuedAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Recent';
                const fileUrl = doc.fileUrl?.startsWith('http')
                  ? doc.fileUrl
                  : `http://localhost:5000${doc.fileUrl}`;
                return (
                  <div
                    key={doc.id || idx}
                    className="flex items-center justify-between p-3.5 border border-[#1f293d] rounded-xl bg-[#162032]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg border border-[#1f293d] bg-[#090d16] text-sky-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-white truncate max-w-xs">{docTitle}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{docDate}</p>
                      </div>
                    </div>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#1f293d] bg-[#090d16] text-slate-400 hover:text-white transition-colors"
                      title="Download file"
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

function AppointmentListItem({ appt }: { appt: any }) {
  const styles = statusColors[appt.status] || {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };

  const doctorName = appt.doctor?.name || (appt.doctor?.specialization ? `Dr. ${appt.doctor.specialization}` : 'Specialist');

  return (
    <div className="flex items-center justify-between p-3.5 border border-[#1f293d] rounded-xl bg-[#162032]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg border border-[#1f293d] bg-[#090d16] text-sky-400 flex items-center justify-center shrink-0">
          <Stethoscope className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-medium text-white">{doctorName}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {appt.slot?.slotDate ? new Date(appt.slot.slotDate).toLocaleDateString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }) : 'Scheduled'}
            {appt.slot?.startTime ? ` at ${appt.slot.startTime}` : ''}
          </p>
        </div>
      </div>
      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${styles.bg} ${styles.text} ${styles.border}`}
      >
        {appt.status === 'CONFIRMED' ? 'Confirmed' : appt.status === 'PENDING' ? 'Pending' : appt.status}
      </span>
    </div>
  );
}
