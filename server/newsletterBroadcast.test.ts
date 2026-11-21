import { newsletterStatusDue } from './newsletterBroadcast.js';
import { syncBroadcastStatus } from './newsletterBroadcast.js';
import { cancelScheduledBroadcast } from './newsletterBroadcast.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { athensSchedule, broadcastHtml, dispatchBroadcast } from './newsletterBroadcast.js';

test('Athens scheduling converts winter/summer and rejects DST gaps and overlaps', () => {
    const original = Date.now;
    Date.now = () => Date.parse('2026-01-01T00:00:00Z');
    try {
        assert.equal(athensSchedule('2026-02-10T10:30'), '2026-02-10T08:30:00.000Z');
        assert.equal(athensSchedule('2026-07-10T10:30'), '2026-07-10T07:30:00.000Z');
        assert.throws(() => athensSchedule('2026-03-29T03:30'));
        assert.throws(() => athensSchedule('2026-10-25T03:30'));
        assert.throws(() => athensSchedule('2025-01-01T10:00'));
        assert.equal(athensSchedule(null), null);
    } finally { Date.now = original; }
    const html = broadcastHtml('<script>alert(1)</script><p>Hello</p>', '');
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('{{{RESEND_UNSUBSCRIBE_URL}}}'));
});

test('persists broadcast ID before sending and blocks repeated submissions', async () => {
    process.env.RESEND_NEWSLETTER_SEGMENT_ID = 'segment';
    process.env.RESEND_NEWSLETTER_API_KEY = 'test-key';
    let state = 'draft';
    let broadcastId: string | null = null;
    const calls: any[] = [];
    const db: any = { from: () => ({ update: (values: any) => {
        const q: any = { eq: () => q, select: () => q,
            maybeSingle: async () => {
                if (state !== 'draft') return { data: null };
                state = values.status;
                return { data: { id: 'email', subject: 'Hello', body_html: '<p>Message</p>' } };
            },
            single: async () => { state = values.status; return { data: { status: state } }; },
            then: (resolve: any) => { if (values.resend_broadcast_id) broadcastId = values.resend_broadcast_id; resolve({ error: null }); },
        }; return q;
    } }) };
    const original = globalThis.fetch;
    globalThis.fetch = (async (url: string, options: any) => {
        calls.push({ url, body: JSON.parse(options.body) });
        if (url.endsWith('/send')) assert.equal(broadcastId, 'broadcast');
        return new Response(JSON.stringify({ id: 'broadcast' }), { status: 200 });
    }) as typeof fetch;
    try {
        const schedule = '2027-01-01T10:00:00Z';
        await dispatchBroadcast(db, 'email', schedule);
        assert.equal(state, 'scheduled');
        assert.equal(calls[0].body.segment_id, 'segment');
        assert.equal(calls[1].body.scheduled_at, schedule);
        await assert.rejects(dispatchBroadcast(db, 'email', null));
        assert.equal(calls.length, 2);
    } finally { globalThis.fetch = original; }
});

test('cancellation stops if Resend says sending has already completed', async () => {
    process.env.RESEND_NEWSLETTER_API_KEY = 'test-key';
    const original = globalThis.fetch;
    let calls = 0;
    const db: any = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { status: 'scheduled', resend_broadcast_id: 'broadcast' } }) }) }) }) };
    globalThis.fetch = (async () => { calls++; return new Response(JSON.stringify({ status: 'sent' })); }) as typeof fetch;
    try {
        await assert.rejects(cancelScheduledBroadcast(db, 'email'), /no longer scheduled/);
        assert.equal(calls, 1);
    } finally { globalThis.fetch = original; }
});
test('successful cancellation is persisted only after provider acceptance', async () => {
    const original = globalThis.fetch;
    let calls = 0;
    let saved = '';
    const db: any = { from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { status: 'scheduled', resend_broadcast_id: 'broadcast' } }) }) }),
        update: (value: any) => { assert.equal(calls, 2); saved = value.status; const q: any = { eq: () => q, select: () => q, single: async () => ({ data: { status: saved } }) }; return q; },
    }) };
    globalThis.fetch = (async () => { calls++; return new Response(JSON.stringify({ status: 'scheduled' })); }) as typeof fetch;
    try { assert.equal((await cancelScheduledBroadcast(db, 'email')).status, 'canceled'); }
    finally { globalThis.fetch = original; }
});

test('status sync saves provider sent time and never sends an email', async () => {
    const original = globalThis.fetch;
    let values: any;
    const guards: any[] = [];
    const db: any = { from: () => ({ update: (update: any) => { values = update; const q: any = { eq: (key: any, value: any) => { guards.push([key,value]); return q; }, then: (resolve: any) => resolve({error:null}) }; return q; } }) };
    globalThis.fetch = (async (_url: any, options: any) => {
        assert.equal(options.method, 'GET');
        return new Response(JSON.stringify({ status: 'sent', sent_at: '2026-11-20T14:22:29.518Z' }));
    }) as typeof fetch;
    try {
        await syncBroadcastStatus(db, { id:'email', status:'queued', resend_broadcast_id:'broadcast' });
        assert.equal(values.status,'sent');
        assert.equal(values.sent_at,'2026-11-20T14:22:29.518Z');
        assert.ok(guards.some(([key,value]) => key==='status' && value==='queued'));
    } finally { globalThis.fetch=original; }
});

test('status worker waits until one minute after schedule and backs off after checking', () => {
    const scheduled = Date.parse('2027-01-01T10:00:00Z');
    const row = { status:'scheduled', scheudled_at:new Date(scheduled).toISOString(), updated_at:new Date(scheduled-3600000).toISOString() };
    assert.equal(newsletterStatusDue(row,scheduled+59000),false);
    assert.equal(newsletterStatusDue(row,scheduled+61000),true);
    row.updated_at=new Date(scheduled+61000).toISOString();
    assert.equal(newsletterStatusDue(row,scheduled+120000),false);
    assert.equal(newsletterStatusDue(row,scheduled+661000),true);
});
