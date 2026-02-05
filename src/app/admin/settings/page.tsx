"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Key, Save, RefreshCw, Settings, ShieldCheck } from 'lucide-react'
import Swal from 'sweetalert2'
import AdminLayout from '@/components/AdminLayout'

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState('invite-code')
    const [teacherCode, setTeacherCode] = useState('')
    const [loading, setLoading] = useState(false)
    
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        async function fetchConfig() {
            const { data } = await supabase
                .from('system_configs')
                .select('key_value')
                .eq('key_name', 'teacher_invite_code')
                .single()
            if (data) setTeacherCode(data.key_value)
        }
        fetchConfig()
    }, [])

    const handleUpdateCode = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('system_configs')
            .update({ key_value: teacherCode })
            .eq('key_name', 'teacher_invite_code')

        if (error) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message })
        } else {
            Swal.fire({ 
                icon: 'success', 
                title: 'บันทึกสำเร็จ', 
                text: 'อัปเดตรหัสเชิญอาจารย์เรียบร้อยแล้ว',
                customClass: { popup: 'rounded-[2rem]' }
            })
        }
        setLoading(false)
    }

    return (
                <AdminLayout>
        
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800">ตั้งค่าระบบ</h1>
                <p className="text-slate-500">จัดการข้อมูลพื้นฐานและรหัสความปลอดภัยของระบบ</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
                <button 
                    onClick={() => setActiveTab('invite-code')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'invite-code' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ShieldCheck size={18} />
                    รหัสเชิญ (Invite Codes)
                </button>
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Settings size={18} />
                    ตั้งค่าทั่วไป
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-sm border border-slate-100">
                {activeTab === 'invite-code' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <Key size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800">รหัสเชิญอาจารย์</h2>
                                <p className="text-slate-500 text-sm">ใช้สำหรับให้อาจารย์ลงทะเบียนเพื่อเข้าดูผลการฝึกประสบการณ์</p>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-700 ml-1">รหัสปัจจุบัน (Invite Code)</label>
                                <input 
                                    type="text"
                                    className="w-full h-16 px-8 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-2xl font-mono tracking-[0.2em] text-blue-600"
                                    value={teacherCode}
                                    onChange={(e) => setTeacherCode(e.target.value)}
                                    placeholder="เช่น TCM-TEACHER-2026"
                                />
                            </div>

                            <button 
                                onClick={handleUpdateCode}
                                disabled={loading}
                                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-95 disabled:bg-slate-300 shadow-lg shadow-slate-200"
                            >
                                {loading ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                                บันทึกรหัสเชิญใหม่
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'general' && (
                    <div className="py-20 text-center space-y-4 animate-in fade-in duration-500">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <Settings size={40} />
                        </div>
                        <p className="text-slate-400 font-medium">กำลังพัฒนาส่วนตั้งค่าทั่วไป (เช่น ปีการศึกษา, รอบการฝึก)</p>
                    </div>
                )}
            </div>
        </div>
        </AdminLayout>
    )
}