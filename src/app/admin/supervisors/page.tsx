"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    UserCheck, ShieldAlert, Search, MapPin, 
    Phone, Check, X, Trash2, Image as ImageIcon,
    Filter, MonitorCheck, Database, MessageCircle
} from "lucide-react"
import Swal from 'sweetalert2'

// --- Mock Data สำหรับทดสอบ UI ---
const MOCK_DATA = [
    {
        id: "mock-1",
        full_name: "นายสมชาย ใจดี",
        line_display_name: "Somchai_TH",
        phone: "081-234-5678",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Somchai",
        is_verified: false,
        created_at: new Date().toISOString(),
        training_sites: { site_name: "รพ.ยะลา", department: "แผนกนวดไทย" }
    },
    {
        id: "mock-2",
        full_name: "นางสาวสมหญิง รักเรียน",
        line_display_name: "Ying_Happy",
        phone: "089-999-8888",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ying",
        is_verified: false,
        created_at: new Date().toISOString(),
        training_sites: { site_name: "รพ.สต. ท่าสาป", department: "เวชปฏิบัติทั่วไป" }
    },
    {
        id: "mock-3",
        full_name: "นายแพทย์วิชัย เก่งกาจ",
        line_display_name: "Dr.Wichai",
        phone: "082-111-2222",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wichai",
        is_verified: true,
        created_at: new Date().toISOString(),
        training_sites: { site_name: "รพ.ศูนย์อนามัยที่ 12", department: "แผนกประสมยา" }
    },
    {
        id: "mock-4",
        full_name: "นายแพทย์หนู หิ้นน",
        line_display_name: "Dr.Noo",
        phone: "061-567-1014",
        avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=Christopher",
        is_verified: true,
        created_at: new Date().toISOString(),
        training_sites: { site_name: "รพ.ศูนย์อนามัยที่ 12", department: "แผนกประสมยา" }
    }
];

