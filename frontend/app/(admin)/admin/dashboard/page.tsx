'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Stethoscope,
  Calendar,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle2,
  User
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    pendingDoctors: 0,
    totalAppointments: 0,
    appointmentsThisMonth: 0,
    todaysAppointments: 0,
    newPatientsToday: 0,
    cancellationRate: '0.0',
    avgRating: '0.0',
    revenueThisMonth: 0
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, isVerified: true } : d));
      setStats(prev => ({
        ...prev,
        pendingDoctors: prev.pendingDoctors - 1,
        totalDoctors: prev.totalDoctors + 1
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Verification failed');
    }
  };

  const handleReject = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to reject this application?')) return;
      await api.delete(`/admin/doctors/${id}/reject`);
      setDoctors(prev => prev.filter(d => d.id !== id));
      setStats(prev => ({
        ...prev,
        pendingDoctors: prev.pendingDoctors - 1
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Rejection failed');
    }
  };

  const pending = doctors.filter(d => !d.isVerified);

  if (loading) {
    return <div className="p-8 text-zinc-400">Loading dashboard...</div>;
  }

  // Helper to format time ago
  const timeAgo = (dateStr: string) => {
    const hours = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Platform overview</h1>
          <p className="text-sm text-zinc-400 font-medium">Live stats across the DOC4U platform</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-zinc-700 bg-[#1a1a1d] hover:bg-zinc-800 text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-95">
          <Download className="w-4 h-4" />
          <span>Export report</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-5">
          <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center mb-4">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-zinc-100">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Total patients</div>
        </div>

        <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-5">
          <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center mb-4">
            <Stethoscope className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-zinc-100">{stats.totalDoctors.toLocaleString()}</div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Verified doctors</div>
        </div>

        <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-900/30 flex items-center justify-center mb-4">
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-zinc-100">{stats.appointmentsThisMonth.toLocaleString()}</div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Appointments this month</div>
        </div>

        <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-5">
          <div className="w-8 h-8 rounded-lg bg-amber-900/30 flex items-center justify-center mb-4">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-zinc-100">{stats.pendingDoctors}</div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Pending verifications</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Pending Verifications */}
        <div className="lg:col-span-2 bg-[#18181b] border border-zinc-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg font-bold text-zinc-100">Pending doctor verifications</h2>
            {pending.length > 0 && (
              <span className="text-xs font-bold text-amber-500 bg-amber-950/40 px-2.5 py-0.5 rounded-md">
                {pending.length} pending
              </span>
            )}
          </div>

          <div className="space-y-4">
            {pending.length > 0 ? pending.map(doc => (
              <div key={doc.id} className="border border-zinc-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e1e22]/50 hover:bg-[#1e1e22] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-900/20 border border-amber-900/30 flex items-center justify-center text-amber-500 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-zinc-100">
                      Dr. {doc.user?.name || doc.fullName || doc.specialization}
                    </h3>
                    <div className="text-[13px] text-zinc-400 font-medium mt-0.5">
                      {doc.specialization} · {doc.licenseNumber} · Applied {timeAgo(doc.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                  <button 
                    onClick={() => handleVerify(doc.id)}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-semibold text-sm rounded-lg transition-colors border border-emerald-900/30 cursor-pointer active:scale-95"
                  >
                    Verify
                  </button>
                  <button 
                    onClick={() => handleReject(doc.id)}
                    className="px-4 py-2 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 font-semibold text-sm rounded-lg transition-colors border border-rose-900/20 cursor-pointer active:scale-95"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                No pending verifications.
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Alerts */}
        <div className="space-y-6">
          <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-zinc-100 mb-6">Platform stats</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-sm font-medium text-zinc-300">Today's appointments</span>
                <span className="text-sm font-bold text-blue-400">{stats.todaysAppointments}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-sm font-medium text-zinc-300">New patients today</span>
                <span className="text-sm font-bold text-zinc-100">{stats.newPatientsToday}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-sm font-medium text-zinc-300">Cancellation rate</span>
                <span className="text-sm font-bold text-amber-500">{stats.cancellationRate}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-sm font-medium text-zinc-300">Avg rating</span>
                <span className="text-sm font-bold text-emerald-500">{stats.avgRating} ★</span>
              </div>
              <div className="flex justify-between items-center py-2 pt-3">
                <span className="text-sm font-medium text-zinc-300">Revenue this month</span>
                <span className="text-sm font-bold text-zinc-100">₹{stats.revenueThisMonth.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-zinc-100 mb-6">Recent alerts</h2>
            
            <div className="space-y-4">
              {stats.pendingDoctors > 0 && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      {stats.pendingDoctors} doctors pending
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    </div>
                    <div className="text-xs text-zinc-500 font-medium mt-0.5">Needs review</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 pt-3 border-t border-zinc-800/50">
                <div className="mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-zinc-100">System healthy</div>
                  <div className="text-xs text-zinc-500 font-medium mt-0.5">All services up</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}