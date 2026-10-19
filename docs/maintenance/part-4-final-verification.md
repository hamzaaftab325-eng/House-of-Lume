# Part 4 — Final maintenance verification

Date: 19 October 2026. Starting production commit: `2a26b67a38faee47a10d89a4fd668fc181fab93e`. Starting deployment: `dpl_EyDsKjPsspyHtqUaFV2QZhQkADcb`, READY on `https://dwellune.vercel.app`.

This is the fourth and final **maintenance part**, not original build Phase 4 and not certification that all planned ecommerce/CRM phases are complete. The scope is regression verification and confirmed reliability fixes after the baseline, single-owner conversion and storefront cleanup. Checkout enablement remains a separate decision after its launch gates pass.

## Checklist

- [x] Read engineering, brand, design and project instructions; recover the agreed four-part scope.
- [x] Review Parts 1–3 and confirm the tested source matches the current production commit.
- [x] Audit active staff dependencies; preserve necessary compatibility names, private archives and migration history.
- [x] Preserve owner/customer separation, commerce records, inventory/history, optional consent and essential notifications.
- [x] Rebuild the isolated database and run all 24 SQL regression scripts, including owner/RLS and email lease/retry boundaries.
- [x] Read-only production checks for singleton owner, RLS/grants, retired access routines, migration history and scheduled-job health.
- [x] Reproduce and fix optional browser-storage failures without changing server-owned commerce behavior.
- [x] Complete the final formatting, lint, TypeScript, application, production-build and browser gates.
- [x] Audit responsive, keyboard, reduced-motion, failure/retry and route evidence against the final source.
- [x] Re-review dependency risks and record unresolved external acceptance, performance, observability and backup gates.
- [x] Update active architecture/project/readme notes without rewriting historical phase audits.
- [x] Prepare the final release/rollback batch for one main update; post-push CI/SHA/smoke outcomes are reported separately in chat.

## Confirmed fix

Optional recent history could interrupt shopping. Three browser probes reproduced failures on the starting production build: blocked localStorage reads broke the product page, quota errors stopped keyboard suggestion navigation before `location.assign`, and denied removal threw before recent-search controls updated.

The product history now catches storage read/write errors and keeps a bounded in-memory snapshot. Search history saves/removal are best effort, so navigation and controls continue when persistence is unavailable. Existing keys, limits, normal persistence and authoritative cart/account/order APIs are unchanged. These probes assert visible purchase controls and navigation, not merely that a catch block exists; uncaught page errors also fail them.

No feature, component library, dependency, asset, database migration or production setting is added. Staff-management UI/RPCs remain retired; optional ratings, journal/newsletter previews and opt-in UI stay removed.

## Data and access evidence

At preflight, the live database still has five products, two customers, zero orders, zero reviews, one saved optional consent, one owner, 41 applied migrations and zero email outbox jobs. `checkout.orders_enabled` is false. The 41 live migration versions match repository filenames, including the reconciled Phase 5 and Phase 12 history. No Part 4 SQL write, DDL, new Auth session, order, email or consent change is performed.

- All public/private application tables have RLS enabled.
- No active routine references retired role/permission tables or removed permission helpers. Directory/context/access-action management RPCs are absent.
- Anonymous execution of `owner_context` is denied. Authenticated callers still require the live singleton owner's verified, non-anonymous session, ban/floor checks and matching identity.
- A rolled-back READ ONLY transaction under `anon` sees five published products and zero drafts, has no order SELECT or owner RPC privilege, and observes checkout readiness false.
- The sole direct authenticated private-table grant is SELECT on `store_owner`, restricted by `store_owner_self_read` to the owner's valid session. This supports the security-invoker, read-only `staff_profiles` rollout view. No ordinary client has grants to legacy access archives or private receipt/job tables. Do not revoke that bridge dependency merely to make a grant count zero.
- Stored `staff` audiences, `staff_verification_*`, actor fields and `is_super_admin()` are protected compatibility contracts. They are not configurable roles or staff-management features.
- Both scheduled jobs remain active: cart reservation expiry every five minutes and email dispatch every minute. Both have recent successful scheduler runs and zero failures in the observed preceding hour. Worker health has a recent SMTP verification/run and no current error code. This proves neither a real order's delivery nor mailbox arrival.

Database tests execute only in an isolated PGlite 0.5.10 / PostgreSQL 18.6 instance, rebuilding the actual migration history with local Auth/session adapters and inert cron/network. All 24 scripts pass. The existing recovery rehearsal also restores all 135 captured prior function definitions exactly and reconverts before regression. Production is PostgreSQL 17.11; this harness does not reproduce every managed-service/network/concurrency behavior, and its data is never sent to production.

## Quality evidence

Fresh `npm ci` succeeds on Node 24.21.0 with the unchanged lockfile. The install warns about the existing ESLint 9 support pin. Runtime audit reports zero vulnerabilities. The full audit still reports five high-severity affected development-tool entries from the same `braces` chain; this is re-reviewed in `SECURITY.md`, not marked fixed. No forced downgrade or unrelated dependency upgrade is made.

Final local gate: formatting, zero-warning lint, strict TypeScript and production build pass. **196 application tests across 30 files pass. All 107 Chromium browser tests pass with retries disabled (2.7 minutes)**, including the three storage regressions and the existing commerce/account/admin suite. A broad selector in the new recent-search test initially matched the footer as well as the dialog; it was scoped to the dialog before the full pass. Earlier reproduction failures remain failure evidence, not release passes.

