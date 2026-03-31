

// version API Routes Migration
"use client"
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Plus, Edit2, Trash2, MapPin, Search, X,
    Hospital, CalendarDays, ChevronRight, ChevronLeft,
    FileText, StickyNote, EyeOff, Eye
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import Swal from 'sweetalert2'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
// รายชื่อจังหวัดคงเดิม
const THAI_PROVINCES = [
    { name: "กรุงเทพมหานคร", code: "BKK" }, { name: "กระบี่", code: "KBI" }, { name: "กาญจนบุรี", code: "KNR" },
    { name: "กาฬสินธุ์", code: "KSN" }, { name: "กำแพงเพชร", code: "KPT" }, { name: "ขอนแก่น", code: "KKN" },
    { name: "จันทบุรี", code: "CTI" }, { name: "ฉะเชิงเทรา", code: "CCO" }, { name: "ชลบุรี", code: "CBI" },
    { name: "ชัยนาท", code: "CNT" }, { name: "ชัยภูมิ", code: "CPM" }, { name: "ชุมพร", code: "CPN" },
    { name: "เชียงราย", code: "CRI" }, { name: "เชียงใหม่", code: "CNX" }, { name: "ตรัง", code: "TRG" },
    { name: "ตราด", code: "TRT" }, { name: "ตาก", code: "TAK" }, { name: "นครนายก", code: "NYK" },
    { name: "นครปฐม", code: "NPT" }, { name: "นครพนม", code: "NPM" }, { name: "นครราชสีมา", code: "NMA" },
    { name: "นครศรีธรรมราช", code: "NRT" }, { name: "นครสวรรค์", code: "NSN" }, { name: "นนทบุรี", code: "NON" },
    { name: "นราธิวาส", code: "NWT" }, { name: "น่าน", code: "NAN" }, { name: "บึงกาฬ", code: "BKN" },
    { name: "บุรีรัมย์", code: "BRM" }, { name: "ปทุมธานี", code: "PTE" }, { name: "ประจวบคีรีขันธ์", code: "PKN" },
    { name: "ปราจีนบุรี", code: "PRI" }, { name: "ปัตตานี", code: "PTN" }, { name: "พระนครศรีอยุธยา", code: "AYA" },
    { name: "พะเยา", code: "PYO" }, { name: "พังงา", code: "PNA" }, { name: "พัทลุง", code: "PLG" },
    { name: "พิจิตร", code: "PCT" }, { name: "พิษณุโลก", code: "PLK" }, { name: "เพชรบุรี", code: "PBI" },
    { name: "เพชรบูรณ์", code: "PNB" }, { name: "แพร่", code: "PRE" }, { name: "ภูเก็ต", code: "HKT" },
    { name: "มหาสารคาม", code: "MSK" }, { name: "มุกดาหาร", code: "MDH" }, { name: "แม่ฮ่องสอน", code: "MSN" },
    { name: "ยโสธร", code: "YST" }, { name: "ยะลา", code: "YLA" }, { name: "ร้อยเอ็ด", code: "RET" },
    { name: "ระนอง", code: "RNG" }, { name: "ระยอง", code: "RYG" }, { name: "ราชบุรี", code: "RBR" },
    { name: "ลพบุรี", code: "LBR" }, { name: "ลำปาง", code: "LPG" }, { name: "ลำพูน", code: "LPN" },
    { name: "เลย", code: "LOE" }, { name: "ศรีสะเกษ", code: "SSK" }, { name: "สกลนคร", code: "SNK" },
    { name: "สงขลา", code: "SKA" }, { name: "สตูล", code: "STN" }, { name: "สมุทรปราการ", code: "SPK" },
    { name: "สมุทรสงคราม", code: "SKM" }, { name: "สมุทรสาคร", code: "SKN" }, { name: "สระแก้ว", code: "SKW" },
    { name: "สระบุรี", code: "SRI" }, { name: "สิงห์บุรี", code: "SBR" }, { name: "สุโขทัย", code: "STI" },
    { name: "สุพรรณบุรี", code: "SPB" }, { name: "สุราษฎร์ธานี", code: "URT" }, { name: "สุรินทร์", code: "SRN" },
    { name: "หนองคาย", code: "NKI" }, { name: "หนองบัวลำภู", code: "NBP" }, { name: "อ่างทอง", code: "ATG" },
    { name: "อำนาจเจริญ", code: "ACR" }, { name: "อุดรธานี", code: "UTH" }, { name: "อุตรดิตถ์", code: "UTD" },
    { name: "อุทัยธานี", code: "UTI" }, { name: "อุบลราชธานี", code: "UBN" }
];

