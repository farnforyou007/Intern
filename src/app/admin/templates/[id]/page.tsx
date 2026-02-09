// src/app/admin/templates/[id]/page.tsx
"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ListTodo, Plus, Trash2 } from "lucide-react"
import Swal from 'sweetalert2'

export default function TemplateItemsPage() {
    const { id } = useParams()
    const router = useRouter()
    const [template, setTemplate] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [newItem, setNewItem] = useState({ question_text: '', description: '', allow_na: true })
    
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const fetchData = async () => {
        const { data: temp } = await supabase.from('eval_templates').select('*').eq('id', id).single()
        const { data: qst } = await supabase.from('eval_template_items').select('*').eq('template_id', id).order('order_index', { ascending: true })
        if (temp) setTemplate(temp)
        setItems(qst || [])
    }

    const addItem = async () => {
        if (!newItem.question_text) return
        await supabase.from('eval_template_items').insert([{ ...newItem, template_id: id, order_index: items.length }])
        setNewItem({ question_text: '', description: '', allow_na: true })
        fetchData()
    }

    const deleteItem = async (itemId: number) => {
        await supabase.from('eval_template_items').delete().eq('id', itemId)
        fetchData()
    }

    useEffect(() => { fetchData() }, [id])

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto pb-20 px-4 font-sans">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 font-medium transition-colors">
                    <ChevronLeft size={20} /> กลับไปหน้าเทมเพลต
                </button>

                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">จัดการข้อคำถาม</h1>
                    <p className="text-blue-600 font-black text-xl mt-1 underline decoration-blue-100 underline-offset-8 uppercase">{template?.template_name}</p>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm mb-10 overflow-hidden">
                    <div className="flex flex-col gap-4">
                        <Input placeholder="ชื่อข้อคำถาม (ตัวเข้ม)..." value={newItem.question_text} onChange={e => setNewItem({...newItem, question_text: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-bold" />
                        <textarea placeholder="คำอธิบายเกณฑ์การประเมินเพิ่มเติม (ตัวบาง)..." value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full p-5 rounded-2xl bg-slate-50 border-none text-slate-600 h-28 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-base" />
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                            <label className="flex items-center gap-3 text-slate-600 font-bold cursor-pointer bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 w-full sm:w-auto">
                                <input type="checkbox" checked={newItem.allow_na} onChange={e => setNewItem({...newItem, allow_na: e.target.checked})} className="w-5 h-5 accent-blue-600 rounded" />
                                มีตัวเลือก N/A (ประเมินไม่ได้)
                            </label>
                            <Button onClick={addItem} className="w-full sm:w-auto bg-blue-600 h-14 rounded-2xl px-12 font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">เพิ่มข้อคำถาม</Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {items.map((item, idx) => (
                        <div key={item.id} className="bg-white border border-slate-50 p-7 rounded-[2.5rem] flex items-start justify-between group shadow-sm hover:border-blue-200 transition-all">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-lg shadow-slate-200">{idx + 1}</div>
                                    <p className="text-slate-800 font-bold text-xl leading-tight">{item.question_text}</p>
                                </div>
                                <p className="text-slate-500 text-base ml-12 whitespace-pre-line leading-relaxed">{item.description}</p>
                                <div className="flex gap-2 mt-4 ml-12">
                                    <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full uppercase font-black text-slate-400 tracking-wider">Scale: 5-1</span>
                                    {item.allow_na && <span className="text-[10px] bg-emerald-100 px-3 py-1 rounded-full uppercase font-black text-emerald-600 tracking-wider">N/A Active</span>}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full h-12 w-12 shrink-0 transition-colors" onClick={() => deleteItem(item.id)}><Trash2 size={20}/></Button>
                        </div>
                    ))}
                    {items.length === 0 && <div className="text-center py-20 text-slate-300 italic font-medium text-lg">ยังไม่มีคำถามในเทมเพลตนี้</div>}
                </div>
            </div>
        </AdminLayout>
    )
}