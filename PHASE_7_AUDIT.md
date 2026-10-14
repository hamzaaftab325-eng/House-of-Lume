# DWELLUNE — Phase 7 Final Acceptance Checklist

**14 October 2026 · Implementation prepared · Database migrated · Production release held**

Phase 7 is not yet 100% accepted. The user reports saving Gmail SMTP for `dwellunestore@gmail.com`. Real delivery, callback URLs and successful inbox/recovery/account-settings journeys still require verification. An owned domain is not a prerequisite for this explicitly requested Gmail testing setup. Resend remains the planned later transactional provider.

## Verified

- [x] Formatting, ESLint, strict TypeScript and production build.
- [x] 39 unit/route tests: Auth validation, CSRF, fixed signup/recovery redirects, current-password verification, recovery-grant denial, live-session rejection and honest session-revocation failure reporting.
- [x] 52 Chromium tests: earlier storefront/cart/wishlist regressions, public Auth routes, private denial, link errors, keyboard focus, reduced motion and reflow at 320–1920px.
- [x] Five test product detail routes, including an out-of-stock candle, are available only with the local placeholder database and loopback site origin. They are unavailable in Vercel production.
- [x] 13 populated database test groups using two test identities and five products, all rolled back: profile persistence, address defaults/deletion, essential preferences, order ownership/history, notification read state, wishlist/cart sync, return idempotency/quantities/isolation, expired/revoked/unverified session denial.
- [x] 15 Phase 6 database regression groups pass with the new session guard.
- [x] Public contract privileges, five ownerless write denials, 15 restrictive RLS guards and sensitive-column restrictions pass.
- [x] Migration `20261014052742_phase7_account_contracts` applied exactly once; generated database types match the migrated schema.
- [x] Post-apply populated/boundary tests pass; all test business records roll back.
- [x] Post-apply security advisor: no warnings/errors; one existing informational default-deny finding for `commerce_import_receipts`.
- [x] Production dependency audit: zero vulnerabilities.

The first browser run used a build containing the real public Supabase configuration, so placeholder product tests failed. The intended placeholder build fixed that configuration. A new stock-state test initially looked for “Add to Bag”; the actual disabled button reads “Currently unavailable.” The corrected final suite passes all 52 tests. Local external image requests require the environment's configured network proxy; that is a test-environment setting, not an application deployment change.

## Feature acceptance

| Feature | Verified now | Remaining live acceptance |
|---|---|---|
| Signup / email confirmation / resend | Validation, provisioning metadata, callback safety, email-readiness gate | Saved SMTP, actual delivery and valid/replayed link |
| Login / logout | API contracts, global logout, revoked-session boundaries | Successful real-account browser login/logout |
| Recovery / password / email changes | Signed grants, current-password checks, fixed callbacks, honest errors | Real inbox links and credentials through secure setup |
| Sessions / ownership | SSR secure cookies, Auth identity checks, database live-session guards, two-owner isolation | Real browser refresh, cross-tab switch/revocation |
| Profile / Pakistan addresses | Transactional writes/defaults and test-record persistence/isolation | Actual signed-in UI persistence/accessibility |
| Wishlist / cart sync | Populated database sync and all Phase 6 regressions | Real browser account transition |
| Order history / detail | Owned records/items/totals and status history contracts | Actual checkout and fulfillment events arrive in later phases |
| Notification center / preferences | All/unread/order/return/account filters, read actions and essentials-preserving preferences | Actual business events/dispatch arrive in later phases |
| Returns | Owned policy-gated requests, remaining quantity/exclusions, replay/overquantity/partial-write rejection | Merchant COD refund/destination details; actual delivered orders later |

## Merchant operating decisions

See `RETURN_POLICY_DRAFT.md` for the researched seven-day proposal. No policy has been published in production. The actual COD refund payout method and return address/pickup arrangement are still unspecified; test-only rules are used exclusively inside rolled-back tests.

## Final release gate

- [ ] Secure Supabase dashboard sign-in to inspect saved sender/SMTP, verified-email configuration, exact site/callback/recovery URLs and email templates. The connected database plugin does not expose Auth configuration and the agent browser currently shows a sign-in wall.
- [ ] Real verification/recovery/settings acceptance using owner-controlled inboxes and two customer identities; never paste passwords or verification tokens in chat.
- [ ] Choose COD refund payout method and return destination; publish the approved validated policy.
- [ ] Verify signed-in responsive/keyboard/runtime and session/concurrency behavior against the real application.
- [ ] Configure private production `AUTH_RECOVERY_SECRET`; keep `AUTH_EMAIL_READY=false` until email acceptance passes.
- [ ] Prepare one final verified commit and move GitHub `main` once; wait for its automatic Vercel production deployment.
- [ ] Verify that exact live commit and report its production URL.