export default function SitesPageV2() {
    const [sites, setSites] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSite, setSelectedSite] = useState<any>(null)
    const [siteName, setSiteName] = useState('')
    const [inviteCode, setInviteCode] = useState('') // ยังเก็บไว้ใน background
    const [province, setProvince] = useState('')
    const [note, setNote] = useState('') // เพิ่ม state หมายเหตุ
    const [provinceSearch, setProvinceSearch] = useState('')
    const [isHidden, setIsHidden] = useState(false)
    const [errors, setErrors] = useState({
        siteName: false,
        province: false
    })

    const [selectedProvinceFilter, setSelectedProvinceFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    // const [currentPage, setCurrentPage] = useState(1)
    // const rowsPerPage = 10 
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const usedProvinces = Array.from(new Set(sites.map(s => s.province))).filter(Boolean).sort()

    const filteredSites = sites.filter(site => {
        const matchesProvince = selectedProvinceFilter === 'all' || site.province === selectedProvinceFilter
        const matchesSearch =
            site.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (site.note || '').toLowerCase().includes(searchTerm.toLowerCase())
        return matchesProvince && matchesSearch
    }).sort((a, b) => {
        // เรียงตามจังหวัด (ภาษาไทย)
        const provA = a.province || '';
        const provB = b.province || '';
        return provA.localeCompare(provB, 'th');
    })

    const totalPages = Math.ceil(filteredSites.length / rowsPerPage)
    const startIndex = (currentPage - 1) * rowsPerPage
    const paginatedSites = filteredSites.slice(startIndex, startIndex + rowsPerPage)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, selectedProvinceFilter, rowsPerPage])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/sites')
            const result = await res.json()
            if (!result.success) throw new Error(result.error)
            setSites(result.data.sites || [])
        } catch (err: any) {
            console.error('Fetch sites error:', err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const generateSuffix = () => Math.floor(1000 + Math.random() * 9000).toString();

    const getNewCode = (provName: string) => {
        const p = THAI_PROVINCES.find(x => x.name === provName);
        const prefix = p ? p.code : 'SITE';
        return `${prefix}-${generateSuffix()}`;
    }

    const handleSelectProvince = (p: { name: string, code: string }) => {
        setProvince(p.name);
        setProvinceSearch('');
        // Gen code ทิ้งไว้ใน background
        setInviteCode(`${p.code}-${generateSuffix()}`);
        if (errors.province) setErrors({ ...errors, province: false });
    }

    const onOpenModal = (site: any = null) => {
        if (site) {
            setSelectedSite(site);
            setSiteName(site.site_name);
            setInviteCode(site.invite_code || '');
            setProvince(site.province || '');
            setNote(site.note || '');
            setIsHidden(site.is_hidden || false);
        } else {
            setSelectedSite(null);
            setSiteName('');
            setInviteCode('');
            setProvince('');
            setNote('');
            setIsHidden(false);
        }
        setProvinceSearch('');
        setErrors({ siteName: false, province: false });
        setIsModalOpen(true);
    }

    const handleSave = async () => {
        const newErrors = {
            siteName: !siteName,
            province: !province
        };

        setErrors(newErrors);
        if (newErrors.siteName || newErrors.province) return;

        const payload = {
            site_name: siteName,
            invite_code: inviteCode || 'PENDING', // ใส่ค่า default ถ้ายังไม่มี
            province: province,
            note: note,
            is_hidden: isHidden
        }

        try {
            const res = await fetch('/api/admin/sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    siteId: selectedSite?.id || null,
                    payload
                })
            })
            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            setIsModalOpen(false);
            fetchData();
            Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false });
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        }
    }

    const handleDelete = async (site: any) => {
        const { isConfirmed } = await Swal.fire({
            title: 'ยืนยันการลบ?',
            html: `คุณกำลังจะลบแหล่งฝึก <b>"${site.site_name}"</b>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ยืนยันการลบ',
            cancelButtonText: 'ยกเลิก',
        })

        if (isConfirmed) {
            try {
                const res = await fetch('/api/admin/sites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id: site.id })
                })
                const result = await res.json()
                if (!result.success) throw new Error(result.error)

                setSites(prev => prev.filter(item => item.id !== site.id))
                Swal.fire({ icon: 'success', title: 'ลบข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false })
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error')
            }
        }
    }

    const handleToggleHide = async (site: any) => {
        const newStatus = !site.is_hidden;
        try {
            const res = await fetch('/api/admin/sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    siteId: site.id,
                    payload: { is_hidden: newStatus }
                })
            })
            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            setSites(prev => prev.map(item =>
                item.id === site.id ? { ...item, is_hidden: newStatus } : item
            ))
            Swal.fire({
                icon: 'success',
                title: newStatus ? 'ซ่อนแหล่งฝึกแล้ว' : 'แสดงแหล่งฝึกแล้ว',
                timer: 1000,
                showConfirmButton: false
            })
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        }
    }

    const filteredProvinces = THAI_PROVINCES.filter(p => p.name.includes(provinceSearch));

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto p-4 space-y-6 font-sans">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3 text-slate-900">
                            <Hospital className="text-blue-600" /> แหล่งฝึกงาน
                            {/* <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full uppercase tracking-tighter"></span> */}
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium text-sm">จัดการหน่วยงานฝึกงานและข้อมูลหมายเหตุประกอบ</p>
                    </div>
                    <Button onClick={() => onOpenModal()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 rounded-xl h-12 shadow-lg font-bold">
                        <Plus size={20} className="mr-2" /> เพิ่มแหล่งฝึกใหม่
                    </Button>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/50 backdrop-blur-md p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:w-64">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            className="w-full h-12 pl-12 pr-4 rounded-xl border-none bg-white shadow-sm font-bold text-sm focus:ring-2 ring-blue-500 outline-none appearance-none cursor-pointer"
                            value={selectedProvinceFilter}
                            onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                        >
                            <option value="all">ทุกจังหวัด</option>
                            {usedProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="ค้นหาชื่อแหล่งฝึก หรือ หมายเหตุ..."
                            className="h-12 pl-12 rounded-xl border-none bg-white shadow-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 w-1/2">ชื่อหน่วยงาน / รายละเอียด</TableHead>
                                <TableHead className="text-left font-black text-[10px] uppercase tracking-widest text-slate-400">หมายเหตุ / ข้อมูลเพิ่มเติม</TableHead>
                                <TableHead className="text-right px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={3} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></TableCell></TableRow>
                                ))
                            ) : paginatedSites.length > 0 ? (
                                paginatedSites.map((site) => (
                                    <TableRow key={site.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <TableCell className="px-8 py-5">
                                            <div className="font-bold text-slate-800 text-lg leading-tight">{site.site_name}</div>
                                            <div className="flex items-center gap-4 mt-1.5">
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <MapPin size={13} className="text-amber-500" />
                                                    <span className="text-[11px] font-bold text-slate-500">{site.province || 'ไม่ระบุจังหวัด'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-400 border-l pl-4">
                                                    <CalendarDays size={13} className="text-blue-400" />
                                                    <span className="text-[11px] font-bold text-slate-500">
                                                        {new Date(site.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <StickyNote size={14} className="text-slate-300 shrink-0" />
                                                <span className="text-sm font-medium line-clamp-1 italic">
                                                    {site.note || '- ไม่มีหมายเหตุ -'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-blue-600 rounded-xl" onClick={() => onOpenModal(site)}>
                                                    <Edit2 size={18} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-red-600 rounded-xl" onClick={() => handleDelete(site)}>
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="p-20 text-center text-slate-400 italic font-bold">ไม่พบข้อมูลแหล่งฝึกงาน</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    
                    {filteredSites.length > 0 && (
                        <div className="px-8 py-6 bg-slate-50/30 border-t flex justify-between items-center">
                            <p className="text-xs font-bold text-slate-400 italic">
                                แสดง {startIndex + 1} - {Math.min(startIndex + rowsPerPage, filteredSites.length)} จาก {filteredSites.length} รายการ
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="rounded-xl h-9" onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}><ChevronLeft size={16}/></Button>
                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button key={i} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i+1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>{i+1}</button>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" className="rounded-xl h-9" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages}><ChevronRight size={16}/></Button>
                            </div>
                        </div>
                    )}
                </div>
            </div> */}

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 w-1/2">ชื่อหน่วยงาน / รายละเอียด</TableHead>
                                <TableHead className="text-left font-black text-[10px] uppercase tracking-widest text-slate-400">หมายเหตุ / ข้อมูลเพิ่มเติม</TableHead>
                                <TableHead className="text-right px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={3} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></TableCell></TableRow>
                                ))
                            ) : paginatedSites.length > 0 ? (
                                paginatedSites.map((site) => (
                                    <TableRow key={site.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <TableCell className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="font-bold text-slate-800 text-lg leading-tight">{site.site_name}</div>
                                                {site.is_hidden && (
                                                    <Badge variant="secondary" className="bg-amber-100 text-amber-600 border-none font-bold text-[10px] uppercase flex gap-1 items-center">
                                                        <EyeOff size={10} /> Hidden
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1.5">
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <MapPin size={13} className="text-amber-500" />
                                                    <span className="text-[11px] font-bold text-slate-500">{site.province || 'ไม่ระบุจังหวัด'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-400 border-l pl-4">
                                                    <CalendarDays size={13} className="text-blue-400" />
                                                    <span className="text-[11px] font-bold text-slate-500">
                                                        {new Date(site.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <StickyNote size={14} className="text-slate-300 shrink-0" />
                                                <span className="text-sm font-medium line-clamp-1 italic">
                                                    {site.note || '- ไม่มีหมายเหตุ -'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="flex justify-end gap-1">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-10 w-10 rounded-xl transition-colors ${site.is_hidden ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
                                                                onClick={() => handleToggleHide(site)}
                                                            >
                                                                {site.is_hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="font-bold text-xs">
                                                            {site.is_hidden ? 'แสดงแหล่งฝึก' : 'ซ่อนแหล่งฝึก'}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-blue-600 rounded-xl" onClick={() => onOpenModal(site)}>
                                                    <Edit2 size={18} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-red-600 rounded-xl" onClick={() => handleDelete(site)}>
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="p-20 text-center text-slate-400 italic font-bold">ไม่พบข้อมูลแหล่งฝึกงาน</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* 3. Pagination Footer พร้อมตัวเลือกจำนวนแถว */}
                    {filteredSites.length > 0 && (
                        <div className="px-8 py-6 bg-slate-50/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">แสดงแถว:</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                    className="bg-white border-none shadow-sm rounded-xl px-3 py-1.5 text-xs font-black text-slate-600 outline-none focus:ring-2 ring-blue-500 cursor-pointer transition-all hover:shadow-md"
                                >
                                    {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
                                </select>
                                <p className="text-xs font-bold text-slate-400 ml-2">
                                    {startIndex + 1} - {Math.min(startIndex + rowsPerPage, filteredSites.length)} จาก {filteredSites.length} รายการ
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="rounded-xl h-9" onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}><ChevronLeft size={16} /></Button>
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                        // Logic ย่อหน้า pagination เหมือนเดิม
                                        if (totalPages > 7 && (page !== 1 && page !== totalPages && Math.abs(currentPage - page) > 1)) {
                                            if (page === 2 || page === totalPages - 1) return <span key={page} className="text-slate-300 text-xs px-1">...</span>;
                                            return null;
                                        }
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    })}
                                </div>
                                <Button variant="outline" size="sm" className="rounded-xl h-9" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages}><ChevronRight size={16} /></Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal - เพิ่มหมายเหตุแทน Invite Code */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] p-10 border-none shadow-2xl bg-white focus:outline-none overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><Hospital size={24} /></div>
                            {selectedSite ? 'แก้ไขข้อมูลแหล่งฝึก' : 'เพิ่มแหล่งฝึกใหม่'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-8 py-8">
                        {/* เลือกจังหวัด */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400 flex justify-between">
                                <span>จังหวัดที่ตั้ง</span>
                                {errors.province && <span className="text-red-500 font-bold animate-pulse italic">! กรุณาเลือกจังหวัด</span>}
                            </label>
                            {province ? (
                                <div className="flex items-center justify-between bg-blue-600 text-white p-5 rounded-2xl shadow-lg shadow-blue-100 animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={22} className="text-blue-100" />
                                        <span className="text-lg font-black">{province}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setProvince('')} className="text-white hover:bg-white/20 rounded-full h-8 w-8"><X size={18} /></Button>
                                </div>
                            ) : (
                                <div className="relative group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <Input
                                        placeholder="พิมพ์ชื่อจังหวัดเพื่อค้นหา..."
                                        value={provinceSearch}
                                        onChange={(e) => setProvinceSearch(e.target.value)}
                                        className={`h-16 pl-14 rounded-2xl border-2 bg-slate-50/50 text-lg font-bold transition-all ${errors.province ? 'border-red-400' : 'border-slate-100 focus:border-blue-500'}`}
                                    />
                                    {provinceSearch && (
                                        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl max-h-60 overflow-y-auto p-2 scrollbar-hide animate-in fade-in zoom-in-95">
                                            {filteredProvinces.map(p => (
                                                <div key={p.code} onClick={() => handleSelectProvince(p)} className="p-4 hover:bg-blue-50 rounded-xl cursor-pointer font-bold text-slate-700 transition-colors flex items-center justify-between group">
                                                    <span>{p.name}</span>
                                                    <span className="text-xs text-slate-300 group-hover:text-blue-300">{p.code}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ชื่อหน่วยงาน */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400 flex justify-between">
                                <span>ชื่อแหล่งฝึกงาน</span>
                                {errors.siteName && <span className="text-red-500 font-bold animate-pulse italic">! กรุณากรอกชื่อหน่วยงาน</span>}
                            </label>
                            <Input
                                value={siteName}
                                onChange={(e) => {
                                    setSiteName(e.target.value);
                                    if (errors.siteName) setErrors({ ...errors, siteName: false });
                                }}
                                placeholder="เช่น รพ.สต. บ้านควนพัฒนา"
                                className={`h-16 rounded-2xl text-lg font-bold border-2 bg-slate-50/50 transition-all ${errors.siteName ? 'border-red-400' : 'border-slate-100 focus:border-blue-500'}`}
                            />
                        </div>

                        {/* เพิ่มช่องหมายเหตุ แทนที่ Invite Code */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400 flex items-center gap-2">
                                <FileText size={12} /> หมายเหตุ / ข้อมูลเพิ่มเติม (ทางเลือก)
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="เช่น ติดต่อคุณหมอสมชาย, อยู่ติดกับวัดเก่า ฯลฯ"
                                className="w-full min-h-[120px] p-5 rounded-2xl text-lg font-medium border-2 bg-slate-50/50 border-slate-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                        {/* ช่องซ่อนแหล่งฝึก */}
                        <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <Checkbox 
                                id="isHidden" 
                                checked={isHidden} 
                                onCheckedChange={(checked) => setIsHidden(checked === true)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="isHidden"
                                    className="text-sm font-black leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700"
                                >
                                    ซ่อนแหล่งฝึกนี้
                                </label>
                                <p className="text-[10px] font-bold text-slate-400">
                                    หากเปิดใช้ แหล่งฝึกนี้จะไม่แสดงในหน้าลงทะเบียนสำหรับนักศึกษา
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-start">
                        <Button
                            onClick={handleSave}
                            className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-2xl text-xl font-black transition-all shadow-xl shadow-blue-100 flex items-center gap-3"
                        >
                            <Plus size={24} /> {selectedSite ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างแหล่งฝึกใหม่'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}