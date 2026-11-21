import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import { athensTimestamp, createEventNotifications, eventAcceptsAlerts, normalizeAlertEmail, remainingPlaces } from './eventNotifications.js';
import { renderEventAlert, validateEventAlertTemplate } from './eventAlertTemplate.js';

// An in-memory Supabase boundary: no real customer records or email provider are used.
function database(seed: Record<string, any[]>) {
    const tables = structuredClone(seed);
    const db: any = { from(table: string) {
        const filters: ((r: any) => boolean)[] = [];
        let operation = 'select', payload: any, conflict: string[] = [], ignore = false;
        let start = 0, end = Infinity, one = false, sort: string | undefined;
        const q: any = {
            select: () => q,
            update: (data: any) => { operation = 'update'; payload = data; return q; },
            upsert: (data: any, options: any) => { operation = 'upsert'; payload = Array.isArray(data) ? data : [data]; conflict = options.onConflict.split(','); ignore = options.ignoreDuplicates; return q; },
            eq: (key: string, value: any) => { filters.push(r => r[key] === value); return q; },
            is: (key: string, value: any) => { filters.push(r => (r[key] ?? null) === value); return q; },
            in: (key: string, values: any[]) => { filters.push(r => values.includes(r[key])); return q; },
            or: (expression: string) => { assert.equal(expression, 'status.is.null,status.not.in.(canceled,cancelled)'); filters.push(r => !['canceled', 'cancelled'].includes(r.status)); return q; },
            lt: (key: string, value: any) => { filters.push(r => r[key] < value); return q; },
            gte: (key: string, value: any) => { filters.push(r => r[key] >= value); return q; },
            range: (a: number, b: number) => { start = a; end = b + 1; return q; },
            limit: (value: number) => { end = value; return q; },
            order: (key: string) => { sort = key; return q; },
            single: () => { one = true; return q; },
            maybeSingle: () => { one = true; return q; },
            then: (resolve: any, reject: any) => Promise.resolve().then(() => {
                const rows = tables[table] ||= [];
                if (operation === 'upsert') for (const row of payload) {
                    const old = rows.find(r => conflict.every(k => r[k] === row[k]));
                    if (old) { if (!ignore) Object.assign(old, row); }
                    else rows.push({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row });
                }
                let matching = rows.filter(r => filters.every(f => f(r)));
                if (operation === 'update') matching.forEach(r => Object.assign(r, payload));
                if (sort) matching = matching.sort((a, b) => String(a[sort!]).localeCompare(String(b[sort!])));
                matching = matching.slice(start, end);
                return { data: structuredClone(one ? matching[0] || null : matching), error: null };
            }).then(resolve, reject),
        };
        return q;
    } };
    return { db, tables };
}

function fixture() {
    const future = new Date(Date.now() + 7 * 86400000).toISOString();
    const { db, tables } = database({
        events: [{ id: 1, title: 'Clay & <Coffee>', slug: 'clay-coffee', is_hidden: false, is_sold_out: true, status: 'active', booking_deadline: future }],
        shifts: [{ id: 2, event_id: 1, capacity: 10, booked_spots: 10, start_time: future, is_full: true, is_active: true }],
        bookings: [{ id: 3, event_id: 1, shift_id: 2, status: 'canceled', number_of_people: 2 }, { id: 4, event_id: 1, shift_id: 2, status: 'pending', number_of_people: 8 }],
        notify_email_subscriptions: [], event_notify_deliveries: [],
    });
    const emails: any[] = [];
    let fail = false;
    const notifications = createEventNotifications({ db, serverUrl: 'https://api.example.com', siteUrl: 'https://example.com',
        secret: 'test-secret', from: 'info@example.com', emailEnabled: () => true, paceMs: 0,
        send: async (message, options) => { emails.push({ ...message, ...options }); return fail ? { error: 'unavailable' } : { data: { id: 'resend-test' } }; },
    });
    return { db, tables, emails, notifications, setFail: (value: boolean) => { fail = value; } };
}

async function withApi(f: ReturnType<typeof fixture>, run: (url: string) => Promise<void>) {
    const app = express(); app.use(express.json()); app.use('/api', f.notifications.router);
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address() as { port: number };
    try { await run(`http://127.0.0.1:${address.port}/api`); }
    finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}

async function subscribe(url: string, email: string, eventId = 1, language = 'en') {
    return fetch(`${url}/notify-me`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, email, email_language: language }) });
}

