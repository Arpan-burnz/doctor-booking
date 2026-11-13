'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUserRole, clearTokens, getUserEmail } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  LayoutGrid,
  Calendar,
  Clock,
  Users,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    group: null,
    items: [
      { label: 'Overview', href: '/doctor/dashboard', icon: LayoutGrid },
      { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
      { label: 'Schedule', href: '/doctor/slots', icon: Clock },
    ],
  },
  {
    group: 'PRACTICE',
    items: [
      { label: 'Patients', href: '/doctor/patients', icon: Users },
      { label: 'Prescriptions', href: '/doctor/prescriptions', icon: FileText },
      { label: 'Earnings', href: '/doctor/earnings', icon: TrendingUp },
    ],
  },
  {
    group: 'ACCOUNT',
    items: [
      { label: 'Settings', href: '/doctor/settings', icon: Settings },
    ],
  },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'DOCTOR') {
      router.replace('/login');
    } else {
      setIsAuthorized(true);
      api.get('/doctors/me/profile')
        .then(res => setDoctorProfile(res.data.data))
        .catch(() => {});
    }
  }, [pathname, router]);

  if (!isAuthorized) return null;

  const email = getUserEmail() || '';
  // Name defaults strictly to email ID if no custom name has been set
  const displayName = doctorProfile?.name?.trim() ? doctorProfile.name : (email || 'Doctor');
  const initials = displayName.includes('@')
    ? displayName.slice(0, 2).toUpperCase()
    : displayName.split(' ').map((p: string) => p[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'DR';
  const specialization = doctorProfile?.specialization || 'Physician';
  const isVerified = doctorProfile?.isVerified ?? false;
  const isSuspended = Boolean(doctorProfile?.isSuspended);

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#111827]/65 backdrop-blur-xl text-slate-100 select-none border-r border-[#1f293d]/50">
      {/* Brand / Logo */}
      <div className="px-5 py-6 border-b border-[#1f293d]/60">
        <Link href="/doctor/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-extrabold text-xl tracking-tight leading-tight">
              DOC<span className="text-emerald-400">4U</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doctor Portal</span>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-5' : ''}>
            {section.group && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400/90 px-3 pt-2 pb-1.5">
                {section.group}
              </p>
            )}
            {section.items.map(item => {
              const isActive = pathname === item.href || (item.href !== '/doctor/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Doctor profile card at bottom */}
      <div className="p-3 relative border-t border-[#1f293d]/60">
        <div
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-[#162032] border border-[#1f293d] hover:border-slate-600 transition-all duration-150 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 shadow-inner">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate leading-tight">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-slate-400 text-[11px] truncate">{specialization}</span>
              {isSuspended ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800/80">
                  Suspended
                </span>
              ) : !isVerified ? (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-900/50">
                  Unverified
                </span>
              ) : null}
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Profile Popover / Dropdown */}
        {profileDropdownOpen && (
          <div className="absolute bottom-16 left-3 right-3 bg-[#162032]/85 backdrop-blur-xl border border-[#1f293d]/60 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <Link
              href="/doctor/settings"
              onClick={() => { setProfileDropdownOpen(false); setSidebarOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              Doctor Profile Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-transparent text-slate-100 overflow-hidden font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-[#111827]/65 backdrop-blur-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-[#111827]/80 backdrop-blur-xl border-r border-[#1f293d]/50 flex flex-col h-full shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-5 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111827]/65 backdrop-blur-xl border-b border-[#1f293d]/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Stethoscope className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <span className="text-white font-extrabold text-base">DOC<span className="text-emerald-400">4U</span></span>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
            {initials}
          </div>
        </header>

        {/* Global Suspended Warning Banner */}
        {isSuspended && (
          <div className="bg-rose-950/90 border-b border-rose-500/40 px-5 py-3 flex items-center gap-3 text-xs text-rose-200 shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="leading-relaxed">
              <strong className="text-rose-100 font-bold">Account Suspended:</strong> Your practitioner account has been suspended by an administrator. You are prohibited from managing slots, creating prescriptions, and accepting patient appointments.
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
