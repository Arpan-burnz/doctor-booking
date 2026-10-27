'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  UserCheck,
  UserX,
  Download,
  MoreHorizontal,
  Search
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
      api.get('/admin/users')
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
        deactivated: prev.deactivated + 1
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
        deactivated: prev.deactivated - 1
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Restore failed');
    }
  };

  if (loading) {
    return <div className="p-8 text-zinc-400">Loading users...</div>;
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">User management</h1>
          <p className="text-sm text-zinc-400 font-medium">All patients and accounts on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date, name, email..."
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Patients */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-900/20 flex items-center justify-center text-blue-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.totalPatients.toLocaleString()}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Total patients</div>
          </div>
        </div>
        {/* Active Accounts */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-900/20 flex items-center justify-center text-green-500">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.activeAccounts.toLocaleString()}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Active accounts</div>
          </div>
        </div>
        {/* Deactivated */}
        <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-900/20 flex items-center justify-center text-red-500">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.deactivated.toLocaleString()}</div>
            <div className="text-sm font-medium text-zinc-400 mt-1">Deactivated</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">All patients</h2>
          <button className="text-sm font-medium text-blue-400 hover:text-blue-300">Filter by status</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500 border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Patient</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Email</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Appointments</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Joined</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredUsers.map((user) => {
                const isActive = user.isActive !== false;
                const displayName = user.email?.split('@')[0] || 'Unknown'; // Can be mapped to actual name if added
                const initials = getInitials(user.email, displayName);

                return (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isActive ? 'bg-blue-900/40 text-blue-400' : 'bg-red-900/40 text-red-400'}`}>
                          {initials}
                        </div>
                        <div className="font-semibold text-zinc-200 truncate max-w-[150px] capitalize">
                          {displayName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-400 truncate max-w-[150px]">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-200">
                      {Number(user.appointmentsCount || 0)}
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {isActive ? (
                        <span className="text-green-500 font-medium text-xs bg-green-500/10 px-2 py-1 rounded-md">
                          Active
                        </span>
                      ) : (
                        <span className="text-red-500 font-medium text-xs bg-red-500/10 px-2 py-1 rounded-md">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                        {isActive ? (
                          <button onClick={() => handleDeactivate(user.id)} className="text-red-400 hover:text-red-300 transition-colors">
                            Deactivate
                          </button>
                        ) : (
                          <button onClick={() => handleRestore(user.id)} className="text-blue-400 hover:text-blue-300 transition-colors">
                            Restore
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
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No users found matching your search.
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