Browser coverage includes browse/search/filter/sort, product variants/media/stock, bag/wishlist, quote/order retry and confirmation, account guards, notifications/consent withdrawal, owner verification/policy and delivery views. Existing responsive checks cover homepage widths 320/375/430/768/1024/1440/1920px, affected product/auth screens and admin 375/768/1440px layouts, keyboard/focus/dialog behavior and reduced-motion interruption. Browser `pageerror` assertions confirm the storage-failure journeys no longer throw. Media DNS failures remain separately recorded below. No layout/style, animation, asset or client-boundary expansion is introduced by Part 4.

An initial local build hit the same generated Turbopack persistence error observed in Part 3. Moving only the generated cache aside allowed a clean production build; no source/build-setting workaround was added.

## Remaining launch gates and verification limits

| Area                     | Current evidence                                                                                                                  | Remaining acceptance                                                                                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Checkout and real stock  | Atomic order/quote/idempotency and stock-release SQL/browser regression; production gate stays false                              | Merchant-approved sellable products, stock, delivery/COD rules and controlled real order/account/owner/mailbox journey before opening checkout                                                                                                               |
| Accounts and recovery    | Session/ownership/API regression and public sign-in guard                                                                         | Real signup/sign-in/sign-out and hosted recovery/email-change callback/inbox acceptance; `AUTH_EMAIL_READY` must remain gated until configured and accepted                                                                                                  |
| Operational workflow     | Implemented verification, review policy, cancellation, notifications and durable email queue tested                               | Product management, packing/shipping/delivery/RTO/settlement and other original future phases are not implemented by this cleanup                                                                                                                            |
| External media           | Brand/local assets and image sizing preserved                                                                                     | Cloudinary DNS fails in this execution environment; complete production-image visual acceptance is unverified                                                                                                                                                |
| Responsive/accessibility | Existing supported-width, keyboard/dialog/focus/reflow and reduced-motion regression                                              | These checks do not certify a complete manual WCAG 2.2 AA audit or all physical mobile devices                                                                                                                                                               |
| Performance              | Image dimensions/sizes, first-hero priority, lazy media and animation lifecycle reviewed; no dependency/client-boundary expansion | Field p75 LCP/INP/CLS and representative mobile scroll profiling remain unmeasured; restricted-network HTTP timings are not a performance score                                                                                                              |
| Observability            | Public HTTP responses, local browser errors and database scheduler/worker state inspected                                         | Vercel grouped-runtime-error query returns 403; no authenticated CLI is installed. Production runtime errors/drains cannot be certified clean through this connection                                                                                        |
| Database security        | RLS, grants, owner boundary and current SQL regression                                                                            | Existing leaked-password-protection warning, one notification-preference Auth evaluation performance warning, 13 intentional default-deny notices and 50 prelaunch unused-index notices remain; no permissive policies/index deletions added to silence them |
| Recovery                 | Application rollback target and prior scoped access checkpoint/recovery rehearsal                                                 | Full database/Auth/Vault backup availability and restore rehearsal remain unverified; the scoped checkpoint is not a full disaster-recovery backup                                                                                                           |

Advisor references: [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [Auth evaluation](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan), [default-deny tables](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index). These findings are carried forward explicitly, not presented as new feature work or a reason to erase protective records.

## Single release and rollback procedure

1. Complete local checks and inspect the exact staged tree, including docs/tests. Confirm remote `main` still equals the starting SHA; stop and reconcile if it changed.
2. Create one scoped final commit on that parent. Move `main` exactly once with an expected-head check and no force. Use the existing Git-triggered production deployment; do not create branches, previews, workflow-only commits or duplicate manual deployments.
3. Wait for GitHub CI and Vercel. Verify the exact SHA, project `prj_Oxq9codSitHckUg3RkkTByvG8I8d`, production target, READY state and `dwellune.vercel.app` alias.
4. Check canonical homepage/shop/product, removed routes, account/admin sign-in guards, private no-store APIs, disabled fixture cookies and closed checkout. Read-only counts/job/access checks must still match. No real order or email is created just to finish maintenance.
5. Report CI/deployment/smoke outcomes in chat after the one update; this pre-push audit does not predict their result.

Application rollback target: commit `2a26b67a38faee47a10d89a4fd668fc181fab93e`, deployment `dpl_EyDsKjPsspyHtqUaFV2QZhQkADcb`. Part 4 changes no database contract/data, so application rollback requires no schema/data restore. If rollback is needed, inspect current state and perform it as a separately authorized recovery operation. Do not run the old access restoration SQL or reset current customer/inventory data.

## Final audit status

| Category                 | Status at final local gate                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Functional               | ✅ Existing regression plus blocked/quota storage purchase/search journeys pass                                                                  |
| Design                   | ✅ Existing brand, styles, media, motion and component structure preserved                                                                       |
| Responsive/accessibility | ✅ Supported-width, keyboard/focus/dialog and reduced-motion regression passes; full manual/device acceptance remains limited as above           |
| Security/data            | ✅ Owner/anonymous/RLS/private-grant checks and all 24 isolated SQL scripts pass; live migration history matches all 41 files                    |
| Notifications/operations | ✅ Recipient/consent/lease/retry regression and live scheduler/worker state checked; real inbox acceptance remains separate                      |
| Quality                  | ✅ Locked install, formatting, lint, TypeScript, 196 application tests, 107 browser tests, production build and zero-vulnerability runtime audit |
| Production release       | Exact new SHA, CI, READY alias and canonical smoke checks are recorded in chat after the single push                                             |

Maintenance verification is distinct from store launch sign-off. This audit records the verified pre-push batch; the production gate must pass before calling it released. The unresolved acceptance items above prevent an unqualified “100% launch ready” claim.
