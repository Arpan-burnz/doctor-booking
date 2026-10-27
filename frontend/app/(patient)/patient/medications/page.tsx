'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole, getUsername } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import PatientSidebar from '@/components/shared/PatientSidebar';
import {
  Plus,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  Edit2,
  Trash2,
  Clock,
  CheckCircle
} from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  doseAmount: string;
  multiplier: string;
  prescribedBy: string;
  scheduleTime: string;
  foodInstruction: string;
  period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  color: 'emerald' | 'blue' | 'amber' | 'pink';
  checked: boolean;
}

const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: '1',
    name: 'Metformin',
    doseAmount: '500mg',
    multiplier: '2',
    prescribedBy: 'Dr. Sharma',
    scheduleTime: '8:00 AM',
    foodInstruction: 'With food',
    period: 'MORNING',
    color: 'emerald',
    checked: true
  },
  {
    id: '2',
    name: 'Amlodipine',
    doseAmount: '5mg',
    multiplier: '1',
    prescribedBy: 'Dr. Sharma',
    scheduleTime: '8:00 AM',
    foodInstruction: 'Before food',
    period: 'MORNING',
    color: 'blue',
    checked: true
  },
  {
    id: '3',
    name: 'Vitamin D3',
    doseAmount: '60K',
    multiplier: '1',
    prescribedBy: 'Dr. Mehta',
    scheduleTime: '1:00 PM',
    foodInstruction: 'After food',
    period: 'AFTERNOON',
    color: 'amber',
    checked: false
  },
  {
    id: '4',
    name: 'Atorvastatin',
    doseAmount: '10mg',
    multiplier: '1',
    prescribedBy: 'Dr. Kapoor',
    scheduleTime: '9:00 PM',
    foodInstruction: 'Before sleep',
    period: 'EVENING',
    color: 'pink',
    checked: false
  }
];

const dotColors: Record<string, string> = {
  emerald: 'bg-emerald-400',
  blue: 'bg-blue-400',
  amber: 'bg-amber-400',
  pink: 'bg-pink-400'
};

