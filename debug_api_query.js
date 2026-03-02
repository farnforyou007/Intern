const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testQuery() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const lineUserId = 'DEBUG_TEACHER_01';

    console.log(`Testing query for: ${lineUserId}`);

    try {
        const { data, error } = await supabase
            .from('supervisors')
            .select(`
                id, 
                full_name,
                phone,
                email,
                line_user_id,
                is_verified, 
                role,
                avatar_url,
                supervisor_subjects(
                    id,
                    subjects(id, name)
                )
            `)
            .eq('line_user_id', lineUserId)
            .limit(1);

        if (error) {
            console.error('❌ Query Error:', error);
        } else {
            console.log('✅ Query Success:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('🔥 Execution Exception:', err);
    }
}

testQuery();
