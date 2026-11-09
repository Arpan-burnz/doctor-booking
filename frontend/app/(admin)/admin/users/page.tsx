'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  UserCheck,
  UserX,
  Download,
  MoreHorizontal,
  Search,
  Loader2,
} from 'lucide-react';

export default function AdminUsers() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeAccounts: 0,
    deactivated: 0,
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/users/stats'),
      api.get('/admin/users'),
    ]).then(([statsRes, usersRes]) => {
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleDeactivate = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to deactivate this account?')) return;
      await api.patch(`/admin/users/${id}/deactivate`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u));
      setStats(prev => ({
        ...prev,
        activeAccounts: prev.activeAccounts - 1,
        deactivated: prev.deactivated + 1,
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Deactivation failed');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/restore`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u));
      setStats(prev => ({
        ...prev,
        activeAccounts: prev.activeAccounts + 1,
        deactivated: prev.deactivated - 1,
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Restore failed');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh] bg-[#090d16]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          <p className="text-slate-400 text-xs">Loading users</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();

    const userDate = new Date(user.createdAt);
    const dateStr = userDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
    const monthStr = userDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
    const yearStr = userDate.getFullYear().toString();
    const isoDate = userDate.toISOString().split('T')[0];

    const email = (user.email || '').toLowerCase();
    const displayName = (user.email?.split('@')[0] || '').toLowerCase();

    return (
      dateStr.includes(q) || monthStr.includes(q) || yearStr.includes(q) || isoDate.includes(q) ||
      email.includes(q) || displayName.includes(q)
    );
  });

  // Helper to extract initials for avatar
  const getInitials = (email: string, name?: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#090d16] text-slate-100 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">User management</h1>
          <p className="text-xs text-slate-400 mt-1">All registered patients and patient accounts</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date, name, or email..."
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.totalPatients.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">Total patients</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.activeAccounts.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">Active accounts</div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <UserX className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-white tracking-tight">{stats.deactivated.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">Deactivated</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1f293d] flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registered patients</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] bg-[#162032] text-slate-400 border-b border-[#1f293d]">
              <tr>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Appointments</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {filteredUsers.map((user) => {
                const isActive = user.isActive !== false;
                const displayName = user.email?.split('@')[0] || 'Unknown';
                const initials = getInitials(user.email, displayName);

                return (
                  <tr key={user.id} className="hover:bg-[#162032]/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                          isActive
                            ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}>
                          {initials}
                        </div>
                        <div className="font-medium text-white truncate max-w-[150px] capitalize">
                          {displayName}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 truncate max-w-[150px] font-mono text-[11px]">
                      {user.email}
                    </td>
                    <td className="px-5 py-3 text-white tabular-nums">
                      {Number(user.appointmentsCount || 0)}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      {isActive ? (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      ) : (
                        <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2.5 text-xs font-medium">
                        {isActive ? (
                          <button onClick={() => handleDeactivate(user.id)} className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer">
                            Deactivate
                          </button>
                        ) : (
                          <button onClick={() => handleRestore(user.id)} className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">
                            Restore
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
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                    No users found matching your search
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
