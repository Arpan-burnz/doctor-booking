'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Clock,
  AlertTriangle,
  UserX,
  CheckCircle2,
  Database,
  RefreshCw
} from 'lucide-react';

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<any>({ actionRequired: [], systemEvents: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/alerts')
      .then((res) => {
        if (res.data.success) {
          setAlerts(res.data.data);
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return <div className="p-8 text-zinc-400">Loading alerts...</div>;
  }

  const handleMarkAllRead = () => {
    // Optimistic UI update
    setAlerts((prev: any) => ({
      ...prev,
      actionRequired: prev.actionRequired.map((alert: any) => ({ ...alert, isRead: true }))
    }));
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CLOCK': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'USER_X': return <UserX className="w-5 h-5 text-red-500" />;
      case 'CHECK_CIRCLE': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'DATABASE': return <Database className="w-5 h-5 text-blue-500" />;
      case 'REFRESH': return <RefreshCw className="w-5 h-5 text-green-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getIconBg = (iconName: string) => {
    switch (iconName) {
      case 'CLOCK': return 'bg-amber-900/20';
      case 'WARNING': return 'bg-red-900/20';
      case 'USER_X': return 'bg-red-900/20';
      case 'CHECK_CIRCLE': return 'bg-green-900/20';
      case 'DATABASE': return 'bg-blue-900/20';
      case 'REFRESH': return 'bg-green-900/20';
      default: return 'bg-zinc-800';
    }
  };

  const unreadCount = alerts.actionRequired.filter((a: any) => !a.isRead).length;

  return (
    <div className="p-6 md:p-10 max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Admin alerts</h1>
          <p className="text-sm text-zinc-400 font-medium">Platform-wide notifications and action items</p>
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="px-4 py-2 border border-zinc-700 bg-[#1a1a1d] hover:bg-zinc-800 text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-95 text-zinc-200"
        >
          Mark all read
        </button>
      </div>

      {/* Action Required */}
      <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">Action required</h2>
          {unreadCount > 0 && (
            <span className="text-amber-500 font-semibold text-xs tracking-wide">{unreadCount} urgent</span>
          )}
        </div>
        
        <div className="divide-y divide-zinc-800/50">
          {alerts.actionRequired.map((alert: any) => (
            <div key={alert.id} className="p-5 flex gap-4 hover:bg-zinc-800/30 transition-colors group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(alert.icon)}`}>
                {getIcon(alert.icon)}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-zinc-100 text-base">{alert.title}</h3>
                <p className="text-sm font-medium text-zinc-300 leading-relaxed">{alert.message}</p>
                <div className="text-xs font-medium text-zinc-500 pt-1">{alert.time}</div>
              </div>
              {!alert.isRead && (
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0"></div>
              )}
            </div>
          ))}
          {alerts.actionRequired.length === 0 && (
            <div className="p-8 text-center text-zinc-500 text-sm font-medium">
              No urgent actions required.
            </div>
          )}
        </div>
      </div>

      {/* System Events */}
      <div className="bg-[#1a1a1d] border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/50">
          <h2 className="text-lg font-bold text-zinc-100">System events</h2>
        </div>
        
        <div className="divide-y divide-zinc-800/50">
          {alerts.systemEvents.map((event: any) => (
            <div key={event.id} className="p-5 flex gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(event.icon)}`}>
                {getIcon(event.icon)}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-zinc-100 text-base">{event.title}</h3>
                <p className="text-sm font-medium text-zinc-300 leading-relaxed">{event.message}</p>
                <div className="text-xs font-medium text-zinc-500 pt-1">{event.time}</div>
              </div>
            </div>
          ))}
          {alerts.systemEvents.length === 0 && (
            <div className="p-8 text-center text-zinc-500 text-sm font-medium">
              No recent system events.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
