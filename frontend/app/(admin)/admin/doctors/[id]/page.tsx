'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Stethoscope,
  CheckCircle2,
  Clock,
  Ban,
  Award,
  FileText,
  Mail,
  Phone,
  Calendar,
  IndianRupee,
  Star,
  Users,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Loader2,
  User,
  Briefcase,
} from 'lucide-react';

export default function AdminDoctorProfilePage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const doctorId = params?.id;

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDoctor = async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/admin/doctors/${doctorId}`);
      if (res.data.success) {
        setDoctor(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  const handleVerify = async () => {
    try {
      setActionLoading(true);
      await api.patch(`/admin/doctors/${doctorId}/verify`);
      setDoctor((prev: any) => ({ ...prev, isVerified: true, isSuspended: false }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this doctor? Their unbooked future slots will be cleared and they will not be able to accept appointments.')) {
      return;
    }
    try {
      setActionLoading(true);
      await api.patch(`/admin/doctors/${doctorId}/suspend`);
      setDoctor((prev: any) => ({ ...prev, isSuspended: true }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to suspend doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinstate = async () => {
    try {
      setActionLoading(true);
      await api.patch(`/admin/doctors/${doctorId}/reinstate`);
      setDoctor((prev: any) => ({ ...prev, isSuspended: false }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reinstate doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewCertificate = async () => {
    if (!doctor?.certificateUrl) return;
    try {
      setCertLoading(true);
      const res = await api.get(`/admin/doctors/${doctorId}/certificate`, {
        responseType: 'blob',
      });
      const contentType = (res.headers['content-type'] as string) || 'application/pdf';
      const blob = new Blob([res.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to retrieve registration certificate');
    } finally {
      setCertLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-[#090d16]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          <p className="text-slate-400 text-xs">Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Link
          href="/admin/doctors"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to doctors</span>
        </Link>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center text-rose-300">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm font-semibold">{error || 'Doctor not found'}</p>
        </div>
      </div>
    );
  }

  const isVerified = doctor.isVerified && !doctor.isSuspended;
  const isPending = !doctor.isVerified && !doctor.isSuspended;
  const isSuspended = doctor.isSuspended;
  const stats = doctor.stats || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header / Breadcrumbs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f293d]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/doctors"
            className="p-2 rounded-lg bg-[#111827] border border-[#1f293d] hover:bg-[#162032] text-slate-300 hover:text-white transition-colors"
            title="Back to all doctors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Link href="/admin/doctors" className="hover:text-slate-200">
                Doctors
              </Link>
              <span>/</span>
              <span className="text-slate-200 truncate max-w-[200px]">
                {doctor.name || doctor.email}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-0.5">
              <span>{doctor.name ? `Dr. ${doctor.name}` : doctor.email}</span>
              {isVerified && (
                <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Verified practitioner
                </span>
              )}
              {isPending && (
                <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Pending review
                </span>
              )}
              {isSuspended && (
                <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Account suspended
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {doctor.certificateUrl && (
            <button
              onClick={handleViewCertificate}
              disabled={certLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#162032] border border-[#1f293d] text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              {certLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>View Certificate</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          )}

          {isPending && (
            <button
              onClick={handleVerify}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify doctor</span>
            </button>
          )}

          {isVerified && (
            <button
              onClick={handleSuspend}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Suspend doctor</span>
            </button>
          )}

          {isSuspended && (
            <button
              onClick={handleReinstate}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Reinstate doctor</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 shadow-inner">
              <Stethoscope className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {doctor.name ? `Dr. ${doctor.name}` : 'Doctor Profile'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-violet-500/10 border border-violet-500/20 text-violet-300">
                  {doctor.specialization}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                {doctor.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{doctor.email}</span>
                  </span>
                )}
                {doctor.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{doctor.phone}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Registered {new Date(doctor.createdAt).toLocaleDateString()}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:border-l md:border-[#1f293d] md:pl-6">
            <div className="bg-[#090d16] border border-[#1f293d] rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Patients
              </div>
              <div className="text-lg font-semibold tabular-nums text-white mt-0.5">
                {stats.patientsCount || 0}
              </div>
            </div>

            <div className="bg-[#090d16] border border-[#1f293d] rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Appointments
              </div>
              <div className="text-lg font-semibold tabular-nums text-white mt-0.5">
                {stats.totalAppointments || 0}
              </div>
            </div>

            <div className="bg-[#090d16] border border-[#1f293d] rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Fee
              </div>
              <div className="text-lg font-semibold tabular-nums text-emerald-400 mt-0.5">
                ₹{doctor.consultationFee}
              </div>
            </div>

            <div className="bg-[#090d16] border border-[#1f293d] rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Rating
              </div>
              <div className="text-lg font-semibold tabular-nums text-amber-400 mt-0.5 flex items-center gap-1">
                <span>{stats.avgRating || '0.0'}</span>
                <span className="text-xs">★</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({stats.reviewsCount || 0})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Credentials, Verification & Schedule */}
        <div className="lg:col-span-5 space-y-6">
          {/* VERIFICATION & CREDENTIALS */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Medical verification
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                ID: {doctor.id.slice(0, 8)}...
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">
                  Medical Registration Number (License)
                </span>
                <div className="text-white font-mono font-semibold bg-[#090d16] border border-[#1f293d] rounded-lg px-3 py-2">
                  {doctor.licenseNumber || 'Not specified'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">
                  Issuing Medical Council
                </span>
                <div className="text-white font-medium bg-[#090d16] border border-[#1f293d] rounded-lg px-3 py-2">
                  {doctor.medicalCouncil || 'Not specified'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-1">
                  Registration Certificate
                </span>
                {doctor.certificateUrl ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#090d16] border border-[#1f293d]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <div className="text-white font-medium text-xs truncate">
                          Certificate document
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Accessible strictly by Admin team
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleViewCertificate}
                      disabled={certLoading}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                    >
                      {certLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>Open</span>
                      )}
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-[#090d16] border border-[#1f293d] text-slate-500 text-xs italic">
                    No certificate file uploaded for this doctor.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PRACTICE INFORMATION */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1f293d]">
              <Briefcase className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Practice & experience
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#090d16] border border-[#1f293d] rounded-lg p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Specialization
                </span>
                <p className="text-white font-medium mt-1 truncate">
                  {doctor.specialization}
                </p>
              </div>

              <div className="bg-[#090d16] border border-[#1f293d] rounded-lg p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Experience
                </span>
                <p className="text-white font-medium mt-1">
                  {doctor.experience ? `${doctor.experience} years` : 'Not specified'}
                </p>
              </div>
            </div>

            {doctor.bio && (
              <div>
                <span className="text-slate-400 block text-[11px] mb-1">
                  Professional Biography
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#090d16] border border-[#1f293d] rounded-lg p-3">
                  {doctor.bio}
                </p>
              </div>
            )}
          </div>

          {/* UPCOMING AVAILABILITY SLOTS */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Upcoming schedule
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {doctor.upcomingSlots?.length || 0} slots
              </span>
            </div>

            {doctor.upcomingSlots && doctor.upcomingSlots.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {doctor.upcomingSlots.map((slot: any) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#090d16] border border-[#1f293d] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-200 font-medium">
                        {new Date(slot.slotDate).toLocaleDateString()}
                      </span>
                      <span className="text-slate-400">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        slot.isBooked
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {slot.isBooked ? 'Booked' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2 text-center">
                No active future slots scheduled.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Appointments & Reviews */}
        <div className="lg:col-span-7 space-y-6">
          {/* RECENT APPOINTMENTS */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#1f293d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Recent appointments
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Total: {stats.totalAppointments || 0}
              </span>
            </div>

            {doctor.recentAppointments && doctor.recentAppointments.length > 0 ? (
              <div className="divide-y divide-[#1f293d]">
                {doctor.recentAppointments.map((appt: any) => {
                  const statusColors: Record<string, string> = {
                    COMPLETED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    CONFIRMED: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
                    CANCELLED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                    PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    NO_SHOW: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                  };

                  return (
                    <div
                      key={appt.id}
                      className="p-3.5 hover:bg-[#162032]/40 transition-colors flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">
                          {appt.patientName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {appt.patientEmail || 'No email provided'}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-slate-300 font-medium">
                          {appt.slotDate
                            ? new Date(appt.slotDate).toLocaleDateString()
                            : 'Date TBD'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {appt.startTime} - {appt.endTime}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider ${
                            statusColors[appt.status] || 'text-slate-400'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No appointments logged yet for this doctor.
              </div>
            )}
          </div>

          {/* PATIENT REVIEWS & RATINGS */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#1f293d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Patient reviews & feedback
                </h3>
              </div>
              <div className="flex items-center gap-1 text-amber-400 font-semibold text-xs tabular-nums">
                <span>{stats.avgRating || '0.0'} ★</span>
                <span className="text-slate-500 font-normal text-[11px]">
                  ({stats.reviewsCount || 0} reviews)
                </span>
              </div>
            </div>

            {doctor.recentReviews && doctor.recentReviews.length > 0 ? (
              <div className="divide-y divide-[#1f293d]">
                {doctor.recentReviews.map((rev: any) => (
                  <div key={rev.id} className="p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {rev.patientName}
                        </span>
                        <div className="flex items-center text-amber-400 text-xs">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {rev.comment && (
                      <p className="text-slate-300 text-xs leading-relaxed">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No patient reviews submitted for this doctor yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

