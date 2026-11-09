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
  User,
  Loader2,
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
    revenueThisMonth: 0,
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, isVerified: true } : d));
      setStats(prev => ({
        ...prev,
        pendingDoctors: prev.pendingDoctors - 1,
        totalDoctors: prev.totalDoctors + 1,
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
        pendingDoctors: prev.pendingDoctors - 1,
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Rejection failed');
    }
  };

  const pending = doctors.filter(d => !d.isVerified);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-[#090d16]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          <p className="text-slate-400 text-xs">Loading admin portal</p>
        </div>
      </div>
    );
  }

  // Helper to format time ago
  const timeAgo = (dateStr: string) => {
    const hours = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#090d16] text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Platform overview</h1>
          <p className="text-xs text-slate-400 mt-1">Live metrics across the consultation platform</p>
        </div>
        <button className="flex items-center gap-2 px-3.5 py-2 border border-[#1f293d] bg-[#111827] hover:bg-[#162032] text-xs font-medium text-slate-200 rounded-lg transition-colors cursor-pointer">
          <Download className="w-3.5 h-3.5 text-violet-400" />
          <span>Export report</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3 text-violet-400">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total patients</div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3 text-violet-400">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.totalDoctors.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-0.5">Verified doctors</div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3 text-violet-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.appointmentsThisMonth.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-0.5">Appointments this month</div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3 text-violet-400">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.pendingDoctors}</div>
          <div className="text-xs text-slate-400 mt-0.5">Pending verifications</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Pending Verifications */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f293d] rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#1f293d]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending doctor verifications
            </h2>
            {pending.length > 0 && (
              <span className="text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                {pending.length} pending
              </span>
            )}
          </div>

          <div className="space-y-3">
            {pending.length > 0 ? pending.map(doc => (
              <div key={doc.id} className="border border-[#1f293d] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-[#162032]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Dr. {doc.user?.name || doc.fullName || doc.specialization}
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {doc.specialization} · {doc.licenseNumber} · {timeAgo(doc.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                  <button 
                    onClick={() => handleVerify(doc.id)}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Verify
                  </button>
                  <button 
                    onClick={() => handleReject(doc.id)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-xs rounded-lg transition-colors border border-rose-500/20 cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-[#1f293d] rounded-lg bg-[#162032]/30">
                No pending doctor verifications
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Alerts */}
        <div className="space-y-5">
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 pb-3 border-b border-[#1f293d]">
              Platform metrics
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-300">Today&apos;s appointments</span>
                <span className="text-xs font-medium tabular-nums text-white">{stats.todaysAppointments}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-[#1f293d] pt-2.5">
                <span className="text-xs text-slate-300">New patients today</span>
                <span className="text-xs font-medium tabular-nums text-white">{stats.newPatientsToday}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-[#1f293d] pt-2.5">
                <span className="text-xs text-slate-300">Cancellation rate</span>
                <span className="text-xs font-medium tabular-nums text-amber-400">{stats.cancellationRate}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-[#1f293d] pt-2.5">
                <span className="text-xs text-slate-300">Average rating</span>
                <span className="text-xs font-medium tabular-nums text-emerald-400">{stats.avgRating} ★</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-[#1f293d] pt-2.5">
                <span className="text-xs text-slate-300">Revenue this month</span>
                <span className="text-xs font-medium tabular-nums text-white">₹{stats.revenueThisMonth.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 pb-3 border-b border-[#1f293d]">
              System alerts
            </h2>
            
            <div className="space-y-3">
              {stats.pendingDoctors > 0 && (
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white flex items-center gap-2">
                      {stats.pendingDoctors} doctor applications pending review
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Verification required</div>
                  </div>
                </div>
              )}
              
              <div className={`flex items-start gap-2.5 ${stats.pendingDoctors > 0 ? 'pt-2.5 border-t border-[#1f293d]' : ''}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-white">All clinical services operational</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">API and database active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
