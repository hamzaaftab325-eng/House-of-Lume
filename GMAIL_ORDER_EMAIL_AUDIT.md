# Gmail order-email update — 14 October 2026

Owner authorization: use `dwellunestore@gmail.com` for store emails and replies; reuse the Google App Password configured securely in Vercel Production. No cloud browser or sending-domain purchase is required. Supabase Auth SMTP remains unchanged.

## Implemented

- Server-only Nodemailer SMTP adapter, exact pinned dependency and lockfile; TLS on Gmail port 465, bounded connection/socket timeouts, no attachment file/URL access, no raw SMTP logging.
- Capability-protected POST worker with strict actions and bounded JSON. Browser callers and arbitrary test recipients are rejected. The diagnostic test recipient is the exact owner-supplied `hamzaaftab325@gmail.com`.
- Existing minute Supabase cron calls the canonical production URL with its Vault capability. No browser session, in-process scheduler or service-role credential is involved. Gmail password stays solely in Vercel.
- One durable queue lease per invocation. A second invocation cannot claim a sending job. Acknowledgement validates the UUID lease. Temporary explicit rejection or failure before DATA retries with bounded backoff; permanent rejection alerts staff.
- SMTP lacks provider idempotency. Ambiguous acceptance or worker/acknowledgement crash requires manual review, with no automatic resend. Stable Message-ID is diagnostic only. Provider acceptance is never represented as verified inbox delivery.
- Hourly SMTP authentication verification, private health state, readiness fails closed after verification failure or stale health. Order placement remains disabled independently of SMTP readiness.

## Verification before the single push

- 113 application tests in 20 files passed, including secret/Unicode denial, arbitrary-recipient denial, TLS configuration, claimed payload, acknowledged acceptance, SMTP error classification, ambiguous acceptance and failed acknowledgements.
- Real database rollback test passed capability/RLS denial, claim dedupe, wrong lease denial, backoff, uncertain/expired sends, operator-alert dedupe, single finalization and closed checkout. No surviving fixture orders/emails.
- Formatting, zero-warning lint, TypeScript, production build and runtime dependency audit passed; audit found zero vulnerabilities.
- All 59 local Chromium browser regression scenarios passed under CI settings. Existing Cloudinary fixture DNS warnings do not establish live image acceptance; no cloud browser was opened.
- Security advisor INFO on the private queue/receipt/health tables is intentional deny-all access. Existing Auth leaked-password-protection warning remains external configuration; no new actionable warning introduced.

## Live acceptance and operating limits

After the single production push, verify SMTP authentication on the live worker, submit one clearly labelled setup-test email to the owner inbox, and inspect the minute scheduler. Owner must confirm actual receipt and reply behavior; SMTP acceptance alone is insufficient. Live order receipt/totals acceptance also needs a merchant-confirmed real product.

The worker handles at most one claimed order email per minute. Gmail account quotas and shared Auth usage must be monitored; this is a small-store transactional adapter, not a bulk-mail facility. During temporary rejection, jobs back off. After five attempts or 22 hours they require operator attention. Before real ordering is enabled, agree a send budget and monitoring against the account's actual quota and test guest/customer checkout with confirmed inventory and merchant return arrangements. No Phase 8 100% claim is made.