export default function SupervisorManagementPage() {
    const [allSupervisors, setAllSupervisors] = useState<any[]>([])
    const [sites, setSites] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterSite, setFilterSite] = useState('all')
    const [useMock, setUseMock] = useState(true)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const fetchData = async () => {
        if (useMock) {
            setAllSupervisors(MOCK_DATA)
            setLoading(false)
            return
        }

        setLoading(true)
        const { data: sups } = await supabase
            .from('supervisors')
            .select('*, training_sites(site_name, department)')
            .order('created_at', { ascending: false })
        
        const { data: st } = await supabase.from('training_sites').select('id, site_name, department')
        
        if (sups) setAllSupervisors(sups)
        if (st) setSites(st)
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [useMock])

    // --- Logic การกรองข้อมูล ---
    const filteredData = allSupervisors.filter(s => {
        const matchSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (s.line_display_name && s.line_display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (s.phone && s.phone.includes(searchTerm));
        const matchSite = filterSite === 'all' || s.site_id?.toString() === filterSite;
        return matchSearch && matchSite;
    });

    const pendingRequests = filteredData.filter(s => !s.is_verified);
    const verifiedData = filteredData.filter(s => s.is_verified);

    const handleApprove = async (id: string, name: string) => {
        if (useMock) {
            setAllSupervisors(prev => prev.map(s => s.id === id ? {...s, is_verified: true} : s))
            Swal.fire('สำเร็จ (Mock)', `อนุมัติคุณ ${name} แล้ว`, 'success')
            return
        }
        const { error } = await supabase.from('supervisors').update({ is_verified: true }).eq('id', id)
        if (!error) {
            fetchData()
            Swal.fire('สำเร็จ', 'อนุมัติสิทธิ์เรียบร้อยแล้ว', 'success')
        }
    }

    const handleDelete = async (id: string, name: string) => {
        const res = await Swal.fire({
            title: 'ลบรายชื่อ?',
            text: `ต้องการลบข้อมูลของ ${name} หรือไม่?`,
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
        })
        if (res.isConfirmed) {
            if (!useMock) await supabase.from('supervisors').delete().eq('id', id)
            else setAllSupervisors(prev => prev.filter(s => s.id !== id))
            fetchData()
        }
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto px-4 pb-20 font-sans">
                {/* Header & Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <UserCheck className="text-blue-600" size={36} /> จัดการพี่เลี้ยง
                        </h1>
                        <p className="text-slate-500 mt-1">ตรวจสอบข้อมูลและชื่อ LINE ก่อนอนุมัติสิทธิ์</p>
                    </div>
                    <Button 
                        variant={useMock ? "default" : "outline"}
                        onClick={() => setUseMock(!useMock)}
                        className={`rounded-2xl gap-2 h-12 ${useMock ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    >
                        {useMock ? <MonitorCheck size={18}/> : <Database size={18}/>}
                        {useMock ? "Mock Mode: ON" : "Real Database"}
                    </Button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <Input 
                            placeholder="ค้นหาชื่อจริง, ชื่อ LINE หรือเบอร์โทร..." 
                            className="pl-12 h-14 rounded-2xl bg-white border-slate-200 text-lg shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative sm:w-72">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select 
                            className="pl-12 pr-4 h-14 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-slate-600 w-full appearance-none shadow-sm"
                            value={filterSite}
                            onChange={(e) => setFilterSite(e.target.value)}
                        >
                            <option value="all">ทุกแหล่งฝึกงาน</option>
                            {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                        </select>
                    </div>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="bg-slate-100 p-1.5 rounded-[2rem] h-auto mb-8 flex-wrap">
                        <TabsTrigger value="pending" className="rounded-full px-10 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold gap-3 transition-all">
                            รออนุมัติ 
                            {pendingRequests.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-2.5 py-1 rounded-full animate-pulse">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="all" className="rounded-full px-10 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold transition-all">
                            พี่เลี้ยงที่อนุมัติแล้ว
                        </TabsTrigger>
                    </TabsList>

                    {/* Content: Pending (Cards) */}
                    <TabsContent value="pending">
                        {pendingRequests.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                <ShieldAlert size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-bold">ไม่มีคำขอลงทะเบียนใหม่</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pendingRequests.map(req => (
                                    <SupervisorCard key={req.id} data={req} onApprove={handleApprove} onDelete={handleDelete} mode="pending" />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Content: All (Table) */}
                    <TabsContent value="all">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-sm font-black text-slate-400 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                                        <th className="px-8 py-5 text-left text-sm font-black text-slate-400 uppercase tracking-wider">LINE Display</th>
                                        <th className="px-8 py-5 text-left text-sm font-black text-slate-400 uppercase tracking-wider">สังกัด</th>
                                        <th className="px-8 py-5 text-left text-sm font-black text-slate-400 uppercase tracking-wider">ติดต่อ</th>
                                        <th className="px-8 py-5 text-center text-sm font-black text-slate-400 uppercase tracking-wider">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {verifiedData.map(sup => (
                                        <tr key={sup.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                                                        <img src={sup.avatar_url} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="font-bold text-slate-800 text-lg">{sup.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                                    <MessageCircle size={14} />
                                                    <span>{sup.line_display_name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-slate-700">{sup.training_sites?.site_name}</div>
                                                <div className="text-xs text-slate-400">{sup.training_sites?.department}</div>
                                            </td>
                                            <td className="px-8 py-5 font-mono text-sm text-slate-600">{sup.phone}</td>
                                            <td className="px-8 py-5 text-center">
                                                <Button variant="ghost" onClick={() => handleDelete(sup.id, sup.full_name)} className="h-10 w-10 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50">
                                                    <Trash2 size={20} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    )
}

function SupervisorCard({ data, onApprove, onDelete, mode }: any) {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
            <div className="p-7 flex gap-5 items-start">
                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex-shrink-0 border-2 border-white shadow-inner overflow-hidden flex items-center justify-center">
                    {data.avatar_url ? (
                        <img src={data.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="text-slate-300" size={28} />
                    )}
                </div>
                
                <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-800 text-xl leading-tight truncate">{data.full_name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-green-100 text-green-700 font-black px-2 py-0.5 rounded-md">LINE</span>
                        <span className="text-slate-400 text-sm font-medium truncate italic">{data.line_display_name || 'unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs mt-3">
                        <Phone size={14} /> <span className="font-bold">{data.phone}</span>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-50">
                        <div className="flex items-start gap-2 text-blue-600">
                            <MapPin size={14} className="mt-0.5 shrink-0" />
                            <div className="text-[12px] leading-tight font-bold">
                                {data.training_sites?.site_name}
                                <span className="block text-slate-400 font-medium mt-0.5">{data.training_sites?.department}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {mode === 'pending' && (
                <div className="px-7 pb-7 pt-2 flex gap-3 mt-auto">
                    <Button 
                        onClick={() => onApprove(data.id, data.full_name)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black shadow-lg shadow-emerald-100 text-lg active:scale-95 transition-all"
                    >
                        <Check size={20} className="mr-2" /> อนุมัติ
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => onDelete(data.id, data.full_name)}
                        className="h-14 w-14 rounded-2xl text-red-300 hover:text-red-500 hover:bg-red-50"
                    >
                        <X size={24} />
                    </Button>
                </div>
            )}
        </div>
    )
}