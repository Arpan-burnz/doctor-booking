'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole, getUsername } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import PatientSidebar from '@/components/shared/PatientSidebar';
import {
  Pencil,
  X,
  CheckCircle2,
  Activity,
  Heart,
  Scale,
  Thermometer
} from 'lucide-react';

interface VitalsData {
  bloodPressure: string;
  bloodPressureStatus: string;
  bloodSugar: string;
  bloodSugarStatus: string;
  heartRate: string;
  heartRateStatus: string;
  spO2: string;
  spO2Status: string;
  weight: string;
  height: string;
  bmi: string;
  bmiStatus: string;
}

interface PersonalInfoData {
  bloodGroup: string;
  dateOfBirth: string;
  age: string;
  allergies: string;
  conditions: string;
  lastCheckup: string;
}

export default function HealthRecordsPage() {
  const router = useRouter();

  const { theme, setTheme, isDark } = useTheme();

  const DEFAULT_EMPTY_VITALS: VitalsData = {
    bloodPressure: '--',
    bloodPressureStatus: 'Not recorded',
    bloodSugar: '--',
    bloodSugarStatus: 'Not recorded',
    heartRate: '--',
    heartRateStatus: 'Not recorded',
    spO2: '--',
    spO2Status: 'Not recorded',
    weight: '--',
    height: '--',
    bmi: '--',
    bmiStatus: 'Not recorded'
  };

  const DEFAULT_EMPTY_INFO: PersonalInfoData = {
    bloodGroup: '--',
    dateOfBirth: '--',
    age: '--',
    allergies: 'None listed',
    conditions: 'None listed',
    lastCheckup: 'No record'
  };

  // Vitals State
  const [vitals, setVitals] = useState<VitalsData>(DEFAULT_EMPTY_VITALS);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);

  // Personal Info State
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>(DEFAULT_EMPTY_INFO);

  // Timeframe state
  const [timeframe, setTimeframe] = useState<'3months' | '6months' | '1year'>('6months');

  // Modals state
  const [isUpdateVitalsOpen, setIsUpdateVitalsOpen] = useState(false);
  const [isEditPersonalInfoOpen, setIsEditPersonalInfoOpen] = useState(false);

  // Form draft state for Update Vitals
  const [vitalsForm, setVitalsForm] = useState({ ...vitals });
  // Form draft state for Personal Info
  const [infoForm, setInfoForm] = useState({ ...personalInfo });

  useEffect(() => {
    if (getUserRole() !== 'PATIENT') {
      router.push('/login');
      return;
    }

    // Load saved vitals & info from localStorage if available
    const savedVitals = localStorage.getItem('doc4u_patient_vitals');
    if (savedVitals) {
      try { setVitals(JSON.parse(savedVitals)); } catch (e) { }
    } else {
      setVitals(DEFAULT_EMPTY_VITALS);
    }
    const savedInfo = localStorage.getItem('doc4u_patient_personal_info');
    if (savedInfo) {
      try { setPersonalInfo(JSON.parse(savedInfo)); } catch (e) { }
    } else {
      setPersonalInfo(DEFAULT_EMPTY_INFO);
    }
    const savedHistory = localStorage.getItem('doc4u_patient_vitals_history');
    if (savedHistory) {
      try { setVitalsHistory(JSON.parse(savedHistory)); } catch (e) { }
    } else {
      setVitalsHistory([]);
    }
  }, [router]);

  // Handle Save Vitals
  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(vitalsForm.weight);
    const h = parseFloat(vitalsForm.height) / 100;
    let computedBmi = vitalsForm.bmi || '--';
    let bmiStat = vitalsForm.bmiStatus || 'Normal';

    if (w && h && h > 0) {
      const calc = (w / (h * h)).toFixed(1);
      computedBmi = calc;
      const calcNum = parseFloat(calc);
      if (calcNum < 18.5) bmiStat = 'Underweight';
      else if (calcNum <= 24.9) bmiStat = 'Normal';
      else if (calcNum <= 29.9) bmiStat = 'Overweight';
      else bmiStat = 'High';
    }

    const bp = vitalsForm.bloodPressure.trim() || '--';
    const bs = vitalsForm.bloodSugar.trim() || '--';
    const hr = vitalsForm.heartRate.trim() || '--';
    const spo2 = vitalsForm.spO2.trim() || '--';
    const wt = vitalsForm.weight.trim() || '--';
    const ht = vitalsForm.height.trim() || '--';

    const updated: VitalsData = {
      bloodPressure: bp,
      bloodPressureStatus: bp === '--' ? 'Not recorded' : 'Normal',
      bloodSugar: bs,
      bloodSugarStatus: bs === '--' ? 'Not recorded' : (parseFloat(bs) > 140 ? 'High' : parseFloat(bs) > 100 ? 'Watch' : 'Normal'),
      heartRate: hr,
      heartRateStatus: hr === '--' ? 'Not recorded' : 'Normal',
      spO2: spo2,
      spO2Status: spo2 === '--' ? 'Not recorded' : (parseFloat(spo2) < 95 ? 'Watch' : 'Normal'),
      weight: wt,
      height: ht,
      bmi: computedBmi,
      bmiStatus: computedBmi === '--' ? 'Not recorded' : bmiStat
    };

    setVitals(updated);
    localStorage.setItem('doc4u_patient_vitals', JSON.stringify(updated));

    // Update vitals history for trend view
    if (bp !== '--' || bs !== '--' || wt !== '--') {
      const monthLabel = new Date().toLocaleDateString(undefined, { month: 'short' });
      const newHistoryItem = {
        month: monthLabel,
        bloodPressure: bp,
        bloodSugar: bs !== '--' ? `${bs} mg` : '--',
        weight: wt !== '--' ? `${wt} kg` : '--',
        timestamp: Date.now()
      };
      const existingHistory = localStorage.getItem('doc4u_patient_vitals_history');
      let historyList: any[] = existingHistory ? JSON.parse(existingHistory) : [];
      const existingIdx = historyList.findIndex((h: any) => h.month === monthLabel);
      if (existingIdx >= 0) {
        historyList[existingIdx] = newHistoryItem;
      } else {
        historyList.push(newHistoryItem);
      }
      historyList = historyList.slice(-6);
      setVitalsHistory(historyList);
      localStorage.setItem('doc4u_patient_vitals_history', JSON.stringify(historyList));
    }

    setIsUpdateVitalsOpen(false);
  };

  // Handle Save Personal Info
  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PersonalInfoData = {
      bloodGroup: infoForm.bloodGroup.trim() || '--',
      dateOfBirth: infoForm.dateOfBirth.trim() || '--',
      age: infoForm.age.trim() || '--',
      allergies: infoForm.allergies.trim() || 'None listed',
      conditions: infoForm.conditions.trim() || 'None listed',
      lastCheckup: infoForm.lastCheckup.trim() || 'No record',
    };
    setPersonalInfo(updated);
    localStorage.setItem('doc4u_patient_personal_info', JSON.stringify(updated));
    setIsEditPersonalInfoOpen(false);
  };

  return (
    <div className={`min-h-screen flex font-sans select-none antialiased transition-all duration-300 ${
      isDark ? 'bg-[#0c0d0e] text-zinc-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Shared Sidebar */}
      <PatientSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 md:pt-8 pb-8 space-y-7 transition-all duration-300">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Health records</h1>
            <p className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Your personal health vitals and history
            </p>
          </div>

          <button
            onClick={() => {
              setVitalsForm({
                ...vitals,
                bloodPressure: vitals.bloodPressure === '--' ? '' : vitals.bloodPressure,
                bloodSugar: vitals.bloodSugar === '--' ? '' : vitals.bloodSugar,
                heartRate: vitals.heartRate === '--' ? '' : vitals.heartRate,
                spO2: vitals.spO2 === '--' ? '' : vitals.spO2,
                weight: vitals.weight === '--' ? '' : vitals.weight,
                height: vitals.height === '--' ? '' : vitals.height,
              });
              setIsUpdateVitalsOpen(true);
            }}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDark
                ? 'bg-[#181a1f] border-zinc-700/80 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-600'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Pencil className="w-3.5 h-3.5 text-zinc-300" />
            <span>Update vitals</span>
          </button>
        </div>

        {/* Top Grid: Current Vitals & Personal Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Current Vitals Card */}
          <div className={`rounded-2xl p-6 transition-all border ${
            isDark ? 'bg-[#181a1f] border-zinc-800/80' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-4">
              <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Current vitals</h2>
              <button
                onClick={() => {
                  setVitalsForm({
                    ...vitals,
                    bloodPressure: vitals.bloodPressure === '--' ? '' : vitals.bloodPressure,
                    bloodSugar: vitals.bloodSugar === '--' ? '' : vitals.bloodSugar,
                    heartRate: vitals.heartRate === '--' ? '' : vitals.heartRate,
                    spO2: vitals.spO2 === '--' ? '' : vitals.spO2,
                    weight: vitals.weight === '--' ? '' : vitals.weight,
                    height: vitals.height === '--' ? '' : vitals.height,
                  });
                  setIsUpdateVitalsOpen(true);
                }}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="space-y-4">
              {/* Blood Pressure */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Blood pressure</span>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {vitals.bloodPressure} {vitals.bloodPressure !== '--' && <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>mmHg</span>}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    vitals.bloodPressureStatus === 'Not recorded'
                      ? isDark ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50' : 'bg-slate-100 text-slate-500 border-slate-200'
                      : vitals.bloodPressureStatus === 'Normal'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                      : 'bg-amber-950/40 text-amber-500 border-amber-900/50'
                  }`}>
                    {vitals.bloodPressureStatus}
                  </span>
                </div>
              </div>

              {/* Blood Sugar */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Blood sugar</span>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {vitals.bloodSugar} {vitals.bloodSugar !== '--' && <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>mg/dL</span>}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                    vitals.bloodSugarStatus === 'Not recorded'
                      ? isDark ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50' : 'bg-slate-100 text-slate-500 border-slate-200'
                      : vitals.bloodSugarStatus === 'Watch'
                      ? 'bg-amber-950/40 text-amber-500 border-amber-900/50'
                      : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                  }`}>
                    {vitals.bloodSugarStatus}
                  </span>
                </div>
              </div>

              {/* Heart Rate */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Heart rate</span>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {vitals.heartRate} {vitals.heartRate !== '--' && <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>bpm</span>}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    vitals.heartRateStatus === 'Not recorded'
                      ? isDark ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50' : 'bg-slate-100 text-slate-500 border-slate-200'
                      : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                  }`}>
                    {vitals.heartRateStatus}
                  </span>
                </div>
              </div>

              {/* SpO2 */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>SpO2</span>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {vitals.spO2}{vitals.spO2 !== '--' ? '%' : ''}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    vitals.spO2Status === 'Not recorded'
                      ? isDark ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50' : 'bg-slate-100 text-slate-500 border-slate-200'
                      : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                  }`}>
                    {vitals.spO2Status}
                  </span>
                </div>
              </div>

              {/* Weight */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Weight</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {vitals.weight}{vitals.weight !== '--' ? ' kg' : ''}
                </span>
              </div>

              {/* Height */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Height</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {vitals.height}{vitals.height !== '--' ? ' cm' : ''}
                </span>
              </div>

              {/* BMI */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>BMI</span>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{vitals.bmi}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    vitals.bmiStatus === 'Not recorded'
                      ? isDark ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50' : 'bg-slate-100 text-slate-500 border-slate-200'
                      : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                  }`}>
                    {vitals.bmiStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Info Card */}
          <div className={`rounded-2xl p-6 transition-all border ${
            isDark ? 'bg-[#181a1f] border-zinc-800/80' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-4">
              <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Personal info</h2>
              <button
                onClick={() => {
                  setInfoForm({
                    ...personalInfo,
                    bloodGroup: personalInfo.bloodGroup === '--' ? '' : personalInfo.bloodGroup,
                    dateOfBirth: personalInfo.dateOfBirth === '--' ? '' : personalInfo.dateOfBirth,
                    age: personalInfo.age === '--' ? '' : personalInfo.age,
                    allergies: personalInfo.allergies === 'None listed' ? '' : personalInfo.allergies,
                    conditions: personalInfo.conditions === 'None listed' ? '' : personalInfo.conditions,
                    lastCheckup: personalInfo.lastCheckup === 'No record' ? '' : personalInfo.lastCheckup,
                  });
                  setIsEditPersonalInfoOpen(true);
                }}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Blood group */}
              <div className="flex items-center justify-between py-0.5">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Blood group</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{personalInfo.bloodGroup}</span>
              </div>

              {/* Date of birth */}
              <div className="flex items-center justify-between py-0.5">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Date of birth</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{personalInfo.dateOfBirth}</span>
              </div>

              {/* Age */}
              <div className="flex items-center justify-between py-0.5">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Age</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{personalInfo.age}</span>
              </div>

              {/* Allergies */}
              <div className="flex items-center justify-between py-0.5">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Allergies</span>
                <span className={personalInfo.allergies === 'None listed' ? (isDark ? 'text-zinc-400 font-semibold' : 'text-slate-500 font-semibold') : 'font-bold text-rose-500'}>
                  {personalInfo.allergies}
                </span>
              </div>

              {/* Conditions */}
              <div className="flex items-center justify-between py-0.5">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Conditions</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{personalInfo.conditions}</span>
              </div>

              {/* Last checkup */}
              <div className="flex items-center justify-between py-0.5">
                <span className={`font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Last checkup</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{personalInfo.lastCheckup}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section: Health Trend Card */}
        <div className={`rounded-2xl p-6 transition-all border ${
          isDark ? 'bg-[#181a1f] border-zinc-800/80' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-6">
            <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Health trend</h2>
            {vitalsHistory.length > 0 && (
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  className={`bg-transparent text-xs font-semibold text-blue-400 outline-none cursor-pointer hover:underline ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  <option value="3months" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>Last 3 months</option>
                  <option value="6months" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>Last 6 months</option>
                  <option value="1year" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>Last 1 year</option>
                </select>
              </div>
            )}
          </div>

          {vitalsHistory.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-zinc-800/80 text-zinc-400' : 'bg-slate-100 text-slate-400'}`}>
                <Activity className="w-6 h-6" />
              </div>
              <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>No health trend data recorded</h4>
              <p className={`text-xs max-w-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Health trends will automatically generate here as you or your doctor log health vitals over time.
              </p>
              <button
                onClick={() => {
                  setVitalsForm({
                    ...vitals,
                    bloodPressure: vitals.bloodPressure === '--' ? '' : vitals.bloodPressure,
                    bloodSugar: vitals.bloodSugar === '--' ? '' : vitals.bloodSugar,
                    heartRate: vitals.heartRate === '--' ? '' : vitals.heartRate,
                    spO2: vitals.spO2 === '--' ? '' : vitals.spO2,
                    weight: vitals.weight === '--' ? '' : vitals.weight,
                    height: vitals.height === '--' ? '' : vitals.height,
                  });
                  setIsUpdateVitalsOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Update vitals now</span>
              </button>
            </div>
          ) : (
            /* 3 Columns Layout */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Column 1: Blood pressure trend */}
              <div>
                <h3 className={`text-xs font-semibold mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Blood pressure trend</h3>
                <div className="space-y-3.5">
                  {vitalsHistory.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className={`w-8 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{row.month}</span>
                      <div className="flex-1 bg-zinc-800/60 h-2.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: row.bloodPressure !== '--' ? '70%' : '0%' }} />
                      </div>
                      <span className={`w-16 text-right font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.bloodPressure}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Blood sugar trend */}
              <div>
                <h3 className={`text-xs font-semibold mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Blood sugar trend</h3>
                <div className="space-y-3.5">
                  {vitalsHistory.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className={`w-8 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{row.month}</span>
                      <div className="flex-1 bg-zinc-800/60 h-2.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: row.bloodSugar !== '--' ? '65%' : '0%' }} />
                      </div>
                      <span className={`w-16 text-right font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.bloodSugar}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Weight trend */}
              <div>
                <h3 className={`text-xs font-semibold mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Weight trend</h3>
                <div className="space-y-3.5">
                  {vitalsHistory.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className={`w-8 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{row.month}</span>
                      <div className="flex-1 bg-zinc-800/60 h-2.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: row.weight !== '--' ? '75%' : '0%' }} />
                      </div>
                      <span className={`w-16 text-right font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.weight}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </main>

      {/* Modal 1: Update Vitals */}
      {isUpdateVitalsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
            isDark ? 'bg-[#181a1f] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800/60">
              <h3 className="text-sm font-bold">Update health vitals</h3>
              <button
                onClick={() => setIsUpdateVitalsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  value={vitalsForm.bloodPressure}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })}
                  placeholder="e.g. 120/80"
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Blood Sugar (mg/dL)</label>
                  <input
                    type="text"
                    value={vitalsForm.bloodSugar}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bloodSugar: e.target.value })}
                    placeholder="e.g. 108"
                    className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="text"
                    value={vitalsForm.heartRate}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                    placeholder="e.g. 72"
                    className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">SpO2 (%)</label>
                  <input
                    type="text"
                    value={vitalsForm.spO2}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, spO2: e.target.value })}
                    placeholder="e.g. 98"
                    className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                    placeholder="e.g. 74"
                    className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Height (cm)</label>
                <input
                  type="text"
                  value={vitalsForm.height}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                  placeholder="e.g. 175"
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUpdateVitalsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Personal Info */}
      {isEditPersonalInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
            isDark ? 'bg-[#181a1f] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800/60">
              <h3 className="text-sm font-bold">Edit personal information</h3>
              <button
                onClick={() => setIsEditPersonalInfoOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePersonalInfo} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Blood Group</label>
                  <input
                    type="text"
                    value={infoForm.bloodGroup}
                    onChange={(e) => setInfoForm({ ...infoForm, bloodGroup: e.target.value })}
                    placeholder="e.g. B+"
                    className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Age</label>
                  <input
                    type="text"
                    value={infoForm.age}
                    onChange={(e) => setInfoForm({ ...infoForm, age: e.target.value })}
                    placeholder="e.g. 31 years"
                    className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Date of Birth</label>
                <input
                  type="text"
                  value={infoForm.dateOfBirth}
                  onChange={(e) => setInfoForm({ ...infoForm, dateOfBirth: e.target.value })}
                  placeholder="e.g. 12 Mar 1995"
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Allergies</label>
                <input
                  type="text"
                  value={infoForm.allergies}
                  onChange={(e) => setInfoForm({ ...infoForm, allergies: e.target.value })}
                  placeholder="e.g. Penicillin"
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Medical Conditions</label>
                <input
                  type="text"
                  value={infoForm.conditions}
                  onChange={(e) => setInfoForm({ ...infoForm, conditions: e.target.value })}
                  placeholder="e.g. Diabetes, BP"
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Last Checkup Date</label>
                <input
                  type="text"
                  value={infoForm.lastCheckup}
                  onChange={(e) => setInfoForm({ ...infoForm, lastCheckup: e.target.value })}
                  placeholder="e.g. 28 Nov 2026"
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditPersonalInfoOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
