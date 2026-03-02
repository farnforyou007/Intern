const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
s.from('supervisors').select('full_name, line_user_id, role').then(r => {
    console.log(JSON.stringify(r.data, null, 2));
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
