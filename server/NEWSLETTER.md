# Newsletter providers

The active backend is `server/index.ts`. Booking mail uses `RESEND_API_KEY` independently.

## Resend (default)

Set these backend environment variables locally and on Railway:

- `NEWSLETTER_PROVIDER=resend` (also the default when absent)
- `RESEND_NEWSLETTER_API_KEY`: full-access newsletter key
- `RESEND_NEWSLETTER_SEGMENT_ID`: `4f65d44a-6877-4824-849a-c348f517f224`
- `RESEND_NEWSLETTER_FROM`: optional; defaults to `Weekplore <hello@weekplore.gr>`. The domain must be verified in Resend.
- `RESEND_NEWSLETTER_WEBHOOK_SECRET`: Resend's signing secret, obtained when registering the webhook

After deployment, register `https://weekplore-server-production.up.railway.app/api/newsletter/resend-webhook` in Resend for `contact.updated`, then copy its signing secret to Railway and local settings. Raw request bodies are required for signature verification; this route runs before the JSON parser. Never use the Brevo webhook secret here.

Existing active subscribers can be copied from Supabase using `npx tsx migrate-newsletter-resend.ts` from `server`. It sends no emails, skips local unsubscribes, and never reactivates provider unsubscribes. Use during a quiet period; avoid simultaneous signup activity or other Resend traffic during migration.

Signup saves consent in Supabase, then creates/updates the Resend contact and adds it to the configured segment. An explicit signup may reactivate a subscriber; migration cannot. Brevo IDs are retained. No automatic retries are enabled.

Draft saving and subscriber listing remain in Supabase. Test sending uses `/emails` to the single entered address, consumes transactional sending quota, and does not subscribe that address. It is an HTML preview, not a test of Broadcast-specific unsubscribe rendering or branding. Send now and Schedule for later use the Broadcasts API and persist `resend_broadcast_id`. Athens local times are converted on the server; ambiguous or nonexistent daylight-saving times are rejected. Atomic draft claiming prevents duplicate submissions. Resend acceptance is recorded as queued or scheduled, not delivered. A sending state after an error requires checking the saved Broadcast in Resend before manually resolving it; never blindly reset and resend. A backend worker queries due newsletter records once per minute. Scheduled emails are first checked roughly 1–2 minutes after their send time; subsequent checks back off ten minutes. Queued immediate sends are checked after one minute. The worker never sends email. Due records survive restarts in Supabase. The browser has no polling timer, and opening/refreshing the list only reads Supabase. Scheduled cancellation checks provider state before cancellation and retains a read-only canceled snapshot locally. Sent status means the Broadcast was sent, not that every recipient received it. The Emails list includes all persisted statuses; non-drafts are read-only. `scheudled_at` is the existing misspelled database column; do not rename it without a coordinated migration.

## Returning to Brevo

Preserved implementation: `newsletterBrevo.ts`, `newsletterWebhook.ts`, and the Brevo branch of the admin send-test route. Existing configuration script: `configure-newsletter-webhook.mjs`.

1. Export/reconcile subscription state, including unsubscribes, from Resend into Supabase.
2. Resolve/cancel pending sends before changing providers (once scheduling is implemented).
3. Configure `BREVO_API_KEY`, `BREVO_NEWSLETTER_LIST_ID`, and `BREVO_WEBHOOK_SECRET`; verify the Brevo sender/domain.
4. Reconcile active and unsubscribed contacts into Brevo. Do not assume its older list is current.
5. Set `NEWSLETTER_PROVIDER=brevo`, deploy, and activate/test the Brevo webhook.

The inactive Brevo webhook acknowledges without changing subscription state. Disable obsolete provider webhooks after cutover. Keep prior IDs for history; do not mix provider IDs. Selecting a provider alone is not a complete data migration.
