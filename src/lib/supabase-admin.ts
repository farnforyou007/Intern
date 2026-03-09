import { createClient } from '@supabase/supabase-js'

/**
 * สร้าง Supabase Client ด้วย Service Role Key (Admin Privileges)
 * ใช้สำหรับงานหลังบ้านที่ต้องการสิทธิ์สูงสุด เช่น ลบ User ใน Auth
 * ⚠️ คำเตือน: ห้ามใช้ไฟล์นี้ในฝั่ง Client (browser) โดยเด็ดขาด
 */
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)
