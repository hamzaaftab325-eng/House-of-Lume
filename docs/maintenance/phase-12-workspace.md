# Phase 12 — Owner workspace completion

## 20 October selected-design revision

The initial `96f4e0e` foundation passed technical checks but the owner identified insufficient visual fidelity. This revision uses the newly selected [DWELLUNE dashboard](../reference/owner-dashboard-selected.webp), replacing the earlier visual acceptance claim. It applies a compact sidebar, dark bronze selected state, stronger Manrope headings, four separate summary tiles, two upper panels and three lower operational panels. The empty-state icon is centered and the sidebar uses narrower proportions with a thin overflow scrollbar only when needed.

The dashboard does not reproduce the mockup’s device frame, hands, sample furniture or invented revenue. The real preview order value sums the same up-to-five pending requests shown in the table and explicitly says it is not revenue. The SVG ring groups only those requests by manual review/awaiting contact, with text counts, preview labels and an unfilled zero state. It is server-rendered without new chart dependencies, inline styles, extra data requests or client-side analytics. Existing error, loading, auth and session behaviors are retained.

Revision verification:

- Lint, strict TypeScript with unused-local/parameter checks, repository formatting and 196 application tests pass.
- Full browser regression: 123 passed, one worker, no retries (4.5 minutes). Notification revocation also passes in the separate 25-test notification/workspace run.
- The final spacing-only refinement is clean-built and the 15 workspace tests rerun, including all seven widths, accurate manual/contact counts, unfilled empty ring, screenshots, keyboard and session/customer boundaries.
- Desktop and mobile authenticated screenshots are inspected; screenshot capture now waits for the live session check so a hidden-session state cannot be mistaken for the dashboard.
- Runtime audit: zero vulnerabilities. No dependency/lockfile, service, API, SQL, owner access rule or launch flag changes.
- Existing local Cloudinary DNS errors remain a storefront-media verification limitation; no external image requests are added by this dashboard.

 Production evidence is reported against the resulting SHA after the single release; no second documentation push is required.

Rollback for this revision: `96f4e0ea2f7e9c65d960459193c909b3328a3029`. No database change or checkout activation.

## Earlier foundation evidence


Implementation and local verification complete, 20 October 2026. The single-push production gate below must be verified against the resulting commit; post-push evidence is reported with the release.

## Scope and result

The owner-approved dashboard composition is applied to a real, single-owner workspace: branded desktop sidebar, compact header, native mobile navigation, current-location breadcrumbs, actual owner identity, notifications, sign-out and account/storefront links. Existing verification, rules, notification inbox and delivery screens share compact workspace typography and responsive content spacing.

The overview reads existing authorized verification and unread-notification services concurrently. Its up-to-five-row queue is explicitly labelled as a preview, not a total count. Empty queues have an actionable empty state. Errors go through the recoverable workspace boundary; failed requests never become zero. No chart, stock balance, sales number, customer identity or COD reconciliation amount is fabricated.

The selected image describes the mature layout; product/inventory management (13), fulfillment (14), returns/RTO (15), reconciliation (16), customers (17) and reporting (20) retain their phase ownership. Those future features are not claimed complete by Phase 12.

## Security and integrity

- Existing server-side owner identity checks, live-session guard and recipient-scoped services are unchanged.
- Anonymous/customer access cannot acquire admin data; session uncertainty hides private content and supports retry.
- Verification decisions, idempotency/conflict handling, policy writes, notification withdrawal and SMTP uncertainty controls remain in their existing services.
- No dependency, SQL migration, permission, Auth flag, email producer or checkout-setting change.
- No production test orders, account creation or outgoing emails are required for this release.

## Validation

- Locked `npm ci`: passed; package and lockfile unchanged.
- Formatting: passed across the repository; the previous release's formatting failure is resolved.
- ESLint: passed with zero warnings.
- Strict TypeScript plus unused-local/parameter checks: passed.
- Application tests: 196 passed across 30 files.
- Clean production build: passed. Generated build output was removed before the final build; its route manifest references the current focus-handling client bundle.
- New Phase 12 browser checks: 13 passed. Screen widths: 320, 375, 768, 1024, 1280, 1440 and 1920px. Coverage includes navigation/active locations, native mobile dialog, keyboard wrapping/Escape/focus restoration, breakpoint dismissal, empty queues, skip link, customer denial, hidden uncertain sessions and retry.
- Full browser regression on the clean production build: 121 passed, one worker, retries disabled (3.7 minutes). This includes retained shopping, accounts, verification/policy retries, revoked sessions, notification controls and delivery flows. Keyboard checks explicitly activate the page before keyboard interaction.
- Authorized overview page-error checks: no uncaught browser errors in the tested width/navigation matrix. Deliberately denied sessions may log expected server authorization errors.
- Runtime dependency audit: zero vulnerabilities. The existing development-only tooling exception remains documented in `SECURITY.md`.
- Visual review: desktop and mobile overview screenshots inspected using local-only test data. No screenshot is shipped as the interface.
- Contrast: ink/paper 17.00:1; ash/paper 5.45:1; ash/canvas 5.08:1; bronze focus outline/paper 3.94:1. Existing reduced-motion styles remain active; new layout adds no decorative animation.
- Source hygiene: all new workspace CSS selectors are used; no inline style, debug logging, new dependency, server-service/API modification or SQL change. Original build-phase numbering and local document links remain valid.

Existing SQL tests/migrations are unchanged; this batch adds no database behavior. Authorization service/route tests and browser boundary/revocation checks pass. A new production database mutation or restore is neither performed nor claimed. Local external storefront-image requests still encounter the previously recorded Cloudinary DNS limitation; that does not establish real image/device or field performance acceptance.

## Release and rollback

Target: existing `main` and canonical https://dwellune.vercel.app. No feature branch or preview. The release must have all of the following before being reported complete:

1. The final local commit and GitHub `main` match, with parent `96f4e0e`.
2. [GitHub CI on main](https://github.com/hamzaaftab325-eng/House-of-Lume/actions?query=branch%3Amain) succeeds for that exact commit.
3. The canonical Vercel production alias is READY on that same commit, without alias errors.
4. Read-only live route, private API/sign-in guards, fixture denial and closed-checkout checks pass.

These observations are made after publication and supplied in the release report, avoiding a second documentation-only push. No duplicate deployment is needed when the Git integration succeeds.

Pre-release rollback SHA for the initial foundation: `a7f0c86864a46b89638e561ee7ab137de557baaa`. Roll back application code only if necessary; no database restore is required for this batch.

The workspace used for earlier maintenance contained older uncommitted cleanup work. It was preserved unchanged; completion work uses an isolated clean copy of the existing `main` branch at the production SHA.

## Remaining launch gates

Checkout remains disabled. Real merchant catalogue/order/inbox acceptance, hosted Auth email acceptance, full backup/restore rehearsal, production log access, external-image/device acceptance and field Core Web Vitals remain as recorded in the existing roadmap. These are not newly completed by workspace layout tests. Runtime dependency audit and documented development-tool exceptions retain their separate meanings.