**No Phase 7 GitHub push or Vercel deployment has been made.** The production site still serves the earlier commit. The database migration is applied; application code remains local and uncommitted. Nothing in this audit claims later checkout, notification dispatch, fulfillment or refund payment is implemented.


## Continuation verification — 14 October 2026

- Recovered the prior uncommitted implementation into this checkout from main `c86de38419ebc59101544f91f9ff15685d81d25f`.
- Fixed the missing Vitest `@` alias and updated Phase 6 regression fixtures with confirmed-email identities and live sessions.
- Made all three database acceptance scripts self-contained with explicit BEGIN/ROLLBACK. One initial execution omitted the external wrapper and temporarily persisted fixtures; exact fixture users, orders, products and test policy were removed, and zero remaining fixtures was independently verified. All 13 populated account groups and 15 commerce regression groups subsequently passed with rollback.
- Verified production email signup is enabled and email auto-confirmation is disabled. The screenshot supports saved Gmail SMTP settings, but delivery, redirect allowlists and live link acceptance are not verified.
- Configured a private, randomly generated production AUTH_RECOVERY_SECRET and AUTH_EMAIL_READY=false in the existing dwellune Vercel project. No deployment was triggered.
- Dependency installation succeeds, with a local Node 24.19.0 warning against the repository requirement >=24.21.0. Production dependency audit reports zero vulnerabilities.
- The security advisor now reports leaked-password protection disabled, plus the existing informational default-deny commerce_import_receipts finding.
- Browser rerun is blocked: the Chromium download returned an invalid archive. The prior 52-browser-test report remains historical evidence, not a rerun from this checkout.
- No production catalogue products or merchant return policy currently exist. Real controlled inbox identities, refund method and return destination remain required for acceptance.
- No cloud browser was opened. No GitHub push or deployment was made in this continuation. Phase 7 remains incomplete; do not mark 100% until the remaining live acceptance gates pass.


## Owner-authorized release for live acceptance

On 14 October 2026 the owner supplied two controlled inboxes, authorized creation of a test product, chose JazzCash and bank transfer for manual refunds, agreed to perform live email checks, and explicitly requested the production push. The release enables owner-led acceptance; this changes the release gate but does not make unperformed tests pass.

- Published one prominently named test product at `/products/aurelia-floor-lamp-test`, with illustrative existing media, PKR 18,900 test price and 20 test stock units. The listing explicitly states it is not for sale; order placement remains closed.
- Published the seven-day customer return-request policy with manual JazzCash/bank refunds and support-confirmed return destination. No refund transfer or courier booking is implemented in Phase 7.
- Enabled AUTH_EMAIL_READY for the requested live acceptance after the saved SMTP screenshot. Actual delivery, callback/template configuration, email-change/recovery and signed-in UI acceptance remain pending owner confirmation.
- Phase 7 implementation is prepared for the single production push. Overall acceptance remains partial; do not report 100% while the live checks are pending.


## Signup simplification — owner-requested correction

The owner explicitly removed signup-email verification from the Phase 7 scope on 14 October 2026. New signup is intended to create a password account, install its real Supabase session into SSR cookies and open the account immediately. Signup does not depend on AUTH_EMAIL_READY and sends no verification email when provider autoconfirm is enabled. The old resend page redirects to sign-in.

The password signup client uses a nonpersisting implicit flow because SSR PKCE signup is incompatible with automatic email confirmation. The temporary client session is transferred into the existing SSR cookie client; tokens are never returned in API JSON. Live-session, anonymous-user, ownership and revocation guards remain unchanged. Supabase automatically sets email confirmation when the provider toggle is disabled, so no database authorization weakening is required.

Signup first checks public Auth settings and returns an honest temporary-unavailability response before creating an account if Confirm Email is still on. The connected Supabase plugin cannot change hosted Auth configuration; CLI management authentication is unavailable. The owner must turn Confirm Email OFF under Authentication > Sign In / Providers > Email. The last settings check still showed mailer_autoconfirm=false. No real immediate-signup acceptance is claimed before that setting changes and a live account is tested.

Password recovery and email changes retain secure email-based ownership checks. They are distinct from signup and their inbox delivery remains unverified. Auth logs showed successful signup responses, invalid login credentials and a one-time token not found; the inspected fields did not establish an SMTP delivery failure.

The correction is tested with unit/route behavior and a production build. Browser acceptance remains unavailable in this environment. Overall Phase 7 is not 100% accepted until the provider configuration and live acceptance checks are completed.
