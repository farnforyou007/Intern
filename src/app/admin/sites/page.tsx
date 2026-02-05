"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Hospital, Edit2, Trash2, Copy, RefreshCw } from "lucide-react"
import Swal from 'sweetalert2'

export default function SitesPage() {
    const [sites, setSites] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSite, setSelectedSite] = useState<any>(null)
    const [siteName, setSiteName] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const fetchData = async () => {
        setLoading(true)
        const { data } = await supabase.from('training_sites').select('*').order('id', { ascending: false })
        if (data) setSites(data)
        setLoading(false)
    }

    // ฟังก์ชันก๊อปปี้รหัส
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code)
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
        })
        Toast.fire({
            icon: 'success',
            title: 'คัดลอกรหัส Invite แล้ว',
            customClass: { popup: 'rounded-xl font-sans' }
        })
    }

    // ฟังก์ชันรีเซ็ตรหัสสุ่มใหม่
    const handleResetInvite = (site: any) => {
        Swal.fire({
            title: 'สุ่มรหัสใหม่?',
            html: `ต้องการเปลี่ยนรหัสสำหรับ <b>"${site.site_name}"</b> หรือไม่?<br><small>รหัสใหม่จะเป็นภาษาอังกฤษเพื่อความเสถียร</small>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการเปลี่ยน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#2563eb',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                // ใช้ฟังก์ชัน generate ที่เป็นภาษาอังกฤษเท่านั้น
                const newCode = generateEnglishCode();
                const { error } = await supabase.from('training_sites').update({ invite_code: newCode }).eq('id', site.id)
                if (!error) {
                    Swal.fire({
                        title: 'สำเร็จ!',
                        text: `รหัสใหม่คือ: ${newCode}`,
                        icon: 'success',
                        customClass: { popup: 'rounded-[2rem] font-sans' }
                    })
                    fetchData()
                }
            }
        })
    }

    // ฟังก์ชันลบ
    const handleDelete = (site: any) => {
        Swal.fire({
            title: 'ยืนยันการลบ?',
            html: `คุณกำลังจะลบ <b>"${site.site_name}"</b>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการลบ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#94a3b8',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await supabase.from('training_sites').delete().eq('id', site.id)
                fetchData()
            }
        })
    }

    const generateEnglishCode = () => {
        // ใช้ Prefix เป็น SITE หรือ TCM เพื่อความเสถียร
        const prefix = "SITE";
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}-${randomNum}`;
    }

    const handleSave = async () => {
        if (!siteName) return;
        if (selectedSite?.id) {
            // แก้ไข: เพิ่มฟิลด์ inviteCode เข้าไปด้วยเพื่อให้แก้ไขรหัสได้จากหน้า Modal
            await supabase.from('training_sites')
                .update({ site_name: siteName, invite_code: inviteCode })
                .eq('id', selectedSite.id);
        } else {
            // เพิ่มใหม่: ใช้รหัสภาษาอังกฤษ
            const code = generateEnglishCode(siteName);
            await supabase.from('training_sites').insert([{ site_name: siteName, invite_code: code }]);
        }
        setSiteName(''); setSelectedSite(null); setIsModalOpen(false); fetchData()
    }

    useEffect(() => { fetchData() }, [])

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 px-2 sm:px-0">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-slate-900">
                            <Hospital className="text-blue-600" /> สถานที่ฝึกงาน
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm sm:text-base italic font-sans">จัดการรายชื่อและรหัสเข้าถึงสำหรับพี่เลี้ยง</p>
                    </div>
                    <Button onClick={() => { setSelectedSite(null); setSiteName(''); setIsModalOpen(true); }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 rounded-xl h-12 shadow-lg transition-transform active:scale-95">
                        <Plus size={20} className="mr-2" /> เพิ่มแหล่งฝึกใหม่
                    </Button>
                </div>

                <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mx-2 sm:mx-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="px-4 lg:px-8 font-bold">ชื่อโรงพยาบาล</TableHead>
                                    <TableHead className="text-center font-bold">Invite Code</TableHead>
                                    <TableHead className="text-right px-4 lg:px-8 font-bold">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={3} className="p-4"><Skeleton className="h-12 w-full rounded-xl" /></TableCell></TableRow>
                                    ))
                                ) : (
                                    sites.map((site) => (
                                        <TableRow key={site.id} className="hover:bg-slate-50/30">
                                            <TableCell className="px-4 lg:px-8 py-5">
                                                <div className="font-bold text-slate-800 text-base sm:text-lg">{site.site_name}</div>
                                                <div className="text-[10px] sm:text-xs text-slate-400 font-sans tracking-tighter">ID: {site.id} • บันทึกเมื่อ {new Date(site.created_at).toLocaleDateString('th-TH')}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 p-2 sm:px-3 sm:py-2 rounded-xl border border-blue-100">
                                                    <span className="font-mono font-bold text-xs sm:text-sm">{site.invite_code}</span>
                                                    <div className="flex items-center border-l border-blue-200 ml-1 pl-2 gap-2">
                                                        <button onClick={() => handleCopy(site.invite_code)} className="hover:text-blue-900 transition-colors" title="คัดลอก">
                                                            <Copy size={14} />
                                                        </button>
                                                        <button onClick={() => handleResetInvite(site)} className="hover:text-blue-900 transition-colors" title="สุ่มรหัสใหม่">
                                                            <RefreshCw size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-4 lg:px-8">
                                                <div className="flex justify-end gap-1 sm:gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedSite(site); setSiteName(site.site_name); setIsModalOpen(true); }}>
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 text-red-600 hover:bg-red-50" onClick={() => handleDelete(site)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[92%] max-w-[400px] rounded-[2rem] border-none p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-800 mb-2">
                            {selectedSite ? 'แก้ไขแหล่งฝึก' : 'เพิ่มแหล่งฝึกใหม่'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 ml-1 uppercase">ชื่อโรงพยาบาล</label>
                            <Input
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                placeholder="เช่น รพ.ยะลา"
                                className="h-14 rounded-2xl text-lg border-slate-200"
                            />
                        </div>

                        {/* เพิ่มช่องแก้ไขรหัสเชิญ */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 ml-1 uppercase">รหัสเชิญ (Invite Code)</label>
                            <Input
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())} // บังคับตัวพิมพ์ใหญ่
                                placeholder="เช่น YALA-2026"
                                className="h-14 rounded-2xl text-lg font-mono border-slate-200 text-blue-600 font-bold"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">* แนะนำใช้ภาษาอังกฤษและตัวเลขเพื่อความเสถียร</p>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button onClick={handleSave} className="w-full bg-blue-600 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                            บันทึกข้อมูล
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}