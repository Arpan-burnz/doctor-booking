'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/AppLogo';
import {
  Heart,
  Calendar,
  ShieldCheck,
  Mail,
  FileText,
  Lock,
  Clock,
  Smartphone,
  Star,
  ArrowRight,
  TrendingUp,
  Users,
  Search,
  CheckCircle2,
  Menu,
  X,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0]));
  const { isDark } = useTheme();

  const sectionIds = ['hero', 'how', 'features', 'doctors', 'cta'];

  const scrollToSection = (index: number) => {
    if (index < 0 || index >= sectionIds.length) return;
    setActiveSection(index);
    const targetElem = document.getElementById(sectionIds[index]);
    if (targetElem) {
      targetElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // IntersectionObserver — sync dot indicators on natural scroll
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
              setVisibleSections(prev => {
                const newSet = new Set(prev);
                newSet.add(idx);
                return newSet;
              });
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

  return (
    <div
      id="fullpage-container"
      className="h-screen w-full overflow-y-auto scroll-smooth bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-600 selection:text-white antialiased relative"
    >

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/80 px-6 py-4 md:px-12 flex items-center justify-between transition-all duration-200 bg-zinc-900/80 text-white backdrop-blur-md">
        <AppLogo isDark={true} onClick={() => scrollToSection(0)} />

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { name: 'Your Health', idx: 0 },
            { name: 'Process', idx: 1 },
            { name: 'Core Strengths', idx: 2 },
            { name: 'For Providers', idx: 3 },
            { name: 'Take Control', idx: 4 },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => scrollToSection(item.idx)}
              className={`text-sm font-semibold transition-all cursor-pointer ${
                activeSection === item.idx ? 'text-blue-400 font-bold' : 'text-zinc-300 hover:text-white'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => router.push('/login')}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer text-zinc-100 hover:text-blue-400 hover:bg-zinc-800/60"
          >
            Sign in
          </button>
          <button
            onClick={() => router.push('/register')}
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            Get started free
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-zinc-100 hover:text-white focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 border-b border-zinc-800 shadow-xl px-6 py-6 flex flex-col gap-4 md:hidden animate-in fade-in slide-in-from-top-5 duration-200 bg-zinc-900 text-white">
            {[
              { name: 'Part 1: Your Health', idx: 0 },
              { name: 'Part 2: Process', idx: 1 },
              { name: 'Part 3: Core Strengths', idx: 2 },
              { name: 'Part 4: For Providers', idx: 3 },
              { name: 'Part 5: Take Control', idx: 4 },
            ].map((m) => (
              <button
                key={m.name}
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToSection(m.idx);
                }}
                className={`text-left text-base font-semibold py-1 transition-colors ${
                  activeSection === m.idx ? 'text-blue-400 font-bold' : 'text-zinc-100 hover:text-blue-400'
                }`}
              >
                {m.name}
              </button>
            ))}

            <div className="h-px bg-zinc-800 my-1"></div>
            <button
              onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
              className="w-full text-center py-2.5 font-semibold border border-zinc-700 hover:bg-zinc-800 rounded-xl cursor-pointer text-zinc-100"
            >
              Sign in
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); router.push('/register'); }}
              className="w-full text-center py-2.5 text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl cursor-pointer"
            >
              Get started free
            </button>
          </div>
        )}
      </nav>



      {/* Part 1: "Your health, your doctor" */}
      <section
        id="hero"
        className={`min-h-[90vh] w-full flex flex-col justify-center items-center pt-24 pb-12 px-6 md:px-12 relative overflow-hidden bg-gradient-to-b from-zinc-900/40 via-zinc-950/40 to-zinc-950 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          visibleSections.has(0) ? 'opacity-100 scale-100' : 'opacity-85 scale-[0.99]'
        }`}
      >
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[600px] md:h-[600px] bg-gradient-to-r from-blue-900/20 to-indigo-950/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10 w-full">
          {/* Left Column: Text Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white">
              Your health, your doctor,<br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
                your schedule
              </span>
            </h1>

            <p className="text-lg max-w-xl leading-relaxed mb-10 text-zinc-400">
              Book appointments with verified specialists in seconds. Get automated reminders, upload prescriptions, and manage your health seamlessly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md lg:max-w-none">
              <button
              onClick={() => router.push('/register')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Book a doctor now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
              <button
                onClick={() => router.push('/register')}
                className="px-8 py-4 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold rounded-2xl shadow-sm transition-all duration-200 active:scale-98 cursor-pointer backdrop-blur-sm"
              >
                Join as a provider
              </button>
            </div>
          </div>

          {/* Right Column: CSS UI Mockup */}
          <div className="hidden md:flex relative justify-center lg:justify-end perspective-1000">
            {/* Background glow for mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />

            {/* Main Floating Card */}
            <div className="relative w-full max-w-sm rounded-3xl p-6 bg-zinc-900/70 border border-zinc-700/50 shadow-2xl backdrop-blur-xl transform transition-transform duration-700 hover:-translate-y-2 hover:rotate-1 hover:shadow-blue-500/10 animate-float">
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Upcoming Appointment
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold py-1 px-2.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Confirmed
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/80">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0 ring-2 ring-indigo-500/30">
                  SJ
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Dr. Sarah Jenkins</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Cardiology Specialist</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">Date & Time</p>
                  <p className="text-xs font-bold text-zinc-200">Today, 10:30 AM</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">Consultation Fee</p>
                  <p className="text-xs font-bold text-zinc-200">₹800</p>
                </div>
              </div>

              <button className="w-full py-3.5 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors cursor-pointer flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Join Secure Call
              </button>

              {/* Smaller floating element overlapping */}
              <div className="absolute -bottom-6 -left-8 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/50 shadow-xl backdrop-blur-md flex items-center gap-4 transform transition-transform duration-700 hover:-translate-y-1 hover:-rotate-2 animate-float-delayed">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Vitals Logged</p>
                  <p className="text-sm font-bold text-white mt-0.5">BP: 120/80</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Part 2: "Process" */}
      <section
        id="how"
        className={`w-full flex flex-col justify-center items-center py-28 px-6 md:px-12 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] bg-zinc-950 border-t border-zinc-900 ${
          visibleSections.has(1) ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 translate-y-16 blur-sm'
        }`}
      >
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full text-blue-400 bg-blue-950/40 border border-blue-900/50">Process</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 text-white">Book in 3 simple steps</h2>
            <p className="mt-3.5 text-sm md:text-base text-zinc-400">Connecting with the right care is fast, secure, and hassle-free.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line for desktops */}
            <div className="hidden md:block absolute top-[28%] left-[15%] right-[15%] h-0.5 -z-10 bg-zinc-800" />

            {[
              {
                step: '01',
                icon: <Search className="w-7 h-7 text-blue-400 group-hover:scale-110 transition-transform" />,
                bg: 'bg-blue-950/40 border-blue-900/50',
                title: 'Find your doctor',
                desc: 'Locate specialists based on credentials, peer ratings, services offered, and fees.'
              },
              {
                step: '02',
                icon: <Calendar className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition-transform" />,
                bg: 'bg-indigo-950/40 border-indigo-900/50',
                title: 'Pick a time slot',
                desc: 'Select directly from available times in the doctor schedule. Zero wait times.'
              },
              {
                step: '03',
                icon: <CheckCircle2 className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform" />,
                bg: 'bg-emerald-950/40 border-emerald-900/50',
                title: 'Confirm & relax',
                desc: 'Secure booking instantly. Enjoy automated reminders via SMS and email.'
              },
            ].map((s, idx) => (
              <div 
                key={s.step} 
                className={`group border border-zinc-800/90 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 rounded-2xl p-8 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col items-start min-h-[250px] ${
                  visibleSections.has(1) ? 'opacity-100 translate-y-0 blur-none scale-100' : 'opacity-0 translate-y-8 blur-md scale-95'
                }`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="flex items-center justify-between w-full mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${s.bg} border flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-200`}>
                    {s.icon}
                  </div>
                  <span className="text-3xl font-black text-zinc-800 group-hover:text-zinc-700 transition-colors">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2.5 text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Part 3: "Core Strengths" */}
      <section
        id="features"
        className={`w-full flex flex-col justify-center items-center py-28 px-6 md:px-12 border-y border-zinc-900 relative transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] bg-zinc-950 ${
          visibleSections.has(2) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
        }`}
      >
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full text-blue-400 bg-blue-950/40 border border-blue-900/50">Core Strengths</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 text-white">Features built for you</h2>
            <p className="mt-3.5 text-sm md:text-base text-zinc-400">We bridge the gap between patients and practitioners with cutting-edge tools.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: 4 Features */}
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: <ShieldCheck className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />, title: 'Verified doctors', desc: 'Every doctor profile undergoes rigorous review of credentials by administrators.' },
                { icon: <Mail className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />, title: 'Email & SMS alerts', desc: 'Get automatic notifications 24 hours prior to appointment times.' },
                { icon: <Lock className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />, title: 'Secure & private', desc: 'Secure JWT authentication with refresh keys, keeping your private history safe.' },
                { icon: <Smartphone className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />, title: 'Works everywhere', desc: 'Fully responsive UI optimized for mobile view, desktop, and tablet sizes.' },
              ].map((f, idx) => (
                <div 
                  key={f.title} 
                  className={`group border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/70 rounded-2xl p-6 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    visibleSections.has(2) ? 'opacity-100 translate-y-0 blur-none scale-100' : 'opacity-0 translate-y-6 blur-sm scale-95'
                  }`}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 border bg-zinc-950 border-zinc-800 text-zinc-400">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-[15px] mb-2 text-white">{f.title}</h3>
                  <p className="text-[13px] leading-relaxed text-zinc-400">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Right: Graphic */}
            <div 
              className={`hidden lg:flex justify-center relative transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] delay-[300ms] ${
                visibleSections.has(2) ? 'opacity-100 translate-x-0 blur-none scale-100' : 'opacity-0 translate-x-12 blur-md scale-95'
              }`}
            >
              <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Medical tech" 
                className="w-full max-w-md rounded-3xl object-cover shadow-2xl border border-zinc-800/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Part 4: "For Providers/Doctors" */}
      <section
        id="doctors"
        className={`w-full flex flex-col justify-center items-center py-28 px-6 md:px-12 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] bg-zinc-950 origin-bottom ${
          visibleSections.has(3) ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-95 rotate-2'
        }`}
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-10 md:gap-12 items-center w-full">
          <div className="md:col-span-7">
            <span className="text-xs font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full text-blue-400 bg-blue-950/40 border border-blue-900/50">For Providers</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 mb-4 text-white">
              Grow your medical practice online
            </h2>
            <p className="text-sm md:text-base leading-relaxed mb-6 text-zinc-400">
              Create a free booking profile, publish your flexible session hours, manage appointments panel with charts, design prescriptions, and build trust with patients immediately through a digital verified badge.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {[
                'Flexible schedules and customizable fees',
                'E-Prescription delivery suite',
                'Verify badge to stand out',
                'Patient charts and progress reports',
                'Realtime calendar management',
                'Secured database infrastructure'
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5 text-[13px] font-medium text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/register')}
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-98 flex items-center gap-2 cursor-pointer"
            >
              <span>Apply to join as a doctor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Column - Practitioner Preview Card */}
          <div className="md:col-span-5 w-full rounded-3xl p-6 md:p-7 border border-zinc-800 bg-zinc-900 transition-all duration-200 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

            {/* Top Doctor Profile Header */}
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-zinc-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                  SJ
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs md:text-sm text-white">Dr. Sarah Jenkins</h3>
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">Verified</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Cardiology Specialist</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>4.9</span>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 rounded-2xl border bg-zinc-950/60 border-zinc-800">
                <p className="text-[11px] font-semibold text-zinc-400">Today's Load</p>
                <p className="text-base font-black text-blue-400 mt-0.5">8 Bookings</p>
              </div>
              <div className="p-3 rounded-2xl border bg-zinc-950/60 border-zinc-800">
                <p className="text-[11px] font-semibold text-zinc-400">Monthly Growth</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">+64 Patients</p>
              </div>
            </div>

            {/* Upcoming Appointments schedule preview */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Upcoming Schedule</p>
              {[
                { time: '10:00 AM', name: 'Robert Chen', type: 'Heart Checkup', status: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                { time: '11:30 AM', name: 'Emily Davis', type: 'ECG Follow-up', status: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                { time: '02:15 PM', name: 'Michael Vance', type: 'Consultation', status: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              ].map(item => (
                <div key={item.time} className="p-2.5 rounded-xl border bg-zinc-950/40 border-zinc-800/60 flex items-center justify-between transition-all">
                  <div>
                    <p className="text-xs font-bold text-white">{item.name}</p>
                    <p className="text-[10px] text-zinc-400">{item.type} • {item.time}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Part 5: "Ready to take control of your health" */}
      <section
        id="cta"
        className={`w-full flex flex-col justify-center items-center py-28 px-6 md:px-12 relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border-t border-zinc-850 transition-all duration-1000 ease-out ${
          visibleSections.has(4) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-24 scale-90'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10 w-full">
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
            Ready to take control of your health?
          </h2>
          <p className="text-sm md:text-base font-medium max-w-xl mx-auto mb-10 leading-relaxed text-zinc-400">
            Create an account within minutes, browse certified doctor profiles, and request appointments instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
            <button
              onClick={() => router.push('/register')}
              className="w-full sm:w-auto px-8 py-4 font-bold rounded-2xl shadow-xl transition-all duration-200 active:scale-98 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"
            >
              Create free account
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 font-bold rounded-2xl transition-all duration-200 active:scale-98 cursor-pointer text-zinc-300 hover:text-white"
            >
              Sign in
            </button>
          </div>
        </div>

        {/* Footer inside Part 5 */}
        <footer className="border-t border-zinc-850/80 pt-6 pb-2 px-6 md:px-12 text-zinc-500 w-full max-w-5xl mx-auto mt-24">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <AppLogo isDark={true} onClick={() => scrollToSection(0)} />

            <p className="text-xs text-zinc-500 order-3 md:order-2">
              © 2026 DOC4U Care Portal. All rights reserved. Designed for optimal healthcare logistics.
            </p>

            <div className="flex gap-6 order-2 md:order-3">
              {['Privacy Policy', 'Terms of Use', 'Support Help'].map(l => (
                <a key={l} href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </footer>
      </section>

    </div>
  );
}