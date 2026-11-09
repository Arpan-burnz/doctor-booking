'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  Ban,
  Download,
  MoreHorizontal,
  Search,
  User as UserIcon,
  Loader2,
} from 'lucide-react';

export default function AdminDoctors() {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    pendingDoctors: 0,
    suspendedDoctors: 0,
  });
  
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/doctors'),
    ]).then(([statsRes, docRes]) => {
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (docRes.data.success) {
        setDoctors(docRes.data.data);
      }
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleVerify = async (id: string) => {
    try {
      await api.patch(`/admin/doctors/${id}/verify`);
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, isVerified: true, isSuspended: false } : d));
      setStats(prev => ({
        ...prev,
        pendingDoctors: prev.pendingDoctors - 1,
        totalDoctors: prev.totalDoctors + 1,
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Verification failed');
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to suspend this doctor?')) return;
      await api.patch(`/admin/doctors/${id}/suspend`);
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, isSuspended: true } : d));
      setStats(prev => ({
        ...prev,
        suspendedDoctors: prev.suspendedDoctors + 1,
        totalDoctors: prev.totalDoctors - 1,
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Suspension failed');
    }
  };

  const handleReinstate = async (id: string) => {
    try {
      await api.patch(`/admin/doctors/${id}/reinstate`);
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, isSuspended: false } : d));
      setStats(prev => ({
        ...prev,
        suspendedDoctors: prev.suspendedDoctors - 1,
        totalDoctors: prev.totalDoctors + 1,
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Reinstate failed');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-[#090d16]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          <p className="text-slate-400 text-xs">Loading doctors</p>
        </div>
      </div>
    );
  }

  const verifiedDoctors = stats.totalDoctors;
  const pendingCount = stats.pendingDoctors;
  const suspendedCount = stats.suspendedDoctors;
  const totalCount = verifiedDoctors + pendingCount + suspendedCount;

  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    
    const docDate = new Date(doctor.createdAt);
    const dateStr = docDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
    const monthStr = docDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
    const yearStr = docDate.getFullYear().toString();
    const isoDate = docDate.toISOString().split('T')[0];
    
    const email = (doctor.email || '').toLowerCase();
    const displayName = (doctor.name || doctor.firstName || doctor.email?.split('@')[0] || '').toLowerCase();
    const spec = (doctor.specialization || '').toLowerCase();
    
    return (
      dateStr.includes(q) || monthStr.includes(q) || yearStr.includes(q) || isoDate.includes(q) ||
      email.includes(q) || displayName.includes(q) || spec.includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#090d16] text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Doctor management</h1>
          <p className="text-xs text-slate-400 mt-1">Verify credentials, manage active doctors, and monitor compliance</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor, license, specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#090d16] border border-[#1f293d] text-white text-xs rounded-lg pl-8 pr-3.5 py-2 focus:outline-none focus:border-violet-500 w-full sm:w-64 placeholder:text-slate-500 transition-colors"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-[#1f293d] bg-[#111827] hover:bg-[#162032] text-xs font-medium text-slate-200 rounded-lg transition-colors cursor-pointer shrink-0">
            <Download className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{totalCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Total doctors</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{verifiedDoctors}</div>
            <div className="text-xs text-slate-400 mt-0.5">Verified</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{pendingCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Pending</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Ban className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{suspendedCount}</div>
            <div className="text-xs text-slate-400 mt-0.5">Suspended</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1f293d] flex items-center justify-between gap-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Registered practitioners
          </h2>
          <div className="flex gap-3 text-xs font-medium">
            <span className="text-emerald-400">Verified ({verifiedDoctors})</span>
            <span className="text-amber-400">Pending ({pendingCount})</span>
            <span className="text-rose-400">Suspended ({suspendedCount})</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] bg-[#162032] text-slate-400 border-b border-[#1f293d]">
              <tr>
                <th className="px-5 py-3 font-medium">Doctor</th>
                <th className="px-5 py-3 font-medium">Specialization</th>
                <th className="px-5 py-3 font-medium">Patients</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {filteredDoctors.map((doctor) => {
                const isPending = !doctor.isVerified && !doctor.isSuspended;
                const isVerified = doctor.isVerified && !doctor.isSuspended;
                const isSuspended = doctor.isSuspended;

                return (
                  <tr key={doctor.id} className="hover:bg-[#162032]/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="font-medium text-white truncate max-w-[150px]">
                          {doctor.name ? doctor.name : (doctor.email || 'Doctor')}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      {doctor.specialization}
                    </td>
                    <td className="px-5 py-3 text-slate-400 tabular-nums">
                      {isVerified ? doctor.patientsCount || 0 : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {isVerified ? (
                        <div className="flex items-center gap-1 text-amber-400 tabular-nums">
                          {doctor.rating || '0.0'} <span className="text-[10px]">★</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-white tabular-nums">
                      ₹{doctor.consultationFee}
                    </td>
                    <td className="px-5 py-3">
                      {isVerified && (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Verified
                        </span>
                      )}
                      {isPending && (
                        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pending
                        </span>
                      )}
                      {isSuspended && (
                        <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2.5 text-xs font-medium">
                        {isVerified && (
                          <button onClick={() => handleSuspend(doctor.id)} className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer">
                            Suspend
                          </button>
                        )}
                        {isPending && (
                          <button onClick={() => handleVerify(doctor.id)} className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
                            Verify
                          </button>
                        )}
                        {isSuspended && (
                          <button onClick={() => handleReinstate(doctor.id)} className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">
                            Reinstate
                          </button>
                        )}
                        <button className="text-slate-500 hover:text-slate-300 cursor-pointer">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDoctors.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-500">
                    No doctors found matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
