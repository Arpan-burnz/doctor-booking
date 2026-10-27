'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole, getUsername } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import PatientSidebar from '@/components/shared/PatientSidebar';
import {
  Clock,
  XCircle,
  CheckCircle2,
  Check,
  X,
  FileCheck,
  Bell
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'CONFIRMED' | 'MEDICATION' | 'PRESCRIPTION' | 'REMINDER' | 'CANCELLED' | 'COMPLETED';
  title: string;
  description: string;
  time: string;
  category: 'TODAY' | 'EARLIER';
  isUnread: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (getUserRole() !== 'PATIENT') {
      router.push('/login');
      return;
    }
    const saved = localStorage.getItem('doc4u_patient_notifications');
    if (saved) {
      try {
        const parsed: NotificationItem[] = JSON.parse(saved);
        // Filter out legacy demo mock notifications (ids 1-6 or mock demo text)
        const realNotifications = parsed.filter(
          n => !['1', '2', '3', '4', '5', '6'].includes(n.id) &&
               !n.description?.includes('Dr. Priya Sharma') &&
               !n.description?.includes('Vitamin D3') &&
               !n.description?.includes('Dr. Arjun Mehta') &&
               !n.description?.includes('Dr. Neha Kapoor')
        );
        setNotifications(realNotifications);
        localStorage.setItem('doc4u_patient_notifications', JSON.stringify(realNotifications));
      } catch (e) {
        setNotifications([]);
        localStorage.setItem('doc4u_patient_notifications', JSON.stringify([]));
      }
    } else {
      setNotifications([]);
      localStorage.setItem('doc4u_patient_notifications', JSON.stringify([]));
    }
  }, [router]);

  const saveNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    localStorage.setItem('doc4u_patient_notifications', JSON.stringify(updated));
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, isUnread: false }));
    saveNotifications(updated);
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => (n.id === id ? { ...n, isUnread: false } : n));
    saveNotifications(updated);
  };

  const todayNotifications = notifications.filter(n => n.category === 'TODAY');
  const earlierNotifications = notifications.filter(n => n.category === 'EARLIER');
  const newCount = notifications.filter(n => n.isUnread).length;

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'CONFIRMED':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        );
      case 'MEDICATION':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-600/20 text-amber-500 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
        );
      case 'PRESCRIPTION':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'REMINDER':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        );
      case 'CANCELLED':
        return (
          <div className="w-10 h-10 rounded-full bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div
      className={`min-h-screen flex font-sans select-none antialiased transition-all duration-300 ${
        isDark ? 'bg-[#0c0d0e] text-zinc-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Sidebar Navigation */}
      {/* Shared Sidebar */}
      <PatientSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 md:pt-7 pb-7 space-y-7 transition-all duration-300">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h1>
            <p className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Stay updated on appointments and health
            </p>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-[#16171b] border-zinc-700/80 text-white hover:bg-zinc-800 hover:border-zinc-600'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications Grid Stack */}
        <div className="space-y-6 max-w-4xl">
          {notifications.length === 0 ? (
            <div
              className={`rounded-3xl p-12 border text-center flex flex-col items-center justify-center transition-all ${
                isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-zinc-800/80 text-zinc-400' : 'bg-slate-100 text-slate-400'}`}>
                <Bell className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>No notifications yet</h3>
              <p className={`text-xs max-w-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Updates about your upcoming appointments, prescriptions, and health reminders will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Card 1: Today */}
              {todayNotifications.length > 0 && (
                <div
                  className={`rounded-3xl p-6 border transition-all ${
                    isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Today</h3>
                    {newCount > 0 && (
                      <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        {newCount} new
                      </span>
                    )}
                  </div>

                  <div className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
                    {todayNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`flex items-start gap-4 py-4 cursor-pointer group transition-colors rounded-xl px-3 -mx-3 ${
                          notif.isUnread
                            ? isDark ? 'bg-blue-950/20 hover:bg-blue-900/30' : 'bg-blue-50/60 hover:bg-blue-50'
                            : isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50'
                        }`}
                      >
                        {renderIcon(notif.type)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {notif.isUnread && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20 shrink-0 inline-block"
                                  title="Unread notification"
                                />
                              )}
                              <h4 className={`text-sm font-bold ${notif.isUnread ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-zinc-300' : 'text-slate-700')}`}>
                                {notif.title}
                              </h4>
                            </div>
                            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{notif.time}</span>
                          </div>
                          <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                            {notif.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card 2: Earlier */}
              {earlierNotifications.length > 0 && (
                <div
                  className={`rounded-3xl p-6 border transition-all ${
                    isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <h3 className={`text-base font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Earlier</h3>

                  <div className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
                    {earlierNotifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`flex items-start gap-4 py-4 cursor-pointer group transition-colors rounded-xl px-3 -mx-3 ${
                          notif.isUnread
                            ? isDark ? 'bg-blue-950/20 hover:bg-blue-900/30' : 'bg-blue-50/60 hover:bg-blue-50'
                            : isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50'
                        }`}
                      >
                        {renderIcon(notif.type)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {notif.isUnread && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20 shrink-0 inline-block"
                                  title="Unread notification"
                                />
                              )}
                              <h4 className={`text-sm font-bold ${notif.isUnread ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-zinc-300' : 'text-slate-700')}`}>
                                {notif.title}
                              </h4>
                            </div>
                            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{notif.time}</span>
                          </div>
                          <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                            {notif.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
