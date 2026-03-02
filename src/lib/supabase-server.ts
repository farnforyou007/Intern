import { createClient } from '@supabase/supabase-js'

/**
 * สร้าง Supabase client สำหรับใช้ใน API Routes (Server-side only)
 * ไม่ควรใช้ใน client components
 */
export function createServerSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        throw new Error('Missing Supabase environment variables')
    }

    return createClient(url, key)
}
