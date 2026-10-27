'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  TrendingUp,
  Users,
  Star,
  Square,
  Download
} from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/analytics')
    ]).then(([statsRes, anRes]) => {
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (anRes.data.success) setAnalytics(anRes.data.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading || !stats || !analytics) {
    return <div className="p-8 text-zinc-400">Loading analytics...</div>;
  }

  // Format revenue to Lakhs if > 100000
  const formatRevenueCard = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const revenueThisMonth = stats.revenueThisMonth || 0;

  // monthly stats data manipulation
  // We expect monthlyStats to be ordered by sort_key DESC (newest first).
  // We'll reverse it for the bar chart to show Jun -> Nov (oldest to newest).
  const monthsData = [...analytics.monthlyStats].reverse();

  // Find max appointments for bar scaling
  const maxAppointments = Math.max(...monthsData.map((m: any) => m.appointments || 0), 1);

  // Top specializations formatting
  const totalDocs = analytics.specializations.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0) || 1;
  const topSpecs = analytics.specializations.map((spec: any) => ({
    name: spec.specialization,
    percentage: Math.round(((spec.count || 0) / totalDocs) * 100),
  }));

  // Revenue breakdown table
  // We need growth which compares with the previous month.
  // Since monthlyStats is DESC (newest first), monthlyStats[i+1] is the previous month.
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
      cancelRate: cancelRate
    };
  });

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-500';
    if (growth < 0) return 'text-red-500';
    return 'text-zinc-500';
  };

  const getGrowthText = (growth: number) => {
    if (growth > 0) return `+${Math.round(growth)}%`;
    if (growth < 0) return `${Math.round(growth)}%`;
    return '-';
  };

  const barColors = [
    'bg-blue-500', 'bg-blue-500', 'bg-blue-500', 'bg-blue-500', 'bg-blue-500', 'bg-green-500' // Nov is green in mockup
  ];
  
  const specColors = [
    'bg-green-500', 'bg-blue-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500'
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
          <p className="text-sm text-zinc-400 font-medium">Platform performance and growth metrics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-zinc-700 bg-[#1a1a1d] hover:bg-zinc-800 text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-95">
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-900/20 flex items-center justify-center text-green-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{formatRevenueCard(revenueThisMonth)}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Revenue this month</div>
          </div>
        </div>
        
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-900/20 flex items-center justify-center text-blue-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">+{stats.newPatientsToday}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">New patients today</div>
          </div>
        </div>
        
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-900/20 flex items-center justify-center text-purple-400">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.avgRating}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Platform avg rating</div>
          </div>
        </div>

        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-900/20 flex items-center justify-center text-orange-500">
            <Square className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.cancellationRate}%</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Cancellation rate</div>
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Appointments by month chart */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-zinc-100 mb-6">Appointments by month</h2>
          <div className="space-y-4">
            {monthsData.map((m: any, idx: number) => {
              const width = Math.max((m.appointments / maxAppointments) * 100, 5);
              const colorClass = barColors[idx] || 'bg-blue-500';
              return (
                <div key={m.month_short} className="flex items-center gap-4 text-sm font-medium">
                  <div className="w-8 text-zinc-400">{m.month_short}</div>
                  <div className="flex-1">
                    <div className={`h-1.5 rounded-full ${colorClass}`} style={{ width: `${width}%` }}></div>
                  </div>
                  <div className="w-12 text-right text-zinc-200">{m.appointments.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top specializations chart */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-zinc-100 mb-6">Top specializations</h2>
          <div className="space-y-6">
            {topSpecs.map((spec: any, idx: number) => {
              const colorClass = specColors[idx % specColors.length];
              return (
                <div key={spec.name} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-zinc-200">{spec.name}</span>
                    <span className="text-zinc-400">{spec.percentage}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${colorClass}`} style={{ width: `${spec.percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
            {topSpecs.length === 0 && (
              <div className="text-zinc-500 text-sm">No verified doctors found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown Table */}
      <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/50">
          <h2 className="text-lg font-bold text-zinc-100">Revenue breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Month</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Appointments</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Revenue</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Growth</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Cancellation Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {tableData.map((row: any) => (
                <tr key={row.month_year} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-zinc-200">
                    {row.month_year}
                  </td>
                  <td className="px-6 py-4 font-bold text-zinc-200">
                    {row.appointments.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-green-500">
                    ₹{row.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className={`px-6 py-4 font-semibold ${getGrowthColor(row.growth)}`}>
                    {getGrowthText(row.growth)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-yellow-500">
                    {row.cancelRate}%
                  </td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No data available.
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
