# Event availability alerts

Sold-out event cards and detail pages open an email-only Notify Me form. A subscription covers any shift for that event. It does not subscribe the email to the newsletter, reserve places, or assign priority.

## Existing Supabase tables

- `notify_email_subscriptions`: unique `(event_id, email)`; emails are normalized to lowercase by the backend. Statuses are `active`, `unsubscribed`, and `fulfilled`.
- `event_notify_deliveries`: unique `(subscription_id, cancellation_key)`. Statuses are `pending`, `failed`, `sent`, `skipped`, and `expired`. `attempt_count` is an integer. Each actual cancellation transition gets a fresh key.

Keep RLS enabled with no public access policies. The backend uses the service-role key. Existing foreign keys retain their configured deletion behavior; this feature does not add cascading deletes. No extra tables or database functions are required.

## Configuration

### Editing the alert email

In Admin → Email Templates, create or edit a template with English and Greek subject/body fields, then select it in the **Notify Me** assignment card. The existing `email_templates` and `email_purposes` tables store this configuration under purpose `event_availability_alert`; no additional schema changes are needed. With no assignment, the built-in bilingual email is used.

Supported placeholders: `{event}`, `{date}`, `{location}`, `{booking_url}`, `{unsubscribe_url}`. There is no name/group-size placeholder for these alerts. Both language bodies must contain `{booking_url}` and `{unsubscribe_url}` before the template can be assigned or an assigned template updated. Placeholders can be written as plain text (rendered as clickable links) or inside an HTML anchor's `href`. Links appear only where the owner places them; none are appended. The built-in default template contains both links. The availability disclaimer is appended. Plain-text and sanitized HTML bodies are supported. Changes apply when the next batch is sent. Previously assigned invalid templates will not send until corrected.

Use the existing `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `CANCEL_SECRET`, and `SERVER_URL`. `SERVER_URL` must point to the public backend for production unsubscribe/cancellation links. Any accidental path in this setting is stripped to its URL origin.

Optional `NOTIFY_ME_SECRET` overrides `CANCEL_SECRET` for unsubscribe signatures. Keep the signing secret stable: changing it invalidates old event alert links. A configured secret is required for subscriptions and sending. `SITE_URL` defaults to `https://weekplore.gr`; use `http://localhost:3000` when testing local booking links. Never put backend secrets into frontend environment variables.

## Cancellation and delivery

Customer cancellation and admin “Mark as Canceled” share the same guarded status transition. Customer cancellations now retain the booking and its products with status `canceled`, preserving admin history and email-log foreign keys. Repeating a cancellation does not send new alerts. Restoring a booking and canceling it again creates a fresh alert occurrence.

A successful cancellation recalculates the affected shift from non-canceled bookings. If the shift is active, still in the future, has places, and the event is visible and before its deadline, it clears the shift's full flag and the event's sold-out flag. Archived events/shifts are not reopened. Every active subscriber is queued; group size is not collected or used.

The worker runs immediately after queueing, at startup, and every minute. It checks current availability and subscription status before sending each email through the existing transactional Resend key. It skips alerts if the event closes, places fill, the canceled booking is restored, or the subscriber books/unsubscribes. Successful bookings mark that event's active subscription `fulfilled`.

Delivery rows persist for retries across restarts. Resend idempotency keys prevent a repeated delivery request from sending a second email within its 24-hour window. Retries are limited to eight attempts and 23 hours; older unsent rows expire. Queue writes retry immediately and then in memory every minute. Cancellation and queue insertion are separate database operations: a process crash before queue insertion, or a prolonged database failure followed by restart, can lose an alert occurrence. Strict transactional delivery would require a database outbox function/trigger in a future migration.

Unsubscribe links open a confirmation page; GET is read-only to avoid email-scanner unsubscribes. POST stops only that event's subscription. Resubmitting the Notify Me form explicitly reactivates it. Older queued alerts are skipped after reactivation.

## Verification

Run `npx tsx --test server/eventNotifications.test.ts` from the repository root. Tests use an in-memory database boundary and simulated email sender; they do not send real email or cancel customer reservations. For a production end-to-end test, use a dedicated test event and an approved recipient address.
