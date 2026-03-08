import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('email_logs').select('*').limit(1);
    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log('Sample Row:', data[0]);
        console.log('Keys:', data[0] ? Object.keys(data[0]) : 'No data');
    }
}
run();
