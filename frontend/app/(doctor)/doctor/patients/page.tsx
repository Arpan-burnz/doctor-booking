'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole } from '@/lib/auth';
import { Users, Search, Loader2, Phone, Mail } from 'lucide-react';

function cleanPatientName(email: string) {
  if (!email) return 'Patient';
  const raw = email.split('@')[0];
  const parts = raw.split(/[._-]/);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export default function PatientsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (getUserRole() !== 'DOCTOR') { router.push('/login'); return; }
    api.get('/appointments/mine')
      .then(res => setAppointments(res.data.data || []))
      .finally(() => setLoading(false));
  }, [router]);

  // Deduplicate patients
  const patientMap = new Map<string, { patient: any; appointments: any[] }>();
  appointments.forEach(a => {
    const pid = a.patient?.id;
    if (!pid) return;
    if (!patientMap.has(pid)) {
      patientMap.set(pid, { patient: a.patient, appointments: [] });
    }
    patientMap.get(pid)!.appointments.push(a);
  });

  const patients = Array.from(patientMap.values()).filter(({ patient }) => {
    const email = patient?.user?.email || '';
    const name = cleanPatientName(email);
    return email.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-transparent">
      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-full bg-transparent text-slate-100">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Patient directory</h1>
        <p className="text-slate-400 text-xs mt-1">{patients.length} unique patients under your clinical care</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search patients by name or email address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2 bg-[#090d16] border border-[#1f293d] focus:border-emerald-500 rounded-lg text-xs text-white placeholder:text-slate-500 outline-none transition-colors"
        />
      </div>

      {patients.length === 0 ? (
        <div className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-10 text-center">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
          <p className="text-slate-300 font-medium text-xs">No patients found</p>
          <p className="text-slate-500 text-[11px] mt-0.5">
            {appointments.length === 0
              ? 'Patients will appear here once they book appointments with you'
              : 'Try a different search query'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(({ patient, appointments: appts }) => {
            const email = patient?.user?.email || '';
            const phone = patient?.user?.phone;
            const displayName = cleanPatientName(email);
            const completedCount = appts.filter(a => a.status === 'COMPLETED').length;
            const lastAppt = [...appts].sort((a, b) =>
              new Date(b.slot?.slotDate || 0).getTime() - new Date(a.slot?.slotDate || 0).getTime()
            )[0];

            return (
              <div key={patient.id} className="bg-[#111827]/60 backdrop-blur-md border border-[#1f293d]/60 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3 mb-3.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-semibold shrink-0">
                      {displayName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-xs font-semibold tracking-tight truncate">{displayName}</h3>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] truncate mt-0.5 font-mono">
                        <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{email}</span>
                      </div>
                      {phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] truncate mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#162032] p-2.5 rounded-lg border border-[#1f293d] mb-3">
                    <div>
                      <p className="text-[11px] text-slate-400">Total visits</p>
                      <p className="text-white font-medium tabular-nums mt-0.5">{appts.length}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Completed</p>
                      <p className="text-emerald-400 font-medium tabular-nums mt-0.5">{completedCount}</p>
                    </div>
                  </div>
                </div>

                {lastAppt && (
                  <div className="pt-2.5 border-t border-[#1f293d] text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Last visit</span>
                    <span className="text-slate-300 font-medium">
                      {lastAppt.slot?.slotDate ? new Date(lastAppt.slot.slotDate).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
