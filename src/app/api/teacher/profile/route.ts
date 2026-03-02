import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const lineUserId = searchParams.get('lineUserId')

    if (!lineUserId) {
        return apiError('Missing lineUserId', 400)
    }

    const supabase = createServerSupabase()

    try {
        const { data, error } = await supabase
            .from('supervisors')
            .select(`
                id, 
                full_name,
                phone,
                email,
                line_user_id,
                line_display_name,
                is_verified, 
                role,
                avatar_url,
                supervisor_subjects(
                    id,
                    subjects(id, name)
                )
            `)
            .eq('line_user_id', lineUserId)
            .limit(1)

        if (error) {
            console.error('Teacher Profile Fetch Error:', error)
            return apiError(error.message, 500)
        }

        const user = data && data.length > 0 ? data[0] : null
        return apiSuccess(user)
    } catch (error: any) {
        console.error('Teacher Profile API Catch Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
