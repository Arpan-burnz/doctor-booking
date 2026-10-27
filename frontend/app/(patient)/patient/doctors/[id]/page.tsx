'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import AppLogo from '@/components/AppLogo';
import {
  Heart,
  ArrowLeft,
  Stethoscope,
  ShieldCheck,
  IndianRupee,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle
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

  const { isDark } = useTheme();

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    Promise.all([api.get(`/doctors/${id}`), api.get(`/doctors/${id}/slots`)])
      .then(([d, s]) => {
        setDoctor(d.data.data);
        setSlots(s.data.data);
      })
      .catch(() => setError('Failed to load doctor details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    if (!selectedSlot) { setError('Please select a session slot'); return; }
    setBooking(true); setError('');
    try {
      await api.post('/appointments', {
        doctorId: id,
        slotId: selectedSlot,
        notes: notes || undefined
      });
      setSuccess(true);
      setTimeout(() => router.push('/patient/dashboard'), 2200);
    } catch (err: any) {
      const serverMsg = err.response?.data?.error || err.message || 'Booking creation failed. Slot might be unavailable.';
      setError(serverMsg);
      setBooking(false);
      setSelectedSlot('');
      // Refetch available slots so user can select an open slot immediately
      api.get(`/doctors/${id}/slots`)
        .then(s => setSlots(s.data.data || []))
        .catch(() => {});
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-405' : 'bg-slate-50 text-slate-500'}`}>
      <div className="text-center flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
        <p className={`text-xs font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Retrieving calendar schedule...</p>
      </div>
    </div>
  );

  if (success) return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-all duration-300 ${isDark ? 'bg-gradient-to-br from-brand-950/20 via-zinc-950 to-accent-950/20' : 'bg-gradient-to-br from-brand-50 via-slate-50 to-accent-50/70'}`}>
      <div className={`rounded-3xl border shadow-2xl p-8 max-w-sm w-full text-center flex flex-col items-center animate-in scale-in duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/90'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border ${isDark ? 'bg-emerald-950/30 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100'}`}>
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className={`text-xl font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Appointment Secured!</h2>
        <p className={`text-xs leading-relaxed max-w-xs mb-5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          Your reservation is confirmed. Check email folders for full routing. Redirecting to dashboard log...
        </p>
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
          <div className="bg-emerald-500 h-full rounded-full animate-progress duration-[2200ms]" style={{ width: '100%', transition: 'width 2.2s linear' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans transition-all duration-300 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-40 border-b px-6 py-4 md:px-12 flex items-center justify-between shadow-sm transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <AppLogo isDark={isDark} onClick={() => router.push('/patient/dashboard')} />
        <button
          onClick={() => router.push('/patient/doctors')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border text-xs font-semibold rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${isDark
            ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white'
            : 'border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950'
            }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to catalog</span>
        </button>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Error panel */}
        {error && (
          <div className={`border rounded-xl p-3.5 flex items-start gap-2.5 text-xs font-medium mb-6 animate-in slide-in-from-top-2 duration-200 ${isDark
            ? 'bg-rose-955/35 border-rose-905/30 text-rose-400'
            : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Doctor Info card */}
        {doctor && (
          <div className={`border rounded-2xl p-5 shadow-xs flex items-center gap-4 mb-6 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-brand-600 border flex-shrink-0 ${isDark
              ? 'bg-brand-950/20 border-brand-900/30'
              : 'bg-brand-50 border-brand-100'
              }`}>
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Dr. {doctor.specialization}</h2>
                <span className={`flex items-center gap-0.5 text-[9px] font-bold py-0.5 px-2 rounded-full select-none ${isDark
                  ? 'text-accent-400 bg-accent-950/30 border-accent-900/30'
                  : 'text-accent-700 bg-accent-50 border border-accent-100'
                  }`}>
                  <ShieldCheck className="w-3 h-3" />
                  Verified Specialist
                </span>
              </div>
              <p className={`text-xs font-medium leading-relaxed mb-2.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{doctor.bio || 'Credentials reviewed by administrative board.'}</p>

              <div className={`flex items-center gap-0.5 font-extrabold text-[14px] ${isDark ? 'text-brand-400' : 'text-brand-700'}`}>
                <IndianRupee className="w-3.5 h-3.5" />
                <span>{doctor.consultationFee} <span className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-zinc-550' : 'text-slate-400'}`}>per consultation</span></span>
              </div>
            </div>
          </div>
        )}

        {/* Slots selection */}
        <div className={`border rounded-2xl p-5 shadow-xs mb-6 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Select Available Time Slot</h3>
          </div>

          {slots.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Clock className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
              <h4 className={`font-bold text-xs mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>No Available Openings</h4>
              <p className={`text-[11px] max-w-[240px] mx-auto leading-relaxed ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                This practitioner hasn't hosted slots. Please consult other physicians list.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {slots.map((slot: any) => {
                const isSelected = selectedSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${isSelected
                      ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                      : isDark
                        ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/20'
                        : 'border-slate-200 hover:border-slate-350 bg-white'
                      }`}
                  >
                    <div className={`text-xs font-bold ${isSelected ? (isDark ? 'text-brand-400 animate-pulse' : 'text-brand-900') : (isDark ? 'text-zinc-350' : 'text-slate-605')} flex items-center gap-1.5 mb-1.5`}>
                      <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-655' : (isDark ? 'text-zinc-550' : 'text-slate-400')}`} />
                      <span>{new Date(slot.slotDate).toDateString()}</span>
                    </div>
                    <div className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-brand-300' : 'text-brand-700') : (isDark ? 'text-zinc-450' : 'text-slate-500')} flex items-center gap-1.5`}>
                      <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-500' : (isDark ? 'text-zinc-550' : 'text-slate-400')}`} />
                      <span>{slot.startTime} – {slot.endTime}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Symptoms Form */}
        <div className={`border rounded-2xl p-5 shadow-xs mb-6 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
          <label className={`flex items-center gap-2 font-bold text-sm mb-3 ${isDark ? 'text-zinc-300' : 'text-slate-750'}`}>
            <FileText className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
            <span>Consultation Notes (Optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe your current status, concerns, or symptoms for the physician..."
            rows={3.5}
            className={`w-full border rounded-xl p-3 text-xs font-medium outline-none transition-all resize-none focus:ring-4 focus:ring-brand-500/10 leading-relaxed font-sans ${isDark
              ? 'border-zinc-800 focus:border-brand-500 bg-zinc-950 text-zinc-100 placeholder:text-zinc-700'
              : 'border-slate-200 focus:border-brand-500 focus:bg-white text-slate-900 placeholder:text-slate-400'
              }`}
          />
        </div>

        {/* Actions Button */}
        <button
          onClick={handleBook}
          disabled={booking || !selectedSlot}
          className="w-full py-4 px-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none"
        >
          {booking ? (
            <span>Securing appointment slot...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm Appointment Booking</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}