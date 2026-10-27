'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserRole, getUsername } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import PatientSidebar from '@/components/shared/PatientSidebar';
import {
    Plus,
    Loader2,
    Clock,
    Download,
    Upload,
    X,
    FileDown,
    FileSpreadsheet,
    Link as LinkIcon,
    Search,
    FileText
} from 'lucide-react';

export default function PatientPrescriptions() {
    const router = useRouter();

    // States
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { theme, setTheme, isDark } = useTheme();

    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

    // Upload modal states
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
    const [diagnosisInput, setDiagnosisInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Load patient context and initial data
    useEffect(() => {
        if (getUserRole() !== 'PATIENT') {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [prescRes, apptRes] = await Promise.all([
                    api.get('/prescriptions/patient/mine'),
                    api.get('/appointments/mine')
                ]);
                setPrescriptions(prescRes.data.data || []);
                setAppointments(apptRes.data.data || []);
            } catch (err) {
                console.error('Failed to load prescriptions data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    // Helper: check if a prescription is active (within last 30 days or issued in the future)
    const isPrescriptionActive = (issuedAtStr: string) => {
        if (!issuedAtStr) return false;
        const issuedAt = new Date(issuedAtStr);
        const now = new Date();
        const diffTime = now.getTime() - issuedAt.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= 30 || issuedAt.getTime() > now.getTime();
    };

    // Compute statistics
    const totalCount = prescriptions.length;
    const activeCount = prescriptions.filter(p => isPrescriptionActive(p.issuedAt)).length;
    const expiredCount = totalCount - activeCount;

    // Format short date (e.g., 28 Nov 2026)
    const formatShortDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    // Format filename extract (remove uuid prefix)
    const getCleanFileName = (fileUrl: string) => {
        if (!fileUrl) return 'Prescription.pdf';
        const rawName = fileUrl.split('/').pop() || 'Prescription.pdf';
        return rawName.replace(/^[0-9a-fA-F-]{36}-/, '');
    };

    // Get doctor display name mappings or defaults
    const getDoctorDisplayName = (specialization: string) => {
        const spec = specialization?.toLowerCase() || '';
        if (spec.includes('cardiol')) return 'Dr. Sharma';
        if (spec.includes('neuro')) return 'Dr. Mehta';
        if (spec.includes('dentist') || spec.includes('dental')) return 'Dr. Kapoor';
        return `Dr. ${specialization || 'Specialist'}`;
    };

    // Filter list
    const filteredPrescriptions = prescriptions.filter(p => {
        const doctorSpecialty = p.appointment?.doctor?.specialization || '';
        const doctorName = getDoctorDisplayName(doctorSpecialty);
        const diagnosis = p.diagnosis || '';
        const filename = getCleanFileName(p.fileUrl);

        const matchesSearch =
            doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doctorSpecialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
            diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
            filename.toLowerCase().includes(searchQuery.toLowerCase());

        const active = isPrescriptionActive(p.issuedAt);
        const matchesFilter =
            statusFilter === 'ALL' ||
            (statusFilter === 'ACTIVE' && active) ||
            (statusFilter === 'EXPIRED' && !active);

        return matchesSearch && matchesFilter;
    });

    // Handle File upload
    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAppointmentId) {
            setErrorMsg('Please select an appointment');
            return;
        }
        if (!selectedFile) {
            setErrorMsg('Please select a file to upload');
            return;
        }

        setUploading(true);
        setErrorMsg('');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('appointmentId', selectedAppointmentId);
        formData.append('diagnosis', diagnosisInput);

        try {
            await api.post('/prescriptions/patient/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Refresh list
            const resc = await api.get('/prescriptions/patient/mine');
            setPrescriptions(resc.data.data || []);
            // Reset State
            setIsUploadOpen(false);
            setSelectedAppointmentId('');
            setDiagnosisInput('');
            setSelectedFile(null);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Failed to upload prescription');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
            <div className="text-center flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-zinc-550 text-xs font-semibold tracking-wider font-sans">Tethering diagnostics overview...</p>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen flex font-sans select-none antialiased transition-all duration-300 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'
            }`}>

            {/* Shared Sidebar */}
            <PatientSidebar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 md:pt-7 pb-7 space-y-7 transition-all duration-300">

                {/* Top Header Row */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-905'}`}>Prescriptions</h1>
                        <p className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>All prescriptions from your doctors</p>
                    </div>

                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer active:scale-95 border-0 outline-none"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                    </button>
                </div>

                {/* Stats Row Grid (3 columns to match mockup cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[
                        { label: 'Total', value: totalCount, icon: <FileSpreadsheet className="w-5 h-5 text-blue-400" />, bg: 'bg-blue-600/10 border-blue-900/30' },
                        { label: 'Active', value: activeCount, icon: <LinkIcon className="w-5 h-5 text-emerald-450" />, bg: 'bg-emerald-600/10 border-emerald-900/30' },
                        { label: 'Expired', value: expiredCount, icon: <Clock className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-600/10 border-amber-900/30' },
                    ].map((s, idx) => (
                        <div key={idx} className={`rounded-xl p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all shadow-xs min-h-[110px] border ${isDark
                            ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                            : 'bg-white border-slate-202 hover:border-slate-300'
                            }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                                {s.icon}
                            </div>
                            <div className="mt-3">
                                <div className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</div>
                                <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Prescription List block */}
                <div className={`rounded-3xl p-6 border transition-all ${isDark ? 'bg-zinc-900 border-zinc-850' : 'bg-white border-slate-205 shadow-sm'
                    }`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>All prescriptions</h3>
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className={`absolute left-3 top-2.5 w-3.5 h-3.5 ${isDark ? 'text-zinc-550' : 'text-slate-400'}`} />
                                <input
                                    type="text"
                                    placeholder="Search file, doctor, diagnosis..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`pl-9 pr-4 py-1.8 text-xs font-semibold rounded-xl outline-none transition-all border ${isDark
                                        ? 'bg-zinc-950 border-zinc-800 focus:border-blue-500 text-zinc-300 placeholder:text-zinc-600'
                                        : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-700 placeholder:text-slate-450'
                                        }`}
                                />
                            </div>
                            {/* Filter pills */}
                            <div className={`flex items-center p-0.8 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800/80' : 'bg-slate-100 border-slate-200'}`}>
                                {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setStatusFilter(mode)}
                                        className={`px-3 py-1.2 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${statusFilter === mode
                                            ? isDark
                                                ? 'bg-zinc-850 text-white'
                                                : 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                                            : isDark
                                                ? 'text-zinc-500 hover:text-zinc-300'
                                                : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {filteredPrescriptions.length === 0 ? (
                        <div className="text-center py-16">
                            <FileText className={`w-12 h-12 mx-auto mb-3.5 ${isDark ? 'text-zinc-705' : 'text-slate-300'}`} />
                            <p className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-zinc-500' : 'text-slate-450'}`}>No prescriptions found</p>
                            <p className={`text-[11px] mt-1.5 ${isDark ? 'text-zinc-600' : 'text-slate-500'}`}>
                                {searchQuery || statusFilter !== 'ALL' ? 'Try adjusting your filters or search criteria' : 'Any prescriptions shared by your doctors will show up here.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`border-b text-[10px] font-bold tracking-wider ${isDark ? 'border-zinc-800/80 text-zinc-500' : 'border-slate-105 text-slate-400'
                                        }`}>
                                        <th className="pb-3 font-extrabold uppercase">File</th>
                                        <th className="pb-3 font-extrabold uppercase">Doctor</th>
                                        <th className="pb-3 font-extrabold uppercase">Diagnosis</th>
                                        <th className="pb-3 font-extrabold uppercase">Date</th>
                                        <th className="pb-3 font-extrabold uppercase">Status</th>
                                        <th className="pb-3 font-extrabold uppercase text-right">Download</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
                                    {filteredPrescriptions.map((p) => {
                                        const active = isPrescriptionActive(p.issuedAt);
                                        const cleanName = getCleanFileName(p.fileUrl);
                                        const doctorSpecialty = p.appointment?.doctor?.specialization || '';
                                        const doctorName = getDoctorDisplayName(doctorSpecialty);
                                        return (
                                            <tr key={p.id} className="text-xs transition-colors hover:bg-zinc-850/5 dark:hover:bg-zinc-800/5">
                                                <td className="py-4.5 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${isDark
                                                            ? 'bg-rose-500/10 border-rose-900/30 text-rose-455'
                                                            : 'bg-rose-50 border-rose-100 text-rose-650'
                                                            }`}>
                                                            <FileText className="w-4.5 h-4.5" />
                                                        </div>
                                                        <span className={`font-bold transition-all text-xs ${isDark ? 'text-white hover:text-blue-400' : 'text-slate-900 hover:text-blue-600'}`}>
                                                            {cleanName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`py-4.5 font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                                                    {doctorName}
                                                </td>
                                                <td className={`py-4.5 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                                                    {p.diagnosis || 'General checkout'}
                                                </td>
                                                <td className="py-4.5 font-medium">
                                                    {formatShortDate(p.issuedAt)}
                                                </td>
                                                <td className="py-4.5">
                                                    <span className={`text-[10px] font-bold tracking-wide px-3.5 py-1 rounded-full border select-none ${active
                                                        ? isDark
                                                            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/35'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : isDark
                                                            ? 'bg-zinc-800/40 text-zinc-400 border-zinc-800'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                        }`}>
                                                        {active ? 'Active' : 'Expired'}
                                                    </span>
                                                </td>
                                                <td className="py-4.5 text-right">
                                                    <a
                                                        href={p.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`inline-flex w-8 h-8 rounded-lg items-center justify-center border cursor-pointer active:scale-95 transition-all ${isDark
                                                            ? 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white'
                                                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm font-semibold'
                                                            }`}
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </main>

            {/* Upload Dialog Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300">
                    <div className={`w-full max-w-md rounded-3xl p-6 border transition-all animate-in zoom-in-95 duration-200 ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-base">Upload Prescription</h3>
                            <button
                                onClick={() => {
                                    setIsUploadOpen(false);
                                    setErrorMsg('');
                                    setSelectedAppointmentId('');
                                    setDiagnosisInput('');
                                    setSelectedFile(null);
                                }}
                                className={`p-1 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                            {/* Target Appointment Details */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                    Target Appointment *
                                </label>
                                <select
                                    required
                                    value={selectedAppointmentId}
                                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer ${isDark
                                        ? 'bg-zinc-950 border-zinc-805 text-zinc-200 focus:border-blue-500'
                                        : 'bg-slate-50 border-slate-202 text-slate-800 focus:border-blue-500'
                                        }`}
                                >
                                    <option value="">Select Appointment</option>
                                    {appointments
                                        .filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED')
                                        .map((a) => {
                                            const doctorSpecialty = a.doctor?.specialization || '';
                                            const doctorName = getDoctorDisplayName(doctorSpecialty);
                                            const timeStr = formatShortDate(a.slot?.slotDate);
                                            return (
                                                <option key={a.id} value={a.id}>
                                                    {doctorName} ({doctorSpecialty}) — {timeStr}
                                                </option>
                                            );
                                        })}
                                </select>
                            </div>

                            {/* Diagnosis inputs */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                    Diagnosis (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Hypertension, Flu, Routine Consult"
                                    value={diagnosisInput}
                                    onChange={(e) => setDiagnosisInput(e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${isDark
                                        ? 'bg-zinc-955 bg-zinc-950 border-zinc-805 placeholder:text-zinc-600 focus:border-blue-500 text-zinc-100'
                                        : 'bg-slate-50 border-slate-202 placeholder:text-slate-400 focus:border-blue-500 text-slate-800'
                                        }`}
                                />
                            </div>

                            {/* File upload selector */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                    Select Document * (PDF / Images)
                                </label>
                                <div className={`border-2 border-dashed rounded-xl p-4.5 flex flex-col items-center justify-center transition-all cursor-pointer relative group ${isDark
                                    ? 'border-zinc-800 hover:border-zinc-650 bg-zinc-950/40 hover:bg-zinc-950'
                                    : 'border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50'
                                    }`}>
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                        required
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setSelectedFile(e.target.files[0]);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <FileDown className={`w-7 h-7 mb-2 transition-transform duration-250 group-hover:scale-105 ${isDark ? 'text-zinc-600 group-hover:text-zinc-400' : 'text-slate-400 group-hover:text-slate-655'
                                        }`} />
                                    <span className="text-[11px] font-bold">
                                        {selectedFile ? selectedFile.name : 'Click or drag file here'}
                                    </span>
                                    <span className={`text-[9px] mt-0.5 ${isDark ? 'text-zinc-600' : 'text-slate-450'}`}>
                                        {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Max limit: 5MB'}
                                    </span>
                                </div>
                            </div>

                            {/* Error block */}
                            {errorMsg && (
                                <div className={`p-3 rounded-xl text-xs font-semibold text-center border bg-red-500/10 text-red-500 border-red-900/30`}>
                                    {errorMsg}
                                </div>
                            )}

                            {/* Actions panel */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsUploadOpen(false);
                                        setErrorMsg('');
                                        setSelectedAppointmentId('');
                                        setDiagnosisInput('');
                                        setSelectedFile(null);
                                    }}
                                    disabled={uploading}
                                    className={`flex-1 py-2.5 rounded-xl border text-xs font-extrabold cursor-pointer active:scale-97 transition-all ${isDark
                                        ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/40 text-white text-xs font-extrabold rounded-xl transition-all shadow-md active:scale-97 cursor-pointer border-0 outline-none flex items-center justify-center gap-1.5"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <span>Upload File</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