test('validates emails, respects Athens time, closed events and canceled group capacity', () => {
    assert.equal(normalizeAlertEmail(' Person@Example.com '), 'person@example.com');
    for (const email of [null, 'invalid', 'a b@example.com', 'a'.repeat(255) + '@example.com']) assert.equal(normalizeAlertEmail(email), null);
    assert.equal(athensTimestamp('2030-07-01T12:00:00'), Date.parse('2030-07-01T09:00:00Z'));
    assert.equal(athensTimestamp('2030-01-01T12:00:00'), Date.parse('2030-01-01T10:00:00Z'));
    assert.equal(athensTimestamp('2030-07-01T12:00:00Z'), Date.parse('2030-07-01T12:00:00Z'));
    assert.equal(eventAcceptsAlerts({ status: 'archived', booking_deadline: '2099-01-01' }), false);
    assert.equal(eventAcceptsAlerts({ is_hidden: true, booking_deadline: '2099-01-01' }), false);
    assert.equal(eventAcceptsAlerts({ booking_deadline: '2020-01-01' }), false);
    assert.equal(remainingPlaces({ capacity: 10 }, [{ status: 'pending', number_of_people: 8 }, { status: 'cancelled', number_of_people: 2 }]), 2);
});

test('email-only subscriptions deduplicate, reject invalid/closed events and rate-limit requests', async () => {
    const f = fixture();
    await withApi(f, async url => {
        assert.equal((await subscribe(url, ' PERSON@example.com ')).status, 200);
        assert.equal((await subscribe(url, 'person@example.com')).status, 200);
        assert.equal(f.tables.notify_email_subscriptions.length, 1);
        assert.equal(f.tables.notify_email_subscriptions[0].email, 'person@example.com');
        assert.equal(f.tables.notify_email_subscriptions[0].unsubscribe_token_hash.length, 64);
        assert.equal((await subscribe(url, 'invalid')).status, 400);
        assert.equal((await subscribe(url, 'person@example.com', 999)).status, 400);
        f.tables.events[0].is_hidden = true;
        assert.equal((await subscribe(url, 'person@example.com')).status, 400);
        for (let i = 0; i < 5; i++) await subscribe(url, 'invalid');
        assert.equal((await subscribe(url, 'person@example.com')).status, 429);
    });
});

test('each new cancellation alerts all active subscribers, duplicate queueing does not resend', async () => {
    const f = fixture();
    await withApi(f, async url => {
        await subscribe(url, 'one@example.com'); await subscribe(url, 'two@example.com', 1, 'el');
        await f.notifications.queueCancellation(f.tables.bookings[0], 'booking:3:first');
        assert.equal(f.tables.events[0].is_sold_out, false);
        assert.equal(f.tables.shifts[0].is_full, false);
        assert.equal(f.tables.shifts[0].booked_spots, 8);
        await f.notifications.queueCancellation(f.tables.bookings[0], 'booking:3:first');
        assert.equal(f.tables.event_notify_deliveries.length, 2);
        await f.notifications.processQueue();
        assert.equal(f.emails.length, 2);
        assert.ok(f.emails.some(e => e.subject.startsWith('Ελευθερώθηκαν')));
        assert.ok(f.emails.some(e => e.subject.startsWith('Places')));
        assert.ok(f.emails.every(e => e.html.includes('Clay &amp; &lt;Coffee&gt;')));
        assert.ok(f.emails.every(e => e.html.includes('https://example.com/#event/clay-coffee')));
        assert.ok(f.tables.event_notify_deliveries.every(d => d.status === 'sent' && d.resend_email_id));
        await f.notifications.processQueue(); assert.equal(f.emails.length, 2);
        // A restored booking canceled again is a new occurrence and alerts both people again.
        await f.notifications.queueCancellation(f.tables.bookings[0], 'booking:3:second');
        await f.notifications.processQueue(); assert.equal(f.emails.length, 4);
    });
});

