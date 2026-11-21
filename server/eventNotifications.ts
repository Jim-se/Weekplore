import crypto from 'node:crypto';
import { Router, urlencoded } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { renderEventAlert } from './eventAlertTemplate.js';

const CLOSED = new Set(['archived', 'canceled', 'cancelled']);
const isClosed = (status: unknown) => CLOSED.has(String(status || '').toLowerCase());
export const isCanceled = (status: unknown) => ['canceled', 'cancelled'].includes(String(status || '').toLowerCase());
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ATTEMPTS = 8;
const MAX_RETRY_AGE_MS = 23 * 60 * 60 * 1000;

export function normalizeAlertEmail(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const email = value.trim().toLowerCase();
    return email.length <= 254 && !/[\u0000-\u001f\u007f]/.test(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

// These database columns are Athens wall-clock timestamps without a timezone.
// Resolve them explicitly instead of using the server's (usually UTC) timezone.
export function athensTimestamp(value: string): number {
    if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(value)) return Date.parse(value);
    const wallClock = Date.parse(`${value.replace(' ', 'T')}Z`);
    if (!Number.isFinite(wallClock)) return NaN;
    let instant = wallClock;
    for (let i = 0; i < 3; i++) {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
        }).formatToParts(new Date(instant));
        const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
        const displayed = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
        instant += wallClock - displayed;
    }
    return instant;
}

export function eventAcceptsAlerts(event: any, now = Date.now()) {
    if (!event || event.is_hidden || isClosed(event.status)) return false;
    const deadline = athensTimestamp(event.booking_deadline || event.event_date || '');
    return Number.isFinite(deadline) && deadline > now;
}

export function remainingPlaces(shift: any, bookings: any[]) {
    return Math.max(0, Number(shift.capacity) - bookings.reduce((total, booking) =>
        total + (isCanceled(booking.status) ? 0 : Number(booking.number_of_people || 0)), 0));
}

type SendEmail = (message: { from: string; to: string; subject: string; html: string; text: string }, options: { idempotencyKey: string }) => Promise<{ data?: { id: string } | null; error?: unknown }>;
type Options = { db: SupabaseClient; serverUrl: string; siteUrl: string; secret: string; from: string; send: SendEmail; emailEnabled: () => boolean; paceMs?: number };

