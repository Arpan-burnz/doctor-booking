'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole, getUserEmail } from '@/lib/auth';
import {
  Calendar,
  Clock,
  Users,
  Star,
  Plus,
  Upload,
  Search,
  CalendarDays,
  CalendarX,
  MoreHorizontal,
  Video,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ExternalLink,
  RefreshCw,
  FileText,
  ShieldAlert,
  Lock,
} from 'lucide-react';

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

function formatReviewerName(email?: string) {
  if (!email) return 'Patient';
  const raw = email.split('@')[0];
  const parts = raw.split(/[._-]/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} ${parts[1].charAt(0).toUpperCase()}.`;
  }
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  // Action Modals State
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showBlockDateModal, setShowBlockDateModal] = useState(false);
  const [showUploadRxModal, setShowUploadRxModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState<any>(null);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  // Forms
  const [slotForm, setSlotForm] = useState({
    slotDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '09:30',
    mode: 'single', // 'single' | 'morning' | 'afternoon'
  });
  const [blockDateForm, setBlockDateForm] = useState({
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    reason: '',
  });
  const [rxForm, setRxForm] = useState({
    appointmentId: '',
    diagnosis: '',
  });
  const rxFileRef = useRef<HTMLInputElement>(null);

  const [modalLoading, setModalLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const email = getUserEmail() || '';

  // Fetch Dashboard Data directly from database
  const loadData = useCallback(async (isRefresh = false) => {
    if (getUserRole() !== 'DOCTOR') {
      router.push('/login');
      return;
    }
    if (isRefresh) setRefreshing(true);
    try {
      const [statsRes, apptRes, profileRes] = await Promise.allSettled([
        api.get('/doctors/me/dashboard-stats'),
        api.get('/appointments/mine'),
        api.get('/doctors/me/profile'),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStatsData(statsRes.value.data.data);
      }
      if (apptRes.status === 'fulfilled') {
        setAppointments(apptRes.value.data.data || []);
      }
      if (profileRes.status === 'fulfilled') {
        setDoctorProfile(profileRes.value.data.data);
      }
    } catch {
      // Handle gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Doctor Name calculation strictly from database profile: default is email ID
  const isVerified = doctorProfile?.isVerified ?? false;
  const isSuspended = Boolean(doctorProfile?.isSuspended);
  const doctorDisplayName = doctorProfile?.name?.trim() ? doctorProfile.name : (email || 'Doctor');

  // Filter Today's appointments strictly from database
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todayAppts = (statsData?.todaySchedule && Array.isArray(statsData.todaySchedule))
    ? statsData.todaySchedule
    : appointments.filter(a => {
        if (!a.slot?.slotDate) return false;
        const d = new Date(a.slot.slotDate);
        return d >= startOfToday && d <= endOfToday;
      }).sort((a, b) => (a.slot?.startTime || '').localeCompare(b.slot?.startTime || ''));

  // Calculate next upcoming appointment from database records
  const nextAppt = todayAppts.find((a: any) => {
    if (a.status !== 'CONFIRMED' && a.status !== 'PENDING') return false;
    if (!a.slot?.startTime) return false;
    const [h, m] = a.slot.startTime.split(':').map(Number);
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);
    return slotDate >= now;
  }) || todayAppts.find((a: any) => a.status === 'CONFIRMED' || a.status === 'PENDING') || todayAppts[0];

  // Pure Database Metrics
  const statToday = statsData?.todayCount ?? todayAppts.length;
  const statWeek = statsData?.weekCount ?? 0;
  const statPatients = statsData?.totalPatients ?? (new Set(appointments.map(a => a.patientId)).size);
  const statRating = statsData?.rating ?? 0;
  const statReviewsCount = statsData?.reviewCount ?? (doctorProfile?.reviews?.length || 0);

  // Pure Database Reviews
  const displayReviews = (statsData?.recentReviews && statsData.recentReviews.length > 0)
    ? statsData.recentReviews
    : (doctorProfile?.reviews && doctorProfile.reviews.length > 0)
      ? doctorProfile.reviews
      : [];

  // Handlers
  const handleOpenAddSlots = () => {
    if (isSuspended) {
      alert('Doctor account is currently suspended. You cannot add slots.');
      return;
    }
    if (!isVerified) {
      alert('wait untill u get verified');
      return;
    }
    setShowAddSlotModal(true);
  };

  const handleCreateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      setModalError('Doctor account is suspended. Adding slots prohibited.');
      return;
    }
    if (!isVerified) {
      setModalError('wait untill u get verified');
      return;
    }

    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      let slotsToCreate: any[] = [];
      if (slotForm.mode === 'single') {
        slotsToCreate = [{
          slotDate: slotForm.slotDate,
          startTime: slotForm.startTime,
          endTime: slotForm.endTime,
        }];
      } else if (slotForm.mode === 'morning') {
        slotsToCreate = [
          { slotDate: slotForm.slotDate, startTime: '09:00', endTime: '09:30' },
          { slotDate: slotForm.slotDate, startTime: '09:30', endTime: '10:00' },
          { slotDate: slotForm.slotDate, startTime: '10:00', endTime: '10:30' },
          { slotDate: slotForm.slotDate, startTime: '10:30', endTime: '11:00' },
          { slotDate: slotForm.slotDate, startTime: '11:00', endTime: '11:30' },
          { slotDate: slotForm.slotDate, startTime: '11:30', endTime: '12:00' },
        ];
      } else if (slotForm.mode === 'afternoon') {
        slotsToCreate = [
          { slotDate: slotForm.slotDate, startTime: '14:00', endTime: '14:30' },
          { slotDate: slotForm.slotDate, startTime: '14:30', endTime: '15:00' },
          { slotDate: slotForm.slotDate, startTime: '15:00', endTime: '15:30' },
          { slotDate: slotForm.slotDate, startTime: '15:30', endTime: '16:00' },
          { slotDate: slotForm.slotDate, startTime: '16:00', endTime: '16:30' },
          { slotDate: slotForm.slotDate, startTime: '16:30', endTime: '17:00' },
        ];
      }

      await api.post('/slots', { slots: slotsToCreate });
      setModalSuccess(`Successfully created ${slotsToCreate.length} availability slot(s)`);
      setTimeout(() => {
        setShowAddSlotModal(false);
        setModalSuccess('');
        loadData(true);
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'wait untill u get verified');
    } finally {
      setModalLoading(false);
    }
  };

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      setModalError('Doctor account is currently suspended. Blocking dates prohibited.');
      return;
    }
    if (!isVerified) {
      setModalError('wait untill u get verified');
      return;
    }

    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await api.post('/slots/block-date', {
        date: blockDateForm.date,
        reason: blockDateForm.reason,
      });
      setModalSuccess(res.data.message || 'Date successfully blocked');
      setTimeout(() => {
        setShowBlockDateModal(false);
        setModalSuccess('');
        loadData(true);
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'wait untill u get verified');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUploadRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      setModalError('Doctor account is currently suspended. Prescription issuing prohibited.');
      return;
    }
    if (!rxFileRef.current?.files?.[0]) {
      setModalError('Please select a file to upload');
      return;
    }
    if (!rxForm.appointmentId) {
      setModalError('Please select an appointment');
      return;
    }

    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', rxFileRef.current.files[0]);
      formData.append('appointmentId', rxForm.appointmentId);
      if (rxForm.diagnosis) formData.append('diagnosis', rxForm.diagnosis);

      await api.post('/prescriptions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setModalSuccess('Prescription uploaded successfully');
      setTimeout(() => {
        setShowUploadRxModal(false);
        setModalSuccess('');
        loadData(true);
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to upload prescription');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCompleteSession = async (apptId: string) => {
    if (isSuspended) {
      setModalError('Doctor account is currently suspended. Completing sessions prohibited.');
      return;
    }
    setModalLoading(true);
    try {
      await api.patch(`/appointments/${apptId}/complete`);
      setModalSuccess('Consultation completed successfully');
      setTimeout(() => {
        setShowStartModal(null);
        setModalSuccess('');
        loadData(true);
      }, 1200);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to complete session');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <p className="text-slate-400 text-xs">Loading doctor portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-full bg-transparent text-slate-100">
      {/* Account Suspended Alert Banner */}
      {isSuspended ? (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-rose-100">Practitioner Account Suspended</p>
              <p className="text-rose-200/80 mt-0.5">Your doctor account has been suspended by an administrator. You are prohibited from managing slots, blocking dates, and issuing prescriptions.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium text-[11px] whitespace-nowrap">
            Suspended
          </span>
        </div>
      ) : !isVerified ? (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-medium text-amber-300">Account pending verification</p>
              <p className="text-amber-200/80 mt-0.5">Your medical license credentials are under review by the platform administrator. You cannot open appointment slots until verified.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium text-[11px] whitespace-nowrap">
            Pending review
          </span>
        </div>
      ) : null}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Doctor Workspace
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {doctorDisplayName} · {todayAppts.length > 0
              ? `${todayAppts.length} appointment${todayAppts.length !== 1 ? 's' : ''} today${nextAppt?.slot?.startTime ? `, next one at ${formatTime(nextAppt.slot.startTime)}` : ''}`
              : 'No appointments scheduled for today'}
          </p>
        </div>

        {/* Header Right Action Buttons */}
        <div className="flex items-center gap-2.5 relative">
          <button
            onClick={handleOpenAddSlots}
            disabled={isSuspended}
            className={`flex items-center gap-2 px-3.5 py-2 border rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isSuspended
                ? 'bg-[#111827]/70 backdrop-blur-sm border-rose-500/30 text-rose-300'
                : !isVerified
                  ? 'bg-[#111827]/70 backdrop-blur-sm border-amber-500/30 text-amber-300 hover:border-amber-500'
                  : 'bg-[#111827]/70 hover:bg-[#162032] backdrop-blur-sm border-[#1f293d] hover:border-slate-600 text-white'
            }`}
            title={isSuspended ? 'Account suspended' : !isVerified ? 'wait untill u get verified' : 'Add availability slots'}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add slots</span>
            {(isSuspended || !isVerified) && <Lock className="w-3.5 h-3.5 text-amber-400 ml-0.5" />}
          </button>

          {/* Three dots button */}
          <div className="relative">
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="p-2 bg-[#111827]/70 hover:bg-[#162032] backdrop-blur-sm border border-[#1f293d] hover:border-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenuDropdown && (
              <div className="absolute right-0 top-11 w-52 bg-[#162032]/85 backdrop-blur-xl border border-[#1f293d] rounded-xl shadow-lg p-1.5 z-40">
                <button
                  onClick={() => { setShowMenuDropdown(false); loadData(true); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh data
                </button>
                <button
                  onClick={() => { setShowMenuDropdown(false); router.push('/doctor/appointments'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  View all appointments
                </button>
                <button
                  onClick={() => { setShowMenuDropdown(false); router.push('/doctor/slots'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Manage schedule & slots
                </button>
                <button
                  onClick={() => { setShowMenuDropdown(false); router.push('/doctor/earnings'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  View earnings summary
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row of 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Today */}
        <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-4 flex flex-col justify-between hover:bg-[#111827]/80 hover:border-slate-700/80 transition-all">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-white mt-3 mb-1 tracking-tight">
              {statToday}
            </div>
          </div>
          <div className="text-slate-400 text-xs">
            Today
          </div>
        </div>

        {/* Card 2: Upcoming this week */}
        <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-4 flex flex-col justify-between hover:bg-[#111827]/80 hover:border-slate-700/80 transition-all">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-white mt-3 mb-1 tracking-tight">
              {statWeek}
            </div>
          </div>
          <div className="text-slate-400 text-xs">
            Upcoming this week
          </div>
        </div>

        {/* Card 3: Total patients */}
        <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-4 flex flex-col justify-between hover:bg-[#111827]/80 hover:border-slate-700/80 transition-all">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-white mt-3 mb-1 tracking-tight">
              {statPatients}
            </div>
          </div>
          <div className="text-slate-400 text-xs">
            Total patients
          </div>
        </div>

        {/* Card 4: Rating */}
        <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-4 flex flex-col justify-between hover:bg-[#111827]/80 hover:border-slate-700/80 transition-all">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Star className="w-4 h-4" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-white mt-3 mb-1 tracking-tight">
              {statReviewsCount > 0 ? (typeof statRating === 'number' ? statRating.toFixed(1) : statRating) : '—'}
            </div>
          </div>
          <div className="text-slate-400 text-xs">
            Rating ({statReviewsCount} review{statReviewsCount !== 1 ? 's' : ''})
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Today's Schedule */}
        <div className="lg:col-span-7 bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1f293d]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today&apos;s schedule
            </h2>
            <button
              onClick={() => router.push('/doctor/appointments')}
              className="text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-colors cursor-pointer"
            >
              View all
            </button>
          </div>

          {todayAppts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Calendar className="w-8 h-8 text-slate-600 mb-2.5" />
              <p className="text-slate-300 text-xs font-medium">No appointments today</p>
              <p className="text-slate-500 text-xs mt-0.5 mb-4">You have a clear schedule today</p>
              <button
                onClick={handleOpenAddSlots}
                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
              >
                + Add availability slot
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1f293d]">
              {todayAppts.map((appt: any, idx: number) => {
                const patientEmail = appt.patient?.user?.email || '';
                const pName = cleanPatientName(patientEmail);
                const subtitle = appt.notes || 'General consultation';
                const isConfirmed = appt.status === 'CONFIRMED';
                const isPending = appt.status === 'PENDING';
                const isNext = (appt.id === nextAppt?.id) || (idx === 0 && (isConfirmed || isPending));

                return (
                  <div
                    key={appt.id || idx}
                    className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1 gap-4"
                  >
                    {/* Time */}
                    <div className="w-16 shrink-0 text-white font-medium text-xs tabular-nums">
                      {appt.slot?.startTime || '09:00'}
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-white text-xs font-medium truncate">
                        {pName}
                      </p>
                      <p className="text-slate-400 text-[11px] truncate mt-0.5">
                        {subtitle}
                      </p>
                    </div>

                    {/* Status Badges & Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isNext ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            Next up
                          </span>
                          <button
                            onClick={() => setShowStartModal(appt)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Start
                          </button>
                        </>
                      ) : isConfirmed ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Confirmed
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          {appt.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quick actions & Latest reviews */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Quick Actions */}
          <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3.5">
              Quick actions
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Add slots */}
              <button
                onClick={handleOpenAddSlots}
                className="border border-[#1f293d]/80 hover:border-slate-600 bg-[#162032]/70 hover:bg-[#1a263c] p-3.5 rounded-lg transition-colors flex flex-col justify-between items-start text-left cursor-pointer"
              >
                <div className="text-emerald-400 flex items-center justify-between w-full">
                  <Clock className="w-4 h-4" />
                  {!isVerified && <span className="text-[10px] text-amber-400 font-medium">Locked</span>}
                </div>
                <span className="text-white text-xs font-medium mt-3">
                  Add slots
                </span>
              </button>

              {/* 2. Upload Rx */}
              <button
                onClick={() => setShowUploadRxModal(true)}
                className="border border-[#1f293d]/80 hover:border-slate-600 bg-[#162032]/70 hover:bg-[#1a263c] p-3.5 rounded-lg transition-colors flex flex-col justify-between items-start text-left cursor-pointer"
              >
                <div className="text-emerald-400">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-white text-xs font-medium mt-3">
                  Upload Rx
                </span>
              </button>

              {/* 3. Find patient */}
              <button
                onClick={() => router.push('/doctor/patients')}
                className="border border-[#1f293d]/80 hover:border-slate-600 bg-[#162032]/70 hover:bg-[#1a263c] p-3.5 rounded-lg transition-colors flex flex-col justify-between items-start text-left cursor-pointer"
              >
                <div className="text-emerald-400">
                  <Search className="w-4 h-4" />
                </div>
                <span className="text-white text-xs font-medium mt-3">
                  Find patient
                </span>
              </button>

              {/* 4. Block a date */}
              <button
                onClick={() => {
                  if (!isVerified) {
                    alert('wait untill u get verified');
                    return;
                  }
                  setShowBlockDateModal(true);
                }}
                className="border border-[#1f293d]/80 hover:border-slate-600 bg-[#162032]/70 hover:bg-[#1a263c] p-3.5 rounded-lg transition-colors flex flex-col justify-between items-start text-left cursor-pointer"
              >
                <div className="text-emerald-400 flex items-center justify-between w-full">
                  <CalendarX className="w-4 h-4" />
                  {!isVerified && <span className="text-[10px] text-amber-400 font-medium">Locked</span>}
                </div>
                <span className="text-white text-xs font-medium mt-3">
                  Block a date
                </span>
              </button>
            </div>
          </div>

          {/* Card 2: Latest Reviews */}
          <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3.5">
              Latest reviews
            </h2>

            {displayReviews.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <Star className="w-5 h-5 text-slate-600 mb-2" />
                <p className="text-slate-400 text-xs font-medium">No reviews recorded yet</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Reviews submitted by your patients will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayReviews.slice(0, 3).map((rev: any, idx: number) => {
                  const reviewerEmail = rev.patient?.user?.email;
                  const reviewerName = formatReviewerName(reviewerEmail) || 'Patient';
                  const ratingVal = typeof rev.rating === 'number' ? rev.rating.toFixed(1) : rev.rating;
                  const commentText = rev.comment || 'Patient consultation review';

                  return (
                    <div
                      key={rev.id || idx}
                      className="border-b border-[#1f293d] pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-amber-400 font-medium">{ratingVal} ★</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-200 font-medium">{reviewerName}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        {commentText}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD SLOTS */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111827]/90 backdrop-blur-xl border border-[#1f293d]/80 rounded-xl w-full max-w-md max-h-[90dvh] overflow-y-auto p-6 relative">
            <button
              onClick={() => { setShowAddSlotModal(false); setModalError(''); setModalSuccess(''); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[#1f293d]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Add availability slots</h3>
                <p className="text-slate-400 text-xs">Set when patients can book with you</p>
              </div>
            </div>

            {modalSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSlots} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={slotForm.slotDate}
                  onChange={e => setSlotForm({ ...slotForm, slotDate: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] focus:border-emerald-500 focus:outline-none rounded-lg text-xs text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Creation mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'single', label: 'Custom' },
                    { id: 'morning', label: 'Morning (9-12)' },
                    { id: 'afternoon', label: 'Afternoon (2-5)' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSlotForm({ ...slotForm, mode: m.id })}
                      className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        slotForm.mode === m.id
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#162032] text-slate-400 border border-[#1f293d] hover:text-white hover:bg-[#1a263c]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {slotForm.mode === 'single' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Start time</label>
                    <input
                      type="time"
                      required
                      value={slotForm.startTime}
                      onChange={e => setSlotForm({ ...slotForm, startTime: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] focus:border-emerald-500 focus:outline-none rounded-lg text-xs text-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">End time</label>
                    <input
                      type="time"
                      required
                      value={slotForm.endTime}
                      onChange={e => setSlotForm({ ...slotForm, endTime: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] focus:border-emerald-500 focus:outline-none rounded-lg text-xs text-white transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#1f293d] bg-[#162032] text-slate-300 text-xs font-medium hover:bg-[#1a263c] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {modalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save slots
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BLOCK A DATE */}
      {showBlockDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111827]/90 backdrop-blur-xl border border-[#1f293d]/80 rounded-xl w-full max-w-md max-h-[90dvh] overflow-y-auto p-6 relative">
            <button
              onClick={() => { setShowBlockDateModal(false); setModalError(''); setModalSuccess(''); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[#1f293d]">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <CalendarX className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Block a date</h3>
                <p className="text-slate-400 text-xs">Remove unbooked slots for an entire day</p>
              </div>
            </div>

            {modalSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleBlockDate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Date to block</label>
                <input
                  type="date"
                  required
                  value={blockDateForm.date}
                  onChange={e => setBlockDateForm({ ...blockDateForm, date: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] focus:border-rose-500 focus:outline-none rounded-lg text-xs text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Reason (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Attending medical conference"
                  value={blockDateForm.reason}
                  onChange={e => setBlockDateForm({ ...blockDateForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] focus:border-rose-500 focus:outline-none rounded-lg text-xs text-white transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBlockDateModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#1f293d] bg-[#162032] text-slate-300 text-xs font-medium hover:bg-[#1a263c] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {modalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarX className="w-3.5 h-3.5" />}
                  Confirm block date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: UPLOAD RX */}
      {showUploadRxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111827]/90 backdrop-blur-xl border border-[#1f293d]/80 rounded-xl w-full max-w-md max-h-[90dvh] overflow-y-auto p-6 relative">
            <button
              onClick={() => { setShowUploadRxModal(false); setModalError(''); setModalSuccess(''); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[#1f293d]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Upload prescription (Rx)</h3>
                <p className="text-slate-400 text-xs">Issue digital prescription to a patient</p>
              </div>
            </div>

            {modalSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUploadRx} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Select patient session</label>
                <select
                  required
                  value={rxForm.appointmentId}
                  onChange={e => setRxForm({ ...rxForm, appointmentId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] focus:border-emerald-500 focus:outline-none rounded-lg text-xs text-white transition-colors"
                >
                  <option value="">Choose appointment</option>
                  {appointments.slice(0, 15).map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {cleanPatientName(a.patient?.user?.email)} · {a.slot?.slotDate ? new Date(a.slot.slotDate).toLocaleDateString() : ''} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Clinical diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Mild hypertension, stage 1"
                  value={rxForm.diagnosis}
                  onChange={e => setRxForm({ ...rxForm, diagnosis: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#090d16] border border-[#1f293d] focus:border-emerald-500 focus:outline-none rounded-lg text-xs text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Prescription document (PDF / image)</label>
                <input
                  type="file"
                  required
                  ref={rxFileRef}
                  accept=".pdf,image/*"
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 transition-colors cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUploadRxModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#1f293d] bg-[#162032] text-slate-300 text-xs font-medium hover:bg-[#1a263c] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {modalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Upload Rx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: START CONSULTATION */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111827]/90 backdrop-blur-xl border border-[#1f293d]/80 rounded-xl w-full max-w-md max-h-[90dvh] overflow-y-auto p-6 relative">
            <button
              onClick={() => { setShowStartModal(null); setModalError(''); setModalSuccess(''); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[#1f293d]">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Start consultation session</h3>
                <p className="text-slate-400 text-xs">Patient: {cleanPatientName(showStartModal.patient?.user?.email)}</p>
              </div>
            </div>

            {modalSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div className="p-3 bg-[#162032] rounded-lg border border-[#1f293d]">
                <p className="text-[11px] font-medium text-slate-400">Scheduled time</p>
                <p className="text-xs font-medium tabular-nums text-white mt-0.5">{showStartModal.slot?.startTime} · 30 mins</p>
              </div>

              <div className="p-3 bg-[#162032] rounded-lg border border-[#1f293d]">
                <p className="text-[11px] font-medium text-slate-400">Chief complaint / notes</p>
                <p className="text-xs text-slate-200 mt-0.5">{showStartModal.notes || 'General consultation'}</p>
              </div>

              <div className="p-3 bg-[#162032] rounded-lg border border-[#1f293d]">
                <p className="text-[11px] font-medium text-slate-400">Video room URL</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-xs text-sky-400 font-mono truncate">
                    {showStartModal.videoLink || `https://meet.google.com/doc4u-${showStartModal.id.slice(0, 8)}`}
                  </span>
                  <a
                    href={showStartModal.videoLink || `https://meet.google.com/doc4u-${showStartModal.id.slice(0, 8)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <a
                href={showStartModal.videoLink || `https://meet.google.com/doc4u-${showStartModal.id.slice(0, 8)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                Join video call
              </a>

              <button
                onClick={() => handleCompleteSession(showStartModal.id)}
                disabled={modalLoading}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {modalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Complete session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
