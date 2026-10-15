# Phase 11 Part 2 — Transactional event jobs

Status: implementation and release checks complete for supported events; final production push authorized. Full Phase 11 retains the acceptance limits below.

## Functional checklist

- [x] Durable jobs for receipt, COD verification, confirmation, cancellation and return-request receipt, including guest contact emails.
- [x] Versioned saved payloads and durable per-event/recipient receipts. Template upgrades do not resurrect an already recorded event. Retained receipts with no job prevent replay.
- [x] Deferred transaction producers run after order items and companion customer notices are saved. Only owned customer notices receive linked email-delivery records.
- [x] Private attempt/status/error log and per-job failure alerts. The worker retains its original lease, bounded-backoff and uncertain-send review rules.
- [x] Admin delivery view includes event and template version without contact addresses, payloads or credentials.
- [x] Future templates prepared for packed, shipped, out for delivery, delivered, delivery failed, return update and RTO update. The database and worker permit only the five current events. Abandoned-cart email remains disabled.
- [x] Formatting, lint, TypeScript, application tests, browser regressions and production build.
- [x] Hosted database tests and privacy/authorization checks; all fixtures rolled back.

## Database migrations

The first six files were applied through the SQL connection after the migration endpoint returned expired-request-state errors. Each file and its history entry were committed together. Original bytes are preserved. After the owner restored access to the correct Supabase project, the last two corrections were applied through apply_migration; filenames match the recorded timestamps.

1. `20261014174240_phase11_transactional_events.sql`
2. `20261015004443_phase11_email_receipts.sql`
3. `20261015004445_phase11_email_snapshots.sql`
4. `20261015004448_phase11_email_producers.sql`
5. `20261015004451_phase11_email_worker_events.sql`
6. `20261015004453_phase11_email_operations.sql`
7. `20261015153919_phase11_receipt_link_ordering.sql`
8. `20261015154643_phase11_status_event_identity.sql`

The receipt correction claims a durable receipt with a null job link in BEFORE INSERT, then attaches its foreign key in AFTER INSERT, so immediate constraints work. Checkout confirmation reads only the original placement email, and a partial unique index preserves one placement receipt per order. Status-history IDs are bigint; the producer derives stable namespaced UUID event IDs from order ID plus history ID. These fixes were discovered during review/hosted tests and validated before release.

## Hosted verification

Large diagnostic requests sometimes returned expired-request-state errors. Successful results below come from focused rollback transactions, not those failed calls:

- `phase11-email-snapshot.sql`: saved item/PKR snapshot, customer notice delivery, version and replay suppression. The worker sends the claimed stored payload; no customer-provided URL or private staff note is rendered.
- `phase11-email-lifecycle.sql`: all five event jobs, guest updates, deterministic history IDs, return reference and replay suppression.
- `phase11-email-boundaries.sql`: guest receipt works with multiple email jobs, foreign token denied, deferred producer denied, retained receipt without job blocks replay, attempt log and private queue boundaries.
- `phase11-staff-workflow.sql`: live-session-guarded staff confirmation/replay/cancellation creates exactly three distinct event jobs; private notes are omitted; admin operations returns the event/version contract without payloads.
- `phase11-worker-acceptance.sql`: accepted once, duplicate acknowledgement denied, expired lease held and unhealthy SMTP gate enforced.
- `phase11-worker-retry.sql`: capability check, exclusive claim, lease ownership, retry/backoff, uncertain send and operator-alert suppression.

The last two tests use an isolated pg_temp copy of the deployed worker body with a synthetic capability in place of the Vault lookup. The deployed body was independently matched to the test source (MD5 a9c3d6d3bc0dc3ccca00a96a08c4f7cf); guards reject future divergence. No real capability was retrieved by the successful isolated tests, no public worker definition was replaced, no SMTP messages were sent, and all changes rolled back. Actual Gmail acceptance and the production worker adapter were verified in Part 1. These are SQL state-machine tests, not new inbox-delivery acceptance.

Final database check: eight migrations, zero orders/jobs/event receipts/attempt events, checkout disabled. Security advisor findings contain intentional deny-all private-table INFO entries and the existing leaked-password-protection WARN. The latter is unchanged by this phase; [Supabase remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Local verification

192 application tests passed; lint, TypeScript, production build and formatting passed. Dependency audit: zero production vulnerabilities. The full browser suite completed with 99 tests passing immediately and one existing short-mobile-hero test passing on retry; its separate targeted recheck passed on the first attempt. All email and delivery-operations checks passed. Cloudinary DNS warnings in the local environment do not establish live product-image acceptance.

No new runtime dependency, public enqueue/resend endpoint, Auth configuration change, marketing send or checkout enablement.

## Acceptance and release limits

The owner's first test reached Gmail Inbox. The polished sample was accepted by Gmail; the owner subsequently approved the result and requested Part 2. This batch sends no extra samples. Actual live product/order acceptance remains deferred until products and checkout readiness are approved. Hosted Supabase Auth template/allowlist inspection and real password-recovery/email-change acceptance remain pending. Future fulfillment/return-decision/RTO email producers are intentionally deferred until their workflows are validated. Full Phase 11 is not claimed 100% complete.

One final main production push is authorized for this batch. Verify the resulting deployment SHA/READY state, GitHub CI and signed-out/private route behavior. Production SMTP logs were not available through the prior connection; do not interpret HTTP/CI checks as a clean-log or inbox-delivery guarantee.
