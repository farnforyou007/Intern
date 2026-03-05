// "use client"
// import { useState } from 'react'
// import { createBrowserClient } from '@supabase/ssr' // เปลี่ยนมาใช้ตัวนี้
// import { useRouter } from 'next/navigation'
// import Swal from 'sweetalert2'

// export default function LoginPage() {
//     const [email, setEmail] = useState('')
//     const [password, setPassword] = useState('')
//     const [loading, setLoading] = useState(false)
//     const router = useRouter()

//     // สร้าง Client สำหรับ Browser โดยเฉพาะ
//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     const handleLogin = async (e: React.FormEvent) => {
//         e.preventDefault()
//         setLoading(true)

//         const { data, error } = await supabase.auth.signInWithPassword({
//             email,
//             password,
//         })

//         if (error) {
//             Swal.fire('Login Failed', error.message, 'error')
//             setLoading(false)
//             return
//         }

//         Swal.fire({
//             title: 'สำเร็จ',
//             text: 'กำลังเข้าสู่ระบบแอดมิน...',
//             icon: 'success',
//             timer: 1000,
//             showConfirmButton: false
//         })

//         // ใช้ router.refresh ก่อนเพื่อให้ Server รับรู้ Cookie ใหม่
//         router.refresh()

//         // แนะนำใช้ window.location.href สำหรับ Vercel เพื่อความแน่นอนในการบันทึก Cookie
//         setTimeout(() => {
//             window.location.href = '/admin'
//         }, 500)
//     }

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
//             <form onSubmit={handleLogin} className="w-full max-w-md bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
//                 <h1 className="text-3xl font-black text-slate-800 mb-8 text-center">Admin Access</h1>
//                 <div className="space-y-5">
//                     <input
//                         type="email"
//                         placeholder="อีเมลแอดมิน"
//                         className="w-full h-14 px-6 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         required
//                     />
//                     <input
//                         type="password"
//                         placeholder="รหัสผ่าน"
//                         className="w-full h-14 px-6 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                     />
//                     <button
//                         disabled={loading}
//                         className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:bg-slate-300"
//                     >
//                         {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     )
// }


// ----
"use client"
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { Lock, Mail, Loader2 } from 'lucide-react' // แนะนำให้ลง lucide-react เพิ่มครับ
import Link from 'next/link'
export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            Swal.fire({
                title: 'เข้าสู่ระบบไม่สำเร็จ',
                text: error.message,
                icon: 'error',
                confirmButtonColor: '#2563eb'
            })
            setLoading(false)
            return
        }

        Swal.fire({
            title: 'สำเร็จ',
            text: 'ยินดีต้อนรับแอดมิน เข้าสู่ระบบประเมิน...',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        })

        router.refresh()

        setTimeout(() => {
            window.location.href = '/admin'
        }, 800)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] font-sans p-4">
            {/* ตกแต่งพื้นหลังเล็กน้อย */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-50 blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-slate-100 blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative">
                <form onSubmit={handleLogin} className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 backdrop-blur-sm bg-white/90">

                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-blue-600 rounded-3xl rotate-12 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                            <Lock className="text-white w-10 h-10 -rotate-12" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Admin Portal</h1>
                        <p className="text-slate-500 mt-2 text-sm">ระบบประเมินการฝึกงานนักศึกษาแพทย์แผนไทย</p>
                    </div>

                    <div className="space-y-4">
                        {/* Email Input */}
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="email"
                                placeholder="อีเมล"
                                className="w-full h-14 pl-14 pr-6 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-700"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="password"
                                placeholder="รหัสผ่าน"
                                className="w-full h-14 pl-14 pr-6 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-700"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {/* Login Button */}
                        <button
                            disabled={loading}
                            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:bg-slate-300 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>กำลังตรวจสอบข้อมูล...</span>
                                </>
                            ) : (
                                'เข้าสู่ระบบ'
                            )}
                        </button>
                    </div>
                    <div className="text-center mt-6">
                        <Link
                            href="/forgot-password"
                            className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                        >
                            ลืมรหัสผ่านใช่หรือไม่?
                        </Link>
                    </div>

                    {/* Footer Info */}
                    <p className="text-center text-slate-400 text-xs mt-10">
                        © 2026 คณะการแพทย์แผนไทย <br />
                        มหาวิทยาลัยสงขลานครินทร์
                    </p>
                </form>
            </div>
        </div>
    )
}