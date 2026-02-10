"use client"
import React from 'react'
import { Clock, ShieldAlert, ArrowLeft, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import liff from '@line/liff'
import { createBrowserClient } from '@supabase/ssr'

export default function PendingPage() {
    const router = useRouter()

    const handleLogout = () => {
        liff.logout()
        router.replace('/')
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
            <div className="w-24 h-24 bg-amber-100 rounded-[2.5rem] flex items-center justify-center text-amber-600 mb-8 animate-pulse">
                <Clock size={48} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                รอการยืนยันตัวตน
            </h1>

            <p className="text-slate-500 font-medium mb-12 max-w-xs leading-relaxed">
                ลงทะเบียนสำเร็จแล้ว! ขณะนี้ข้อมูลของคุณอยู่ระหว่างการตรวจสอบโดยผู้ดูแลระบบ (Admin)
            </p>

            <div className="w-full max-w-sm space-y-4">
                <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-start gap-4 text-left">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm">ทำไมต้องรอ?</p>
                        <p className="text-xs text-slate-400 leading-normal mt-1">
                            เพื่อความปลอดภัยของข้อมูลนักศึกษา ระบบจำเป็นต้องให้แอดมินตรวจสอบสิทธิ์ของพี่เลี้ยงก่อนเริ่มใช้งาน
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => router.replace('/')}
                    className="w-full h-16 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <ArrowLeft size={18} />
                    กลับหน้าหลัก
                </button>

                <button
                    onClick={handleLogout}
                    className="text-slate-400 font-bold text-xs hover:text-rose-500 transition-colors pt-4"
                >
                    ออกจากระบบ
                </button>
            </div>

            <p className="absolute bottom-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Traditional Medicine Intern Management
            </p>
        </div>
    )
}