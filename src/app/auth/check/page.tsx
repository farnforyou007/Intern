// ver2
"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import liff from '@line/liff'

export default function AuthCheckPage() {
    const router = useRouter()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // ใช้แค่ loading เพราะหน้านี้ทำหน้าที่เป็น Router เฉยๆ
    const [status, setStatus] = useState<'loading' | 'authorized'>('loading')
    const [showTroubleshoot, setShowTroubleshoot] = useState(false)

    // ฟังก์ชันเคลียร์คุกกี้และ Storage ทั้งหมด
    const performFullCleanup = async () => {
        localStorage.clear();
        sessionStorage.clear();
        try {
            await Promise.race([
                supabase.auth.signOut({ scope: 'local' }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
            ]);
        } catch (e) {
            console.warn("Cleanup signout skipped:", e);
        }
        window.location.href = '/';
    }

    useEffect(() => {
        let hangTimer: NodeJS.Timeout;
        const checkAuth = async () => {
            // เริ่มนับเวลาถอยหลัง 8 วินาที (หน้านี้อาจจะรวม LIFF เลยให้นานกว่านิดนึง)
            hangTimer = setTimeout(() => setShowTroubleshoot(true), 8000);

            try {
                // 🚀 1. เช็ก Cache ก่อน ถ้าเคยเข้าแล้วให้ดีดไปหน้า Dashboard เลย
                const cachedSupervisor = sessionStorage.getItem('supervisor_auth_status');
                const cachedTeacher = sessionStorage.getItem('teacher_auth_status');

                if (cachedSupervisor === 'authorized') {
                    router.replace('/supervisor/dashboard');
                    return;
                }
                if (cachedTeacher === 'authorized') {
                    router.replace('/teacher/dashboard');
                    return;
                }

                // 🌐 2. เริ่มต้น LIFF (พร้อม Timeout)
                await Promise.race([
                    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('LIFF init timeout')), 5000))
                ]);

                if (!liff.isLoggedIn()) {
                    liff.login({ redirectUri: window.location.href });
                    return;
                }

                const profile = await Promise.race([
                    liff.getProfile(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('LIFF profile timeout')), 4000))
                ]) as any;
                const lineUserId = profile.userId;

                // 🗄️ 3. ดึงข้อมูลจาก Database (พร้อม Timeout)
                const { data: user, error } = await Promise.race([
                    supabase
                        .from('supervisors')
                        .select(`
                            id, role, is_verified,
                            supervisor_subjects(id)
                        `)
                        .eq('line_user_id', lineUserId)
                        .maybeSingle(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('DB Query timeout')), 5000))
                ]) as any;

                // 🚫 4. กรณีไม่มีข้อมูล User
                if (!user || error) {
                    router.replace('/register');
                    return;
                }

                // ⏳ 5. กรณีมีข้อมูลแต่ยังไม่อนุมัติ
                if (!user.is_verified) {
                    if (user.role === 'teacher') {
                        router.replace('/teacher/pending');
                    } else {
                        router.replace('/supervisor/pending');
                    }
                    return;
                }

                // ✅ 6. อนุมัติแล้ว -> ตรวจสอบเงื่อนไขวิชา
                const hasSubject = user.supervisor_subjects && user.supervisor_subjects.length > 0;
                
                // แยก Logic ตาม Role
                if (user.role === 'teacher') {
                    if (hasSubject) {
                        sessionStorage.setItem('teacher_auth_status', 'authorized');
                        router.replace('/teacher/dashboard');
                    } else {
                        router.replace('/teacher/unauthorized');
                    }
                } else {
                    sessionStorage.setItem('supervisor_auth_status', 'authorized');
                    router.replace('/supervisor/dashboard');
                }

            } catch (err) {
                console.error("Auth Check Error:", err);
                router.replace('/register');
            } finally {
                clearTimeout(hangTimer);
            }
        };

        checkAuth();
        return () => clearTimeout(hangTimer);
    }, [router, supabase]);

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#064e3b] rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative flex flex-col items-center">
                <div className="relative w-24 h-24 mb-10">
                    {/* Ring animation */}
                    <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-[#064e3b] animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-t-emerald-400 animate-[spin_0.8s_linear_infinite]"></div>
                    
                    {/* Center dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-[#064e3b] rounded-full animate-ping"></div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] ml-[0.3em]">
                        กำลังเข้าสู่ระบบ
                    </h2>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            กรุณารอซักครู่...
                        </span>
                        <span className="flex gap-0.5">
                            <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_100ms]"></span>
                            <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                            <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_300ms]"></span>
                        </span>
                    </div>
                </div>

                {/* Troubleshooting Area */}
                {showTroubleshoot && (
                    <div className="mt-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 px-6">
                        <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 max-w-xs w-full text-center shadow-sm">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                                พบปัญหาในการเชื่อมต่อ?
                            </p>
                            <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                                หากค้างหน้านี้นานเกินไป อาจเกิดจากเซสชั่นเดิมหมดอายุหรือการเชื่อมต่อ LINE มีปัญหา
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    ลองโหลดใหม่
                                </button>
                                <button
                                    onClick={performFullCleanup}
                                    className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                >
                                    ออกจากระบบและเริ่มใหม่
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <p className="absolute bottom-10 text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
                TTMED Internships Management System
            </p>
        </div>
    );
}