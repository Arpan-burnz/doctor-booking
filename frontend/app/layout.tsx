import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import SilkShaderBackground from '@/components/SilkShaderBackground';
import SmoothScroll from '@/components/SmoothScroll';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#02010a',
};

export const metadata: Metadata = {
  title: 'DOC4U — Book Doctor Appointments',
  description: 'Find and book verified doctors instantly',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head />
      <body className="bg-[#02010a] text-slate-100 antialiased relative min-h-screen selection:bg-purple-900/40 selection:text-purple-200">
        <SilkShaderBackground />
        <ThemeProvider>
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}