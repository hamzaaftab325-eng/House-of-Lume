# Phase 12 preparation — cleanup and handoff

Date: 19 October 2026. Starting production application: `9a418ce541e9b2fa798fb4f5cf7175ff8c448837`; deployment `dpl_5kPxnBTeazt2HKyPz5BnrzDiTSVw`. This batch includes the previously prepared roadmap update and the newly requested dead-code/document cleanup. It prepares the next phase; CRM workspace redesign/navigation work has not started.

## Scope and checklist

- [x] Read the engineering/brand/design/roadmap sources and retain the single final production-push workflow.
- [x] Trace source imports/exports, CSS references, duplicate files, docs links and required public assets before deciding what to remove.
- [x] Remove confirmed account code leftovers and keep implementation-only symbols private.
- [x] Remove global rules for the retired journal while retaining shared service-section styles.
- [x] Consolidate superseded setup/draft documents without losing catalogue image provenance or return-operation inputs.
- [x] Prepare the specific Phase 12 owner-workspace plan in `PROJECT_PLAN.md`; keep later modules and optional features excluded.
- [x] Complete final static, application, browser and production-build verification and record the results below.
- [x] Prepare the final release/rollback batch for one main update; CI, exact production SHA/alias and live smoke outcomes are reported afterwards in chat.

## Removal and preservation record

| Item                                                   | Decision and evidence                                                                                                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AccountActionButton`                                  | Remove: no production/test caller; forms and their shared mutation/error feedback retain real callers                                                                                                                                |
| Old account `notificationSchema`                       | Remove with its unused `Notification` type: the real notification platform validates its feed with `feedSchema`; the old schema has no consumer                                                                                      |
| Six unreferenced aliases                               | Remove account `Order`, `Notification`, `CustomerReturn`, verification `VerificationDetail`, checkout `OrderConfirmation` and `NotificationOperations`; their used runtime schemas stay intact                                       |
| Generic account notification branch                    | Remove: the dedicated static `/account/notifications` route owns this URL. Remove its old filter helper/type and irrelevant order/return pagination filter forwarding; preserve real inbox filtering and navigation                  |
| 26 implementation-only exports                         | Retain the implementations as local declarations; compiler-symbol and manual call-site review found only same-module references, with no external/test import. Do not change exported framework, dynamic-import or test entry points |
| Root `SAMPLE_PRODUCTS.md` and `RETURN_POLICY_DRAFT.md` | Remove superseded originals after consolidating useful records into `docs/reference/catalogue-and-return-notes.md`; update the historical Phase 7 source pointer without changing its recorded test/acceptance results               |
| Application modules and generated types                | Initial graph has 60 Next.js/proxy entry points and no unreachable application module except intentionally retained `database.types.ts`; no justified whole runtime-module deletion was found                                        |
| CSS/modules                                            | CSS-module scan finds no unused selectors. A separate global-style review found 13 selectors for the retired `notes-title` journal section; remove those only, retaining shared `why-title` service rules and all design tokens      |
| Required assets, package/lockfile and SQL              | Preserve all. Local product WebPs have live database/fixture references; logo/email logo/icon serve actual framework/UI/email callers. All runtime dependencies have retained callers                                                |
| Tests, seeds, audits and recovery contracts            | Preserve. Similar route loading/error files are framework boundaries, and similar SQL tests cover different scenarios; they are not dead just because filenames/content resemble each other                                          |

The exported-symbol scan is a candidate finder, not a deletion authority. Dynamic imports, import aliases, GSAP reexports and framework entry points were reviewed separately and retained. Internalizing a declaration does not delete its implementation or change an HTTP/database contract.

## Phase 12 handoff

The authoritative next checklist is the **Phase 12 execution plan** in [PROJECT_PLAN.md](../../PROJECT_PLAN.md). It is one focused owner-workspace batch: shared navigation and active-route orientation; clear links to the existing overview/verification/rules/inbox/delivery screens; coherent landing/loading/error/session states; keyboard/reflow checks; one verified release. Use existing owner Auth/RLS/session checks and existing operational services. No new package, migration, role matrix, fake dashboard data or future-module placeholder is expected.

Product/collection/inventory management remains Phase 13; fulfillment, returns/RTO and COD settlement remain later modules. The accepted storefront, existing owner operations and essential notifications remain protected. Reviews/newsletter/journal/marketing/subscription opt-ins remain outside scope. The new [operating reference](../reference/catalogue-and-return-notes.md) preserves useful merchant decisions without instructing anyone to recreate staff roles or switch email providers.

## Verification

The preparation is checked against the retained application and the specific public route being simplified. A browser regression verifies `/account/notifications?filter=unread&page=2` uses the dedicated feed and ignores obsolete offset pagination, legacy category filtering still works, and the settings link reaches the withdrawal screen. Existing verification/customer/admin/checkout/storage regressions remain required. Global journal rules are pruned by selector, preserving the two shared service-section rules; no `notes-title` markup or JavaScript reference remains.

Final local verification against the complete cleanup source:

- Formatting, zero-warning ESLint and strict TypeScript pass. The additional `noUnusedLocals`/`noUnusedParameters` compiler check passes.
- **196 application tests across 30 files pass**. No existing test file or supported behavior test was deleted.
- **108 Chromium browser tests pass with retries disabled (2.6 minutes)** on the final production build, including the added legacy-filter/dedicated-route regression. A preceding 108-test pass was followed by discovery of the global journal selectors; the build and full browser gate were repeated after removing those selectors.
- Production build passes on Node 24.21.0 with the repository's isolated CI placeholder environment. This does not establish real order/inbox acceptance.
- Runtime dependency audit reports **zero vulnerabilities**; the existing full development-tool exception remains documented in `SECURITY.md`.
- Final source graph still has 60 route/proxy roots; generated database types remain the only intentional unreferenced module. CSS-module audit is empty. A structural comparison proves every remaining global CSS rule/declaration matches the starting version after excluding only the 13 retired journal selectors.
- Updated local document links resolve; both superseded root documents are removed; historical audit results are preserved with only their relocated source pointer updated.
- Public assets, package/lockfile, all SQL migrations/seeds and all database tests match the starting commit.

No production SQL write, migration, Auth setting, consent, inventory, order, email or checkout change is part of the cleanup. SQL files and dependencies are unchanged; the prior 24-script database regression and service acceptance limits remain recorded in Part 4 rather than being presented as a fresh real merchant journey. External Cloudinary DNS failures still occur in this environment, so full external-media visual acceptance and clean production logs are not claimed.

## Release and recovery

Build/test/audit the whole preparation batch before creating one commit and one main update. Let the existing Git integration deploy it; no preview or duplicate deployment. Compare the remote base before updating it. Check CI, exact deployment SHA, production READY alias and live route/security smoke outcomes after the update and report those outcomes in chat; this pre-push record does not predict them.

Application rollback target: `9a418ce541e9b2fa798fb4f5cf7175ff8c448837`. No schema/data restore is needed for this source/doc cleanup. Git retains removed source/docs; restoring old application code is compatible with the unchanged database contracts. Do not delete private archives, migration history or perform recovery SQL as part of ordinary cleanup.

Carried limits: checkout closed; real merchant/order/account/inbox acceptance, full backup/restore, production runtime-error access (last read returned 403), external-media visual checks, manual/device accessibility and field performance evidence remain open as detailed in [Part 4](part-4-final-verification.md). This is not a “100% launch ready” certification.
