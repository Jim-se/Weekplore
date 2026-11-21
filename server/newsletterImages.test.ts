import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageExtension, sanitizeNewsletterHtml } from './newsletterImages.js';
import { broadcastHtml } from './newsletterBroadcast.js';

test('newsletter images survive sanitizing and broadcast rendering without unsafe attributes', () => {
    const input = '<p>Hello</p><img src="https://example.com/image.jpg" alt="Event" onerror="alert(1)"><script>bad()</script>';
    const html = sanitizeNewsletterHtml(input);
    assert.ok(html.includes('https://example.com/image.jpg'));
    assert.ok(html.includes('max-width:100%'));
    assert.ok(!html.includes('onerror'));
    assert.ok(!html.includes('<script>'));
    assert.ok(broadcastHtml(html, '').includes('https://example.com/image.jpg'));
    assert.ok(!sanitizeNewsletterHtml('<img src="javascript:alert(1)">').includes('javascript:'));
    assert.ok(!sanitizeNewsletterHtml('<img src="data:image/svg+xml,abc">').includes('data:'));
});

test('image upload rejects wrong signatures and SVG', () => {
    assert.equal(imageExtension(Buffer.from('<svg/>'), 'image/png'), null);
    assert.equal(imageExtension(Buffer.from([255,216,255,0]), 'image/jpeg'), 'jpg');
    assert.equal(imageExtension(Buffer.from([137,80,78,71,13,10,26,10]), 'image/png'), 'png');
    assert.equal(imageExtension(Buffer.from('RIFF0000WEBP'), 'image/webp'), 'webp');
});

test('chosen image width survives email sanitizing and broadcast rendering', () => {
    const input = '<img src="https://example.com/photo.jpg" width="240" height="500">';
    const html = sanitizeNewsletterHtml(input);
    assert.ok(html.includes('width="240"'));
    assert.ok(html.includes('height:auto'));
    assert.ok(!html.includes('height="500"'));
    assert.ok(broadcastHtml(html, '').includes('width="240"'));
    assert.ok(sanitizeNewsletterHtml('<img src="https://example.com/a.jpg" width="99999">').includes('width="1200"'));
    assert.ok(!sanitizeNewsletterHtml('<img src="https://example.com/a.jpg" width="bad">').includes('width="bad"'));
});