export default function MedicationsPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDose, setFormDose] = useState('');
  const [formMultiplier, setFormMultiplier] = useState('1');
  const [formPrescribedBy, setFormPrescribedBy] = useState('');
  const [formTime, setFormTime] = useState('8:00 AM');
  const [formFood, setFormFood] = useState('With food');
  const [formPeriod, setFormPeriod] = useState<'MORNING' | 'AFTERNOON' | 'EVENING'>('MORNING');
  const [formColor, setFormColor] = useState<'emerald' | 'blue' | 'amber' | 'pink'>('blue');

  useEffect(() => {
    if (getUserRole() !== 'PATIENT') {
      router.push('/login');
      return;
    }
    const saved = localStorage.getItem('doc4u_patient_medications');
    if (saved) {
      try {
        setMedications(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved medications', e);
      }
    } else {
      setMedications([]);
    }
  }, [router]);

  const saveMedicationsState = (updated: Medication[]) => {
    setMedications(updated);
    localStorage.setItem('doc4u_patient_medications', JSON.stringify(updated));
  };

  const handleToggleCheck = (id: string) => {
    const updated = medications.map(m => (m.id === id ? { ...m, checked: !m.checked } : m));
    saveMedicationsState(updated);
  };

  const handleOpenAddModal = () => {
    setEditingMed(null);
    setFormName('');
    setFormDose('');
    setFormMultiplier('1');
    setFormPrescribedBy('');
    setFormTime('8:00 AM');
    setFormFood('With food');
    setFormPeriod('MORNING');
    setFormColor('blue');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (med: Medication) => {
    setEditingMed(med);
    setFormName(med.name);
    setFormDose(med.doseAmount);
    setFormMultiplier(med.multiplier);
    setFormPrescribedBy(med.prescribedBy);
    setFormTime(med.scheduleTime);
    setFormFood(med.foodInstruction);
    setFormPeriod(med.period);
    setFormColor(med.color);
    setIsAddModalOpen(true);
  };

  const handleDeleteMed = (id: string) => {
    const updated = medications.filter(m => m.id !== id);
    saveMedicationsState(updated);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingMed) {
      const updated = medications.map(m =>
        m.id === editingMed.id
          ? {
              ...m,
              name: formName,
              doseAmount: formDose,
              multiplier: formMultiplier,
              prescribedBy: formPrescribedBy || 'Self Added',
              scheduleTime: formTime,
              foodInstruction: formFood,
              period: formPeriod,
              color: formColor
            }
          : m
      );
      saveMedicationsState(updated);
    } else {
      const newMed: Medication = {
        id: Date.now().toString(),
        name: formName,
        doseAmount: formDose || '1 pill',
        multiplier: formMultiplier || '1',
        prescribedBy: formPrescribedBy || 'Self Added',
        scheduleTime: formTime,
        foodInstruction: formFood,
        period: formPeriod,
        color: formColor,
        checked: false
      };
      saveMedicationsState([...medications, newMed]);
    }
    setIsAddModalOpen(false);
  };

  // Metric calculations
  const totalActive = medications.length;
  const checkedCount = medications.filter(m => m.checked).length;
  const adherencePercent = totalActive > 0 ? Math.round((checkedCount / totalActive) * 100) : 0;
  const doseDueSoonCount = medications.filter(m => !m.checked).length;

  const morningMeds = medications.filter(m => m.period === 'MORNING');
  const afternoonMeds = medications.filter(m => m.period === 'AFTERNOON');
  const eveningMeds = medications.filter(m => m.period === 'EVENING');

  return (
    <div
      className={`min-h-screen flex font-sans select-none antialiased transition-all duration-300 ${
        isDark ? 'bg-[#0c0d0e] text-zinc-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Shared Sidebar */}
      <PatientSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 md:pt-7 pb-7 space-y-7 transition-all duration-300">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Medications</h1>
            <p className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Track your daily medications and doses
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-[#16171b] border-zinc-700/80 text-white hover:bg-zinc-800 hover:border-zinc-600'
                : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add medication</span>
          </button>
        </div>

        {/* Top Metric Cards Row (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Active Medications Card */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Pill className="w-4.5 h-4.5" />
            </div>
            <div className="mt-4">
              <div className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalActive}</div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Active medications</div>
            </div>
          </div>

          {/* Today's Adherence Card */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Check className="w-4.5 h-4.5 stroke-[3]" />
            </div>
            <div className="mt-4">
              <div className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {adherencePercent}%
              </div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Today's adherence</div>
            </div>
          </div>

          {/* Dose Due Soon Card */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div className="mt-4">
              <div className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {doseDueSoonCount}
              </div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Dose due soon</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Today's schedule */}
          <div
            className={`lg:col-span-6 rounded-3xl p-6 border flex flex-col justify-between transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div>
              <h3 className={`text-base font-bold mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>Today's schedule</h3>

              <div className="space-y-6">
                {medications.length === 0 && (
                  <div className={`py-6 text-center text-xs font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    No medications scheduled for today.
                  </div>
                )}
                {/* MORNING */}
                {morningMeds.length > 0 && (
                  <div>
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Morning
                    </h4>
                    <div className="space-y-4">
                      {morningMeds.map(med => (
                        <div key={med.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColors[med.color] || 'bg-blue-400'}`} />
                            <div>
                              <h5 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {med.name} {med.doseAmount}
                              </h5>
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                {med.scheduleTime} · {med.foodInstruction}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleCheck(med.id)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              med.checked
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                : isDark
                                ? 'border border-zinc-700 bg-zinc-900/60 text-zinc-700 hover:border-zinc-500'
                                : 'border border-slate-300 bg-slate-100 text-slate-400 hover:border-slate-400'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 stroke-[3] ${med.checked ? 'text-white' : 'opacity-40'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AFTERNOON */}
                {afternoonMeds.length > 0 && (
                  <div>
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Afternoon
                    </h4>
                    <div className="space-y-4">
                      {afternoonMeds.map(med => (
                        <div key={med.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColors[med.color] || 'bg-amber-400'}`} />
                            <div>
                              <h5 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {med.name} {med.doseAmount}
                              </h5>
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                {med.scheduleTime} · {med.foodInstruction}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleCheck(med.id)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              med.checked
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                : isDark
                                ? 'border border-zinc-700 bg-zinc-900/60 text-zinc-700 hover:border-zinc-500'
                                : 'border border-slate-300 bg-slate-100 text-slate-400 hover:border-slate-400'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 stroke-[3] ${med.checked ? 'text-white' : 'opacity-40'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EVENING */}
                {eveningMeds.length > 0 && (
                  <div>
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Evening
                    </h4>
                    <div className="space-y-4">
                      {eveningMeds.map(med => (
                        <div key={med.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColors[med.color] || 'bg-pink-400'}`} />
                            <div>
                              <h5 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {med.name} {med.doseAmount}
                              </h5>
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                {med.scheduleTime} · {med.foodInstruction}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleCheck(med.id)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              med.checked
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                : isDark
                                ? 'border border-zinc-700 bg-zinc-900/60 text-zinc-700 hover:border-zinc-500'
                                : 'border border-slate-300 bg-slate-100 text-slate-400 hover:border-slate-400'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 stroke-[3] ${med.checked ? 'text-white' : 'opacity-40'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Adherence Progress Footer */}
            <div className={`mt-8 pt-5 border-t ${isDark ? 'border-zinc-800/80' : 'border-slate-100'}`}>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Daily adherence</span>
                <span className="text-blue-500 font-bold">{adherencePercent}%</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${adherencePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Column 2: All medications */}
          <div
            className={`lg:col-span-6 rounded-3xl p-6 border flex flex-col justify-between transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800/80' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>All medications</h3>
                {medications.length > 0 && (
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    {isEditMode ? 'Done' : 'Edit'}
                  </button>
                )}
              </div>

              {medications.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-zinc-800/80 text-zinc-400' : 'bg-slate-100 text-slate-400'}`}>
                    <Pill className="w-6 h-6" />
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>No medications recorded</h4>
                  <p className={`text-xs max-w-xs mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    You don't have any active medications. Click below to add one or get prescriptions from your doctor.
                  </p>
                  <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add medication</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Table Column Headers */}
                  <div
                    className={`grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider pb-3 border-b ${
                      isDark ? 'text-zinc-500 border-zinc-800/60' : 'text-slate-400 border-slate-100'
                    }`}
                  >
                    <div className="col-span-5">NAME</div>
                    <div className="col-span-3">DOSE</div>
                    <div className="col-span-4 text-right">PRESCRIBED BY</div>
                  </div>

                  {/* Rows */}
                  <div className={`divide-y ${isDark ? 'divide-zinc-800/50' : 'divide-slate-100'}`}>
                    {medications.map(med => (
                      <div key={med.id} className="grid grid-cols-12 items-center py-4 text-xs font-medium">
                        <div className="col-span-5 flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColors[med.color] || 'bg-blue-400'}`} />
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{med.name}</span>
                        </div>

                        <div className={`col-span-3 font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {med.doseAmount} {med.multiplier ? `× ${med.multiplier}` : ''}
                        </div>

                        <div className="col-span-4 flex items-center justify-end gap-2">
                          <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{med.prescribedBy}</span>

                          {isEditMode && (
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                onClick={() => handleOpenEditModal(med)}
                                className="p-1 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMed(med.id)}
                                className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add / Edit Medication Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
              isDark ? 'bg-[#16171b] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">{editingMed ? 'Edit Medication' : 'Add Medication'}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Medication Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Dosage Amount
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg"
                    value={formDose}
                    onChange={e => setFormDose(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Daily Multiplier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2"
                    value={formMultiplier}
                    onChange={e => setFormMultiplier(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Schedule Period
                  </label>
                  <select
                    value={formPeriod}
                    onChange={e => setFormPeriod(e.target.value as any)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="MORNING">Morning</option>
                    <option value="AFTERNOON">Afternoon</option>
                    <option value="EVENING">Evening</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Schedule Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8:00 AM"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Food Instruction
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. With food"
                    value={formFood}
                    onChange={e => setFormFood(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Prescribed By
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Sharma"
                    value={formPrescribedBy}
                    onChange={e => setFormPrescribedBy(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Tag Indicator Color
                </label>
                <div className="flex gap-4">
                  {(['emerald', 'blue', 'amber', 'pink'] as const).map(color => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setFormColor(color)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        dotColors[color]
                      } ${formColor === color ? 'ring-4 ring-blue-500/40 scale-110' : 'opacity-70 hover:opacity-100'}`}
                    >
                      {formColor === color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {editingMed ? 'Save Changes' : 'Add Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
