'use client';
import { useRouter, usePathname } from 'next/navigation';
import AppLogo from '@/components/AppLogo';
import { clearTokens } from '@/lib/auth';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const links = [
    { label: 'Overview', href: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Doctors', href: '/admin/doctors', icon: <Stethoscope className="w-4 h-4" /> },
    { label: 'Users', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { label: 'Appointments', href: '/admin/appointments', icon: <Calendar className="w-4 h-4" /> },
  ];

  const reports = [
    { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Alerts', href: '/admin/alerts', icon: <Bell className="w-4 h-4" /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="w-64 h-screen bg-[#131315] border-r border-zinc-800/80 flex flex-col flex-shrink-0 sticky top-0 font-sans">
      <div className="px-6 py-6 border-b border-zinc-800/50 mb-2">
        <AppLogo isDark={true} onClick={() => router.push('/admin/dashboard')} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <button
                key={link.label}
                onClick={() => router.push(link.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-900/40 text-purple-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>

        <div>
          <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Reports</h4>
          <div className="space-y-1">
            {reports.map((link) => {
              const isActive = pathname === link.href;
              return (
                <button
                  key={link.label}
                  onClick={() => router.push(link.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-900/40 text-purple-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-3 border border-zinc-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-indigo-900/60 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0 shadow-inner">
              AD
            </div>
            <div className="truncate text-left">
              <div className="text-sm font-bold text-zinc-100 truncate">Super admin</div>
              <div className="text-[11px] font-medium text-zinc-500 truncate">admin@doc4u.com</div>
            </div>
          </div>
          <button
            onClick={() => {
              clearTokens();
              router.push('/login');
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