test('unsubscribe GET is read-only, POST stops this event only, tampered tokens fail and rejoin works', async () => {
    const f = fixture();
    await withApi(f, async url => {
        await subscribe(url, 'one@example.com');
        f.tables.notify_email_subscriptions.push({ id: crypto.randomUUID(), event_id: 99, email: 'one@example.com', status: 'active' });
        await f.notifications.queueCancellation(f.tables.bookings[0], 'booking:3:first');
        await f.notifications.processQueue();
        const link = /https:\/\/api.example.com\/api\/notify-me\/unsubscribe\/[^\s)]+/.exec(f.emails[0].text)![0];
        const parsed = new URL(link);
        const local = `${url}${parsed.pathname.replace('/api', '')}${parsed.search}`;
        const record = f.tables.notify_email_subscriptions[0];
        assert.equal((await fetch(local)).status, 200); assert.equal(record.status, 'active');
        assert.equal((await fetch(`${local}x`)).status, 400);
        const body = new URLSearchParams({ token: parsed.searchParams.get('token')! });
        assert.equal((await fetch(local.split('?')[0], { method: 'POST', body })).status, 200);
        assert.equal(record.status, 'unsubscribed'); assert.ok(record.unsubscribed_at);
        assert.equal(f.tables.notify_email_subscriptions[1].status, 'active');
        await f.notifications.queueCancellation(f.tables.bookings[0], 'booking:3:second');
        await f.notifications.processQueue(); assert.equal(f.emails.length, 1);
        await subscribe(url, 'one@example.com'); assert.equal(record.status, 'active');
        assert.equal(f.tables.notify_email_subscriptions.filter(s => s.event_id === 1).length, 1);
    });
});

test('queued alerts skip unsubscribed, booked, closed, refilled, or restored reservations', async () => {
    for (const change of ['unsubscribe', 'book', 'archive', 'refill', 'restore', 'deadline']) {
        const f = fixture();
        await withApi(f, async url => {
            await subscribe(url, 'one@example.com');
            await f.notifications.queueCancellation(f.tables.bookings[0], 'booking:3:first');
            if (change === 'unsubscribe') f.tables.notify_email_subscriptions[0].status = 'unsubscribed';
            if (change === 'book') await f.notifications.fulfill(1, 'one@example.com');
            if (change === 'archive') f.tables.events[0].status = 'archived';
            if (change === 'deadline') f.tables.events[0].booking_deadline = '2000-01-01T12:00:00';
            if (change === 'refill') f.tables.bookings[1].number_of_people = 10;
            if (change === 'restore') f.tables.bookings[0].status = 'pending';
            await f.notifications.processQueue();
            assert.equal(f.emails.length, 0, change);
            assert.equal(f.tables.event_notify_deliveries[0].status, 'skipped', change);
        });
    }
});

test('failed sends remain retryable with the same provider key; old ambiguous sends expire', async () => {
    const f = fixture();
    await withApi(f, async url => {
        await subscribe(url, 'one@example.com');
        await f.notifications.queueCancellation(f.tables.bookings[0], 'booking:3:first');
        f.setFail(true);
        await f.notifications.processQueue();
        const job = f.tables.event_notify_deliveries[0];
        assert.equal(job.status, 'failed'); assert.equal(job.attempt_count, 1);
        f.setFail(false); job.created_at = new Date(Date.now() - 10 * 60000).toISOString();
        f.tables.notify_email_subscriptions[0].created_at = new Date(Date.now() - 20 * 60000).toISOString();
        await f.notifications.processQueue();
        assert.equal(job.status, 'sent'); assert.equal(f.emails[0].idempotencyKey, f.emails[1].idempotencyKey);
        await f.notifications.queueCancellation(f.tables.bookings[0], 'booking:3:second');
        f.tables.event_notify_deliveries[1].created_at = new Date(Date.now() - 25 * 3600000).toISOString();
        await f.notifications.processQueue();
        assert.equal(f.tables.event_notify_deliveries[1].status, 'expired');
        assert.equal(f.emails.length, 2);
    });
});

test('shared customer/admin cancellation keeps booking history and triggers only real status transitions', async () => {
    const f = fixture();
    await withApi(f, async url => {
        await subscribe(url, 'one@example.com');
        f.tables.bookings[0].status = 'pending';
        assert.equal((await f.notifications.cancelReservations([3])).length, 1);
        assert.equal(f.tables.bookings.length, 2);
        assert.equal(f.tables.bookings[0].status, 'canceled');
        assert.equal(f.tables.event_notify_deliveries.length, 1);
        assert.equal((await f.notifications.cancelReservations([3])).length, 0);
        assert.equal(f.tables.event_notify_deliveries.length, 1);
        f.tables.bookings[0].status = 'pending';
        assert.equal((await f.notifications.cancelReservations([3])).length, 1);
        assert.equal(f.tables.event_notify_deliveries.length, 2);
        assert.notEqual(f.tables.event_notify_deliveries[0].cancellation_key, f.tables.event_notify_deliveries[1].cancellation_key);
    });
});

