'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole, getUsername } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import PatientSidebar from '@/components/shared/PatientSidebar';
import { ToastContainer, useToast } from '@/components/shared/Toast';
import {
  Plus,
  Calendar,
  Search,
  FileText,
  Loader2,
  Activity,
  Clock,
  IndianRupee,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCheck,
  MessageSquare,
  Video,
  ArrowUpDown,
  Edit3,
  CalendarDays,
  X,
  Check,
  AlertTriangle,
  Star,
  Download,
  Printer,
  ExternalLink,
  RotateCcw,
  Info,
  HelpCircle,
  CalendarPlus,
  Send,
  MailCheck,
  LayoutGrid,
  ListTree,
  FileDown,
  Phone,
  Mail,
  Award
} from 'lucide-react';

export default function PatientAppointments() {
  const router = useRouter();

  // States
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest');

  // View Switcher State: 'grid' | 'timeline'
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // Date Range Filtering States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Doctor Quick-Profile Modal State
  const [quickProfileDoctor, setQuickProfileDoctor] = useState<any>(null);

  // Export History PDF Report Modal State
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);

  // Modal States
  const [cancelModalAppt, setCancelModalAppt] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  const [rescheduleModalAppt, setRescheduleModalAppt] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const [notesModalAppt, setNotesModalAppt] = useState<any>(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [reviewModalAppt, setReviewModalAppt] = useState<any>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [summaryModalAppt, setSummaryModalAppt] = useState<any>(null);
  const [isStatusGuideOpen, setIsStatusGuideOpen] = useState(false);

  // Resend Reminder State
  const [reminderSendingId, setReminderSendingId] = useState<string | null>(null);
  const [reminderSentId, setReminderSentId] = useState<string | null>(null);

  // Inline Error Alerts per Card State
  const [cardErrors, setCardErrors] = useState<{ [apptId: string]: string }>({});

  const { theme, setTheme, isDark } = useTheme();
  const { toasts, addToast, removeToast } = useToast();

  // Helper to detect if a slot date/time has passed
  const isSlotPast = (slotDateStr?: string, startTimeStr?: string) => {
    if (!slotDateStr) return false;
    try {
      const slotDate = new Date(slotDateStr);
      if (startTimeStr) {
        const [time, modifier] = startTimeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        slotDate.setHours(hours, minutes, 0, 0);
      }
      return slotDate.getTime() < new Date().getTime();
    } catch (e) {
      return false;
    }
  };

  // Derive effective status
  const getEffectiveStatus = (appt: any) => {
    if (
      (appt.status === 'CONFIRMED' || appt.status === 'PENDING') &&
      isSlotPast(appt.slot?.slotDate, appt.slot?.startTime)
    ) {
      return 'NO_SHOW';
    }
    return appt.status;
  };

  // Load appointments
  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/mine');
      setAppointments(res.data.data || []);
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getUserRole() !== 'PATIENT') {
      router.push('/login');
      return;
    }
    fetchAppointments();
  }, [router]);

  // Clear card error banner
  const clearCardError = (apptId: string) => {
    setCardErrors(prev => {
      const copy = { ...prev };
      delete copy[apptId];
      return copy;
    });
  };

  // Cancel Action
  const handleConfirmCancel = async () => {
    if (!cancelModalAppt) return;
    setCancelling(true);
    clearCardError(cancelModalAppt.id);
    try {
      await api.patch(`/appointments/${cancelModalAppt.id}/cancel`);
      setAppointments(prev =>
        prev.map(a => (a.id === cancelModalAppt.id ? { ...a, status: 'CANCELLED' } : a))
      );
      setCancelModalAppt(null);
      addToast('Appointment cancelled successfully.', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to cancel appointment. It may already be cancelled.';
      setCardErrors(prev => ({ ...prev, [cancelModalAppt.id]: errMsg }));
      setCancelModalAppt(null);
    } finally {
      setCancelling(false);
    }
  };

  // Reschedule Action
  const handleOpenRescheduleModal = async (appt: any) => {
    setRescheduleModalAppt(appt);
    setSelectedSlotId('');
    setLoadingSlots(true);
    clearCardError(appt.id);
    try {
      const res = await api.get(`/doctors/${appt.doctorId}/slots`);
      setAvailableSlots(res.data.data || []);
    } catch (err) {
      console.error('Failed to load slots', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleModalAppt || !selectedSlotId) return;
    setRescheduling(true);
    clearCardError(rescheduleModalAppt.id);
    try {
      const res = await api.patch(`/appointments/${rescheduleModalAppt.id}/reschedule`, {
        slotId: selectedSlotId
      });
      const updatedAppt = res.data.data;
      setAppointments(prev =>
        prev.map(a => (a.id === rescheduleModalAppt.id ? { ...a, ...updatedAppt } : a))
      );
      setRescheduleModalAppt(null);
      addToast('Appointment rescheduled successfully.', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to reschedule appointment.';
      setCardErrors(prev => ({ ...prev, [rescheduleModalAppt.id]: errMsg }));
      setRescheduleModalAppt(null);
    } finally {
      setRescheduling(false);
    }
  };

  // Edit Notes Action
  const handleOpenNotesModal = (appt: any) => {
    setNotesModalAppt(appt);
    setEditedNotes(appt.notes || '');
    clearCardError(appt.id);
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesModalAppt) return;
    setSavingNotes(true);
    clearCardError(notesModalAppt.id);
    try {
      await api.patch(`/appointments/${notesModalAppt.id}/notes`, {
        notes: editedNotes
      });
      setAppointments(prev =>
        prev.map(a => (a.id === notesModalAppt.id ? { ...a, notes: editedNotes } : a))
      );
      setNotesModalAppt(null);
      addToast('Notes saved successfully.', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update notes.';
      setCardErrors(prev => ({ ...prev, [notesModalAppt.id]: errMsg }));
      setNotesModalAppt(null);
    } finally {
      setSavingNotes(false);
    }
  };

  // Submit Review Action
  const handleOpenReviewModal = (appt: any) => {
    setReviewModalAppt(appt);
    setRatingScore(5);
    setReviewComment('');
    clearCardError(appt.id);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalAppt) return;
    setSubmittingReview(true);
    clearCardError(reviewModalAppt.id);
    try {
      const res = await api.post(`/appointments/${reviewModalAppt.id}/review`, {
        rating: ratingScore,
        comment: reviewComment
      });
      const createdReview = res.data.data;
      setAppointments(prev =>
        prev.map(a => (a.id === reviewModalAppt.id ? { ...a, review: createdReview } : a))
      );
      setReviewModalAppt(null);
      addToast('Review submitted — thank you!', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to submit review.';
      setCardErrors(prev => ({ ...prev, [reviewModalAppt.id]: errMsg }));
      setReviewModalAppt(null);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Resend Reminder Action
  const handleResendReminder = async (apptId: string) => {
    setReminderSendingId(apptId);
    clearCardError(apptId);
    try {
      await api.post(`/appointments/${apptId}/resend-reminder`);
      setReminderSentId(apptId);
      setTimeout(() => setReminderSentId(null), 4000);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to resend reminder.';
      setCardErrors(prev => ({ ...prev, [apptId]: errMsg }));
    } finally {
      setReminderSendingId(null);
    }
  };

  // Add to Calendar .ics Generator
  const downloadCalendarICS = (appt: any) => {
    const docName = getDoctorDisplayName(appt.doctor?.specialization);
    const spec = appt.doctor?.specialization || 'Consultation';
    const notes = appt.notes || 'No extra notes provided';

    let startDate = new Date();
    if (appt.slot?.slotDate) {
      startDate = new Date(appt.slot.slotDate);
      if (appt.slot?.startTime) {
        try {
          const [time, modifier] = appt.slot.startTime.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (modifier === 'PM' && hours < 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
          startDate.setHours(hours, minutes, 0, 0);
        } catch (e) {}
      }
    }

    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
    const formatICalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DOC4U Healthcare//Doctor Appointment//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:appt-${appt.id}@doc4u.com`,
      `DTSTAMP:${formatICalDate(new Date())}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:Doctor Appointment - ${docName} (${spec})`,
      `DESCRIPTION:Consultation with ${docName}. Specialization: ${spec}. Patient Notes: ${notes}`,
      'LOCATION:DOC4U Healthcare Virtual Clinic',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `appointment-${appt.id.slice(0, 8)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Relative Countdown Badge
  const getRelativeCountdown = (slotDateStr?: string, startTimeStr?: string) => {
    if (!slotDateStr) return null;
    try {
      const slotDate = new Date(slotDateStr);
      if (startTimeStr) {
        const [time, modifier] = startTimeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        slotDate.setHours(hours, minutes, 0, 0);
      }

      const now = new Date();
      const diffMs = slotDate.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs < 0 && diffMs >= -60 * 60 * 1000) return 'Active now';
      if (diffMs < 0) return null;
      if (diffHours < 1) {
        const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        return `In ${mins} mins`;
      }
      if (diffHours < 24) return `In ${diffHours} hours`;
      if (diffDays === 1) return `Tomorrow at ${startTimeStr || '9:30 AM'}`;
      return `In ${diffDays} days`;
    } catch (e) {
      return null;
    }
  };

  // Check Video Call Eligibility (15 minutes window)
  const isVideoCallEligible = (appt: any) => {
    const effStatus = getEffectiveStatus(appt);
    if (effStatus !== 'CONFIRMED' && effStatus !== 'PENDING') return false;
    if (appt.slot?.slotDate && appt.slot?.startTime) {
      try {
        const slotDate = new Date(appt.slot.slotDate);
        const [time, modifier] = appt.slot.startTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        slotDate.setHours(hours, minutes, 0, 0);

        const now = new Date();
        const diffInMinutes = (slotDate.getTime() - now.getTime()) / (1000 * 60);
        return diffInMinutes <= 15 && diffInMinutes >= -60;
      } catch (e) {
        return true;
      }
    }
    return true;
  };

  const getDoctorDisplayName = (specialization?: string) => {
    const spec = (specialization || '').toLowerCase();
    if (spec.includes('cardiol')) return 'Dr. Priya Sharma';
    if (spec.includes('neuro')) return 'Dr. Arjun Mehta';
    if (spec.includes('dentist') || spec.includes('dental')) return 'Dr. Neha Kapoor';
    return `Dr. ${specialization || 'Specialist'}`;
  };

  const formatDateObj = (dateStr?: string) => {
    if (!dateStr) return 'Date Pending';
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Real-time counts computed using effective status
  const allCount = appointments.length;
  const upcomingCount = appointments.filter((a: any) => {
    const st = getEffectiveStatus(a);
    return st === 'CONFIRMED' || st === 'PENDING';
  }).length;
  const completedCount = appointments.filter((a: any) => getEffectiveStatus(a) === 'COMPLETED').length;
  const cancelledCount = appointments.filter((a: any) => getEffectiveStatus(a) === 'CANCELLED').length;
  const noShowCount = appointments.filter((a: any) => getEffectiveStatus(a) === 'NO_SHOW').length;

  // Filter list with Search, Tab, and Date Range Filter
  const filteredList = appointments.filter((appt: any) => {
    const effStatus = getEffectiveStatus(appt);
    if (filter === 'UPCOMING' && !(effStatus === 'CONFIRMED' || effStatus === 'PENDING')) return false;
    if (filter === 'COMPLETED' && effStatus !== 'COMPLETED') return false;
    if (filter === 'CANCELLED' && effStatus !== 'CANCELLED') return false;
    if (filter === 'NO_SHOW' && effStatus !== 'NO_SHOW') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const docName = getDoctorDisplayName(appt.doctor?.specialization).toLowerCase();
      const spec = (appt.doctor?.specialization || '').toLowerCase();
      const matchName = docName.includes(q);
      const matchSpec = spec.includes(q);
      if (!matchName && !matchSpec) return false;
    }

    // Date Range Filtering
    if (startDate && appt.slot?.slotDate) {
      const apptDate = new Date(appt.slot.slotDate);
      const start = new Date(startDate);
      if (apptDate < start) return false;
    }
    if (endDate && appt.slot?.slotDate) {
      const apptDate = new Date(appt.slot.slotDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (apptDate > end) return false;
    }

    return true;
  });

  // Sort filtered list
  const sortedList = [...filteredList].sort((a: any, b: any) => {
    if (sortBy === 'newest') {
      const dateA = new Date(a.slot?.slotDate || a.createdAt).getTime();
      const dateB = new Date(b.slot?.slotDate || b.createdAt).getTime();
      return dateB - dateA;
    }
    if (sortBy === 'oldest') {
      const dateA = new Date(a.slot?.slotDate || a.createdAt).getTime();
      const dateB = new Date(b.slot?.slotDate || b.createdAt).getTime();
      return dateA - dateB;
    }
    if (sortBy === 'status') {
      return (getEffectiveStatus(a) || '').localeCompare(getEffectiveStatus(b) || '');
    }
    return 0;
  });

  const getPillClass = (tab: 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW') => {
    const isActive = filter === tab;
    if (isActive) {
      return `px-4.5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer bg-blue-600 text-white shadow-sm flex items-center gap-1.5`;
    }
    return `px-4.5 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
      isDark
        ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  };

  const renderStatusBadge = (appt: any) => {
    const status = getEffectiveStatus(appt);
    switch (status) {
      case 'CONFIRMED':
        return (
          <span
            title="CONFIRMED: Doctor confirmed the slot"
            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1 select-none ${
              isDark ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span
            title="PENDING: Booked but not yet confirmed"
            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1 select-none ${
              isDark ? 'bg-amber-950/30 text-amber-400 border-amber-900/40' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'COMPLETED':
        return (
          <span
            title="COMPLETED: Doctor marked it done"
            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1 select-none ${
              isDark ? 'bg-blue-950/30 text-blue-400 border-blue-900/40' : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <FileCheck className="w-3 h-3" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span
            title="CANCELLED: Either party cancelled"
            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1 select-none ${
              isDark ? 'bg-rose-950/30 text-rose-400 border-rose-900/40' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case 'NO_SHOW':
        return (
          <span
            title="NO_SHOW: Slot date passed without completion"
            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1 select-none ${
              isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            No Show
          </span>
        );
      default:
        return (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border select-none ${
            isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {status}
          </span>
        );
    }
  };

  // Render Tab-Specific Empty States
  const renderEmptyState = () => {
    let title = "No appointments found";
    let desc = "You don't have any appointments matching this view.";
    let btnText = "Book an Appointment";

    if (searchQuery.trim() || startDate || endDate) {
      title = "No matching search/filter results";
      desc = "No bookings match your search query or selected date range.";
      btnText = "Clear Filters";
    } else if (filter === 'UPCOMING') {
      title = "No upcoming appointments — book one now";
      desc = "You don't have any upcoming doctor consultations scheduled.";
      btnText = "Find & Book Doctors";
    } else if (filter === 'COMPLETED') {
      title = "No completed consultations yet";
      desc = "Your past finished medical visits and prescriptions will appear here.";
      btnText = "Explore Specialties";
    } else if (filter === 'CANCELLED') {
      title = "No cancelled appointments";
      desc = "You have no cancelled appointments in your record.";
      btnText = "Schedule Booking";
    } else if (filter === 'NO_SHOW') {
      title = "No missed appointments recorded";
      desc = "Great job! You haven't missed any scheduled appointments.";
      btnText = "Book Appointment";
    }

    return (
      <div
        className={`border rounded-3xl p-12 text-center my-6 transition-all ${
          isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <Calendar className={`w-12 h-12 ${isDark ? 'text-zinc-700' : 'text-slate-300'} mx-auto mb-3`} />
        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>{title}</h3>
        <p className={`text-xs max-w-sm mx-auto mb-6 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{desc}</p>
        <button
          onClick={() => {
            setSearchQuery('');
            setStartDate('');
            setEndDate('');
            setFilter('ALL');
            router.push('/patient/doctors');
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
        >
          {btnText}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-zinc-500 text-xs font-semibold tracking-wider font-sans">Tethering diagnostics overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex font-sans select-none antialiased transition-all duration-300 ${
        isDark ? 'bg-[#0c0d0e] text-zinc-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Shared Sidebar */}
      <PatientSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 md:pt-7 pb-7 space-y-7 transition-all duration-300">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>My appointments</h1>
            <p className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              View, manage and track all your bookings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-200/70 border-slate-300'}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'timeline'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
                title="Timeline View"
              >
                <ListTree className="w-4 h-4" />
                <span>Timeline</span>
              </button>
            </div>

            <button
              onClick={() => setIsExportPdfOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Export Full History to PDF"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => setIsStatusGuideOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Status Management Guide"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>Status Guide</span>
            </button>

            <button
              onClick={() => router.push('/patient/doctors')}
              className={`flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer active:scale-95`}
            >
              <Plus className="w-4 h-4" />
              <span>Book new appointment</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Tabs with Count Badges */}
        <div className={`flex flex-wrap gap-2.5 border-b pb-4 ${isDark ? 'border-zinc-800/50' : 'border-slate-200'}`}>
          <button onClick={() => setFilter('ALL')} className={getPillClass('ALL')}>
            <span>All</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'ALL' ? 'bg-white/20 text-white' : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
              {allCount}
            </span>
          </button>

          <button onClick={() => setFilter('UPCOMING')} className={getPillClass('UPCOMING')}>
            <span>Upcoming</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'UPCOMING' ? 'bg-white/20 text-white' : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
              {upcomingCount}
            </span>
          </button>

          <button onClick={() => setFilter('COMPLETED')} className={getPillClass('COMPLETED')}>
            <span>Completed</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'COMPLETED' ? 'bg-white/20 text-white' : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
              {completedCount}
            </span>
          </button>

          <button onClick={() => setFilter('CANCELLED')} className={getPillClass('CANCELLED')}>
            <span>Cancelled</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'CANCELLED' ? 'bg-white/20 text-white' : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
              {cancelledCount}
            </span>
          </button>

          <button onClick={() => setFilter('NO_SHOW')} className={getPillClass('NO_SHOW')}>
            <span>No-show</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === 'NO_SHOW' ? 'bg-white/20 text-white' : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
              {noShowCount}
            </span>
          </button>
        </div>

        {/* Search, Date Range Filter and Sort Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search doctor name or specialty..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                  isDark
                    ? 'bg-[#16171b] border-zinc-800 text-white focus:border-blue-500 placeholder:text-zinc-500'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* Date Range Controls */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
              <span className={`text-[11px] font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort by:</span>
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer transition-all ${
                isDark
                  ? 'bg-[#16171b] border-zinc-800 text-white focus:border-blue-500'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            >
              <option value="newest">Date: Newest first</option>
              <option value="oldest">Date: Oldest first</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Main Display: Grid View OR Vertical Timeline View */}
        {sortedList.length === 0 ? (
          renderEmptyState()
        ) : viewMode === 'timeline' ? (
          /* Vertical Appointment History Timeline View */
          <div className="relative pl-6 space-y-8 my-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
            {sortedList.map((appt: any) => {
              const docName = getDoctorDisplayName(appt.doctor?.specialization);
              const specialization = appt.doctor?.specialization || 'General Physician';
              const formattedDate = formatDateObj(appt.slot?.slotDate);
              const timeSlot = appt.slot?.startTime || '09:00 AM';
              const effStatus = getEffectiveStatus(appt);
              const isConfirmed = effStatus === 'CONFIRMED';
              const isPending = effStatus === 'PENDING';
              const isCompleted = effStatus === 'COMPLETED';
              const isCancelled = effStatus === 'CANCELLED';
              const isNoShow = effStatus === 'NO_SHOW';
              const isUpcoming = isConfirmed || isPending;

              return (
                <div key={appt.id} className="relative flex items-start gap-5 group">
                  {/* Timeline Dot Node */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-[#0c0d0e] bg-blue-600 flex items-center justify-center text-white shadow-md z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  <div
                    className={`flex-1 border rounded-3xl p-6 transition-all duration-300 hover:shadow-lg ${
                      isDark
                        ? 'bg-[#16171b] border-zinc-800/80 group-hover:border-zinc-700'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <button
                          onClick={() => setQuickProfileDoctor(appt.doctor)}
                          className="text-base font-bold text-left hover:text-blue-400 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <span>{docName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-400 font-semibold border border-blue-900/30">
                            {specialization}
                          </span>
                        </button>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {formattedDate} at {timeSlot}
                        </p>
                      </div>

                      {renderStatusBadge(appt)}
                    </div>

                    <p className={`text-xs p-3 rounded-xl border leading-relaxed mb-4 ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800/60 text-zinc-300' : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}>
                      <strong>Patient Notes:</strong> {appt.notes || 'Routine consultation'}
                    </p>

                    {/* Timeline Footer Actions */}
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-800/50">
                      <button
                        onClick={() => setQuickProfileDoctor(appt.doctor)}
                        className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Doctor Quick-Profile</span>
                      </button>

                      {isUpcoming ? (
                        <button
                          onClick={() => handleOpenRescheduleModal(appt)}
                          className="text-zinc-300 hover:text-white font-bold cursor-pointer"
                        >
                          Reschedule
                        </button>
                      ) : isCompleted ? (
                        <button
                          onClick={() => setSummaryModalAppt(appt)}
                          className="text-zinc-300 hover:text-white font-bold cursor-pointer"
                        >
                          View Summary
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/patient/doctors/${appt.doctorId}`)}
                          className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                        >
                          Rebook
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sortedList.map((appt: any) => {
              const docName = getDoctorDisplayName(appt.doctor?.specialization);
              const specialization = appt.doctor?.specialization || 'General Physician';
              const formattedDate = formatDateObj(appt.slot?.slotDate);
              const timeSlot = appt.slot?.startTime || '09:00 AM';
              const fee = appt.doctor?.consultationFee || 500;
              const notes = appt.notes || 'General consultation request';
              const effStatus = getEffectiveStatus(appt);
              const isPending = effStatus === 'PENDING';
              const isConfirmed = effStatus === 'CONFIRMED';
              const isCompleted = effStatus === 'COMPLETED';
              const isCancelled = effStatus === 'CANCELLED';
              const isNoShow = effStatus === 'NO_SHOW';
              const isUpcoming = isConfirmed || isPending;
              const hasVideoCall = isConfirmed && isVideoCallEligible(appt);
              const meetingUrl = appt.videoLink || `https://meet.google.com/doc4u-${appt.id.slice(0, 8)}`;
              const countdownBadge = isUpcoming ? getRelativeCountdown(appt.slot?.slotDate, appt.slot?.startTime) : null;
              const cardErr = cardErrors[appt.id];

              return (
                <div
                  key={appt.id}
                  className={`border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${
                    isDark
                      ? 'bg-[#16171b] border-zinc-800/80 hover:border-zinc-700'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Header Row: Doctor & Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => setQuickProfileDoctor(appt.doctor)}
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner shrink-0 cursor-pointer hover:scale-105 transition-transform ${
                            isDark ? 'bg-blue-600/10 border-blue-900/30 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
                          }`}
                          title="View Doctor Profile"
                        >
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <button
                            onClick={() => setQuickProfileDoctor(appt.doctor)}
                            className={`text-base font-bold tracking-tight text-left hover:text-blue-400 transition-colors cursor-pointer block ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {docName}
                          </button>
                          <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {specialization}
                          </span>
                        </div>
                      </div>

                      {renderStatusBadge(appt)}
                    </div>

                    {/* Inline Error Alert Banner for Card */}
                    {cardErr && (
                      <div className="mb-4 p-3 rounded-2xl bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>{cardErr}</span>
                        </div>
                        <button
                          onClick={() => clearCardError(appt.id)}
                          className="text-rose-400 hover:text-rose-200 text-xs font-bold cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Meta Row: Date, Time Slot, Fee + Countdown Badge */}
                    <div
                      className={`p-3.5 rounded-2xl border mb-4 text-xs font-medium space-y-2.5 ${
                        isDark ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                              Date & Time
                            </p>
                            <p className={`font-bold mt-0.5 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                              {formattedDate} · {timeSlot}
                            </p>
                          </div>
                        </div>

                        {countdownBadge && (
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            {countdownBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>₹{fee}</span>
                        </div>

                        {/* Additional Utility Actions for Upcoming */}
                        {isUpcoming && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadCalendarICS(appt)}
                              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Generate .ics calendar file"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>Add to Calendar</span>
                            </button>
                            <span className="text-zinc-700">•</span>
                            <button
                              onClick={() => handleResendReminder(appt.id)}
                              disabled={reminderSendingId === appt.id}
                              className="text-[11px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                              title="Resend email and SMS reminder"
                            >
                              {reminderSendingId === appt.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                              ) : (
                                <Send className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <span>{reminderSentId === appt.id ? 'Sent!' : 'Resend'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Booking Notes */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3 text-zinc-400" />
                          <span>Patient Booking Notes</span>
                        </div>
                        {isConfirmed && (
                          <button
                            onClick={() => handleOpenNotesModal(appt)}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit notes</span>
                          </button>
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          isDark
                            ? 'bg-zinc-900/60 border-zinc-800/50 text-zinc-300'
                            : 'bg-slate-100/70 border-slate-200/60 text-slate-700'
                        }`}
                      >
                        {notes}
                      </div>
                    </div>

                    {/* Review Block for Completed Appointments */}
                    {isCompleted && (
                      <div className="mb-4">
                        {appt.review ? (
                          <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-950/20 border-amber-900/30' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Your Rating</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= appt.review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {appt.review.comment && (
                              <p className={`text-xs italic ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                                "{appt.review.comment}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenReviewModal(appt)}
                            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isDark
                                ? 'bg-amber-600/10 border-amber-900/40 text-amber-400 hover:bg-amber-600/20'
                                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>Leave a Review</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Video Call Button */}
                    {hasVideoCall && (
                      <div className="mb-4">
                        <a
                          href={meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer animate-pulse"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Video Call (Active Now)</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer - Enforced by Status Matrix */}
                  <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-2.5 ${isDark ? 'border-zinc-800/60' : 'border-slate-100'}`}>
                    {isPending && (
                      <button
                        onClick={() => setCancelModalAppt(appt)}
                        className={`w-full py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isDark
                            ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-rose-950/40 hover:border-rose-900/40 hover:text-rose-400'
                            : 'border-slate-200 bg-white text-slate-650 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'
                        }`}
                      >
                        Cancel Appointment
                      </button>
                    )}

                    {isConfirmed && (
                      <div className="flex items-center justify-between w-full gap-2">
                        <button
                          onClick={() => handleOpenRescheduleModal(appt)}
                          className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isDark
                              ? 'border-zinc-700/80 bg-zinc-900 text-white hover:bg-zinc-800'
                              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
                          <span>Reschedule</span>
                        </button>

                        <button
                          onClick={() => setCancelModalAppt(appt)}
                          className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isDark
                              ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-rose-950/40 hover:border-rose-900/40 hover:text-rose-400'
                              : 'border-slate-200 bg-white text-slate-650 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'
                          }`}
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push('/patient/prescriptions')}
                            className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Rx</span>
                          </button>
                          <button
                            onClick={() => setSummaryModalAppt(appt)}
                            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Summary</span>
                          </button>
                        </div>

                        <button
                          onClick={() => router.push(`/patient/doctors/${appt.doctorId}`)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Rebook</span>
                        </button>
                      </div>
                    )}

                    {(isCancelled || isNoShow) && (
                      <button
                        onClick={() => router.push(`/patient/doctors/${appt.doctorId}`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer ml-auto flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rebook Doctor</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Doctor Quick-Profile Side Modal */}
      {quickProfileDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">{getDoctorDisplayName(quickProfileDoctor.specialization)}</h3>
                  <p className="text-xs text-blue-400 font-semibold">{quickProfileDoctor.specialization || 'Medical Specialist'}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickProfileDoctor(null)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Patient Rating</p>
                  <div className="flex items-center gap-1 mt-1 font-bold text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>4.9 (124 reviews)</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Consultation Fee</p>
                  <p className="font-bold text-emerald-400 mt-1">₹{quickProfileDoctor.consultationFee || 500}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Award className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>10+ Years Senior Clinical Experience</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{quickProfileDoctor.user?.email || 'doctor@doc4u.com'}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{quickProfileDoctor.user?.phone || '+91 98765 43210'}</span>
                </div>
              </div>

              <p className="text-zinc-400 text-xs leading-relaxed">
                Specialized practitioner committed to evidence-based medical care, preventive health, and patient consultation.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setQuickProfileDoctor(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                Close Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  const docId = quickProfileDoctor.id;
                  setQuickProfileDoctor(null);
                  router.push(`/patient/doctors/${docId}`);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rebook This Doctor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export History PDF Report Printable Modal */}
      {isExportPdfOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-2xl rounded-3xl p-7 border shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  DOC4U
                </div>
                <div>
                  <h3 className="text-lg font-bold">Medical Appointment History Report</h3>
                  <p className="text-xs text-zinc-400">Patient: {getUsername()} • Export Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportPdfOpen(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Stats Table */}
            <div className="grid grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Total Records</p>
                <p className="text-base font-bold text-white mt-1">{sortedList.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Completed</p>
                <p className="text-base font-bold text-blue-400 mt-1">{completedCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Upcoming</p>
                <p className="text-base font-bold text-emerald-400 mt-1">{upcomingCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Cancelled / Missed</p>
                <p className="text-base font-bold text-rose-400 mt-1">{cancelledCount + noShowCount}</p>
              </div>
            </div>

            {/* Appointment Record List Table */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Appointments Record Ledger</h4>
              <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Doctor</th>
                      <th className="p-3">Fee</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {sortedList.map(item => (
                      <tr key={item.id} className="hover:bg-zinc-900/50">
                        <td className="p-3 font-semibold">{formatDateObj(item.slot?.slotDate)}<br/><span className="text-[10px] text-zinc-500">{item.slot?.startTime}</span></td>
                        <td className="p-3 font-bold text-white">{getDoctorDisplayName(item.doctor?.specialization)}<br/><span className="text-[10px] font-normal text-zinc-400">{item.doctor?.specialization}</span></td>
                        <td className="p-3 font-semibold text-emerald-400">₹{item.doctor?.consultationFee || 500}</td>
                        <td className="p-3 font-bold">{getEffectiveStatus(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsExportPdfOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Management Guide Modal */}
      {isStatusGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold">Appointment Status Guide</h3>
              </div>
              <button
                onClick={() => setIsStatusGuideOpen(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs mb-5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Reference matrix for appointment statuses, definitions, and permitted actions:
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {[
                {
                  status: 'PENDING',
                  color: isDark ? 'text-amber-400 bg-amber-950/30 border-amber-900/40' : 'text-amber-700 bg-amber-50 border-amber-200',
                  meaning: 'Booked but not yet confirmed',
                  actions: 'Cancel'
                },
                {
                  status: 'CONFIRMED',
                  color: isDark ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/40' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  meaning: 'Doctor confirmed the slot',
                  actions: 'Cancel, Reschedule, Add/Edit notes, Join video call'
                },
                {
                  status: 'COMPLETED',
                  color: isDark ? 'text-blue-400 bg-blue-950/30 border-blue-900/40' : 'text-blue-700 bg-blue-50 border-blue-200',
                  meaning: 'Doctor marked it done',
                  actions: 'View Rx, Leave review, Rebook, Summary'
                },
                {
                  status: 'CANCELLED',
                  color: isDark ? 'text-rose-400 bg-rose-950/30 border-rose-900/40' : 'text-rose-700 bg-rose-50 border-rose-200',
                  meaning: 'Either party cancelled',
                  actions: 'Rebook'
                },
                {
                  status: 'NO_SHOW',
                  color: isDark ? 'text-zinc-400 bg-zinc-800 border-zinc-700' : 'text-slate-600 bg-slate-100 border-slate-200',
                  meaning: 'Patient missed the appointment / slot date passed',
                  actions: 'Rebook'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.meaning}</p>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    <strong className="text-zinc-300 font-semibold">Available actions:</strong> {item.actions}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 mt-5 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsStatusGuideOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Cancel Appointment</h3>
              </div>
              <button
                onClick={() => setCancelModalAppt(null)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
              Are you sure you want to cancel your appointment with{' '}
              <strong className="text-white">{getDoctorDisplayName(cancelModalAppt.doctor?.specialization)}</strong>?
            </p>

            <div
              className={`p-3 rounded-2xl border text-xs mb-6 ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <p>
                <strong>Date & Time:</strong> {formatDateObj(cancelModalAppt.slot?.slotDate)} at {cancelModalAppt.slot?.startTime}
              </p>
              <p className="mt-1 text-emerald-400 font-semibold">
                ✓ Freeing up this slot so another patient can book it.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelModalAppt(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Confirm Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold">Reschedule Appointment</h3>
              </div>
              <button
                onClick={() => setRescheduleModalAppt(null)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Select a new available time slot with{' '}
              <strong className="text-white">{getDoctorDisplayName(rescheduleModalAppt.doctor?.specialization)}</strong>:
            </p>

            {loadingSlots ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <p className="text-xs text-zinc-400">Loading available slots...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className={`p-6 text-center border rounded-2xl mb-6 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-xs font-semibold text-zinc-400">No other open slots available for this doctor right now.</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-1">
                {availableSlots.map((slot: any) => {
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                          : isDark
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-xs">
                        <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <span>{formatDateObj(slot.slotDate)}</span>
                          <span className="mx-2">•</span>
                          <span className="font-bold">{slot.startTime} - {slot.endTime}</span>
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setRescheduleModalAppt(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedSlotId || rescheduling}
                onClick={handleConfirmReschedule}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                {rescheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Confirm Reschedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {notesModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold">Booking Notes</h3>
              </div>
              <button
                onClick={() => setNotesModalAppt(null)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Update your symptoms / notes for the doctor
                </label>
                <textarea
                  rows={4}
                  value={editedNotes}
                  onChange={e => setEditedNotes(e.target.value)}
                  placeholder="Describe your current symptoms, medical history, or reason for visit..."
                  className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setNotesModalAppt(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNotes}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Notes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Review Modal */}
      {reviewModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-lg font-bold">Leave a Review</h3>
              </div>
              <button
                onClick={() => setReviewModalAppt(null)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              How was your consultation with{' '}
              <strong className="text-white">{getDoctorDisplayName(reviewModalAppt.doctor?.specialization)}</strong>?
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Star Rating (1–5)
                </label>
                <div className="flex items-center gap-2 justify-center py-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingScore(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= ratingScore ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Your Feedback / Review Comments
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share details of your experience to help other patients..."
                  className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setReviewModalAppt(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Summary Printable Modal */}
      {summaryModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl p-7 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  DOC4U
                </div>
                <div>
                  <h3 className="text-base font-bold">Appointment Summary</h3>
                  <p className="text-[10px] text-zinc-400">ID: {summaryModalAppt.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSummaryModalAppt(null)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Practitioner</p>
                  <p className="font-bold text-white mt-0.5">{getDoctorDisplayName(summaryModalAppt.doctor?.specialization)}</p>
                  <p className="text-zinc-400 text-[11px]">{summaryModalAppt.doctor?.specialization}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Date & Time</p>
                  <p className="font-bold text-white mt-0.5">{formatDateObj(summaryModalAppt.slot?.slotDate)}</p>
                  <p className="text-zinc-400 text-[11px]">{summaryModalAppt.slot?.startTime}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Patient Name</span>
                  <span className="font-bold">{getUsername()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Consultation Fee</span>
                  <span className="font-bold text-emerald-400">₹{summaryModalAppt.doctor?.consultationFee || 500}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Status</span>
                  <span className="font-bold text-blue-400">Completed</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Diagnosis & Notes</p>
                <p className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 leading-relaxed">
                  {summaryModalAppt.notes || 'Routine consultation completed cleanly.'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Prescription Links</p>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-300 font-semibold">Official Prescription Document</span>
                  <button
                    onClick={() => router.push('/patient/prescriptions')}
                    className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View File</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSummaryModalAppt(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
