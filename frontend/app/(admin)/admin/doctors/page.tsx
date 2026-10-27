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
      api.get('/admin/doctors')
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
        totalDoctors: prev.totalDoctors + 1
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
        totalDoctors: prev.totalDoctors - 1
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
        totalDoctors: prev.totalDoctors + 1
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Reinstate failed');
    }
  };

  if (loading) {
    return <div className="p-8 text-zinc-400">Loading doctors...</div>;
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
    const displayName = (doctor.firstName || doctor.email?.split('@')[0] || '').toLowerCase();
    const spec = (doctor.specialization || '').toLowerCase();
    
    return (
      dateStr.includes(q) || monthStr.includes(q) || yearStr.includes(q) || isoDate.includes(q) ||
      email.includes(q) || displayName.includes(q) || spec.includes(q)
    );
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Doctor management</h1>
          <p className="text-sm text-zinc-400 font-medium">Verify, suspend, and manage all doctors</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date, name, specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1a1a1d] border border-zinc-700 text-zinc-200 text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500 w-full sm:w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-zinc-700 bg-[#1a1a1d] hover:bg-zinc-800 text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-95 shrink-0">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Doctors */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-900/20 flex items-center justify-center text-purple-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{totalCount}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Total doctors</div>
          </div>
        </div>
        {/* Verified */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-900/20 flex items-center justify-center text-green-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{verifiedDoctors}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Verified</div>
          </div>
        </div>
        {/* Pending */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-900/20 flex items-center justify-center text-yellow-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{pendingCount}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Pending</div>
          </div>
        </div>
        {/* Suspended */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-900/20 flex items-center justify-center text-red-500">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{suspendedCount}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Suspended</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/50 flex items-center gap-6">
          <h2 className="text-lg font-bold text-zinc-100">All doctors</h2>
          <div className="flex gap-4 text-sm font-medium">
            <span className="text-green-400">Verified ({verifiedDoctors})</span>
            <span className="text-yellow-500">Pending ({pendingCount})</span>
            <span className="text-red-500">Suspended ({suspendedCount})</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Doctor</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Specialization</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Patients</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Rating</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Fee</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredDoctors.map((doctor) => {
                const isPending = !doctor.isVerified && !doctor.isSuspended;
                const isVerified = doctor.isVerified && !doctor.isSuspended;
                const isSuspended = doctor.isSuspended;

                return (
                  <tr key={doctor.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-900/40 text-purple-400 flex items-center justify-center shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="font-semibold text-zinc-200 truncate max-w-[150px]">
                          Dr. {doctor.firstName || doctor.email?.split('@')[0] || 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-300">
                      {doctor.specialization}
                    </td>
                    <td className="px-6 py-4">
                      {isVerified ? doctor.patientsCount || 0 : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {isVerified ? (
                        <div className="flex items-center gap-1 text-yellow-500 font-medium">
                          {doctor.rating || '0.0'} <span className="text-[10px]">★</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-200">
                      ₹{doctor.consultationFee}
                    </td>
                    <td className="px-6 py-4">
                      {isVerified && <span className="text-green-400 font-medium bg-green-400/10 px-2 py-1 rounded-md text-xs">Verified</span>}
                      {isPending && <span className="text-yellow-500 font-medium bg-yellow-500/10 px-2 py-1 rounded-md text-xs">Pending</span>}
                      {isSuspended && <span className="text-red-500 font-medium bg-red-500/10 px-2 py-1 rounded-md text-xs">Suspended</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                        {isVerified && (
                          <button onClick={() => handleSuspend(doctor.id)} className="text-red-400 hover:text-red-300 transition-colors">
                            Suspend
                          </button>
                        )}
                        {isPending && (
                          <button onClick={() => handleVerify(doctor.id)} className="text-green-400 hover:text-green-300 transition-colors">
                            Verify
                          </button>
                        )}
                        {isSuspended && (
                          <button onClick={() => handleReinstate(doctor.id)} className="text-purple-400 hover:text-purple-300 transition-colors">
                            Reinstate
                          </button>
                        )}
                        <button className="text-zinc-500 hover:text-zinc-300">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDoctors.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    No doctors found matching your search.
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
