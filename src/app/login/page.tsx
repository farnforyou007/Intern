"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // เรียกใช้ Supabase Client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    // แก้ไขส่วน handleLogin ใน page.tsx
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            Swal.fire('Login Failed', error.message, 'error')
            setLoading(false)
            return
        }

        // ล็อกอินสำเร็จ
        Swal.fire({
            title: 'สำเร็จ',
            text: 'กำลังเข้าสู่ระบบแอดมิน...',
            icon: 'success',
            timer: 1000,
            showConfirmButton: false
        })

        // บังคับรีโหลดหน้าไปยังหน้าจัดการพี่เลี้ยง 
        // วิธีนี้จะช่วยให้ Middleware เห็น Cookie แน่นอน
        window.location.assign('/admin/supervisors')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
            <form onSubmit={handleLogin} className="w-full max-w-md bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
                <h1 className="text-3xl font-black text-slate-800 mb-8 text-center">Admin Access</h1>
                <div className="space-y-5">
                    <input
                        type="email"
                        placeholder="อีเมลแอดมิน"
                        className="w-full h-14 px-6 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="รหัสผ่าน"
                        className="w-full h-14 px-6 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        disabled={loading}
                        className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:bg-slate-300"
                    >
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </div>
            </form>
        </div>
    )
}