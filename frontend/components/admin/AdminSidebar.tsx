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
  LogOut,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
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

  const handleNav = (href: string) => {
    router.push(href);
    onClose?.();
  };

  const handleLogout = () => {
    clearTokens();
    onClose?.();
    router.push('/login');
  };

  const SidebarContent = ({ showClose = false }: { showClose?: boolean }) => (
    <div className="flex flex-col h-full bg-[#111827]/90 backdrop-blur-md select-none">
      <div className="px-5 py-5 border-b border-[#1f293d]/70 flex items-center justify-between">
        <AppLogo
          isDark={true}
          onClick={() => handleNav('/admin/dashboard')}
          accentColor="purple"
        />
        {showClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25 shadow-sm shadow-purple-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>

        <div>
          <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 mb-2">Reports</h4>
          <div className="space-y-1">
            {reports.map((link) => {
              const isActive = pathname === link.href;
              return (
                <button
                  key={link.label}
                  onClick={() => handleNav(link.href)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25 shadow-sm shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
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

      <div className="p-4 border-t border-[#1f293d]/70">
        <div className="flex items-center justify-between bg-[#162032] rounded-xl p-3 border border-[#1f293d]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs shrink-0 shadow-inner">
              AD
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-bold text-slate-100 truncate">Super admin</div>
              <div className="text-[11px] font-medium text-slate-400 truncate">admin@doc4u.com</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 h-screen bg-[#111827]/90 backdrop-blur-md border-r border-[#1f293d] flex-col flex-shrink-0 sticky top-0 font-sans select-none z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="relative z-10 w-72 bg-[#111827] border-r border-[#1f293d] h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarContent showClose={true} />
          </aside>
        </div>
      )}
    </>
  );
}
