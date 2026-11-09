'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clearTokens, getUsername } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import AppLogo from '@/components/AppLogo';
import {
  LayoutDashboard,
  Calendar,
  Search,
  FileText,
  FileSpreadsheet,
  Pill,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';

interface PatientSidebarProps {
  username?: string;
  avatarUrl?: string;
}

export default function PatientSidebar({ username, avatarUrl }: PatientSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = username || getUsername();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, href: '/patient/dashboard' },
    { name: 'Appointments', icon: <Calendar className="w-4 h-4" />, href: '/patient/appointments' },
    { name: 'Find Doctors', icon: <Search className="w-4 h-4" />, href: '/patient/doctors' },
  ];

  const healthItems = [
    { name: 'Prescriptions', icon: <FileText className="w-4 h-4" />, href: '/patient/prescriptions' },
    { name: 'Health Records', icon: <FileSpreadsheet className="w-4 h-4" />, href: '/patient/health-records' },
    { name: 'Medications', icon: <Pill className="w-4 h-4" />, href: '/patient/medications' },
  ];

  const accountItems = [
    { name: 'Notifications', icon: <Bell className="w-4 h-4" />, href: '/patient/notifications' },
    { name: 'Settings', icon: <Settings className="w-4 h-4" />, href: '/patient/settings' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navBtnClass = (href: string) =>
    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
      isActive(href)
        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25 shadow-sm shadow-sky-500/10'
        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 border border-transparent'
    }`;

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#111827]/90 backdrop-blur-md text-slate-100 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-[#1f293d]/70">
        <AppLogo isDark={true} onClick={() => router.push('/patient/dashboard')} accentColor="blue" />
        <button
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Links Panel */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(item => (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                setMobileOpen(false);
              }}
              className={navBtnClass(item.href)}
            >
              <span className={isActive(item.href) ? 'text-sky-400' : 'text-slate-400'}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        {/* Health Section */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold tracking-widest pl-3.5 uppercase text-slate-400/90">
            Clinical Health
          </div>
          <div className="space-y-1">
            {healthItems.map(item => (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setMobileOpen(false);
                }}
                className={navBtnClass(item.href)}
              >
                <span className={isActive(item.href) ? 'text-sky-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account Section */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold tracking-widest pl-3.5 uppercase text-slate-400/90">
            Preferences
          </div>
          <div className="space-y-1">
            {accountItems.map(item => (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setMobileOpen(false);
                }}
                className={navBtnClass(item.href)}
              >
                <span className={isActive(item.href) ? 'text-sky-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Identity Footer */}
      <div className="p-3 border-t border-[#1f293d]/70">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-[#1f293d] bg-[#162032] transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-sky-500/40 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-inner shrink-0">
                {displayName ? displayName.substring(0, 2).toUpperCase() : 'PT'}
              </div>
            )}
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <p className="text-[10px] font-semibold text-slate-400">Active Patient</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
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
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-3 left-4 z-40 p-2 rounded-xl border border-[#1f293d] bg-[#111827]/90 text-slate-300 hover:text-white backdrop-blur-md cursor-pointer transition-all shadow-md"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 border-r border-[#1f293d] bg-[#111827]/90 backdrop-blur-md h-screen sticky top-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 bg-[#111827] border-r border-[#1f293d] h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
