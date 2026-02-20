"use client"
import { useRouter } from 'next/navigation'
import { GraduationCap, UserCircle } from 'lucide-react'

export default function SelectRolePage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
            <h1 className="text-2xl font-black text-slate-900 mb-2">เลือกบทบาท</h1>
            <p className="text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest">Select Your Role</p>
            
            <div className="w-full max-w-sm space-y-4">
                {/* ปุ่มเข้าฝั่งอาจารย์ */}
                <button 
                    onClick={() => router.push('/teacher/dashboard')}
                    className="w-full p-6 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center gap-6 active:scale-95 transition-all group hover:border-slate-900"
                >
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                        <GraduationCap size={32} />
                    </div>
                    <div className="text-left">
                        <span className="block font-black text-slate-900 text-lg">อาจารย์</span>
                        <span className="block text-xs font-bold text-slate-400 uppercase">Instructor</span>
                    </div>
                </button>

                {/* ปุ่มเข้าฝั่งพี่เลี้ยง */}
                <button 
                    onClick={() => router.push('/supervisor/dashboard')}
                    className="w-full p-6 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center gap-6 active:scale-95 transition-all group hover:border-emerald-600"
                >
                    <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center">
                        <UserCircle size={32} />
                    </div>
                    <div className="text-left">
                        <span className="block font-black text-slate-900 text-lg">พี่เลี้ยง</span>
                        <span className="block text-xs font-bold text-slate-400 uppercase">Supervisor</span>
                    </div>
                </button>
            </div>
        </div>
    )
}