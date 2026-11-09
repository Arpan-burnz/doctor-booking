'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUserRole } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'ADMIN') {
      router.replace('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  if (!isAuthorized) {
    return null; // Return nothing while checking auth to prevent flashing content
  }

  return (
    <div className="min-h-screen bg-transparent flex font-sans select-none antialiased text-slate-100 selection:bg-purple-900/40 selection:text-purple-200">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto bg-transparent">
        {children}
      </div>
    </div>
  );
}
