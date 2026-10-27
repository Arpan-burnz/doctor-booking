'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { clearTokens, getUsername } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/AppLogo';
import PatientSidebar from '@/components/shared/PatientSidebar';
import {
  Heart,
  ArrowLeft,
  LogOut,
  Search,
  Stethoscope,
  ShieldCheck,
  Briefcase,
  IndianRupee,
  Calendar,
  Loader2
} from 'lucide-react';

import { useTheme } from '@/lib/theme';

export default function BrowseDoctors() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { theme, setTheme, isDark } = useTheme();

  useEffect(() => {
    api.get('/doctors')
      .then(res => setDoctors(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(doc =>
    doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
    doc.bio?.toLowerCase().includes(search.toLowerCase()) ||
    (doc.user?.name || doc.fullName || '')?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex font-sans select-none antialiased transition-all duration-300 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Shared Sidebar */}
      <PatientSidebar username={getUsername() || 'Patient'} avatarUrl={undefined} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 md:pt-7 pb-7 space-y-7 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-2">
          {/* Title */}
          <div className="mb-8">
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Find a doctor</h1>
          <p className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{loading ? 'Retrieving listings...' : `${doctors.length} verified specialist practitioners live`}</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-lg">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by specialty (e.g. Cardiology, Dentistry)..."
            className={`w-full pl-11 pr-4 py-3 border rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-slate-400 shadow-sm focus:ring-4 focus:ring-brand-500/10 ${isDark
              ? 'bg-zinc-900 border-zinc-800 focus:border-brand-500 text-zinc-100 placeholder:text-zinc-650'
              : 'bg-white border-slate-200 focus:border-brand-500 focus:bg-white text-slate-955'
              }`}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className={`text-xs font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Loading practitioners catalog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`border rounded-3xl p-16 text-center max-w-md mx-auto shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-zinc-950 text-zinc-500' : 'bg-slate-100 text-slate-400'}`}>
              <Search className="w-6 h-6" />
            </div>
            <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>No doctor match found</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-450' : 'text-slate-505'}`}>
              We couldn't locate any practitioners matching "{search}". Try searching for other medical fields.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {filtered.map((doc: any) => (
              <div
                key={doc.id}
                className={`border rounded-2xl p-6 transition-all duration-300 flex flex-col hover:-translate-y-1 ${isDark
                  ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-705'
                  : 'bg-white border-slate-200 hover:shadow-xl hover:shadow-slate-100/70 hover:border-slate-300'
                  }`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-brand-600 border shadow-inner ${isDark
                    ? 'bg-brand-950/20 border-brand-900/30'
                    : 'bg-brand-50 border-brand-100'
                    }`}>
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  {doc.isVerified !== false && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold py-1 px-2.5 rounded-full select-none ${isDark
                      ? 'text-accent-400 bg-accent-950/30 border-accent-900/30'
                      : 'text-accent-700 bg-accent-50 border border-accent-100'
                      }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                {/* Doctor Description */}
                <div>
                  <h3 className={`font-bold text-base tracking-tight mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {doc.user?.name ? `Dr. ${doc.user.name}` : doc.fullName ? `Dr. ${doc.fullName}` : `Dr. ${doc.specialization}`}
                  </h3>
                  <div className={`flex items-center gap-1.5 text-xs font-semibold mb-3 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                    <span>{doc.experience ? `${doc.experience} Years Practice` : 'Credentialed Practitioner'}</span>
                  </div>
                  {doc.bio ? (
                    <p className={`text-xs leading-relaxed mb-4 line-clamp-3 min-h-[54px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{doc.bio}</p>
                  ) : (
                    <p className={`text-xs italic leading-relaxed mb-4 min-h-[54px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No profile bio listed by active practitioner.</p>
                  )}
                </div>

                {/* Pricing block */}
                <div className={`flex justify-between items-center py-3 border-t mt-auto mb-4 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  <div className={`flex items-center gap-0.5 font-extrabold text-base ${isDark ? 'text-brand-400' : 'text-brand-900'}`}>
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>{doc.consultationFee}</span>
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>session charge</span>
                </div>

                {/* Booking link button */}
                <button
                  onClick={() => router.push(`/patient/doctors/${doc.id}`)}
                  className={`w-full py-2.5 px-4 border text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-97 ${isDark
                    ? 'bg-brand-600/10 text-brand-400 border-brand-900/30 hover:bg-brand-600 hover:text-white hover:border-brand-600'
                    : 'bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white border-brand-200 hover:border-brand-600 hover:shadow-md'
                    }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}