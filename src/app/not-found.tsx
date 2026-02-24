"use client"
import Link from 'next/link'
import { LayoutDashboard, AlertCircle , ArrowLeft} from 'lucide-react'
import { useRouter } from 'next/navigation'


export default function NotFound() {
    const router = useRouter()  
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex justify-center">
                    <div className="p-4 bg-rose-50 rounded-2xl">
                        <AlertCircle size={48} className="text-rose-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-6xl font-black text-slate-900">404</h1>
                    <h2 className="text-xl font-bold text-slate-700 uppercase tracking-tight">ไม่พบหน้าที่คุณต้องการ</h2>
                    <p className="text-slate-400 text-sm font-medium">
                        ขออภัย ไม่พบหน้าที่คุณกำลังมองหา หรือหน้านี้อาจจะถูกลบไปแล้ว
                    </p>
                </div>

                <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all active:scale-[0.98]"
                >
                    <ArrowLeft size={18} />
                    ย้อนกลับ
                </button>
            </div>
        </div>
    )
}