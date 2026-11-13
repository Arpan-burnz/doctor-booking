'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUserRole } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AppLogo from '@/components/AppLogo';
import { Menu } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'ADMIN') {
      router.replace('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!isAuthorized) {
    return null; // Return nothing while checking auth to prevent flashing content
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row font-sans select-none antialiased text-slate-100 selection:bg-purple-900/40 selection:text-purple-200">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111827]/90 backdrop-blur-md border-b border-[#1f293d] sticky top-0 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <AppLogo isDark={true} onClick={() => router.push('/admin/dashboard')} accentColor="purple" />
        <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs shrink-0 shadow-inner">
          AD
        </div>
      </header>

      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="flex-1 overflow-y-auto bg-transparent min-w-0">
        {children}
      </main>
    </div>
  );
}
