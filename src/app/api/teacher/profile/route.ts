import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

export async function GET(request: Request) {
    const supabase = await createServerSupabase()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser || authUser.app_metadata?.provider !== 'line') {
        return apiError('Unauthorized', 401)
    }

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
            .eq('user_id', authUser.id)
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
