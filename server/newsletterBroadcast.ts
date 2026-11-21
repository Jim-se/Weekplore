import { sanitizeNewsletterHtml } from './newsletterImages.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';
import { resendRequest, newsletterProvider } from './newsletter.js';

export function athensSchedule(value: unknown): string | null {
    if (value == null || value === '') return null;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Invalid schedule');
    const wall = Date.parse(value + ':00Z');
    const format = (ms: number) => {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(ms);
        const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
        return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
    };
    const matches = [2, 3].map(offset => wall - offset * 3600000).filter(ms => Number.isFinite(ms) && format(ms) === value);
    if (matches.length !== 1) throw new Error('Choose another time: daylight-saving transition is ambiguous or invalid');
    if (matches[0] < Date.now() + 60000) throw new Error('Choose a time at least one minute in the future');
    return new Date(matches[0]).toISOString();
}
const escape = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
export function broadcastHtml(body: string, preview: string) {
    return `<!doctype html><html><body style="margin:0;background:#faf7f2;color:#4b3d2e;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escape(preview)}</div><div style="max-width:600px;background:white;margin:auto;padding:32px"><h1 style="font-family:Georgia,serif;font-style:italic">Weekplore.</h1>${sanitizeNewsletterHtml(body)}<div style="margin-top:40px;border-top:1px solid #eee;padding-top:20px;font-size:11px;text-align:center">Weekplore · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe / Διαγραφή</a></div></div></body></html>`;
}
export async function dispatchBroadcast(db: SupabaseClient, id: string, schedule: string | null) {
    const segment = process.env.RESEND_NEWSLETTER_SEGMENT_ID;
    if (!segment || !process.env.RESEND_NEWSLETTER_API_KEY) throw new Error('Resend newsletter configuration missing');
    // Atomic claim prevents duplicate clicks and requests from sending the same draft twice.
    const { data: draft, error } = await db.from('newsletter_emails').update({ status: 'sending', updated_at: new Date().toISOString(), scheudled_at: schedule })
        .eq('id', id).eq('status', 'draft').select('*').maybeSingle();
    if (error || !draft) throw new Error('Draft is unavailable or already submitted');
    if (!draft.subject?.trim() || (!draft.body_html?.replace(/<[^>]*>/g, '').trim() && !/<img\b[^>]*src="https:/i.test(draft.body_html || ''))) {
        await db.from('newsletter_emails').update({ status: 'draft' }).eq('id', id).eq('status', 'sending');
        throw new Error('Subject and message required');
    }
    // Keep ambiguous provider failures locked as sending; never blindly resend after a timeout.
    const created = await resendRequest('/broadcasts', 'POST', {
        segment_id: segment, from: process.env.RESEND_NEWSLETTER_FROM || 'Weekplore <hello@weekplore.gr>',
        reply_to: 'info@weekplore.gr', subject: draft.subject,
        name: `Weekplore ${id}`, html: broadcastHtml(draft.body_html, draft.preview_text || ''),
    });
    if (!created.ok) throw new Error('Resend could not prepare this email. Check Resend before retrying.');
    const broadcast = await created.json();
    if (typeof broadcast.id !== 'string') throw new Error('Invalid provider response');
    const saved = await db.from('newsletter_emails').update({ resend_broadcast_id: broadcast.id }).eq('id', id).eq('status', 'sending');
    if (saved.error) throw new Error('Could not record Broadcast ID; nothing has been sent');
    const sent = await resendRequest(`/broadcasts/${broadcast.id}/send`, 'POST', schedule ? { scheduled_at: schedule } : {});
    if (!sent.ok) throw new Error('Resend did not confirm sending. Check the Broadcast in Resend before trying again.');
    const result = await db.from('newsletter_emails').update({ status: schedule ? 'scheduled' : 'queued', updated_at: new Date().toISOString() })
        .eq('id', id).eq('status', 'sending').select('*').single();
    if (result.error) throw new Error('Resend accepted the email, but saving status failed. Do not resend.');
    return result.data;
}

export async function cancelScheduledBroadcast(db: SupabaseClient, id: string) {
    const { data: email, error } = await db.from('newsletter_emails').select('*').eq('id', id).maybeSingle();
    if (error || !email) throw new Error('Email not found');
    if (email.status === 'canceled') return email;
    if (email.status !== 'scheduled' || !email.resend_broadcast_id) throw new Error('Only scheduled emails can be canceled here');
    const response = await resendRequest(`/broadcasts/${email.resend_broadcast_id}`);
    if (!response.ok) throw new Error('Could not check the scheduled email in Resend');
    const broadcast = await response.json();
    if (broadcast.status !== 'scheduled') throw new Error('This email is no longer scheduled. Check Resend before taking further action.');
    const canceled = await resendRequest(`/broadcasts/${email.resend_broadcast_id}/cancel`, 'POST');
    if (!canceled.ok) throw new Error('Resend did not confirm cancellation. Check Resend before retrying.');
    // Resend returns a scheduled broadcast to draft; retain a canceled snapshot locally.
    const saved = await db.from('newsletter_emails').update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', id).eq('status', 'scheduled').select('*').single();
    if (saved.error) throw new Error('Canceled in Resend, but local status could not be saved. Refresh and check Resend.');
    return saved.data;
}

export async function syncBroadcastStatus(db: SupabaseClient, row: { id: string; status: string; resend_broadcast_id: string | null }) {
    if (!row.resend_broadcast_id || !['queued', 'scheduled', 'sending'].includes(row.status)) return;
    const response = await resendRequest(`/broadcasts/${encodeURIComponent(row.resend_broadcast_id)}`);
    if (!response.ok) throw new Error('Could not read Broadcast status');
    const broadcast = await response.json();
    const status = broadcast.status === 'canceled' || broadcast.status === 'cancelled' ? 'canceled' : broadcast.status;
    if (!['sent', 'scheduled', 'queued', 'failed', 'canceled'].includes(status)) return;
    const sentAt = broadcast.sent_at && Number.isFinite(Date.parse(broadcast.sent_at)) ? new Date(broadcast.sent_at).toISOString() : null;
    const { error } = await db.from('newsletter_emails').update({ status,
        ...(sentAt ? { sent_at: sentAt } : {}), updated_at: new Date().toISOString() })
        .eq('id', row.id).eq('status', row.status).eq('resend_broadcast_id', row.resend_broadcast_id);
    if (error) throw new Error('Could not save Broadcast status');
}

export function newsletterStatusDue(row: { scheudled_at: string | null; updated_at: string | null; status: string }, now = Date.now()) {
    const scheduled = row.scheudled_at ? Date.parse(row.scheudled_at) : null;
    const updated = row.updated_at ? Date.parse(row.updated_at) : 0;
    if (scheduled !== null) {
        if (!Number.isFinite(scheduled) || scheduled > now - 60000) return false;
        // The first check runs after send time; subsequent checks back off for ten minutes.
        return updated <= scheduled || updated <= now - 600000;
    }
    return updated <= now - (row.status === 'sending' ? 600000 : 60000);
}
let newsletterStatusCheckRunning = false;
export async function processDueNewsletterStatuses(db: SupabaseClient) {
    if (newsletterStatusCheckRunning || newsletterProvider() !== 'resend' || !process.env.RESEND_NEWSLETTER_API_KEY) return;
    newsletterStatusCheckRunning = true;
    try {
        const cutoff = new Date(Date.now() - 60000).toISOString();
        const { data, error } = await db.from('newsletter_emails')
            .select('id,status,resend_broadcast_id,scheudled_at,updated_at')
            .in('status', ['queued', 'scheduled', 'sending']).not('resend_broadcast_id', 'is', null)
            .or(`scheudled_at.lte.${cutoff},and(scheudled_at.is.null,updated_at.lte.${cutoff})`)
            .order('updated_at', { ascending: true }).limit(100);
        if (error) throw error;
        for (const row of data || []) {
            if (!newsletterStatusDue(row)) continue;
            try { await syncBroadcastStatus(db, row); }
            catch {
                // Back off after temporary provider failures; never send from this worker.
                await db.from('newsletter_emails').update({ updated_at: new Date().toISOString() })
                    .eq('id', row.id).eq('status', row.status);
            }
            await new Promise(resolve => setTimeout(resolve, 650));
        }
    } catch { console.warn('Newsletter status check could not complete'); }
    finally { newsletterStatusCheckRunning = false; }
}
