import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncResendContact } from './newsletter.js';

test('creates contacts and adds only to configured newsletter segment', async () => {
    process.env.RESEND_NEWSLETTER_API_KEY = 'test-key';
    process.env.RESEND_NEWSLETTER_SEGMENT_ID = 'segment-test';
    const original = globalThis.fetch;
    const calls: any[] = [];
    globalThis.fetch = (async (url: string, options: any) => {
        calls.push({ url, ...options });
        if (options.method === 'GET') return new Response('{}', { status: 404 });
        return new Response(JSON.stringify({ id: 'contact-test' }), { status: 200 });
    }) as typeof fetch;
    try {
        assert.equal(await syncResendContact('person@example.com'), 'contact-test');
        assert.equal(calls.length, 3);
        assert.equal(calls[2].url, 'https://api.resend.com/contacts/contact-test/segments/segment-test');
        assert.equal(calls[0].headers.Authorization, 'Bearer test-key');
    } finally { globalThis.fetch = original; }
});

test('migration never reactivates an existing provider unsubscribe', async () => {
    const original = globalThis.fetch;
    let count = 0;
    globalThis.fetch = (async () => {
        count++;
        return new Response(JSON.stringify({ id: 'contact-test', unsubscribed: true }), { status: 200 });
    }) as typeof fetch;
    try {
        await assert.rejects(syncResendContact('person@example.com'), /unsubscribed/);
        assert.equal(count, 1);
    } finally { globalThis.fetch = original; }
});
