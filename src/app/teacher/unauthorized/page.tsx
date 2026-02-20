"use client"
import { ShieldAlert, ArrowLeft, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TeacherUnauthorized() {
    const router = useRouter()

    return (
        <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F0F7FF]">
            {/* Icon Box */}
            <div className="w-24 h-24 bg-white text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100 animate-in zoom-in duration-500">
                <ShieldAlert size={48} />
            </div>

            {/* Content */}
            <h2 className="text-2xl font-black text-slate-900 mb-3">ไม่พบข้อมูลรายวิชา</h2>
            <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed">
                บัญชีของคุณได้รับการอนุมัติแล้ว แต่ยังไม่มีการมอบหมายรายวิชาที่รับผิดชอบในระบบ กรุณาติดต่อเจ้าหน้าที่เพื่อผูกข้อมูลรายวิชา
            </p>

            {/* Action Buttons */}
            <div className="w-full max-w-xs space-y-4">
                <button
                    onClick={() => router.replace('/auth/check')}
                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <ArrowLeft size={20} />
                    ตรวจสอบสิทธิ์อีกครั้ง
                </button>

                <a 
                    href="https://line.me/ti/p/@your-admin-id" // ลิงก์ติดต่อแอดมิน
                    className="w-full py-5 bg-white text-slate-900 rounded-3xl font-black text-sm shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all border border-slate-100"
                >
                    <MessageCircle size={20} className="text-emerald-500" />
                    ติดต่อเจ้าหน้าที่ (Admin)
                </a>
            </div>

            {/* Footer */}
            <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                TTMED Internships Management
            </p>
        </div>
    )
}