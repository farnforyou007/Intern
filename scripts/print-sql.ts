
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runSQL() {
    const sql = `
    -- 1. Add user_id to supervisors
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='supervisors' AND column_name='user_id') THEN
        ALTER TABLE supervisors ADD COLUMN user_id UUID UNIQUE;
        ALTER TABLE supervisors ADD CONSTRAINT fk_supervisors_user FOREIGN KEY (user_id) REFERENCES auth.users(id);
      END IF;
    END $$;

    -- 2. Add user_id to students
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='user_id') THEN
        ALTER TABLE students ADD COLUMN user_id UUID UNIQUE;
        ALTER TABLE students ADD CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES auth.users(id);
      END IF;
    END $$;
  `;

    // We can't run raw SQL easily via the standard JS client without a custom RPC or a specific extension.
    // However, I can try to use RPC if a 'exec_sql' exists or just assume the user will run it in the dashboard.
    // Actually, I'll ask the user to run it if I can't.
    // Let's check if I can use the 'postgres-js' or similar if it's installed.

    console.log("Please run the following SQL in your Supabase SQL Editor:");
    console.log(sql);
}

runSQL()
