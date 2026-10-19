# Part 2 — Single owner admin

Date: 19 October 2026. Scope: convert existing access to one administrator, preserving implemented commerce behavior. This is maintenance Part 2; it does not implement future CRM product, fulfillment, settlement or analytics features.

## Checklist

- [x] Read engineering, brand, design and project instructions; retain one final production-push workflow.
- [x] Reconcile Phase 5 migration timestamp and two live-only Phase 12 migrations before adding the new conversion. Historical SQL is recorded, not reapplied.
- [x] Capture private access rows, function definitions/grants and affected object definitions before schema changes.
- [x] Test conversion, exact restoration of 135 prior function definitions, and reconversion locally.
- [x] Replace active staff/roles/permissions with one database-owned Auth identity and a singleton constraint.
- [x] Preserve the existing owner and access-valid-after boundary; reject customer metadata promotion and direct client assignment.
- [x] Require a live verified, non-anonymous session; reject banned, expired, revoked or pre-floor owner sessions.
- [x] Remove staff directory/context/access-action RPCs and permission helpers. Archive their records privately with no client grants.
- [x] Route existing verification, policy, operational inbox and delivery controls through the same owner authority.
- [x] Target operational notification and email-failure alerts to that owner; preserve customer delivery, preferences, dedupe and receipt history.
- [x] Separate admin user identity from customer profile identity in the server and browser session guard.
- [x] Use admin labels in the CRM. Retain internal legacy protocol names for compatibility.
- [x] Preserve loading/error/empty states, same-origin mutations, immutable retries, private no-store responses and stale-session hiding.
- [x] Update active architecture/scope documentation and generated database types.
- [x] Run formatting, lint, TypeScript, application tests, database/RLS regression checks and a production build.
- [x] Record final browser-suite result and live post-migration checks before the single main update.

## Active access contract

`app_private.store_owner` has one `singleton=true` row with a unique Auth user foreign key (`ON DELETE RESTRICT`). No customer-editable metadata, email-string comparison or permission matrix grants administrator access. Private `is_owner()` validates the live session and ban/floor state. `owner_require()` holds the owner row while an admin transaction runs. `public.owner_context()` returns only that owner's user ID/email; the application verifies the ID against `auth.getUser()`.

The former staff/role/permission tables and access receipts become `app_private.legacy_*` archives. No ordinary client can read or mutate them. Verification action receipts remain active under `admin_verification_receipts`; idempotency and actor attribution are preserved.

`staff_verification_*`, stored audience `staff`, actor fields and `is_super_admin()` remain internal compatibility contracts. All resolve to the one owner check. A read-only security-invoker `public.staff_profiles` view exposes that owner only to the owner's valid session, supporting the previous production application's lookup during deployment or a code rollback. New application code does not use that view. There is no supported staff-management workflow.

## Verification evidence

- Node 24.21.0 and the existing lockfile; no application dependency additions.
- Formatting, lint and TypeScript pass; 198 tests across 31 files pass.
- Production build passes with the repository's isolated CI environment.
- Production dependency audit: zero vulnerabilities. Existing development-lint dependency exception remains documented in `SECURITY.md`.
- All 23 existing SQL regression scripts plus `single-owner.sql` pass against a rebuilt isolated database. Coverage includes access/RLS, order/private-note ownership, quote validation, COD idempotency, verification/review policy, cancellation stock release, customer preferences, recipient isolation, event/email dedupe, leases and retry uncertainty.
- Local database: PGlite 0.5.10 / PostgreSQL 18.6. Historical schema migrations are real; Auth schema/session functions are local platform adapters, cron is inert, and network calls cannot send email. Production uses PostgreSQL 17.11. This is not a claim that a local WASM database reproduces every managed service behavior.
- Older SQL probes were updated for the current notification RPC contract and owner fixtures. The quote-only probe excludes stock-event notices generated deliberately by its own inventory changes. The price/recovery probe now creates its own temporary test product instead of requiring a production demonstration SKU.
- Recovery test: conversion → reverse SQL → equality of all 135 captured function definitions → reconversion, then regression tests.

## Recovery and release order

Private checkpoint: `DWELLUNE-Part2-Access-Recovery.zip`, captured before production DDL and saved separately from Git. It contains the prior access rows/functions/grants/object definitions and `restore-access.sql`. Old access tables remain in the database, so normal recovery does not reconstruct those rows from JSON. This is a scoped access checkpoint, **not a complete database/Auth/Vault backup**. Managed backup availability could not be verified through the current connection.

Apply only the new conversion migration transactionally, check owner/archives/RPC grants and unchanged business row counts, regenerate types, then make one final main update. The read-only owner view keeps the preceding application compatible while the new deployment builds. Check GitHub CI, the production deployment SHA and canonical routes after the one push. A code rollback to the preceding SHA is compatible with the new database. Full access-model restoration requires reviewing current state and reconciling migration history separately; do not run recovery SQL automatically.

## Scope limits carried forward

Storefront cleanup is Part 3 and remains separate. Checkout stays disabled. Real customer/password-recovery inbox acceptance and real-product/order/fulfillment/settlement acceptance are existing launch gates, not proven by browser fixtures. No real order or email is created by these checks. The baseline's Cloudinary DNS errors in this environment prevent an unqualified external-image/runtime-clean claim. Existing leaked-password protection and notification-preference policy advisory findings remain outside this access conversion.

## Release gate results

- Final browser suite: **101 passed**, no retries needed, using Chromium 153 through the existing Playwright configuration. Responsive and keyboard coverage includes the affected admin screens at 375, 768 and 1440px. External Cloudinary DNS errors remain an environment limitation, so full external-image quality is not claimed.
- Supabase migration **20261019105119_single_owner_admin** applied successfully once. A preceding tool request expired without applying anything; live schema/history were inspected before retrying. The repository filename matches the applied migration version.
- Live business counts preserved: five products, two customers, zero orders, zero email jobs. Checkout remains disabled.
- Live owner count: one. Private archives retain one access profile, three roles, 18 permissions and 25 assignments; no client archive grants remain.
- No active function references the retired staff/role/permission tables or permission helpers. Directory/access-action RPCs are absent. Owner RPC is granted only to authenticated clients, whose identity is checked inside the function; anonymous execution is denied.
- A rollback-only production transaction reused existing session metadata internally (no token/password retrieval or new session) to verify owner context, policy access, queue, admin inbox, operations and the one-row read-only rollout view on PostgreSQL 17.11.
- RLS, archive privacy and view write denial verified on the live schema. Security advisor findings remain the existing leaked-password warning plus 13 intentional no-policy receipt/private-table notices.
- Generated public-schema types refreshed from the live database and typechecked.
- Existing owner UUID and access-valid-after floor preserved. Reservation cleanup and email cron remain active; no job failures in the observed 10-minute window and no worker error.

The commit containing this audit is the single final main update. CI and production deployment completion are checked after that update and reported in chat; they are not predicted in this pre-push audit.
