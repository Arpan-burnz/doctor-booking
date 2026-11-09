'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getUsername } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import PatientSidebar from '@/components/shared/PatientSidebar';
import {
  Search,
  Stethoscope,
  ShieldCheck,
  Briefcase,
  IndianRupee,
  Calendar,
  Loader2,
  Star,
  Sparkles,
} from 'lucide-react';

export default function BrowseDoctors() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');

  useEffect(() => {
    api
      .get('/doctors')
      .then(res => setDoctors(res.data.data || []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  const specialties = [
    'ALL',
    ...Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean))),
  ];

  const filtered = doctors.filter(doc => {
    const matchesSearch =
      doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      doc.bio?.toLowerCase().includes(search.toLowerCase()) ||
      (doc.name || doc.user?.email || '')?.toLowerCase().includes(search.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === 'ALL' ||
      doc.specialization?.toLowerCase() === selectedSpecialty.toLowerCase();

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen flex font-sans select-none antialiased bg-transparent text-slate-100 selection:bg-purple-900/40 selection:text-purple-200">
      {/* Shared Sidebar */}
      <PatientSidebar username={getUsername() || 'Patient'} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 md:pt-7 pb-8 space-y-7">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Find a Medical Specialist</h1>
            <p className="text-xs font-medium text-slate-400 mt-1">
              {loading
                ? 'Retrieving certified practitioners...'
                : `${doctors.length} verified specialist practitioners available for booking`}
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="space-y-3">
            <div className="relative max-w-xl">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by practitioner name, specialty (e.g. Cardiology), or symptoms..."
                className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-[#1f293d] rounded-2xl text-xs font-semibold text-white placeholder:text-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* Specialty Pills */}
            {specialties.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {specialties.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 border ${
                      selectedSpecialty === spec
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-medium'
                        : 'bg-[#111827] border-[#1f293d] text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {spec === 'ALL' ? 'All Specialties' : spec}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-[#1f293d] bg-[#111827]/40 rounded-3xl">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-400">Loading specialist registry...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-[#1f293d] bg-[#111827] rounded-3xl p-16 text-center max-w-md mx-auto shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-[#162032] border border-[#1f293d] text-slate-400 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="font-bold text-base text-white mb-1">No Doctors Found</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We couldn't locate any practitioners matching your search. Try resetting filters or searching for another specialty.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
              {filtered.map((doc: any) => {
                const doctorDisplayName =
                  doc.name || (doc.user?.email ? doc.user.email : `Dr. ${doc.specialization}`);

                const avgRating =
                  doc.reviews && doc.reviews.length > 0
                    ? (
                        doc.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
                        doc.reviews.length
                      ).toFixed(1)
                    : null;

                return (
                  <div
                    key={doc.id}
                    className="border border-[#1f293d] bg-[#111827] hover:border-sky-500/50 rounded-3xl p-5 transition-all duration-200 flex flex-col justify-between hover:-translate-y-1 shadow-xl shadow-black/40 group relative overflow-hidden"
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                          <Stethoscope className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {avgRating && (
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-950/40 border border-amber-900/40 text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{avgRating}</span>
                            </span>
                          )}
                          {doc.isVerified !== false && (
                            <span className="flex items-center gap-1 text-[10px] font-bold py-1 px-2.5 rounded-full bg-emerald-950/40 border border-emerald-900/40 text-emerald-400">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <div>
                        <h3 className="font-bold text-base text-white tracking-tight leading-snug truncate">
                          {doctorDisplayName}
                        </h3>
                        <p className="text-xs font-semibold text-sky-400 mt-0.5">
                          {doc.specialization || 'General Practice'}
                        </p>

                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-2 mb-3">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {doc.experience
                              ? `${doc.experience} Years Clinical Practice`
                              : 'Certified Medical Practitioner'}
                          </span>
                        </div>

                        {doc.bio ? (
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 min-h-[50px]">
                            {doc.bio}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 italic leading-relaxed min-h-[50px]">
                            Consultation availability configured for patient care.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="mt-5 pt-3.5 border-t border-[#1f293d]">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-0.5 text-white font-extrabold text-base">
                          <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="tabular-nums">{doc.consultationFee || 500}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Standard Fee
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push(`/patient/doctors/${doc.id}`)}
                        className="w-full py-2 px-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>View schedule and book</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
