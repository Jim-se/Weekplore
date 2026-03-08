import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Testing upsert...');
    const { error } = await supabase
        .from('email_purposes')
        .upsert({ purpose: 'interest_received', template_id: null }, { onConflict: 'purpose' });

    if (error) {
        console.error('UPSERT ERROR:', error.message);
        console.error('CODE:', error.code);
        console.error('HINT:', error.hint);
        console.error('DETAILS:', error.details);
    } else {
        console.log('Upsert successful');
    }

    console.log('--- Current Data ---');
    const { data: rows } = await supabase.from('email_purposes').select('*');
    console.log(rows);
}

checkTable();
