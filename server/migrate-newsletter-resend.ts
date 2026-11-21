import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { syncResendContact } from './newsletter.js';
dotenv.config();
const db = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
let migrated = 0;
let offset = 0;
for (;;) {
    const { data, error } = await db.from('newsletter_subscribers').select('id,email')
        .is('unsubscribed_at', null).order('id').range(offset, offset + 99);
    if (error) throw new Error('Could not read subscribers');
    for (const row of data || []) {
        // Space provider requests to respect Resend's shared account rate limit.
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
            await new Promise(resolve => setTimeout(resolve, 700));
            return originalFetch(...args);
        }) as typeof fetch;
        let id: string;
        try { id = await syncResendContact(row.email); }
        catch (error) {
            if (error instanceof Error && error.message.includes('has unsubscribed')) {
                const { error: saveError } = await db.from('newsletter_subscribers').update({ unsubscribed_at: new Date().toISOString() }).eq('id', row.id);
                if (saveError) throw saveError;
                continue;
            }
            throw error;
        } finally { globalThis.fetch = originalFetch; }
        const { error: saveError } = await db.from('newsletter_subscribers').update({ resend_contact_id: id,
            sync_status: 'synced', last_synced_at: new Date().toISOString() }).eq('id', row.id).is('unsubscribed_at', null);
        if (saveError) throw saveError;
        migrated++;
    }
    if (!data || data.length < 100) break;
    offset += 100;
}
console.log(`Migrated ${migrated} newsletter subscribers. No emails sent.`);
