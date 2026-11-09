'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole } from '@/lib/auth';
import { DollarSign, TrendingUp, Calendar, CheckCircle2, Loader2 } from 'lucide-react';

export default function EarningsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getUserRole() !== 'DOCTOR') { router.push('/login'); return; }
    Promise.allSettled([
      api.get('/appointments/mine'),
      api.get('/doctors/me/profile'),
    ]).then(([apptRes, profileRes]) => {
      if (apptRes.status === 'fulfilled') setAppointments(apptRes.value.data.data || []);
      if (profileRes.status === 'fulfilled') setDoctorProfile(profileRes.value.data.data);
    }).finally(() => setLoading(false));
  }, [router]);

  const consultationFee = doctorProfile?.consultationFee || 1500;
  const completedAppts = appointments.filter(a => a.status === 'COMPLETED');
  const confirmedAppts = appointments.filter(a => a.status === 'CONFIRMED');
  const totalEarnings = completedAppts.length * consultationFee;
  const projectedEarnings = (completedAppts.length + confirmedAppts.length) * consultationFee;

  // Group by month
  const monthlyData: Record<string, { count: number; amount: number }> = {};
  completedAppts.forEach(a => {
    if (!a.slot?.slotDate) return;
    const d = new Date(a.slot.slotDate);
    const key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!monthlyData[key]) monthlyData[key] = { count: 0, amount: 0 };
    monthlyData[key].count += 1;
    monthlyData[key].amount += consultationFee;
  });

  const monthlyEntries = Object.entries(monthlyData).sort(([a], [b]) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-[#090d16]">
      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-full bg-[#090d16] text-slate-100">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Practice earnings</h1>
        <p className="text-slate-400 text-xs mt-1">
          Base consultation fee: ₹{consultationFee.toLocaleString('en-IN')} per patient session
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            icon: <DollarSign className="w-4 h-4" />,
            label: 'Total earned',
            value: `₹${totalEarnings.toLocaleString('en-IN')}`,
          },
          {
            icon: <CheckCircle2 className="w-4 h-4" />,
            label: 'Completed consultations',
            value: completedAppts.length.toString(),
          },
          {
            icon: <TrendingUp className="w-4 h-4" />,
            label: 'Projected revenue',
            value: `₹${projectedEarnings.toLocaleString('en-IN')}`,
          },
        ].map((s, i) => (
          <div key={i} className="bg-[#111827] border border-[#1f293d] rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              {s.icon}
            </div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 pb-3 border-b border-[#1f293d]">
          Monthly breakdown
        </h2>

        {monthlyEntries.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-slate-600 mb-2.5" />
            <p className="text-slate-300 text-xs font-medium">No completed consultations recorded</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Earnings will accumulate as sessions are marked completed</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {monthlyEntries.map(([month, data]) => (
              <div key={month} className="flex items-center justify-between p-3.5 rounded-lg bg-[#162032] border border-[#1f293d]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white text-xs font-medium">{month}</h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">{data.count} session{data.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 text-sm font-semibold tabular-nums">₹{data.amount.toLocaleString('en-IN')}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Settled via platform</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
