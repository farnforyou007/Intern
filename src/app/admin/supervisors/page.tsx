"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    UserCheck, ShieldAlert, MapPin, Phone, Trash2,
    Image as ImageIcon, Check, Search, Users,
    Loader2, RefreshCw, MessageCircle, Calendar, User, X
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Swal from 'sweetalert2'
import AdminLayout from '@/components/AdminLayout'
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"

// --- 1. Component: PersonnelDetailModal (แสดงรายละเอียดเมื่อกดดู) ---
function PersonnelDetailModal({ data, isOpen, onClose, onApprove, onDelete }: any) {
    if (!data) return null;
    const isTeacher = data.role === 'teacher';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
                <DialogHeader className="sr-only">
                    <DialogTitle>รายละเอียดบุคลากร: {data.full_name}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    <div className="md:w-5/12 bg-slate-100 relative min-h-[300px]">
                        {data.avatar_url ? (
                            <img src={data.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-300">
                                <ImageIcon size={60} />
                            </div>
                        )}
                        <div className="absolute top-6 left-6">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border ${isTeacher ? 'bg-purple-600/90 text-white' : 'bg-blue-600/90 text-white'}`}>
                                {isTeacher ? 'Faculty Member' : 'Clinical Instructor'}
                            </span>
                        </div>
                    </div>

                    <div className="md:w-7/12 p-10 flex flex-col justify-between bg-white">
                        <div>
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">{data.full_name}</h2>
                                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                    <MessageCircle size={16} fill="currentColor" />
                                    <span>@{data.line_display_name || 'No LINE'}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-500 border border-slate-100">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เบอร์โทรศัพท์</p>
                                        <p className="text-lg font-bold text-slate-700">{data.phone || '-'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-amber-500 border border-slate-100">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หน่วยงาน / แหล่งฝึก</p>
                                        <p className="text-lg font-bold text-slate-700">
                                            {isTeacher ? 'คณะการแพทย์แผนไทย' : (data.training_sites?.site_name || '-')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-3">
                            {!data.is_verified ? (
                                <>
                                    <Button
                                        onClick={() => { onApprove(data.id, data.full_name); onClose(); }}
                                        className="flex-1 bg-slate-900 hover:bg-emerald-600 h-14 rounded-2xl font-black transition-all shadow-lg shadow-slate-200"
                                    >
                                        อนุมัติสิทธิ์
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => { onDelete(data.id, data.full_name); onClose(); }}
                                        className="flex-1 h-14 rounded-2xl text-red-500 border-red-100 hover:bg-red-50 font-bold"
                                    >
                                        ไม่อนุมัติ
                                    </Button>

                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => { onDelete(data.id, data.full_name); onClose(); }}
                                    className="flex-1 h-14 rounded-2xl font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-100"
                                >
                                    ลบข้อมูล
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// --- 2. Component: SupervisorCard (การ์ดรออนุมัติ - 3 Col) ---
function SupervisorCard({ data, onClick }: any) {
    const isTeacher = data.role === 'teacher';
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group cursor-pointer p-7 relative flex flex-col h-full"
        >
            <div className="absolute top-7 right-7">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm uppercase ${isTeacher ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {isTeacher ? 'อาจารย์' : 'พี่เลี้ยง'}
                </span>
            </div>

            <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 overflow-hidden shrink-0 border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                    {data.avatar_url ? (
                        <img src={data.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={28} /></div>
                    )}
                </div>
                <div className="min-w-0 flex-1 pr-14">
                    <h3 className="font-black text-slate-900 text-xl leading-tight truncate">{data.full_name}</h3>
                    <p className="text-emerald-600 text-[11px] font-bold flex items-center gap-1 mt-1">
                        <MessageCircle size={12} fill="currentColor" /> {data.line_display_name || 'no-line'}
                    </p>
                </div>
            </div>

            <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                    <Phone size={14} className="text-blue-500" /> {data.phone || '-'}
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                    <MapPin size={14} className="text-amber-500" />
                    <span className="truncate">{isTeacher ? 'คณะการแพทย์แผนไทย' : (data.training_sites?.site_name || '-')}</span>
                </div>
            </div>

            <Button className="w-full bg-slate-900 hover:bg-blue-600 rounded-xl font-black h-12 mt-auto transition-colors">
                ตรวจสอบข้อมูล
            </Button>
        </div>
    )
}

// --- 3. Component: PersonnelTable (ตารางข้อมูลที่อนุมัติแล้ว) ---
function PersonnelTable({ list, onView, onDelete }: any) {
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อ-สกุล / LINE</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">เบอร์โทรศัพท์</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">หน่วยงาน</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {list.map((item: any) => (
                            <tr key={item.id} onClick={() => onView(item)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                            {item.avatar_url ? <img src={item.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={16} /></div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm leading-tight">{item.full_name}</div>
                                            <div className="text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                                                <MessageCircle size={10} fill="currentColor" /> {item.line_display_name || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3.5">
                                    <div className="text-sm font-medium text-slate-600">{item.phone || '-'}</div>
                                </td>
                                <td className="px-6 py-3.5">
                                    {/* <div className="text-xs font-bold text-slate-500"> */}
                                    <div className="flex items-center gap-3 text-xs font-bold">

                                        <MapPin size={14} className="text-amber-500" />
                                        <span className="truncate ml-1">
                                            {item.role === 'teacher' ? 'Faculty Member' : (item.training_sites?.site_name || '-')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                    <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.full_name); }} className="h-9 w-9 p-0 text-slate-300 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {list.length === 0 && <div className="py-20 text-center text-slate-300 font-bold italic text-sm">ไม่พบข้อมูล</div>}
        </div>
    )
}

// --- 4. Main Admin Page Component ---
export default function AdminManagement() {
    const [allSupervisors, setAllSupervisors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase.from('supervisors').select(`*, training_sites:site_id(site_name)`).order('created_at', { ascending: false })
            if (error) throw error
            setAllSupervisors(data || [])
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const handleApprove = async (id: string, name: string) => {
        const { isConfirmed } = await Swal.fire({

            title: 'อนุมัติสิทธิ์?',
            html: `คุณต้องการอนุมัติคุณ <b>"${name}"</b> `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการอนุมัติ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            reverseButtons: true, // สลับตำแหน่งปุ่มยกเลิกไปไว้ซ้าย ยืนยันไปไว้ขวา
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        })
        if (isConfirmed) {
            const { error } = await supabase.from('supervisors').update({ is_verified: true }).eq('id', id)
            if (!error) { fetchData(); Swal.fire({ icon: 'success', title: 'อนุมัติแล้ว', timer: 1500, showConfirmButton: false }) }
        }
    }

    const handleDelete = async (id: string, name: string) => {
        const { isConfirmed } = await Swal.fire({
            title: 'ยืนยันการลบ?',
            html: `คุณกำลังจะลบ <b>"${name}"</b> ออกจากระบบ`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการลบ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#94a3b8',
            reverseButtons: true, // สลับตำแหน่งปุ่มยกเลิกไปไว้ซ้าย ยืนยันไปไว้ขวา
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        })

        if (isConfirmed) {
            try {
                const { error } = await supabase
                    .from('supervisors')
                    .delete()
                    .eq('id', id)

                if (error) throw error

                // แจ้งเตือนเมื่อลบสำเร็จ
                await Swal.fire({
                    title: 'ลบข้อมูลสำเร็จ',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-[2.5rem] p-10'
                    }
                })

                fetchData() // ดึงข้อมูลใหม่
            } catch (error: any) {
                Swal.fire('เกิดข้อผิดพลาด', error.message, 'error')
            }
        }
    }

    const filteredData = allSupervisors.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.line_display_name && s.line_display_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">

                {/* Header Section (Adjusted Size) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-8">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
                            <Users size={12} /> Personnel Management
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">จัดการบุคลากร</h1>
                        <p className="text-slate-400 text-sm font-medium">จัดการสิทธิ์อาจารย์และพี่เลี้ยงในระบบ</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <Input
                                placeholder="ค้นหาชื่อ, เบอร์โทร..."
                                className="w-full md:w-64 h-11 pl-11 pr-4 rounded-xl bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={fetchData} variant="outline" className="h-11 w-11 rounded-xl shadow-sm bg-white border-slate-200">
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
                        </Button>
                    </div>
                </div>

                {/* Tabs & Content */}
                <Tabs defaultValue="pending">
                    <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-auto mb-8 border border-slate-100 inline-flex shadow-sm">
                        <TabsTrigger value="pending" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm gap-2 transition-all">
                            รออนุมัติ <span className="bg-orange-500 text-white px-2 py-0.5 rounded-md text-[10px]">{filteredData.filter(s => !s.is_verified).length}</span>
                        </TabsTrigger>
                        <TabsTrigger value="teachers" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm transition-all">
                            อาจารย์คณะ
                        </TabsTrigger>
                        <TabsTrigger value="supervisors" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm transition-all">
                            พี่เลี้ยงแหล่งฝึก
                        </TabsTrigger>
                    </TabsList>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="text-sm font-bold">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : (
                        <>
                            <TabsContent value="pending" className="mt-0 focus-visible:ring-0">
                                {filteredData.filter(s => !s.is_verified).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredData.filter(s => !s.is_verified).map(sup => (
                                            <SupervisorCard key={sup.id} data={sup} onClick={() => setSelectedPersonnel(sup)} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                                        <Users size={48} className="mb-3 opacity-20" />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">No pending requests</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="teachers">
                                <PersonnelTable list={filteredData.filter(s => s.is_verified && s.role === 'teacher')} onView={setSelectedPersonnel} onDelete={handleDelete} />
                            </TabsContent>

                            <TabsContent value="supervisors">
                                <PersonnelTable list={filteredData.filter(s => s.is_verified && s.role === 'supervisor')} onView={setSelectedPersonnel} onDelete={handleDelete} />
                            </TabsContent>
                        </>
                    )}
                </Tabs>

                <PersonnelDetailModal
                    data={selectedPersonnel}
                    isOpen={!!selectedPersonnel}
                    onClose={() => setSelectedPersonnel(null)}
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    )
}