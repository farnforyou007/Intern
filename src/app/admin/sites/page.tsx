"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit2, Copy, Trash2, RefreshCw, MapPin, Search, X, Sparkles, Hash, Hospital, CalendarDays } from "lucide-react"
import Swal from 'sweetalert2'

// รายชื่อจังหวัดพร้อมตัวย่อ 3 หลัก
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

export default function SitesPage() {
    const [sites, setSites] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSite, setSelectedSite] = useState<any>(null)
    const [siteName, setSiteName] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [province, setProvince] = useState('')
    const [provinceSearch, setProvinceSearch] = useState('')
    const [errors, setErrors] = useState({
        siteName: false,
        province: false,
        inviteCode: false
    })
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const fetchData = async () => {
        setLoading(true)
        const { data } = await supabase.from('training_sites').select('*').order('created_at', { ascending: false })
        if (data) setSites(data)
        setLoading(false)
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
        setInviteCode(`${p.code}-${generateSuffix()}`);
        if (errors.province) setErrors({ ...errors, province: false });
    }

    const onOpenModal = (site: any = null) => {
        if (site) {
            setSelectedSite(site);
            setSiteName(site.site_name);
            setInviteCode(site.invite_code);
            setProvince(site.province || '');
        } else {
            setSelectedSite(null);
            setSiteName('');
            setInviteCode('');
            setProvince('');
        }
        setProvinceSearch('');
        setErrors({ siteName: false, province: false, inviteCode: false });
        setIsModalOpen(true);
    }

    const handleSave = async () => {
        const newErrors = {
            siteName: !siteName,
            province: !province,
            inviteCode: !inviteCode
        };

        setErrors(newErrors);

        if (newErrors.siteName || newErrors.province || newErrors.inviteCode) {
            return;
        }

        const payload = {
            site_name: siteName,
            invite_code: inviteCode.toUpperCase(),
            province: province
        }

        try {
            if (selectedSite) {
                await supabase.from('training_sites').update(payload).eq('id', selectedSite.id)
            } else {
                await supabase.from('training_sites').insert(payload)
            }

            setErrors({ siteName: false, province: false, inviteCode: false });
            setIsModalOpen(false);
            fetchData();
            Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false });
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        }
    }

    // ฟังก์ชันลบข้อมูล
    const handleDelete = async (site: any) => {
        const { isConfirmed } = await Swal.fire({
            title: 'ยืนยันการลบ?',
            html: `คุณกำลังจะลบแหล่งฝึก <b>"${site.site_name}"</b><br/>ข้อมูลนี้จะหายไปจากระบบทันที`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ยืนยันการลบ',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
             customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        })

        if (isConfirmed) {
            try {
                const { error } = await supabase.from('training_sites').delete().eq('id', site.id)
                if (error) throw error
                
                setSites(prev => prev.filter(item => item.id !== site.id))
                Swal.fire({ icon: 'success', title: 'ลบข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false })
            } catch (error: any) {
                Swal.fire('Error', 'ไม่สามารถลบข้อมูลได้: ' + error.message, 'error')
            }
        }
    }

    const handleRegenInTable = async (siteId: number, provName: string) => {
        const newCode = getNewCode(provName);
        const { error } = await supabase.from('training_sites').update({ invite_code: newCode }).eq('id', siteId);

        if (!error) {
            setSites(prev => prev.map(item =>
                item.id === siteId ? { ...item, invite_code: newCode } : item
            ));
            Swal.fire({ icon: 'success', title: 'เปลี่ยนรหัสแล้ว', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    }

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code)
        Swal.fire({ icon: 'success', title: 'คัดลอกรหัสแล้ว', toast: true, position: 'top-end', timer: 1000, showConfirmButton: false });
    }

    const filteredProvinces = THAI_PROVINCES.filter(p => p.name.includes(provinceSearch));

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3 text-slate-900">
                            <Hospital className="text-blue-600" /> แหล่งฝึกงาน
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">จัดการหน่วยงานและรหัสเชิญสำหรับยืนยันตัวตน</p>
                    </div>
                    <Button onClick={() => onOpenModal()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 rounded-xl h-12 shadow-lg font-bold">
                        <Plus size={20} className="mr-2" /> เพิ่มแหล่งฝึกใหม่
                    </Button>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">ชื่อหน่วยงาน / รายละเอียด</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase tracking-widest text-slate-400">Invite Code</TableHead>
                                <TableHead className="text-right px-8 font-black text-[10px] uppercase tracking-widest text-slate-400">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={3} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></TableCell></TableRow>
                                ))
                            ) : (
                                sites.map((site) => (
                                    <TableRow key={site.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="px-8 py-5">
                                            <div className="font-bold text-slate-800 text-lg leading-tight">{site.site_name}</div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                                <div className="flex items-center gap-1 text-slate-400 font-sans">
                                                    <MapPin size={13} className="text-amber-500" />
                                                    <span className="text-[11px] font-bold text-slate-500">{site.province || 'ไม่ระบุจังหวัด'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-400 font-sans border-l pl-4">
                                                    <CalendarDays size={13} className="text-blue-400" />
                                                    <span className="text-[11px] font-bold text-slate-500">
                                                        บันทึกเมื่อ {new Date(site.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-2 bg-blue-50/50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 group">
                                                <span className="font-mono font-black text-sm tracking-widest">{site.invite_code}</span>
                                                <div className="flex items-center border-l border-blue-200 ml-2 pl-3 gap-3">
                                                    <button onClick={() => handleCopy(site.invite_code)} className="hover:text-blue-900 text-slate-300 transition-colors" title="คัดลอก"><Copy size={16} /></button>
                                                    <button onClick={() => handleRegenInTable(site.id, site.province)} className="hover:text-emerald-600 text-slate-300 transition-colors" title="สุ่มรหัสใหม่"><RefreshCw size={16} /></button>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => onOpenModal(site)}>
                                                    <Edit2 size={18} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl" 
                                                    onClick={() => handleDelete(site)}
                                                >
                                                    <Trash2 size={18} />
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="max-w-2xl rounded-[2.5rem] p-10 border-none shadow-2xl bg-white focus:outline-none"
                >

                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900">
                            {selectedSite ? 'แก้ไขแหล่งฝึกงาน' : 'เพิ่มแหล่งฝึกงานใหม่'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-8 py-6">
                        <div className="space-y-3 relative">
                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.province ? 'text-red-500' : 'text-slate-400'}`}>
                                จังหวัดที่ตั้ง {errors.province && "*"}
                            </label>
                            {province ? (
                                <div className="flex items-center justify-between bg-blue-600 text-white p-4 rounded-2xl shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={22} className="text-blue-100" />
                                        <span className="text-lg font-black">{province}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setProvince('')} className="text-white hover:bg-white/20 rounded-full h-8 w-8"><X size={18} /></Button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        placeholder="พิมพ์ชื่อจังหวัดเพื่อค้นหา..."
                                        value={provinceSearch}
                                        onChange={(e) => setProvinceSearch(e.target.value)}
                                        className={`h-14 pl-12 rounded-2xl border-2 bg-slate-50/50 text-lg font-bold ${errors.province ? 'border-red-400' : 'border-slate-200'}`}
                                    />
                                    {provinceSearch && (
                                        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl max-h-60 overflow-y-auto p-2">
                                            {filteredProvinces.map(p => (
                                                <div key={p.code} onClick={() => handleSelectProvince(p)} className="p-3 hover:bg-blue-50 rounded-xl cursor-pointer font-bold text-slate-700 transition-colors">
                                                    {p.name} ({p.code})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {errors.province && <p className="text-red-500 text-[10px] font-bold ml-1">! กรุณาเลือกจังหวัด</p>}
                        </div>

                        <div className="space-y-3">
                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.siteName ? 'text-red-500' : 'text-slate-400'}`}>
                                ชื่อแหล่งฝึกงาน {errors.siteName && "*"}
                            </label>
                            <Input
                                value={siteName}
                                onChange={(e) => {
                                    setSiteName(e.target.value);
                                    if (errors.siteName) setErrors({ ...errors, siteName: false });
                                }}
                                placeholder="เช่น รพ.ยะลา"
                                className={`h-14 rounded-2xl text-lg font-bold border-2 bg-slate-50/50 ${errors.siteName ? 'border-red-400 focus:ring-red-100' : 'border-slate-200'}`}
                            />
                            {errors.siteName && <p className="text-red-500 text-[10px] font-bold ml-1 animate-pulse">! กรุณากรอกชื่อหน่วยงาน</p>}
                        </div>

                        <div className="space-y-3">
                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.inviteCode ? 'text-red-500' : 'text-slate-400'}`}>
                                รหัสเชิญ (Invite Code) {errors.inviteCode && "*"}
                            </label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        value={inviteCode}
                                        onChange={(e) => {
                                            setInviteCode(e.target.value.toUpperCase());
                                            if (errors.inviteCode) setErrors({ ...errors, inviteCode: false });
                                        }}
                                        className={`h-14 pl-12 rounded-2xl text-lg font-mono font-black text-blue-600 border-2 bg-slate-50/50 ${errors.inviteCode ? 'border-red-400 focus:ring-red-100' : 'border-slate-200'}`}
                                    />
                                </div>
                                <Button type="button" onClick={() => {
                                    if (!province) {
                                        setErrors({...errors, province: true});
                                        return;
                                    }
                                    setInviteCode(getNewCode(province));
                                    if (errors.inviteCode) setErrors({ ...errors, inviteCode: false });
                                }} variant="outline" className="h-14 w-14 rounded-2xl border-slate-200"><Sparkles size={20} /></Button>
                            </div>
                            {errors.inviteCode && <p className="text-red-500 text-[10px] font-bold ml-1 animate-pulse">! กรุณากำหนดรหัสเชิญ</p>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleSave} className="w-full bg-slate-900 hover:bg-blue-600 h-16 rounded-2xl text-xl font-black transition-all shadow-xl">บันทึกข้อมูลแหล่งฝึก</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}