// app/update-password/page.tsx
"use client"
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { Lock, Loader2 } from 'lucide-react'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            Swal.fire('Error', error.message, 'error')
        } else {
            await Swal.fire('สำเร็จ', 'รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว', 'success')
            router.push('/auth/login')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
            <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">ตั้งรหัสผ่านใหม่</h1>
                    <p className="text-slate-500 text-sm mt-2">กรุณาระบุรหัสผ่านใหม่ที่ต้องการใช้งาน</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5">
                    <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="password"
                            placeholder="รหัสผ่านใหม่"
                            className="w-full h-14 pl-14 pr-6 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all disabled:bg-slate-300 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'ยืนยันรหัสผ่านใหม่'}
                    </button>
                </form>
            </div>
        </div>
    )
}