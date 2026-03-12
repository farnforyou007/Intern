"use client"
import { useEffect, useState } from 'react'
import { User, BookOpen, Fingerprint, ShieldCheck, Mail, Phone, Calendar, ArrowRight, GraduationCap } from 'lucide-react'
import { getLineUserId } from '@/utils/auth'

export default function TeacherProfilePage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search)
                const lineUserId = await getLineUserId(urlParams)
                if (!lineUserId) return

                const res = await fetch(`/api/teacher/profile?lineUserId=${lineUserId}`)
                const result = await res.json()
                if (result.success) setUser(result.data)
            } catch (err) {
                console.error("Fetch profile failed", err)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-64 bg-slate-100 rounded-[3rem]" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-48 bg-slate-50 rounded-3xl" />
                    <div className="h-48 bg-slate-50 rounded-3xl" />
                </div>
            </div>
        )
    }


    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header Card */}
            <div className="relative overflow-hidden bg-[#1e1b4b] rounded-[3rem] p-8 md:p-12 text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-inner overflow-hidden font-bold">
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <GraduationCap size={64} className="text-white" />
                        )}
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-2">
                            <span className="px-3 py-1 bg-indigo-600/50 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-400/30">
                                Teacher Profile
                            </span>
                            <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-400/30 text-emerald-300">
                                Verified Account
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black">{user?.full_name || 'ไม่ระบุชื่อ'}</h1>
                        <p className="text-indigo-200 font-bold text-lg">อาจารย์ผู้รับผิดชอบรายวิชา</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Info Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <User size={20} />
                            </div>
                            ข้อมูลส่วนตัว
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อ-นามสกุล</p>
                                <p className="font-bold text-slate-700">{user?.full_name || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เบอร์โทรศัพท์</p>
                                <p className="font-bold text-slate-700">{user?.phone || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">อีเมล (Email)</p>
                                <p className="font-bold text-slate-700">{user?.email || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อไลน์ </p>
                                <p className="font-mono text-[11px] text-slate-400">{user?.line_display_name || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm italic text-slate-400 text-sm">
                        * หากต้องการเปลี่ยนข้อมูลส่วนตัว กรุณาติดต่อฝ่ายจัดการระบบ หรืออัปเดตข้อมูลผ่าน LINE OA
                    </div> */}
                </div>

                {/* Subjects Section */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-full">
                        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <BookOpen size={20} />
                            </div>
                            วิชาที่รับผิดชอบ
                        </h3>

                        <div className="space-y-3">
                            {user?.supervisor_subjects?.length > 0 ? user.supervisor_subjects.map((s: any) => (
                                <div key={s.id} className="group p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-all border border-transparent hover:border-indigo-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-sm">{s.subjects?.name}</span>
                                            {s.sub_subjects?.name && (
                                                <span className="text-[10px] font-bold text-indigo-400">({s.sub_subjects.name})</span>
                                            )}
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                                </div>
                            )) : (
                                <p className="text-slate-400 text-center py-10 font-bold border-2 border-dashed border-slate-50 rounded-3xl">ยังไม่ได้ผูกรายวิชา</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
