'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import AppLogo from '@/components/AppLogo';
import {
  ArrowLeft,
  Stethoscope,
  ShieldCheck,
  IndianRupee,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

export default function BookAppointment() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [slots, setSlots] = useState<any[]>([]);
  const [doctor, setDoctor] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    Promise.all([api.get(`/doctors/${id}`), api.get(`/doctors/${id}/slots`)])
      .then(([d, s]) => {
        setDoctor(d.data.data);
        setSlots(s.data.data || []);
      })
      .catch(() => setError('Failed to load doctor details'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleBook = async () => {
    if (doctor?.isSuspended) {
      setError('This doctor is currently suspended and cannot accept appointments.');
      return;
    }
    if (!selectedSlot) {
      setError('Please select an availability time slot');
      return;
    }
    setBooking(true);
    setError('');
    try {
      await api.post('/appointments', {
        doctorId: id,
        slotId: selectedSlot,
        notes: notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push('/patient/dashboard'), 2200);
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.error ||
        err.message ||
        'Booking creation failed. Slot might be unavailable.';
      setError(serverMsg);
      setBooking(false);
      setSelectedSlot('');
      api
        .get(`/doctors/${id}/slots`)
        .then(s => setSlots(s.data.data || []))
        .catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-400">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
          <p className="text-xs text-slate-400">
            Loading practitioner schedule...
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#090d16] select-none">
        <div className="rounded-xl border border-[#1f293d] bg-[#111827] p-8 max-w-sm w-full text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-white tracking-tight mb-1.5">
            Appointment confirmed
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-5">
            Your consultation slot is locked in. Redirecting to your dashboard...
          </p>
          <div className="w-full h-1 rounded-full overflow-hidden bg-[#162032]">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: '100%', transition: 'width 2.2s linear' }}
            />
          </div>
        </div>
      </div>
    );
  }

  const doctorDisplayName =
    doctor?.name || (doctor?.user?.email ? doctor.user.email : `Dr. ${doctor?.specialization}`);

  return (
    <div className="min-h-screen bg-transparent text-slate-100 font-sans select-none antialiased selection:bg-purple-900/40 selection:text-purple-200">
      {/* Top Bar */}
      <nav className="sticky top-0 z-40 border-b border-[#1f293d]/80 px-6 py-3.5 md:px-10 flex items-center justify-between bg-[#111827]/90 backdrop-blur-md">
        <AppLogo isDark={true} onClick={() => router.push('/patient/dashboard')} />
        <button
          onClick={() => router.push('/patient/doctors')}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1f293d] bg-[#162032] hover:bg-[#1a263c] text-slate-200 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Back to specialists</span>
        </button>
      </nav>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        {doctor?.isSuspended && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-200 mb-5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-100">Doctor Currently Unavailable</h3>
              <p className="mt-0.5 text-rose-200/80 leading-relaxed">
                This practitioner is currently suspended by administration and is prohibited from accepting new bookings. Please select an alternate physician.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2.5 text-xs text-rose-300 font-medium mb-5">
            <AlertCircle className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Doctor Info Card */}
        {doctor && (
          <div className="border border-[#1f293d] bg-[#111827] rounded-xl p-5 flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-semibold text-sm text-white truncate">{doctorDisplayName}</h2>
                {doctor.isSuspended ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium py-0.5 px-2 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400">
                    Suspended
                  </span>
                ) : doctor.isVerified !== false ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium py-0.5 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    Verified practitioner
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-sky-400 mb-1.5 font-medium">
                {doctor.specialization || 'Medical Specialist'}
              </p>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {doctor.bio || 'Credentials validated by clinical administration.'}
              </p>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-0.5 text-emerald-400 font-medium tabular-nums">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">{doctor.consultationFee || 500}</span>
                  <span className="text-[11px] text-slate-500 ml-1">
                    fee
                  </span>
                </div>
                {doctor.experience && (
                  <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <Briefcase className="w-3 h-3 text-slate-500" />
                    <span>{doctor.experience} yrs exp</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Slots Selection */}
        <div className="border border-[#1f293d] bg-[#111827] rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1f293d]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">Select availability slot</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {slots.length} slot{slots.length !== 1 ? 's' : ''} open
            </span>
          </div>

          {slots.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-[#1f293d] rounded-lg bg-[#162032]/30">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <h4 className="font-medium text-xs text-slate-300 mb-0.5">No open slots available</h4>
              <p className="text-[11px] max-w-[260px] mx-auto text-slate-400 leading-relaxed">
                This practitioner hasn&apos;t opened availability slots for booking yet. Check back soon or browse other specialists.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {slots.map((slot: any) => {
                const isSelected = selectedSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-sky-400 bg-sky-500/10 text-white'
                        : 'border-[#1f293d] bg-[#162032] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div
                      className={`text-xs font-medium flex items-center gap-1.5 mb-0.5 ${
                        isSelected ? 'text-sky-400' : 'text-slate-300'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(slot.slotDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div
                      className={`text-xs flex items-center gap-1.5 tabular-nums ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Symptoms / Notes Form */}
        <div className="border border-[#1f293d] bg-[#111827] rounded-xl p-5 mb-5">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Consultation notes (optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe your current symptoms or specific questions for the physician..."
            rows={3}
            className="w-full border border-[#1f293d] rounded-lg p-3 text-xs bg-[#090d16] text-white placeholder:text-slate-500 outline-none transition-colors resize-none focus:border-sky-500 leading-relaxed font-sans"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleBook}
          disabled={booking || !selectedSlot || Boolean(doctor?.isSuspended)}
          className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {booking ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              Securing appointment slot...
            </span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm appointment booking</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
