// "use client"
// import React, { useState } from 'react'
// import { LayoutDashboard, Hospital, CalendarClock, BookOpen, UserCircle, Menu, X } from "lucide-react"
// import Link from 'next/link'
// import { usePathname } from 'next/navigation'
// import { LogOut } from 'lucide-react'

// const router = useRouter()
// const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//     const pathname = usePathname()
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false) // State สำหรับมือถือ

//     const menuItems = [
//         { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin' },
//         { name: 'จัดการแหล่งฝึกงาน', icon: <Hospital size={20} />, href: '/admin/sites' },
//         { name: 'จัดการผลัดการฝึก', icon: <CalendarClock size={20} />, href: '/admin/rotations' },
//         { name: 'จัดการรายวิชา', icon: <BookOpen size={20} />, href: '/admin/subjects' },
//         { name: 'จัดการแบบประเมิน', icon: <BookOpen size={20} />, href: '/admin/templates' },
//         { name: 'จัดการพี่เลี้ยง', icon: <BookOpen size={20} />, href: '/admin/supervisors' },
//     ]

//     return (
//         <div className="flex min-h-screen font-sans bg-[#F8FAFC]">
//             {/* Overlay สำหรับปิดเมนูเมื่อกดพื้นที่ว่างบนมือถือ */}
//             {isSidebarOpen && (
//                 <div
//                     className="fixed inset-0 bg-black/50 z-40 lg:hidden"
//                     onClick={() => setIsSidebarOpen(false)}
//                 />
//             )}

//             {/* Sidebar */}
//             <aside className={`
//         fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 transform transition-transform duration-300 ease-in-out
//         lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
//       `}>
//                 <div className="p-8 text-white font-bold text-2xl flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                         <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">IES</div>
//                         Internship
//                     </div>
//                     {/* ปุ่มปิดบนมือถือ */}
//                     <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
//                         <X size={24} />
//                     </button>
//                 </div>

//                 <nav className="flex-1 px-4 space-y-2">
//                     {menuItems.map((item) => (
//                         <Link
//                             key={item.name}
//                             href={item.href}
//                             onClick={() => setIsSidebarOpen(false)} // ปิดเมนูเมื่อคลิก
//                             className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
//                         >
//                             {item.icon}
//                             <span className="font-medium">{item.name}</span>
//                         </Link>
//                     ))}
//                 </nav>
//             </aside>

//             {/* Main Content */}
//             <div className="flex-1 flex flex-col min-w-0">
//                 <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shadow-sm">
//                     <div className="flex items-center gap-4">
//                         {/* แฮมเบอร์เกอร์ปุ่ม */}
//                         <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsSidebarOpen(true)}>
//                             <Menu size={24} />
//                         </button>
//                         <div className="font-bold text-slate-700 text-lg hidden sm:block">Internship System</div>
//                     </div>
//                     <div className="flex items-center gap-3">
//                         <div className="text-right hidden sm:block">
//                             <p className="text-sm font-bold text-slate-900 leading-none">Admin</p>
//                             <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-widest">Administrator</p>
//                         </div>
//                         <UserCircle size={32} className="text-slate-300" />
//                     </div>
//                 </header>

//                 <main className="p-4 lg:p-10">{children}</main>
//             </div>
//         </div>
//     )
// }


// ver2
"use client"
import React, { useState } from 'react'
import { LayoutDashboard, Hospital, CalendarClock, BookOpen, UserCircle, Menu, X, LogOut ,Settings ,Users ,ClipboardPen ,UserRoundCheck} from "lucide-react"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation' // เพิ่ม useRouter
import { createClient } from '@supabase/supabase-js' // เพิ่ม createClient
import Swal from 'sweetalert2'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // สร้าง Supabase Client ภายใน Component
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin' },
        { name: 'จัดการแหล่งฝึกงาน', icon: <Hospital size={20} />, href: '/admin/sites' },
        { name: 'จัดการผลัดการฝึก', icon: <CalendarClock size={20} />, href: '/admin/rotations' },
        { name: 'จัดการบุคลากร', icon: <UserRoundCheck size={20} />, href: '/admin/supervisors' },
        { name: 'จัดการนักศึกษา', icon: <Users size={20} />, href: '/admin/students' },
        { name: 'จัดการรายวิชา', icon: <BookOpen size={20} />, href: '/admin/subjects' },
        { name: 'จัดการแบบประเมิน', icon: <ClipboardPen size={20} />, href: '/admin/templates' },
        { name: 'ตั้งค่าระบบ', icon: <Settings size={20} />, href: '/admin/settings' },
        
    ]

    // ฟังก์ชันออกจากระบบ
    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'ออกจากระบบ?',
            text: "คุณต้องการออกจากระบบจัดการแอดมินใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            customClass: { popup: 'rounded-[2rem] font-sans' }
        })

        if (result.isConfirmed) {
            const { error } = await supabase.auth.signOut()
            if (!error) {
                router.push('/login')
                router.refresh()
            }
        }
    }

    return (
        <div className="flex min-h-screen font-sans bg-[#F8FAFC]">
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-8 text-white font-bold text-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">IES</div>
                        Internship
                    </div>
                    <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                {/* ปุ่ม Logout ด้านล่าง Sidebar */}
                <div className="p-4 mt-auto border-t border-slate-800">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold"
                    >
                        <LogOut size={20} />
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="font-bold text-slate-700 text-lg hidden sm:block">Internship System</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900 leading-none">Admin</p>
                            <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-widest">Administrator</p>
                        </div>
                        <UserCircle size={32} className="text-slate-300" />
                    </div>
                </header>

                <main className="p-4 lg:p-10">{children}</main>
            </div>
        </div>
    )
}