test('admin-assigned Notify Me template is used in each subscriber’s language and later edits take effect', async () => {
    const f = fixture();
    f.tables.email_purposes = [{ purpose: 'event_availability_alert', email_templates: {
        subject_eng: 'Come join us at {event}', body_eng: 'A place opened for {event} on {date}.\n{booking_url}\n{unsubscribe_url}',
        subject_el: 'Ελάτε στο {event}', body_el: '<p>Ελευθερώθηκαν θέσεις για {event} στις {date}!</p><p>{booking_url}</p><p>{unsubscribe_url}</p>',
    } }];
    await withApi(f, async url => {
        await subscribe(url, 'english@example.com'); await subscribe(url, 'greek@example.com', 1, 'el');
        await f.notifications.queueCancellation(f.tables.bookings[0], 'booking:3:custom');
        await f.notifications.processQueue();
        const english = f.emails.find(e => e.to === 'english@example.com');
        const greek = f.emails.find(e => e.to === 'greek@example.com');
        assert.equal(english.subject, 'Come join us at Clay & <Coffee>');
        assert.equal(greek.subject, 'Ελάτε στο Clay & <Coffee>');
        assert.ok(english.html.includes('A place opened for Clay &amp; &lt;Coffee&gt;'));
        assert.ok(greek.html.includes('Ελευθερώθηκαν θέσεις για Clay &amp; &lt;Coffee&gt;'));
        assert.ok(english.html.includes('Stop alerts for this event'));
        assert.ok(greek.html.includes('Διακοπή ειδοποιήσεων'));
        f.tables.email_purposes[0].email_templates.subject_eng = 'Updated: {event}';
        await f.notifications.queueCancellation(f.tables.bookings[0], 'booking:3:edited');
        await f.notifications.processQueue();
        assert.equal(f.emails.filter(e => e.to === 'english@example.com')[1].subject, 'Updated: Clay & <Coffee>');
    });
});

test('editable alert templates sanitize HTML and render each manually placed link once', () => {
    const message = renderEventAlert({ subject_eng: '{event}\nHello', body_el: '{booking_url} {unsubscribe_url}', body_eng: '<script>danger()</script><p onclick="bad()">{event} at {location}</p><a href="javascript:bad()">bad</a><a href="{booking_url}">Book</a><a href="{unsubscribe_url}">Stop</a>' }, {
        language: 'en', event: '$& <img src=x onerror=bad()>', location: '<Town>', date: 'Tomorrow',
        booking_url: 'https://example.com/#event/test', unsubscribe_url: 'https://api.example.com/stop?token=test',
    });
    assert.equal(message.subject, '$& <img src=x onerror=bad()> Hello');
    assert.ok(!message.html.includes('<script'));
    assert.ok(!message.html.includes('onclick='));
    assert.ok(!message.html.includes('href="javascript:'));
    assert.ok(message.html.includes('$&amp; &lt;img'));
    assert.ok(message.html.includes('https://example.com/#event/test'));
    assert.ok(message.html.includes('https://api.example.com/stop?token=test'));
    assert.ok(message.html.includes('Places aren’t reserved'));
    assert.equal(message.html.split('https://example.com/#event/test').length - 1, 1);
    assert.equal(message.html.split('https://api.example.com/stop?token=test').length - 1, 1);
    assert.equal(message.text.split('https://example.com/#event/test').length - 1, 1);
    assert.equal(message.text.split('https://api.example.com/stop?token=test').length - 1, 1);
});

test('Notify Me templates require both real link placeholders in both languages', () => {
    assert.equal(validateEventAlertTemplate({ body_eng: '{booking_url} {unsubscribe_url}', body_el: '{booking_url} {unsubscribe_url}' }), null);
    assert.match(validateEventAlertTemplate({ body_eng: '{booking_url}', body_el: '{booking_url} {unsubscribe_url}' })!, /English/);
    assert.match(validateEventAlertTemplate({ body_eng: '{booking_url} {unsubscribe_url}', body_el: '{booking_url}' })!, /Greek/);
    assert.ok(validateEventAlertTemplate({ body_eng: '<!-- {booking_url} {unsubscribe_url} -->', body_el: '{booking_url} {unsubscribe_url}' }));
    assert.throws(() => renderEventAlert({ body_eng: 'No links', body_el: 'No links' }, { language: 'en', event: 'Test', date: '', location: '', booking_url: 'https://example.com', unsubscribe_url: 'https://example.com/stop' }), /must include both/);
});
