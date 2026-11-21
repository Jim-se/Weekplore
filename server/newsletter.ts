import type { SupabaseClient } from '@supabase/supabase-js';
import { subscribeNewsletter as subscribeBrevo } from './newsletterBrevo.js';
export { normalizeNewsletterEmail } from './newsletterBrevo.js';
export const newsletterProvider = () => process.env.NEWSLETTER_PROVIDER || 'resend';
export async function resendRequest(path: string, method = 'GET', body?: unknown) {
    const key = process.env.RESEND_NEWSLETTER_API_KEY;
    if (!key) throw new Error('Newsletter Resend key is not configured');
    return fetch(`https://api.resend.com${path}`, { method,
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000) });
}
export async function syncResendContact(email: string, rejoin = false) {
    const segment = process.env.RESEND_NEWSLETTER_SEGMENT_ID;
    if (!segment) throw new Error('Newsletter segment is missing');
    let response = await resendRequest(`/contacts/${encodeURIComponent(email)}`);
    let contact: any;
    if (response.status === 404) {
        response = await resendRequest('/contacts', 'POST', { email, unsubscribed: false });
        if (!response.ok) throw new Error('Resend contact creation failed');
        contact = await response.json();
    } else {
        if (!response.ok) throw new Error('Resend contact lookup failed');
        contact = await response.json();
        if (contact.unsubscribed && !rejoin) throw new Error('Contact has unsubscribed in Resend');
        if (contact.unsubscribed && rejoin) {
            const update = await resendRequest(`/contacts/${contact.id}`, 'PATCH', { unsubscribed: false });
            if (!update.ok) throw new Error('Resend reactivation failed');
        }
    }
    if (!contact.id) throw new Error('Missing contact ID');
    const add = await resendRequest(`/contacts/${contact.id}/segments/${segment}`, 'POST');
    if (!add.ok) throw new Error('Resend segment addition failed');
    return String(contact.id);
}
export async function subscribeNewsletter(db: SupabaseClient, email: string, source: 'website' | 'booking') {
    if (newsletterProvider() === 'brevo') return subscribeBrevo(db, email, source);
    const { data: existing, error } = await db.from('newsletter_subscribers')
        .select('id,unsubscribed_at,sync_status,resend_contact_id').eq('email', email).maybeSingle();
    if (error) throw new Error('Subscriber lookup failed');
    if (existing?.resend_contact_id && !existing.unsubscribed_at && existing.sync_status === 'synced') return 'already_subscribed';
    const { error: saveError } = await db.from('newsletter_subscribers').upsert({ email, source,
        consented_at: new Date().toISOString(), unsubscribed_at: null, sync_status: 'pending' }, { onConflict: 'email' });
    if (saveError) throw new Error('Subscriber save failed');
    try {
        const id = await syncResendContact(email, true);
        const { error } = await db.from('newsletter_subscribers').update({ resend_contact_id: id,
            sync_status: 'synced', last_synced_at: new Date().toISOString() }).eq('email', email);
        if (error) throw error;
        return 'subscribed';
    } catch {
        await db.from('newsletter_subscribers').update({ sync_status: 'failed' }).eq('email', email);
        throw new Error('Newsletter signup failed');
    }
}
