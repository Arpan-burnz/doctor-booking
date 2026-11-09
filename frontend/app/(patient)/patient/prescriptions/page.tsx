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

    // Get doctor display name from database doctor record or specialization
    const getDoctorDisplayName = (doctor?: any) => {
        if (!doctor) return 'Doctor';
        if (doctor.name?.trim()) return doctor.name;
        if (doctor.user?.email) return doctor.user.email;
        return `Dr. ${doctor.specialization || 'Specialist'}`;
    };

    // Filter list
    const filteredPrescriptions = prescriptions.filter(p => {
        const doctorObj = p.appointment?.doctor;
        const doctorSpecialty = doctorObj?.specialization || '';
        const doctorName = getDoctorDisplayName(doctorObj);
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
        <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-400">
            <div className="text-center flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
                <p className="text-slate-400 text-xs font-semibold tracking-wider font-sans">Tethering diagnostics overview...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex font-sans select-none antialiased bg-transparent text-slate-100 selection:bg-purple-900/40 selection:text-purple-200">

            {/* Shared Sidebar */}
            <PatientSidebar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 md:pt-7 pb-7 space-y-7 transition-all duration-300">

                {/* Top Header Row */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">Prescriptions</h1>
                        <p className="text-xs font-medium mt-1 text-slate-400">All prescriptions from your doctors</p>
                    </div>

                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                    </button>
                </div>

                {/* Stats Row Grid (3 columns to match mockup cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[
                        { label: 'Total', value: totalCount, icon: <FileSpreadsheet className="w-5 h-5 text-sky-400" />, bg: 'bg-sky-500/10 border-sky-500/20' },
                        { label: 'Active', value: activeCount, icon: <LinkIcon className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/20' },
                        { label: 'Expired', value: expiredCount, icon: <Clock className="w-5 h-5 text-amber-400" />, bg: 'bg-amber-500/10 border-amber-500/20' },
                    ].map((s, idx) => (
                        <div key={idx} className="rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all shadow-lg shadow-black/30 min-h-[110px] border border-[#1f293d] bg-[#111827] hover:border-slate-700">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${s.bg}`}>
                                {s.icon}
                            </div>
                            <div className="mt-3">
                                <div className="text-2xl font-bold tracking-tight text-white">{s.value}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-slate-400">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Prescription List block */}
                <div className="rounded-3xl p-6 border border-[#1f293d] bg-[#111827] shadow-xl shadow-black/40">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-white">All prescriptions</h3>
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search file, doctor, diagnosis..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 text-xs font-semibold rounded-xl outline-none transition-all border bg-[#0d121f] border-[#1f293d] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-white placeholder:text-slate-500"
                                />
                            </div>
                            {/* Filter pills */}
                            <div className="flex items-center p-1 rounded-xl border bg-[#0d121f] border-[#1f293d]">
                                {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setStatusFilter(mode)}
                                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${statusFilter === mode
                                            ? 'bg-sky-500 text-slate-950 font-medium'
                                            : 'text-slate-400 hover:text-white'
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
                            <FileText className="w-12 h-12 mx-auto mb-3.5 text-slate-600" />
                            <p className="text-xs font-bold tracking-widest uppercase text-slate-400">No prescriptions found</p>
                            <p className="text-[11px] mt-1.5 text-slate-500">
                                {searchQuery || statusFilter !== 'ALL' ? 'Try adjusting your filters or search criteria' : 'Any prescriptions shared by your doctors will show up here.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#1f293d] text-[10px] font-bold tracking-wider text-slate-400">
                                        <th className="pb-3 font-extrabold uppercase">File</th>
                                        <th className="pb-3 font-extrabold uppercase">Doctor</th>
                                        <th className="pb-3 font-extrabold uppercase">Diagnosis</th>
                                        <th className="pb-3 font-extrabold uppercase">Date</th>
                                        <th className="pb-3 font-extrabold uppercase">Status</th>
                                        <th className="pb-3 font-extrabold uppercase text-right">Download</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1f293d]">
                                    {filteredPrescriptions.map((p) => {
                                        const active = isPrescriptionActive(p.issuedAt);
                                        const cleanName = getCleanFileName(p.fileUrl);
                                        const doctorName = getDoctorDisplayName(p.appointment?.doctor);
                                        return (
                                            <tr key={p.id} className="text-xs transition-colors hover:bg-[#162032]/60">
                                                <td className="py-4.5 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 bg-sky-500/10 border-sky-500/20 text-sky-400">
                                                            <FileText className="w-4.5 h-4.5" />
                                                        </div>
                                                        <span className="font-bold transition-all text-xs text-white hover:text-sky-400">
                                                            {cleanName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4.5 font-bold text-slate-200">
                                                    {doctorName}
                                                </td>
                                                <td className="py-4.5 font-medium text-slate-400">
                                                    {p.diagnosis || 'General checkout'}
                                                </td>
                                                <td className="py-4.5 font-medium text-slate-400">
                                                    {formatShortDate(p.issuedAt)}
                                                </td>
                                                <td className="py-4.5">
                                                    <span className={`text-[10px] font-bold tracking-wide px-3.5 py-1 rounded-full border select-none ${active
                                                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-[#162032] text-slate-400 border-[#1f293d]'
                                                        }`}>
                                                        {active ? 'Active' : 'Expired'}
                                                    </span>
                                                </td>
                                                <td className="py-4.5 text-right">
                                                    <a
                                                        href={p.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex w-8 h-8 rounded-lg items-center justify-center border cursor-pointer active:scale-95 transition-all bg-[#162032] hover:bg-slate-800 border-[#1f293d] text-slate-400 hover:text-white"
                                                    >
                                                        <Download className="w-3.5 h-3.5 text-sky-400" />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300">
                    <div className="w-full max-w-md rounded-3xl p-6 border border-[#1f293d] bg-[#111827] text-white shadow-2xl transition-all animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-base text-white">Upload Prescription</h3>
                            <button
                                onClick={() => {
                                    setIsUploadOpen(false);
                                    setErrorMsg('');
                                    setSelectedAppointmentId('');
                                    setDiagnosisInput('');
                                    setSelectedFile(null);
                                }}
                                className="p-1 rounded-lg transition-colors cursor-pointer hover:bg-[#162032] text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                            {/* Target Appointment Details */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Target Appointment *
                                </label>
                                <select
                                    required
                                    value={selectedAppointmentId}
                                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer bg-[#0d121f] border-[#1f293d] text-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
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
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Diagnosis (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Hypertension, Flu, Routine Consult"
                                    value={diagnosisInput}
                                    onChange={(e) => setDiagnosisInput(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all bg-[#0d121f] border-[#1f293d] placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-white"
                                />
                            </div>

                            {/* File upload selector */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Select Document * (PDF / Images)
                                </label>
                                <div className="border-2 border-dashed rounded-xl p-4.5 flex flex-col items-center justify-center transition-all cursor-pointer relative group border-[#1f293d] hover:border-sky-500/40 bg-[#0d121f] hover:bg-[#162032]">
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
                                    <FileDown className="w-7 h-7 mb-2 transition-transform duration-250 group-hover:scale-105 text-slate-500 group-hover:text-sky-400" />
                                    <span className="text-[11px] font-bold text-white">
                                        {selectedFile ? selectedFile.name : 'Click or drag file here'}
                                    </span>
                                    <span className="text-[9px] mt-0.5 text-slate-400">
                                        {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Max limit: 5MB'}
                                    </span>
                                </div>
                            </div>

                            {/* Error block */}
                            {errorMsg && (
                                <div className="p-3 rounded-xl text-xs font-semibold text-center border bg-rose-950/30 text-rose-300 border-rose-500/30">
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
                                    className="flex-1 py-2.5 rounded-xl border text-xs font-bold cursor-pointer active:scale-97 transition-all border-[#1f293d] bg-[#162032] text-slate-300 hover:text-white hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-medium rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
