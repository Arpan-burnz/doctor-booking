'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Calendar,
  CheckCircle2,
  X,
  UserX,
  Download,
  Search,
  Loader2,
} from 'lucide-react';

export default function AdminAppointments() {
  const [stats, setStats] = useState({
    todaysAppointments: 0,
    appointmentsThisMonth: 0,
    cancelledAppointments: 0,
    noShows: 0,
  });
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/appointments'),
    ]).then(([statsRes, apptsRes]) => {
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (apptsRes.data.success) {
        setAppointments(apptsRes.data.data);
      }
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-[#090d16]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          <p className="text-slate-400 text-xs">Loading appointments</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const filteredAppointments = appointments.filter((appt) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const apptDate = new Date(appt.slot?.slotDate || appt.bookedAt);
    const dateStr = apptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
    const monthStr = apptDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
    const yearStr = apptDate.getFullYear().toString();
    const isoDate = apptDate.toISOString().split('T')[0];
    
    const patientName = (appt.patient?.user?.email?.split('@')[0] || '').toLowerCase();
    const doctorName = (appt.doctor?.user?.email?.split('@')[0] || '').toLowerCase();
    
    return (
      dateStr.includes(q) || monthStr.includes(q) || yearStr.includes(q) || isoDate.includes(q) ||
      patientName.includes(q) || doctorName.includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#090d16] text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">All appointments</h1>
          <p className="text-xs text-slate-400 mt-1">Monitor all bookings across the platform</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date, doctor, or patient..."
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
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.todaysAppointments.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">Today</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.appointmentsThisMonth.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">This month</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <X className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.cancelledAppointments.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">Cancelled</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <UserX className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.noShows.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">No shows</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1f293d] flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recorded appointments
          </h2>
          <span className="text-xs text-slate-400 font-mono">{currentDate}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] bg-[#162032] text-slate-400 border-b border-[#1f293d]">
              <tr>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Doctor</th>
                <th className="px-5 py-3 font-medium">Slot</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {filteredAppointments.map((appt) => {
                const patientName = appt.patient?.user?.email?.split('@')[0] || 'Unknown';
                const doctorName = appt.doctor?.user?.email?.split('@')[0] || 'Unknown';
                
                let statusBadge = (
                  <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 font-medium text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Pending
                  </span>
                );
                let actionColor = 'text-rose-400 hover:text-rose-300';
                let actionText = 'Cancel';
                
                if (appt.status === 'CONFIRMED') {
                  statusBadge = (
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-medium text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Confirmed
                    </span>
                  );
                } else if (appt.status === 'COMPLETED') {
                  statusBadge = (
                    <span className="text-sky-400 bg-sky-500/10 border border-sky-500/20 font-medium text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Completed
                    </span>
                  );
                  actionText = 'View';
                  actionColor = 'text-sky-400 hover:text-sky-300';
                } else if (appt.status === 'CANCELLED') {
                  statusBadge = (
                    <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 font-medium text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      Cancelled
                    </span>
                  );
                  actionText = 'Details';
                  actionColor = 'text-slate-400 hover:text-white';
                } else if (appt.status === 'NO_SHOW') {
                  statusBadge = (
                    <span className="text-slate-400 bg-slate-800 border border-slate-700 font-medium text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      No show
                    </span>
                  );
                  actionText = 'Details';
                  actionColor = 'text-slate-400 hover:text-white';
                }

                return (
                  <tr key={appt.id} className="hover:bg-[#162032]/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-white capitalize truncate max-w-[150px]">
                      {patientName}
                    </td>
                    <td className="px-5 py-3 text-slate-300 capitalize truncate max-w-[150px]">
                      Dr. {doctorName}
                    </td>
                    <td className="px-5 py-3 text-slate-300 tabular-nums">
                      {appt.slot?.startTime || '—'}
                    </td>
                    <td className="px-5 py-3 font-medium text-white tabular-nums">
                      ₹{appt.doctor?.consultationFee || 0}
                    </td>
                    <td className="px-5 py-3">
                      {statusBadge}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className={`${actionColor} text-xs font-medium transition-colors cursor-pointer`}>
                        {actionText}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                    No appointments found
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
