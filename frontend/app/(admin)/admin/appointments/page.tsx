'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Calendar,
  CheckCircle2,
  X,
  UserX,
  Download,
  Search
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
      api.get('/admin/appointments')
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
    return <div className="p-8 text-zinc-400">Loading appointments...</div>;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">All appointments</h1>
          <p className="text-sm text-zinc-400 font-medium">Monitor every booking across the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date (e.g. 2026, Oct, 2026-10)..."
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
        {/* Today */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-900/20 flex items-center justify-center text-blue-500">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.todaysAppointments.toLocaleString()}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Today</div>
          </div>
        </div>
        {/* This month */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-900/20 flex items-center justify-center text-green-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.appointmentsThisMonth.toLocaleString()}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">This month</div>
          </div>
        </div>
        {/* Cancelled */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-900/20 flex items-center justify-center text-red-500">
            <X className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.cancelledAppointments.toLocaleString()}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Cancelled</div>
          </div>
        </div>
        {/* No shows */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-900/20 flex items-center justify-center text-orange-500">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.noShows.toLocaleString()}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">No shows</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            Live appointments — today
          </h2>
          <span className="text-sm font-medium text-zinc-400">{currentDate}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Patient</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Doctor</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Slot</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Fee</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredAppointments.map((appt) => {
                const patientName = appt.patient?.user?.email?.split('@')[0] || 'Unknown';
                const doctorName = appt.doctor?.user?.email?.split('@')[0] || 'Unknown';
                
                // Colors based on status
                let statusColor = 'text-zinc-400 bg-zinc-400/10';
                let actionColor = 'text-blue-400 hover:text-blue-300';
                let actionText = 'View';
                let statusLabel = 'Pending';
                
                if (appt.status === 'CONFIRMED') {
                  statusColor = 'text-green-500 bg-green-500/10';
                  actionColor = 'text-red-400 hover:text-red-300';
                  actionText = 'Cancel';
                  statusLabel = 'Confirmed';
                } else if (appt.status === 'COMPLETED') {
                  statusColor = 'text-blue-500 bg-blue-500/10';
                  statusLabel = 'Complete';
                } else if (appt.status === 'CANCELLED') {
                  statusColor = 'text-red-500 bg-red-500/10';
                  statusLabel = 'Cancelled';
                } else if (appt.status === 'NO_SHOW') {
                  statusColor = 'text-red-500 bg-red-500/10';
                  statusLabel = 'No show';
                }

                return (
                  <tr key={appt.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-200 capitalize truncate max-w-[150px]">
                        {patientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-300 capitalize truncate max-w-[150px]">
                      Dr. {doctorName}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-300">
                      {appt.slot?.startTime || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-200">
                      ₹{appt.doctor?.consultationFee || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${statusColor} font-medium text-xs px-2 py-1 rounded-md`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className={`${actionColor} text-xs font-semibold transition-colors`}>
                        {actionText}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No appointments found.
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
