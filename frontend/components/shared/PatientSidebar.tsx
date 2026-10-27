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
    { name: 'Find doctors', icon: <Search className="w-4 h-4" />, href: '/patient/doctors' },
  ];

  const healthItems = [
    { name: 'Prescriptions', icon: <FileText className="w-4 h-4" />, href: '/patient/prescriptions' },
    { name: 'Health records', icon: <FileSpreadsheet className="w-4 h-4" />, href: '/patient/health-records' },
    { name: 'Medications', icon: <Pill className="w-4 h-4" />, href: '/patient/medications' },
  ];

  const accountItems = [
    { name: 'Notifications', icon: <Bell className="w-4 h-4" />, href: '/patient/notifications' },
    { name: 'Settings', icon: <Settings className="w-4 h-4" />, href: '/patient/settings' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navBtnClass = (href: string) =>
    `w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
      isActive(href)
        ? isDark
          ? 'bg-blue-600/10 text-blue-400 border border-blue-900/40'
          : 'bg-blue-50 text-blue-700 border border-blue-100'
        : isDark
        ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className={`p-5 flex items-center justify-between border-b ${isDark ? 'border-zinc-800/50' : 'border-slate-100'}`}>
        <AppLogo isDark={isDark} onClick={() => router.push('/patient/dashboard')} />
        {/* Close button (mobile only) */}
        <button
          className={`md:hidden p-1.5 rounded-lg cursor-pointer ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Links Panel */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {/* Main Nav */}
        <div className="space-y-1">
          {navItems.map(item => (
            <button
              key={item.href}
              onClick={() => { router.push(item.href); setMobileOpen(false); }}
              className={navBtnClass(item.href)}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        {/* Health Section */}
        <div className="space-y-1.5">
          <div className={`text-[10px] font-bold tracking-widest pl-3.5 uppercase ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            Health
          </div>
          <div className="space-y-1">
            {healthItems.map(item => (
              <button
                key={item.href}
                onClick={() => { router.push(item.href); setMobileOpen(false); }}
                className={navBtnClass(item.href)}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account Section */}
        <div className="space-y-1.5">
          <div className={`text-[10px] font-bold tracking-widest pl-3.5 uppercase ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            Account
          </div>
          <div className="space-y-1">
            {accountItems.map(item => (
              <button
                key={item.href}
                onClick={() => { router.push(item.href); setMobileOpen(false); }}
                className={navBtnClass(item.href)}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Identity Footer */}
      <div className={`p-3 border-t ${isDark ? 'border-zinc-800/80' : 'border-slate-100'}`}>
        <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-blue-500/40 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-inner shrink-0">
                {displayName ? displayName.substring(0, 2).toUpperCase() : 'US'}
              </div>
            )}
            <div className="text-left min-w-0">
              <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{displayName}</p>
              <p className={`text-[10px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Patient</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`transition-colors p-1.5 rounded-lg cursor-pointer shrink-0 ${isDark ? 'text-zinc-500 hover:text-rose-400 hover:bg-zinc-800' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'}`}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger toggle button — shown in page header */}
      <button
        className={`md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl border shadow-sm cursor-pointer transition-all ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-in sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col shrink-0 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'bg-[#121316] border-r border-zinc-800/80' : 'bg-white border-r border-slate-200'}`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop fixed sidebar */}
      <aside
        className={`hidden md:flex w-64 border-r flex-col shrink-0 sticky top-0 h-screen transition-all duration-300 ${isDark ? 'bg-[#121316] border-zinc-800/80' : 'bg-white border-slate-200 text-slate-700'}`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
