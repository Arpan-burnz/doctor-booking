'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/AppLogo';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MagneticButton } from '@/components/ui/motion-footer';
import {
  Calendar,
  ShieldCheck,
  Mail,
  Lock,
  Smartphone,
  Star,
  ArrowRight,
  Search,
  CheckCircle2,
  Menu,
  X,
  Clock,
  IndianRupee,
  Activity,
  FileCheck2
} from 'lucide-react';
import { useTheme } from '@/lib/theme';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
  const router = useRouter();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const { isDark } = useTheme();

  const sectionIds = ['hero', 'how', 'features', 'doctors', 'cta'];

  const scrollToSection = (index: number) => {
    if (index < 0 || index >= sectionIds.length) return;
    setActiveSection(index);
    const targetElem = document.getElementById(sectionIds[index]);
    if (targetElem) {
      if (typeof window !== 'undefined' && (window as any).__lenis) {
        (window as any).__lenis.scrollTo(targetElem, { offset: -50, duration: 1.2 });
      } else {
        targetElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach((id, idx) => {
      const elem = document.getElementById(id);
      if (!elem) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveSection(idx);
            }
          });
        },
        { threshold: 0.25 }
      );
      obs.observe(elem);
      observers.push(obs);
    });
    return () => observers.forEach(obs => obs.disconnect());
  }, []);

  // GSAP ScrollTrigger animations on existing content
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ctx = gsap.context(() => {
      // 1. Process steps staggered scroll reveal
      gsap.fromTo(
        '.gsap-how-card',
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#how',
            start: 'top 80%',
          },
        }
      );

      // 2. Features cards staggered scroll reveal
      gsap.fromTo(
        '.gsap-feature-card',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#features',
            start: 'top 80%',
          },
        }
      );

      // 3. For Doctors section elements reveal
      gsap.fromTo(
        ['.gsap-doctor-info', '.gsap-doctor-card'],
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.18,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#doctors',
            start: 'top 80%',
          },
        }
      );

      // 4. CTA section reveal
      gsap.fromTo(
        '.gsap-cta-content',
        { y: 25, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '#cta',
            start: 'top 85%',
          },
        }
      );
    }, pageContainerRef);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageContainerRef}
      id="fullpage-container"
      className="min-h-screen w-full bg-transparent text-slate-100 font-sans antialiased selection:bg-purple-900/40 selection:text-purple-200"
    >
      {/* Navigation Bar: Quiet Chrome */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] px-6 py-4 md:px-12 flex items-center justify-between bg-[#090d16]/60 backdrop-blur-md">
        <AppLogo isDark={true} onClick={() => scrollToSection(0)} />

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-7">
          {[
            { name: 'Consultations', idx: 0 },
            { name: 'How it works', idx: 1 },
            { name: 'Features', idx: 2 },
            { name: 'For doctors', idx: 3 },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => scrollToSection(item.idx)}
              className={`text-xs font-medium transition-colors cursor-pointer ${
                activeSection === item.idx ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="text-xs font-semibold px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#162032] border border-transparent transition-colors cursor-pointer"
          >
            Sign in
          </button>
          <button
            onClick={() => router.push('/register')}
            className="text-xs font-medium text-slate-950 bg-sky-500 hover:bg-sky-400 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Book appointment
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-slate-300 hover:text-white focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 border-b border-[#1f293d] px-6 py-5 flex flex-col gap-3.5 md:hidden bg-[#111827] text-white">
            {[
              { name: 'Consultations', idx: 0 },
              { name: 'How it works', idx: 1 },
              { name: 'Features', idx: 2 },
              { name: 'For doctors', idx: 3 },
            ].map((m) => (
              <button
                key={m.name}
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToSection(m.idx);
                }}
                className={`text-left text-xs font-medium py-1 transition-colors ${
                  activeSection === m.idx ? 'text-sky-400 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {m.name}
              </button>
            ))}
            <div className="h-px bg-[#1f293d] my-1" />
            <button
              onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
              className="w-full text-center py-2 text-xs font-semibold border border-[#1f293d] rounded-xl text-slate-200"
            >
              Sign in
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); router.push('/register'); }}
              className="w-full text-center py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-xl"
            >
              Book appointment
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section: Asymmetric Split on Calm Obsidian Canvas */}
      <section
        id="hero"
        className="min-h-[88vh] w-full flex flex-col justify-center items-center pt-28 pb-16 px-6 md:px-12 bg-transparent"
      >
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Column: Direct, plain headline & specific description */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111827]/60 backdrop-blur-md border border-white/[0.08] text-[11px] text-slate-300 mb-6 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>Verified doctor scheduling platform</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] mb-5 text-white">
              Medical consultations scheduled on your own terms
            </h1>

            <p className="text-sm md:text-base leading-relaxed mb-8 text-slate-400 max-w-xl">
              Select verified medical specialists, schedule appointment slots directly into the practitioner's timetable, and access official diagnostic prescriptions securely.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <MagneticButton
                as="button"
                onClick={() => router.push('/register')}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Find a doctor</span>
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton
                as="button"
                onClick={() => router.push('/register')}
                className="px-5 py-2.5 border border-white/[0.08] bg-[#111827]/60 backdrop-blur-md hover:bg-[#162032] text-slate-300 hover:text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                Join as a doctor
              </MagneticButton>
            </div>
          </div>

          {/* Right Column: Grounded Clinical UI Preview (Real product context, no floating tilt) */}
          <div className="lg:col-span-5 w-full">
            <div className="w-full rounded-2xl bg-[#111827]/60 backdrop-blur-xl border border-white/[0.08] p-6 shadow-2xl relative">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>Scheduled consultation</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Confirmed
                </span>
              </div>

              {/* Doctor Details */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#162032]/70 border border-white/[0.06] mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#090d16]/80 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs shrink-0">
                  SJ
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">Dr. Sarah Jenkins</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">Cardiology • License Med-29402</p>
                </div>
              </div>

              {/* Slot Meta Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="p-3 rounded-xl bg-[#0d121f]/70 border border-white/[0.06]">
                  <p className="text-[11px] text-slate-400 mb-0.5">Date and time</p>
                  <p className="font-semibold text-slate-200 tabular-nums">Thursday, 10:30 AM</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0d121f]/70 border border-white/[0.06]">
                  <p className="text-[11px] text-slate-400 mb-0.5">Consultation fee</p>
                  <p className="font-semibold text-emerald-400 tabular-nums">₹800</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => router.push('/login')}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Join video consultation</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works */}
      <section
        id="how"
        className="w-full py-24 px-6 md:px-12 bg-transparent border-t border-white/[0.06]"
      >
        <div className="max-w-5xl mx-auto w-full">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-semibold text-sky-400 mb-2">Process</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Three steps to consultation</h2>
            <p className="mt-2 text-xs md:text-sm text-slate-400">Appointment scheduling is managed cleanly with zero wait times.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                title: 'Find your practitioner',
                desc: 'Filter verified doctors by clinical specialty, patient reviews, and standard consultation fee.'
              },
              {
                step: '02',
                title: 'Select an open slot',
                desc: 'Select an available date and time directly from the doctor\'s verified availability calendar.'
              },
              {
                step: '03',
                title: 'Attend consultation',
                desc: 'Join the video call on schedule and download official prescriptions directly to your account.'
              },
            ].map((s) => (
              <div
                key={s.step}
                className="gsap-how-card border border-white/[0.08] bg-[#111827]/60 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/30 hover:bg-[#111827]/75 transition-all shadow-xl shadow-black/20"
              >
                <div>
                  <span className="text-xs font-mono font-semibold text-slate-500 block mb-4">Step {s.step}</span>
                  <h3 className="text-sm font-semibold mb-2 text-white">{s.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Core Features */}
      <section
        id="features"
        className="w-full py-24 px-6 md:px-12 border-t border-white/[0.06] bg-transparent"
      >
        <div className="max-w-5xl mx-auto w-full">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-semibold text-sky-400 mb-2">Platform capabilities</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Clinical tools for patients and doctors</h2>
            <p className="mt-2 text-xs md:text-sm text-slate-400">Essential features built for dependability and clear record keeping.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <ShieldCheck className="w-5 h-5 text-sky-400" />, title: 'Verified credentials', desc: 'Every doctor profile undergoes administrator license review before opening slots.' },
              { icon: <Mail className="w-5 h-5 text-sky-400" />, title: 'Scheduled reminders', desc: 'Automated email notifications sent prior to upcoming consultation times.' },
              { icon: <FileCheck2 className="w-5 h-5 text-sky-400" />, title: 'Official prescriptions', desc: 'Review, download, and store diagnostic notes and dosage instructions in PDF format.' },
              { icon: <Smartphone className="w-5 h-5 text-sky-400" />, title: 'Responsive viewport', desc: 'Full-featured interface accessible across desktop workstations, tablets, and phones.' },
            ].map((f) => (
              <div
                key={f.title}
                className="gsap-feature-card border border-white/[0.08] bg-[#111827]/60 backdrop-blur-xl rounded-2xl p-5 hover:border-sky-500/30 hover:bg-[#111827]/75 transition-all shadow-xl shadow-black/20"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3.5 bg-[#162032]/70 border border-white/[0.06]">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-xs mb-1.5 text-white">{f.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: For Doctors */}
      <section
        id="doctors"
        className="w-full py-24 px-6 md:px-12 bg-transparent border-t border-white/[0.06]"
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-10 items-center w-full">
          <div className="gsap-doctor-info md:col-span-7">
            <p className="text-xs font-semibold text-emerald-400 mb-2">For practitioners</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4">
              Manage your clinical schedule online
            </h2>
            <p className="text-xs md:text-sm leading-relaxed mb-6 text-slate-400">
              Create a doctor profile, set standard consultation fees, publish daily time slots, and issue official patient prescriptions from a central workspace.
            </p>

            <div className="grid sm:grid-cols-2 gap-2.5 mb-8">
              {[
                'Flexible appointment slot duration',
                'Digital prescription issuing',
                'Medical license verification badge',
                'Patient appointment history logs',
                'Direct video consultation links',
                'Earnings and patient summary analytics'
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <MagneticButton
              as="button"
              onClick={() => router.push('/register')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <span>Register as a doctor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </MagneticButton>
          </div>

          {/* Right Column: Practitioner schedule tile */}
          <div className="gsap-doctor-card md:col-span-5 w-full rounded-2xl p-6 border border-white/[0.08] bg-[#111827]/60 backdrop-blur-xl shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
              <div>
                <p className="text-xs font-semibold text-white">Practitioner Overview</p>
                <p className="text-[11px] text-slate-400">Active consultation schedule</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verified
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { time: '10:00 AM', name: 'Robert Chen', type: 'General Consultation', fee: '₹800' },
                { time: '11:30 AM', name: 'Emily Davis', type: 'Follow-up Review', fee: '₹800' },
                { time: '02:15 PM', name: 'Michael Vance', type: 'Diagnostics Discussion', fee: '₹800' },
              ].map(item => (
                <div key={item.time} className="p-3 rounded-xl bg-[#162032]/70 border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-xs">{item.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.type} • {item.time}</p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums">{item.fee}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Call to Action & Footer */}
      <section
        id="cta"
        className="w-full py-20 px-6 md:px-12 bg-transparent border-t border-white/[0.06]"
      >
        <div className="gsap-cta-content max-w-2xl mx-auto text-center w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
            Ready to schedule your appointment?
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
            Register an account, browse verified specialists, and book your consultation in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <MagneticButton
              as="button"
              onClick={() => router.push('/register')}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium rounded-lg cursor-pointer bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
            >
              Create patient account
            </MagneticButton>
            <MagneticButton
              as="button"
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#111827]/60 backdrop-blur-md border border-white/[0.08] hover:bg-[#162032] text-xs font-medium rounded-lg cursor-pointer text-slate-300 hover:text-white transition-colors"
            >
              Sign in
            </MagneticButton>
          </div>
        </div>

        {/* Quiet Footer */}
        <footer className="border-t border-white/[0.06] pt-8 mt-16 text-slate-500 w-full max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <AppLogo isDark={true} onClick={() => scrollToSection(0)} />
            <p className="text-slate-500">
              © 2026 DOC4U Care Portal. Medical Consultation Infrastructure.
            </p>
            <div className="flex gap-5">
              <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Terms</span>
              <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Support</span>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
