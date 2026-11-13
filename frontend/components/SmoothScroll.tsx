'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect user's accessibility reduced motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Calibrated for high-refresh-rate displays (90Hz, 120Hz ProMotion, 144Hz, 240Hz)
    // Lerp (linear interpolation) dynamically distributes motion across every hardware V-Sync frame
    const lenis = new Lenis({
      lerp: 0.09,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      syncTouch: false, // Let mobile touch devices use native 120Hz hardware scrolling for zero lag
      autoResize: true,
    });

    lenisRef.current = lenis;

    // Update GSAP ScrollTrigger on every single frame generated at native display frequency
    lenis.on('scroll', ScrollTrigger.update);

    // Direct hardware-synced RAF loop: runs at the device's native V-Sync refresh rate (90Hz, 120Hz, 144Hz+)
    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Disable GSAP lag smoothing clamping so it never throttles high-frequency refresh displays
    gsap.ticker.lagSmoothing(0);

    // Expose lenis globally for programmatic navigation
    (window as any).__lenis = lenis;

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      (window as any).__lenis = null;
    };
  }, []);

  return <>{children}</>;
}
