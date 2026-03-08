import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { error } = await supabase.from('email_logs').select('*').limit(0);
    if (error && error.code === '42P01') {
        console.log('email_logs table missing - Need to run the SQL');
    } else if (error) {
        console.log('Error checking table:', error.message);
    } else {
        console.log('email_logs table exists');
    }
}
run();
