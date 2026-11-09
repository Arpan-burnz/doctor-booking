'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  TrendingUp,
  Users,
  Star,
  Square,
  Download,
  Loader2,
} from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/analytics'),
    ]).then(([statsRes, anRes]) => {
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (anRes.data.success) setAnalytics(anRes.data.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading || !stats || !analytics) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-[#090d16]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          <p className="text-slate-400 text-xs">Loading analytics</p>
        </div>
      </div>
    );
  }

  // Format revenue to Lakhs if > 100000
  const formatRevenueCard = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const revenueThisMonth = stats.revenueThisMonth || 0;
  const monthsData = [...analytics.monthlyStats].reverse();
  const maxAppointments = Math.max(...monthsData.map((m: any) => m.appointments || 0), 1);

  const totalDocs = analytics.specializations.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0) || 1;
  const topSpecs = analytics.specializations.map((spec: any) => ({
    name: spec.specialization,
    percentage: Math.round(((spec.count || 0) / totalDocs) * 100),
  }));

  const tableData = analytics.monthlyStats.map((month: any, index: number, arr: any[]) => {
    const prev = arr[index + 1];
    let growth = 0;
    if (prev && prev.revenue > 0) {
      growth = ((month.revenue - prev.revenue) / prev.revenue) * 100;
    }
    const cancelRate = month.appointments > 0 ? ((month.cancelled / month.appointments) * 100).toFixed(1) : '0.0';
    
    return {
      month_year: month.month_year,
      appointments: month.appointments,
      revenue: month.revenue,
      growth: growth,
      cancelRate: cancelRate,
    };
  });

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-emerald-400';
    if (growth < 0) return 'text-rose-400';
    return 'text-slate-500';
  };

  const getGrowthText = (growth: number) => {
    if (growth > 0) return `+${Math.round(growth)}%`;
    if (growth < 0) return `${Math.round(growth)}%`;
    return '—';
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#090d16] text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Platform performance and growth metrics</p>
        </div>
        <button className="flex items-center gap-2 px-3.5 py-2 border border-[#1f293d] bg-[#111827] hover:bg-[#162032] text-xs font-medium text-slate-200 rounded-lg transition-colors cursor-pointer">
          <Download className="w-3.5 h-3.5 text-violet-400" />
          <span>Export report</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{formatRevenueCard(revenueThisMonth)}</div>
            <div className="text-xs text-slate-400 mt-0.5">Revenue this month</div>
          </div>
        </div>
        
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">+{stats.newPatientsToday}</div>
            <div className="text-xs text-slate-400 mt-0.5">New patients today</div>
          </div>
        </div>
        
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Star className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.avgRating} ★</div>
            <div className="text-xs text-slate-400 mt-0.5">Platform avg rating</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Square className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.cancellationRate}%</div>
            <div className="text-xs text-slate-400 mt-0.5">Cancellation rate</div>
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Appointments by month chart */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 pb-3 border-b border-[#1f293d]">
            Appointments by month
          </h2>
          <div className="space-y-3.5">
            {monthsData.map((m: any) => {
              const width = Math.max((m.appointments / maxAppointments) * 100, 5);
              return (
                <div key={m.month_short} className="flex items-center gap-3 text-xs">
                  <div className="w-7 text-slate-400 font-medium">{m.month_short}</div>
                  <div className="flex-1 bg-[#162032] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-400" style={{ width: `${width}%` }} />
                  </div>
                  <div className="w-10 text-right text-white font-medium tabular-nums">{m.appointments.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top specializations chart */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 pb-3 border-b border-[#1f293d]">
            Top specializations
          </h2>
          <div className="space-y-4">
            {topSpecs.map((spec: any) => (
              <div key={spec.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium">{spec.name}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{spec.percentage}%</span>
                </div>
                <div className="w-full bg-[#162032] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-400" style={{ width: `${spec.percentage}%` }} />
                </div>
              </div>
            ))}
            {topSpecs.length === 0 && (
              <div className="text-slate-500 text-xs py-4 text-center">No verified doctors found</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1f293d]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Revenue breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] bg-[#162032] text-slate-400 border-b border-[#1f293d]">
              <tr>
                <th className="px-5 py-3 font-medium">Month</th>
                <th className="px-5 py-3 font-medium">Appointments</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Growth</th>
                <th className="px-5 py-3 font-medium">Cancellation rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {tableData.map((row: any) => (
                <tr key={row.month_year} className="hover:bg-[#162032]/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-white">
                    {row.month_year}
                  </td>
                  <td className="px-5 py-3 text-slate-300 tabular-nums">
                    {row.appointments.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 font-medium text-emerald-400 tabular-nums">
                    ₹{row.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className={`px-5 py-3 font-medium ${getGrowthColor(row.growth)} tabular-nums`}>
                    {getGrowthText(row.growth)}
                  </td>
                  <td className="px-5 py-3 text-slate-400 tabular-nums">
                    {row.cancelRate}%
                  </td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500">
                    No data available
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
