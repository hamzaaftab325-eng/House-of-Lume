# DWELLUNE — Part 1 Baseline

Date: 19 October 2026  
Scope: baseline assessment and preparation only  
Repository: [hamzaaftab325-eng/House-of-Lume](https://github.com/hamzaaftab325-eng/House-of-Lume)  
Source commit: [`2d2db132b86575e9b5840abe671bf3ef3e3b27ff`](https://github.com/hamzaaftab325-eng/House-of-Lume/commit/2d2db132b86575e9b5840abe671bf3ef3e3b27ff)

## Outcome

The current application and live database have been inventoried before the proposed single-admin conversion. Part 2 has not started. During the Part 1 assessment, application source, dependency manifests, migration files, production data, authorization, scheduled jobs and deployment settings were not changed. No email was sent, order placed, migration applied, commit created or deployment triggered by that assessment. Publication of this report is a subsequent documentation-only release.

Two requirements remain before a schema-changing Part 2 release: establish a verified restorable backup and reconcile the live database migration history with the repository. These are recorded findings, not changes made during Part 1.

## Part 1 checklist

- [x] Record repository branch, commit and initial clean worktree.
- [x] Inspect all 309 text files and inventory the five raster assets.
- [x] Inventory implemented features, deferred features and known acceptance limits.
- [x] Check current GitHub CI and deployed production commit.
- [x] Install locked application dependencies and obtain the required Node runtime separately.
- [x] Run formatting, lint, TypeScript and all application tests.
- [x] Run the production build using the existing CI placeholder configuration.
- [x] Run runtime and full dependency audits separately.
- [x] Run and record the browser regression suite, including a focused recheck of intermittent cases.
- [x] Inspect the connected Supabase project, table/RLS inventory and migration history read-only.
- [x] Check anonymous access boundaries without changing production records.
- [x] Map staff dependencies in application code, live functions, policies, triggers, checkout and notification delivery.
- [x] Check existing scheduled jobs, SMTP worker state and database media references.
- [x] Identify cleanup candidates and documentation drift without removing anything.
- [x] Document rollback procedure and backup requirements.
- [ ] Verify an actual backup restore point/export and its recovery path; unavailable through the connected actions.
- [ ] Reconcile migration drift; deliberately left for a reviewed implementation step.

The assessment records verified outcomes and unresolved requirements. It does not certify that every production customer/admin journey has received live acceptance.

## Source and deployment baseline

| Item | Observed state |
| --- | --- |
| Branch | `main`, tracking `origin/main` |
| Source | `2d2db132b86575e9b5840abe671bf3ef3e3b27ff` |
| Last commit | 15 October 2026 — transactional email jobs for supported order events |
| Initial worktree | Clean |
| Main branch protection | Disabled; no settings changed |
| Repository inventory | 314 tracked files: 309 text files and five raster assets |
| Repository migrations | 38 |
| Test inventory | 31 application test files, 13 browser spec files, 23 database test files |
| Required/test runtime | Node `24.21.0`, npm `11.9.0` |
| Production origin | `https://dwellune.vercel.app` |
| Vercel deployment | `dpl_9MVDCFA19hLu5XLbwLAWbjeGAsZr` |
| Deployment target/state | Production / READY |
| Deployment commit | Matches the source commit above |
| Function region | `iad1`; database is in `ap-southeast-1` |
| Existing CI | [Run 38772459799](https://github.com/hamzaaftab325-eng/House-of-Lume/actions/runs/38772459799), successful on the same commit |

Locked `package-lock.json` SHA-256: `d83b22299299c70eb2255e9464160ca8023ca7193153b3f5f8f6c47866672741`.

## Fresh local verification

| Check | Result | Interpretation |
| --- | --- | --- |
| Locked dependency installation | Passed | Initial host Node `24.19.0` produced an engine warning; Node `24.21.0` was then installed outside the project for the checks. No lockfile changes. |
| Formatting | Passed | Existing repository files conform to Prettier. |
| Lint | Passed | Existing zero-warning lint command passed. |
| TypeScript | Passed | Existing strict typecheck passed. |
| Application tests | 192 passed across 31 files | Fresh local run; no production credentials or data used. |
| Production build | Passed with existing CI configuration | Uses localhost site origin, placeholder Supabase URL and placeholder publishable key, matching the workflow. |
| Runtime dependency audit | Zero vulnerabilities reported | Fresh `npm audit --omit=dev --audit-level=high`. |
| Full dependency audit | Five high-severity affected package entries | All are in the existing lint-tool chain described below. |
| Browser suite | 98 passed, two flaky; exit code 0 | Both intermittent cases passed on retry; a separate no-retry focused rerun passed both. |

An initial build without environment configuration failed at environment validation because the Supabase public URL/key were absent. Providing the repository's existing CI values produced a successful build. The unconfigured invocation is an environment prerequisite, not a source regression.

The standard Playwright Chromium download returned a corrupt archive. An isolated `@sparticuz/chromium@153.0.0` package supplied Chromium `153.0.8010.0` through the existing `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` option. Browser support archives were extracted without preserving unsupported archive ownership. No test configuration or application dependency was edited, and no browser security flags were relaxed. This is a different patch build from Playwright's requested `153.0.8010.12`.

The full browser run completed in 2.8 minutes with 98 passing tests and two flaky tests: the short mobile hero viewport check (`foundation.spec.ts:22`) and immutable COD verification retry check (`phase9.spec.ts:128`). The hero check needed two retries; the verification check needed one. A subsequent focused run of only these two tests, with retries disabled, passed both in 2.4 seconds. These fresh baseline flakes remain recorded; the focused pass does not erase them or establish their root cause. No fixes were made.

The browser server reports `EAI_AGAIN` resolving existing Cloudinary image URLs in this environment. Browser layout/interaction results must not be presented as complete external-image visual acceptance, field performance measurement or a clean-runtime-log guarantee.

### Dependency audit interpretation

The five full-tree affected entries are `eslint-config-next`, `@next/eslint-plugin-next`, `fast-glob`, `micromatch` and `braces`. They form the same development lint chain ending in the `braces` stack-exhaustion advisory. They are not five independent runtime vulnerabilities. The runtime-only audit reports zero.

The existing `SECURITY.md` documents this exception and the incompatible forced-downgrade recommendation. No `npm audit fix`, framework downgrade or dependency update was performed. The exception remains an item for review during final security work.

## Live Supabase baseline

Project ref: `hahlsfuxdyymrwinekjt`. The ref is an identifier, not a secret.

| Item | Observed state |
| --- | --- |
| Project health | ACTIVE_HEALTHY |
| Organization plan | Free |
| Region / database | `ap-southeast-1` / PostgreSQL 17.11 |
| Database migration records | 40 |
| Active administrators | One active `super_admin` |
| Existing access model | Three roles, 18 permissions, 25 role-permission assignments |
| Customer rows | Two reported by the table inventory; customer details were not exported |
| Products / published products | Five / five |
| Orders / email outbox jobs | Zero / zero at the observation time |
| Checkout | `checkout.orders_enabled=false`; readiness function also returns false |
| Public tables without RLS | Zero |
| Private operational tables | 12; all have RLS and deny direct SELECT to `anon` and `authenticated` |
| Supabase Storage | Zero buckets and zero stored objects |
| Development database branches | None |

Published listings include sample/test content. Published-product counts are not evidence of real sellable inventory or merchant acceptance. Existing cart, inventory and audit records were preserved.

### Anonymous read-only checks

A transaction marked READ ONLY ran under database role `anon` and was rolled back. It established:

- Five published products visible and zero draft/unpublished products visible.
- No direct SELECT privilege on `public.orders`.
- No execution privilege on `public.staff_directory` or `public.staff_access_action`.
- Checkout readiness false.

These checks do not impersonate a real signed-in customer or admin and do not constitute the full RLS/IDOR suite. Existing mutation-based SQL tests were inventoried, not executed against the live project during this read-only baseline.

### Scheduled jobs and email worker

| Job | Schedule | State at observation |
| --- | --- | --- |
| Expired cart reservation cleanup | Every five minutes | Active; latest run succeeded; zero failed runs in the preceding 24 hours |
| Order email dispatch | Every minute | Active; latest database scheduler run succeeded; zero failed runs in the preceding 24 hours |

The worker state has a recent successful SMTP verification, a recent run timestamp and no current error code. Database scheduler success alone does not prove downstream HTTP/SMTP or inbox delivery. No dispatch, test-send or verification endpoint was invoked during Part 1.

### Advisor findings

| Finding | Result | Treatment |
| --- | --- | --- |
| [Leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) | One security warning | Existing setting; unchanged. |
| [RLS initialization plan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan) | One performance warning on `notification_preferences_own_all` | Existing per-row Auth evaluation; record for a focused later change. |
| [RLS enabled without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) | 13 informational findings | Matches private/default-deny receipt and operational storage. Direct private-table client grants were checked. Do not add permissive policies just to remove notices. |
| [Unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) | 50 informational findings | Small pre-launch workload is not sufficient evidence to remove protective indexes. |

No advisor settings, grants or policies were changed.

## Migration drift — must be addressed before Part 2 schema changes

| Repository | Database history | Finding |
| --- | --- | --- |
| `20261013082601_phase5_variant_stock_policy_binding.sql` | `20261013082554_phase5_variant_stock_policy_binding` | Same SQL after whitespace normalization; different version identifier. |
| No file | `20261015173233_phase12_staff_access` | Live-only Phase 12 access implementation. |
| No file | `20261015173635_phase12_delivery_permission` | Live-only notification delivery permission implementation. |

The live-only Phase 12 changes add permission-aware staff helpers, directory/access-action RPCs, an owner-protection trigger, an access receipt table and updates to verification and notification functions. Consequently, the live database is ahead of the Phase 11 source snapshot in the access layer.

The migration sources were inspected from the existing migration history read-only. Do not reapply them, overwrite history or assume an older repository definition remains the live definition. A future reconciliation must preserve the actual applied SQL and clearly document the Phase 5 filename/version mismatch.

This discovery refines the earlier source-only assessment: Phase 11 Part 2 is the latest application milestone in GitHub, while the database already contains additional Phase 12 staff work.

## Single-admin dependency map

The live policy scan found 57 policies across 51 tables that reference the admin/staff helpers in the scanned expressions. A catalog capture also records 28 relevant function signatures and definition fingerprints. These are scope markers, not a claim that only those functions need review.

| Area | Dependencies that must move together in Part 2 |
| --- | --- |
| Admin identity | `src/server/admin/admin.service.ts`; active staff lookup, role check, live session and active customer lookup |
| Session contract | `/api/admin/session`, CRM layout and `AccountSessionGuard`; the current response/guard uses `customerId` |
| Authorization foundation | Live `is_super_admin`, `staff_has_permission`, `staff_require_permission`, public wrappers, grants and all dependent policies |
| Owner protection | `staff_owner_protected` trigger, `protect_staff_owner`, staff access revisions and access receipts introduced by live-only Phase 12 |
| COD verification | Queue/detail/action/base functions, policy settings, revision protection and immutable action receipts |
| Checkout | `checkout_release_ready`, canonical order transaction, owner availability and operational alert recipients |
| Notifications | Persisted `staff`/`customer` audiences, recipient ownership, guards, producer fan-out and event receipts |
| Email operations | Notification delivery permissions, worker failure recipients and protected worker capability; credentials remain untouched |
| Reproducibility | Migration ledger, database types, seeds and affected application/browser/SQL tests |

Changing labels from “staff” to “admin” does not by itself migrate stored audience values or contracts. Preserve compatibility or migrate the data and every producer/consumer consistently. Owner identity must not become customer-editable metadata or an email-string authorization check.

## Functionality to protect

| Area | Existing scope to retain |
| --- | --- |
| Storefront | Accepted brand, homepage, motion, navigation and responsive design |
| Catalogue | Categories, collections, search, filters, sort and product routes |
| Product details | Gallery, variants, canonical price/stock information, metadata and structured data |
| Commerce | Guest/account carts, wishlist, merge, quantity/remove/undo, discounts and reservations |
| Accounts | Working signup/sign-in, profiles, addresses, owned orders and return requests |
| Checkout | Guest/account details, address-specific quotes, atomic order creation, idempotency and confirmation, with the release gate still closed |
| Operations | Verification, review controls, cancellation releases, histories and audit attribution |
| Notifications/email | Essential customer/owner notices, five current email events, durable jobs, deduplication and retry/uncertain-send safeguards |

The five supported email events are order placement, verification request, confirmation, cancellation and return-request receipt. New fulfillment, settlement and other future workflows remain outside Part 1.

## Cleanup candidates and restrictions

- `src/lib/result.ts`, `src/lib/validation.ts` and `src/server/logger.ts` are not reachable from production route roots in the static import graph. The result utility has a test and is used by the validation helper. These are candidates for a later deliberate decision, not deletions already approved by reference count alone.
- `/system` and its design showcase form a development-oriented dependency subtree. Removing that route could leave showcase-only helpers/components unused; recompute reachability after any approved removal.
- Generated `database.types.ts` is committed but not imported into the Supabase client factories. Connecting the generated types is a potential later improvement; deleting them is not the intended cleanup.
- All animation libraries in the current stack have active source references. Preserve them while preserving the accepted motion.
- Product detail reads the `reviews` table and derives ratings/structured data. Schema removal alone would break product loading.
- The database references all four local product WebP assets. They are not unused, even though most references do not appear in components. Preserve `email-logo.png`, which is used by templates/tests.
- Newsletter presentation is currently disabled/marked “opens soon”; the newsletter table already has a removal migration. Distinguish existing preview UI from an active subscription service.
- Advanced verification settings and notification filters currently work. Their simplification must not silently remove retained controls or saved configuration.
- No index should be deleted solely because pre-launch advisor statistics mark it unused.

Large components such as checkout, homepage editorial sections and account forms are maintainability review targets, not evidence of broken behaviour. Avoid broad rewrites under the label of cleanup.

## Live HTTP baseline and limits

Public GET checks returned 200 for home, shop, cart, wishlist, checkout, sign-in and a published product page. `/api/checkout` returned a private/no-store response with `ordersEnabled=false`. `/api/admin/session` returned 401 to a signed-out request. GET on the POST-only email worker returned 405; no worker action was invoked.

Account and CRM page responses use streamed Next.js redirects: their initial HTTP status can be 200 while the response stream contains `NEXT_REDIRECT` to sign-in. This redirect instruction was checked in both responses. HTTP status alone was not treated as private-page authorization acceptance. The published product response included product structured data.

Requests used no login credentials and did not run a live browser session. These checks do not verify signed-in workflows, real checkout, password recovery, mailbox arrival, production image appearance or real-user Core Web Vitals. Request timings in this restricted network are not product performance measurements.

## Backup and rollback requirements

### What is established

- Source and production deployment are pinned to the same known commit and deployment ID.
- The assessment used a clean local clone of that commit; source and lockfile hashes can be compared before any future application change.
- Current live migration identifiers, relevant function fingerprints, policies, triggers, job schedules and aggregate state have been recorded.
- No destructive step has been performed, so this assessment itself needs no production rollback.

### What is not established

The connected actions do not expose a backup list or a downloadable full database backup. The organization is on the Free plan. A recent restorable backup/export and restore rehearsal therefore remain unverified. Catalog metadata and source migrations are not a substitute for a data/Auth backup.

According to [Supabase's backup guidance](https://supabase.com/docs/guides/platform/backups), automatic daily backup access is a paid-plan feature; Free projects should maintain their own exports. Database backups do not include Storage object bytes. This project currently reports no Supabase Storage objects, but its repository and external Cloudinary assets still need to be preserved independently.

### Procedure required before Part 2 changes

1. Obtain an appropriately scoped backup/export through the Supabase dashboard or authenticated tooling. Preserve application schemas/data and required Auth state securely; do not put secrets or customer exports into GitHub.
2. Record backup time, covered schemas/assets, retention location, owner and a tested recovery method. Use an isolated target for a restore rehearsal; do not restore over production to test a backup.
3. Reconcile the two live-only Phase 12 migrations and the Phase 5 timestamp mismatch before generating the conversion migration.
4. Design the conversion with additive compatibility first: introduce the single-owner authority, update dependent functions/contracts and verify them before removing old objects. Keep checkout closed.
5. Before the final Part 4 release, record the exact previous deployment and a reviewed forward repair/rollback migration for the actual schema change. Reverting application code alone does not revert database state.
6. If an issue appears after release, stop further changes, assess application/database compatibility and use the documented recovery route. A full database restore can overwrite newer data and cause downtime; it is a separate owner-directed operation.

No restore, backup-plan upgrade, paid database branch or recovery operation was triggered during Part 1.

## Handoff to the next parts

| Part | Status | Gate |
| --- | --- | --- |
| 1 — Baseline | Assessment and available verification finished; backup and drift gates remain | Preserve the findings and unresolved backup requirement |
| 2 — Single-admin conversion | Not started | Verified backup plus migration-drift reconciliation before schema-changing release |
| 3 — Storefront cleanup | Not started | Follow the protected-functionality and dependency map |
| 4 — Final verification/release | Not started | Complete regression checks and one final verified production push when instructed |

Part 1 does not enable checkout or remove features. No later part has been executed.