export function createEventNotifications(options: Options) {
    const { db, send, from } = options;
    const serverUrl = new URL(options.serverUrl).origin;
    const siteUrl = new URL(options.siteUrl).origin;
    const tokenFor = (id: string) => crypto.createHmac('sha256', options.secret).update(`event-alerts:${id}`).digest('hex');
    const hash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
    const check = (result: { error?: any }) => { if (result.error) throw result.error; };
    const router = Router();
    router.use(urlencoded({ extended: false, limit: '2kb' }));
    const limits = new Map<string, { count: number; until: number }>();
    const pendingCancellations = new Map<string, { id: number; event_id: number; shift_id: number }>();
    let working = false;

    async function eventContext(eventId: number, shiftId?: number) {
        const eventResult = await db.from('events').select('id,title,slug,location_name,is_hidden,is_sold_out,status,booking_deadline,event_date').eq('id', eventId).maybeSingle();
        check(eventResult);
        const event = eventResult.data;
        if (!eventAcceptsAlerts(event)) return null;
        let query = db.from('shifts').select('id,event_id,start_time,end_time,capacity,is_full,is_active,status').eq('event_id', eventId);
        if (shiftId) query = query.eq('id', shiftId);
        const shifts = await query;
        check(shifts);
        const shift = shifts.data?.find(s => s.is_active !== false && !isClosed(s.status) && athensTimestamp(s.start_time) > Date.now());
        if (!shift) return null;
        const bookings = await db.from('bookings').select('number_of_people,status').eq('shift_id', shift.id);
        check(bookings);
        return { event: event!, shift, remaining: remainingPlaces(shift, bookings.data || []) };
    }

    router.post('/notify-me', async (req, res) => {
        if (!options.secret) return res.status(503).json({ error: 'Event alerts are not configured yet.' });
        const now = Date.now();
        for (const [key, value] of limits) if (value.until <= now) limits.delete(key);
        const ip = req.ip || 'unknown';
        const limit = limits.get(ip) || { count: 0, until: now + 10 * 60 * 1000 };
        limits.set(ip, limit);
        if (++limit.count > 10) {
            res.set('Retry-After', String(Math.ceil((limit.until - now) / 1000)));
            return res.status(429).json({ error: 'Please try again later.' });
        }
        const eventId = req.body?.eventId;
        const email = normalizeAlertEmail(req.body?.email);
        if (!Number.isSafeInteger(eventId) || eventId < 1 || !email) return res.status(400).json({ error: 'Please provide an event and a valid email.' });
        try {
            const context = await eventContext(eventId);
            if (!context) return res.status(400).json({ error: 'Alerts are closed for this event.' });
            const language = req.body?.email_language === 'el' ? 'el' : 'en';
            const id = crypto.randomUUID();
            // Ignore duplicates first: repeated submissions must not rotate a live unsubscribe token.
            const inserted = await db.from('notify_email_subscriptions').upsert({
                id, event_id: eventId, email, email_language: language, status: 'active',
                unsubscribe_token_hash: hash(tokenFor(id)), unsubscribed_at: null,
            }, { onConflict: 'event_id,email', ignoreDuplicates: true });
            check(inserted);
            const existing = await db.from('notify_email_subscriptions').select('id,status').eq('event_id', eventId).eq('email', email).single();
            check(existing);
            // Explicitly submitting this form again opts back in to this event's alerts.
            const saved = await db.from('notify_email_subscriptions').update({
                email_language: language, status: 'active', unsubscribed_at: null,
                unsubscribe_token_hash: hash(tokenFor(existing.data!.id)),
                ...(existing.data!.status !== 'active' ? { created_at: new Date().toISOString() } : {}),
            }).eq('id', existing.data!.id);
            check(saved);
            return res.json({ success: true });
        } catch (error) {
            console.error('Notify Me subscription failed:', error);
            return res.status(503).json({ error: 'Could not save your alert. Please try again later.' });
        }
    });

    function page(title: string, body: string, language = 'en') {
        return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>${escape(title)} — Weekplore</title></head><body style="margin:0;background:#f8f5ef;color:#29251f;font:16px/1.6 system-ui,sans-serif"><main style="max-width:440px;margin:12vh auto;padding:32px"><p>WEEKPLORE</p><h1>${escape(title)}</h1>${body}</main></body></html>`;
    }
    async function getUnsubscribe(id: string, token: unknown) {
        if (!UUID.test(id) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
        const result = await db.from('notify_email_subscriptions').select('id,email_language,status,unsubscribe_token_hash').eq('id', id).maybeSingle();
        check(result);
        const record = result.data;
        const expected = record?.unsubscribe_token_hash;
        return expected && /^[a-f0-9]{64}$/.test(expected) && crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(hash(token), 'hex')) ? record : null;
    }
    router.get('/notify-me/unsubscribe/:id', async (req, res) => {
        res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' });
        try {
            const record = await getUnsubscribe(req.params.id, req.query.token);
            if (!record) return res.status(400).send(page('Invalid link', '<p>This alert link is invalid.</p>'));
            const gr = record.email_language === 'el';
            const title = gr ? 'Διακοπή ειδοποιήσεων' : 'Stop event alerts';
            // GET is read-only so email security scanners cannot unsubscribe a customer.
            return res.send(page(title, record.status === 'unsubscribed'
                ? `<p>${gr ? 'Οι ειδοποιήσεις για αυτή την εκδήλωση έχουν ήδη σταματήσει.' : 'Alerts for this event have already stopped.'}</p>`
                : `<p>${gr ? 'Θέλετε να σταματήσετε τα email για αυτή την εκδήλωση; Οι κρατήσεις σας δεν επηρεάζονται.' : 'Stop emails for this event? Your bookings will not be affected.'}</p><form method="post" action="${escape(`/api/notify-me/unsubscribe/${record.id}`)}"><input type="hidden" name="token" value="${escape(req.query.token)}"><button style="padding:14px 24px;border:0;border-radius:24px;background:#29251f;color:white;font:inherit;cursor:pointer">${escape(title)}</button></form>`, gr ? 'el' : 'en'));
        } catch {
            return res.status(503).send(page('Please try again', '<p>We couldn’t process your request. Please try again shortly.</p>'));
        }
    });
    router.post('/notify-me/unsubscribe/:id', async (req, res) => {
        res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' });
        try {
            const record = await getUnsubscribe(req.params.id, req.body?.token);
            if (!record) return res.status(400).send(page('Invalid link', '<p>This alert link is invalid.</p>'));
            const result = await db.from('notify_email_subscriptions').update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() }).eq('id', record.id);
            check(result);
            const gr = record.email_language === 'el';
            return res.send(page(gr ? 'Οι ειδοποιήσεις σταμάτησαν' : 'Event alerts stopped', `<p>${gr ? 'Δεν θα λάβετε άλλα email για αυτή την εκδήλωση. Οι κρατήσεις και οι άλλες εγγραφές σας δεν επηρεάζονται.' : 'You won’t receive more alerts for this event. Your bookings and other subscriptions are unchanged.'}</p>`, gr ? 'el' : 'en'));
        } catch {
            return res.status(503).send(page('Please try again', '<p>We couldn’t process your request. Please try again shortly.</p>'));
        }
    });

    async function queueCancellation(booking: { id: number; event_id: number; shift_id: number }, cancellationKey = `booking:${booking.id}:${crypto.randomUUID()}`) {
        const reservation = await db.from('bookings').select('status').eq('id', booking.id).maybeSingle();
        check(reservation);
        if (!reservation.data || !isCanceled(reservation.data.status)) return;
        const context = await eventContext(booking.event_id, booking.shift_id);
        if (!context || context.remaining < 1) return;
        // A real reservation cancellation reopens this shift and the event. Never reopen archived experiences.
        check(await db.from('shifts').update({ is_full: false, booked_spots: Number(context.shift.capacity) - context.remaining }).eq('id', booking.shift_id));
        check(await db.from('events').update({ is_sold_out: false }).eq('id', booking.event_id));
        for (let offset = 0; ; offset += 500) {
            const subscribers = await db.from('notify_email_subscriptions').select('id').eq('event_id', booking.event_id).eq('status', 'active').is('unsubscribed_at', null).order('id').range(offset, offset + 499);
            check(subscribers);
            if (!subscribers.data?.length) break;
            check(await db.from('event_notify_deliveries').upsert(subscribers.data.map(s => ({
                subscription_id: s.id, cancellation_key: cancellationKey, status: 'pending', attempt_count: 0,
            })), { onConflict: 'subscription_id,cancellation_key', ignoreDuplicates: true }));
            if (subscribers.data.length < 500) break;
        }
    }

    async function fulfill(eventId: number, email: string) {
        check(await db.from('notify_email_subscriptions').update({ status: 'fulfilled' }).eq('event_id', eventId).eq('email', email).eq('status', 'active'));
    }

    async function processQueue() {
        if (working || !options.secret) return;
        working = true;
        try {
            for (const [key, booking] of pendingCancellations) {
                try { await queueCancellation(booking, key); pendingCancellations.delete(key); }
                catch (error) { console.error(`Event alert queue retry ${key} failed:`, error); }
            }
            if (!options.emailEnabled()) return;
            const cutoff = new Date(Date.now() - MAX_RETRY_AGE_MS).toISOString();
            // Never retry an ambiguous send beyond Resend's 24-hour idempotency window.
            check(await db.from('event_notify_deliveries').update({ status: 'expired' }).in('status', ['pending', 'failed']).lt('created_at', cutoff));
            const jobs = await db.from('event_notify_deliveries').select('*').in('status', ['pending', 'failed']).lt('attempt_count', MAX_ATTEMPTS).gte('created_at', cutoff).order('attempt_count').order('created_at').limit(50);
            check(jobs);
            const mapping = jobs.data?.length ? await db.from('email_purposes')
                .select('email_templates(*)').eq('purpose', 'event_availability_alert').maybeSingle() : { data: null, error: null };
            check(mapping);
            const alertTemplate = mapping.data?.email_templates as any;
            for (const job of jobs.data || []) {
                const age = Date.now() - Date.parse(job.created_at);
                if (job.attempt_count > 0 && age < Math.min(60_000 * 2 ** job.attempt_count, 3_600_000)) continue;
                // Optimistic claim supports overlapping workers; a crashed process can retry next minute.
                const claim = await db.from('event_notify_deliveries').update({ attempt_count: job.attempt_count + 1 })
                    .eq('id', job.id).eq('attempt_count', job.attempt_count).in('status', ['pending', 'failed']).select('id');
                check(claim);
                if (!claim.data?.length) continue;
                try {
                    const result = await db.from('notify_email_subscriptions').select('*').eq('id', job.subscription_id).maybeSingle();
                    check(result);
                    const subscription = result.data;
                    const bookingId = /^booking:(\d+):/.exec(job.cancellation_key)?.[1];
                    const bookingResult = bookingId ? await db.from('bookings').select('id,event_id,shift_id,status').eq('id', Number(bookingId)).maybeSingle() : { data: null, error: null };
                    check(bookingResult);
                    const booking = bookingResult.data;
                    const context = subscription && booking && booking.event_id === subscription.event_id && isCanceled(booking.status)
                        ? await eventContext(subscription.event_id, booking.shift_id) : null;
                    if (!subscription || subscription.status !== 'active' || subscription.unsubscribed_at || Date.parse(subscription.created_at) > Date.parse(job.created_at) || !context || context.remaining < 1 || context.event.is_sold_out || context.shift.is_full) {
                        check(await db.from('event_notify_deliveries').update({ status: 'skipped' }).eq('id', job.id));
                        continue;
                    }
                    const token = tokenFor(subscription.id);
                    if (hash(token) !== subscription.unsubscribe_token_hash) throw new Error('Event alert unsubscribe token does not match configuration');
                    const unsubscribeUrl = `${serverUrl}/api/notify-me/unsubscribe/${subscription.id}?token=${token}`;
                    const bookingUrl = `${siteUrl}/#event/${encodeURIComponent(context.event.slug)}`;
                    const gr = subscription.email_language === 'el';
                    const date = new Date(athensTimestamp(context.shift.start_time)).toLocaleString(gr ? 'el-GR' : 'en-GB', { timeZone: 'Europe/Athens', dateStyle: 'full', timeStyle: 'short' });
                    const message = renderEventAlert(alertTemplate, { language: gr ? 'el' : 'en',
                        event: context.event.title, date, location: context.event.location_name || '',
                        booking_url: bookingUrl, unsubscribe_url: unsubscribeUrl });
                    const sent = await send({ from, to: subscription.email, ...message }, { idempotencyKey: `event-alert/${job.id}` });
                    await new Promise(resolve => setTimeout(resolve, options.paceMs ?? 600));
                    if (sent.error || !sent.data?.id) throw new Error('Resend did not accept the event alert');
                    check(await db.from('event_notify_deliveries').update({ status: 'sent', sent_at: new Date().toISOString(), resend_email_id: sent.data.id }).eq('id', job.id));
                } catch (error) {
                    console.error(`Event alert delivery ${job.id} failed:`, error);
                    check(await db.from('event_notify_deliveries').update({ status: 'failed' }).eq('id', job.id));
                }
            }
        } catch (error) {
            console.error('Event alert worker failed:', error);
        } finally { working = false; }
    }

    async function afterCancellation(booking: { id: number; event_id: number; shift_id: number }) {
        const key = `booking:${booking.id}:${crypto.randomUUID()}`;
        pendingCancellations.set(key, booking);
        // A stable key makes queue-write retries safe even if an earlier response was lost.
        for (let attempt = 0; attempt < 3; attempt++) {
            try { await queueCancellation(booking, key); pendingCancellations.delete(key); void processQueue(); return; }
            catch (error) {
                if (attempt === 2) throw error;
            }
        }
    }

    async function cancelReservations(bookingIds: number[]) {
        const changed = await db.from('bookings').update({ status: 'canceled' }).in('id', bookingIds)
            .or('status.is.null,status.not.in.(canceled,cancelled)').select('id,event_id,shift_id');
        check(changed);
        for (const booking of changed.data || []) {
            try { await afterCancellation(booking); }
            catch (error) { console.error(`Could not queue event alerts for canceled booking ${booking.id}:`, error); }
        }
        return changed.data || [];
    }

    return { router, afterCancellation, cancelReservations, queueCancellation, processQueue, fulfill };
}
