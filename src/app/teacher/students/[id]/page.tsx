//ver8 — API Routes Migration
"use client"
import { useState, useEffect, useCallback } from 'react'
import {
    ChevronLeft, User, Phone, Mail, MapPin,
    UserCircle2, PhoneCall, Building2, Calendar,
    X, Maximize2, ShieldCheck, GraduationCap,
    BookOpen, Layers, Info, CheckCircle2, Bike, FileText
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

function DetailSkeleton() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans animate-pulse">
            <div className="max-w-3xl mx-auto px-4 pt-2 pb-4">
                <div className="flex justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-200 rounded-2xl" />
                        <div className="h-10 w-48 bg-slate-200 rounded-2xl" />
                    </div>
                    <div className="w-24 h-11 bg-slate-900/10 rounded-2xl" />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
                {/* Profile Card Skeleton */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-slate-100 mx-auto mb-6" />
                    <div className="h-8 w-48 bg-slate-200 rounded-xl mx-auto mb-3" />
                    <div className="h-3 w-32 bg-slate-100 rounded mx-auto" />
                </div>

                {/* Contact Cards Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 h-24" />
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 h-24" />
                </div>

                {/* Placement History Skeleton */}
                <div className="space-y-4 pt-4">
                    <div className="h-3 w-40 bg-slate-200 rounded ml-4 mb-4" />
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                            <div className="bg-slate-100 h-16" />
                            <div className="p-8 space-y-6">
                                <div className="h-20 bg-slate-50 rounded-[2rem]" />
                                <div className="space-y-3">
                                    <div className="h-14 bg-slate-50 rounded-[1.5rem]" />
                                    <div className="h-14 bg-slate-50 rounded-[1.5rem]" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function StudentDetailPage() {
    const router = useRouter()
    const params = useParams()

    // ล้างเครื่องหมาย : ออกเพื่อป้องกัน Error 400 จาก Supabase
    const studentId = params?.id ? String(params.id).replace(':', '') : null;

    const [loading, setLoading] = useState(true)
    const [student, setStudent] = useState<any>(null)
    const [expandedImage, setExpandedImage] = useState<string | null>(null)

    const fetchStudentData = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teacher/students/${studentId}`)
            const result = await res.json()
            if (!result.success) throw new Error(result.error)
            setStudent(result.data)
        } catch (err: any) {
            console.error("Fetch Error:", err.message);
            setStudent(null);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchStudentData();
    }, [fetchStudentData]);

    if (loading) return <DetailSkeleton />

    if (!student) return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
            <div className="space-y-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-sm">
                    <Info size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">ไม่พบข้อมูลนักศึกษา</h3>
                <button onClick={() => router.back()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">ย้อนกลับ</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900">
            {/* Admin-style Header */}
            <div className="max-w-3xl mx-auto px-4 pt-2 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                                <GraduationCap size={32} className="text-white" />
                            </div>
                            <span>STUDENT <span className="text-indigo-600">Profile</span></span>
                        </h1>
                        <p className="text-slate-400 font-bold mt-2 ml-1 text-xs uppercase tracking-[0.2em]">ข้อมูลนักศึกษาและแผนฝึกปฏิบัติ</p>
                    </div>
                    <button onClick={() => router.back()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
                        <ChevronLeft size={16} /> ย้อนกลับ
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">

                {/* 1. Main Profile Card */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-6 right-6">
                        <div className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1 uppercase tracking-tighter">
                            <ShieldCheck size={12} /> Active
                        </div>
                    </div>

                    <div
                        className="w-28 h-28 rounded-[2.5rem] overflow-hidden mx-auto mb-6 border-4 border-slate-50 shadow-md cursor-zoom-in relative group"
                        onClick={() => student?.avatar_url && setExpandedImage(student.avatar_url)}
                    >
                        {student?.avatar_url ? (
                            <img src={student.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><UserCircle2 size={56} strokeWidth={1} /></div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 size={20} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 leading-none mb-2 uppercase tracking-tight">
                        {student?.first_name} {student?.last_name}
                        {student?.nickname && <span className="text-indigo-500 ml-2">({student.nickname})</span>}
                    </h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">ID: {student?.student_code}</p>
                </div>

                {/* 2. Contact Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a href={`tel:${student?.phone}`} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-all group">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                            <Phone size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">เบอร์โทรศัพท์</p>
                            <p className="text-sm font-black text-slate-700">{student?.phone || 'ไม่ระบุ'}</p>
                        </div>
                    </a>
                    <a href={`mailto:${student?.email}`} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-all group">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">อีเมล</p>
                            <p className="text-sm font-black text-slate-700 truncate w-40 sm:w-full">{student?.email || 'ไม่ระบุ'}</p>
                        </div>
                    </a>
                </div>

                {/* 2.1 Vehicle Info Card (NEW) */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${student?.has_motorcycle ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                            <Bike size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">การนำรถส่วนตัวมาใช้</p>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-slate-700">รถจักรยานยนต์</h4>
                                {student?.has_motorcycle ? (
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[8px] font-black rounded-md border border-emerald-200 uppercase tracking-tighter">มีรถ</span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-black rounded-md border border-slate-200 uppercase tracking-tighter">ไม่มี</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {student?.has_motorcycle && student?.parental_consent_url && (
                        <a
                            href={student.parental_consent_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                        >
                            <FileText size={16} /> ดูเอกสารยินยอม
                        </a>
                    )}
                </div>

                {/* 3. Placement History (โชว์วิชาย่อย และ จังหวัด) */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                        <Layers size={14} /> รายละเอียดการฝึกปฏิบัติรายผลัด
                    </h3>

                    {student?.rotationsGrouped?.map((group: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shadow-inner"><Calendar size={18} /></div>
                                    <p className="font-black text-sm uppercase tracking-widest">ผลัดที่ {idx + 1}: {group.rotationName}</p>
                                </div>
                                <div className="text-[9px] font-black bg-indigo-500 px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Rotation</div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* ส่วนแสดง โรงพยาบาล และ จังหวัด */}
                                <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm shrink-0"><MapPin size={20} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">สถานที่ฝึกปฏิบัติ</p>
                                        <p className="text-base font-black text-slate-800 leading-tight">
                                            {group.site?.site_name || 'ยังไม่มอบหมาย'}
                                        </p>
                                        {group.site?.province && (
                                            <p className="text-[10px] font-bold text-indigo-500 mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                                                <CheckCircle2 size={10} /> จ. {group.site.province}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* รายวิชาย่อยและพี่เลี้ยงรายวิชา */}
                                <div className="space-y-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <BookOpen size={12} className="text-indigo-400" /> วิชาย่อยและพี่เลี้ยงที่ดูแล
                                    </p>
                                    <div className="grid grid-cols-1 gap-4">
                                        {group.subjects.map((sub: any, sIdx: number) => (
                                            <div key={sIdx} className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm group/item hover:border-indigo-100 transition-all">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xs shadow-inner">
                                                            {sIdx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{sub.displayName}</p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Practice Subject</p>
                                                        </div>
                                                    </div>

                                                    {/* รายชื่อพี่เลี้ยงของวิชานี้ */}
                                                    <div className="flex flex-wrap gap-2 sm:justify-end">
                                                        {sub.mentors.length > 0 ? sub.mentors.map((m: any, mIdx: number) => (
                                                            <div key={mIdx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                                <UserCircle2 size={14} className="text-indigo-400" />
                                                                <div>
                                                                    <p className="text-[10px] font-black text-slate-700 leading-none">{m.name}</p>
                                                                    <p className="text-[8px] font-bold text-slate-400 mt-0.5">{m.phone || 'No Phone'}</p>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <span className="text-[9px] text-slate-300 italic font-bold uppercase p-2 tracking-widest">ยังไม่มอบหมายพี่เลี้ยง</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Image Preview Modal */}
            {expandedImage && (
                <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpandedImage(null)}>
                    <button className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-800 shadow-sm border border-slate-100"><X size={24} /></button>
                    <div className="max-w-md w-full aspect-square rounded-[3.5rem] overflow-hidden shadow-2xl border-[16px] border-slate-50 ring-1 ring-slate-100" onClick={e => e.stopPropagation()}>
                        <img src={expandedImage} className="w-full h-full object-cover" alt="Profile Full" />
                    </div>
                </div>
            )}
        </div>
    )
}