// "use client"
// import { Clock, ArrowLeft } from 'lucide-react'
// import { useRouter } from 'next/navigation'

// export default function TeacherPendingPage() {
//     const router = useRouter()

//     return (
//         <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F0F7FF]">
//             <div className="w-24 h-24 bg-white text-amber-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100 animate-bounce">
//                 <Clock size={48} />
//             </div>
//             <h2 className="text-2xl font-black text-slate-900 mb-3">อยู่ระหว่างการตรวจสอบ</h2>
//             <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed">
//                 ระบบได้รับข้อมูลการลงทะเบียนอาจารย์ของคุณแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัติสิทธิ์การเข้าถึงรายวิชา
//             </p>

//             <button
//                 onClick={() => router.replace('/auth/check')}
//                 className="w-full max-w-xs py-5 bg-white text-slate-900 rounded-3xl font-black text-sm shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all"
//             >
//                 <ArrowLeft size={20} />
//                 ตรวจสอบสถานะอีกครั้ง
//             </button>
//         </div>
//     )
// }

// ver3
"use client"
import React from 'react'
import { Clock, ShieldAlert, ArrowLeft, LogOut, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import liff from '@line/liff'

export default function TeacherPendingPage() {
    const router = useRouter()

    const handleLogout = () => {
        // หากมีการใช้ LIFF ให้ logout ออก
        try {
            if (liff.isLoggedIn()) {
                liff.logout()
            }
        } catch (err) {
            console.error("Logout failed", err)
        }
        router.replace('/')
    }

    return (
        <div className="min-h-screen bg-[#F0F7FF] flex flex-col items-center justify-center p-6 text-center font-sans">
            {/* Icon Box - ใช้สีเหลือง Amber ให้ดูเป็นสถานะรอเหมือนกัน */}
            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-amber-500 mb-8 shadow-xl shadow-indigo-100 animate-pulse relative">
                <Clock size={48} />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <GraduationCap size={16} />
                </div>
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                อยู่ระหว่างการตรวจสอบ
            </h1>

            <p className="text-slate-500 font-medium mb-12 max-w-xs leading-relaxed">
                ระบบได้รับข้อมูลการลงทะเบียนอาจารย์แล้ว! กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัติสิทธิ์การเข้าถึงรายวิชา
            </p>

            <div className="w-full max-w-sm space-y-4">
                {/* Info Card - สไตล์เดียวกับพี่เลี้ยง */}
                <div className="p-6 bg-white rounded-[2rem] border border-white shadow-sm flex items-start gap-4 text-left">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm">การอนุมัติสิทธิ์</p>
                        <p className="text-xs text-slate-400 leading-normal mt-1">
                            เพื่อความถูกต้องของข้อมูลวิชาและนักศึกษา แอดมินจะทำการตรวจสอบและยืนยันกับบัญชีนี้ก่อนเริ่มใช้งาน
                        </p>
                    </div>
                </div>

                {/* Main Action Button */}
                <button
                    onClick={() => router.replace('/auth/check')}
                    className="w-full h-16 bg-white text-slate-900 rounded-[2rem] font-black text-sm shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all border border-white"
                >
                    <ArrowLeft size={18} className="text-indigo-600" />
                    ตรวจสอบสถานะอีกครั้ง
                </button>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="text-slate-400 font-bold text-xs hover:text-rose-500 transition-colors pt-4 flex items-center justify-center gap-2 mx-auto"
                >
                    <LogOut size={14} />
                    ออกจากระบบ
                </button>
            </div>

            {/* Footer Branding */}
            <p className="absolute bottom-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Traditional Medicine Internship Management
            </p>
        </div>
    )
}