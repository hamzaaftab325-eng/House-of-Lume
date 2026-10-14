# Phase 10 Part 1 — Final Audit

Date: 14 October 2026. Scope: customer and staff in-app notification centers, badges, read controls, filters and cursor navigation.

## Functional

✅ Shared customer `/account/notifications` and staff `/crm/notifications` centers reuse the persistent notification model. All/unread, category and staff priority filters, bounded cursor pages, newest navigation, empty/loading/error/invalid-filter states and manual refresh are implemented.

✅ Storefront signed-in unread badge and staff navigation unread badge. Counts refresh after reads, cross-tab updates, visibility return and 60-second visible-page polling. Guest pages do not fetch private notification counts. Failure shows an unknown count instead of a fabricated zero. This is polling, not a WebSocket/Realtime delivery claim.

✅ Single-read uses server time and preserves that timestamp on retries. Mark-all affects the owned audience across categories/pages only up to the page's server-issued load cutoff; newer notices stay unread. Ambiguous results preserve the same action/cutoff for retry. Read changes never modify order or delivery state.

✅ Entity links derive from implemented owned order/return routes, published product slugs and account routes. Arbitrary stored URLs are ignored and output URLs have a second application allowlist. Unimplemented CRM workflows have no invented destinations.

## Security and data

✅ Migration `20261014160045_phase10_notification_centers.sql` is applied and immutable; types regenerated. Audience and cursor indexes extend existing tables. Existing event emitters remain compatible through a before-insert audience convention. Staff/customer inboxes remain distinct even for Super Admin.

✅ RLS and RPCs enforce live sessions, active account/staff and recipient ownership. Super Admin no longer receives global access to other recipients' inboxes. Direct read timestamp resets are revoked. Strict request validation, same-origin mutation checks and private/no-store responses remain independent of UI controls.

✅ Hosted rollback suite passed owned audiences, foreign read/cursor denial, metadata spoof, expired session/inactive staff, RLS, tied timestamp keyset pagination, filters, URL denial, stable read timestamps and cutoff-safe mark-all. Event regression passed actual confirmation/cancellation notices, safe customer order links, replay dedupe, read count and unchanged order state. No test user/order/notice/email persists; checkout remains false. A larger legacy Phase 9 regression request expired in the tool; the smaller real-event regression above passed.

## Design, responsive and accessibility

✅ Existing brand tokens/components, semantic forms/lists/navigation, labels, priority text/visual cues, button state, keyboard controls and live feedback. Compact header badge and narrow-screen logo sizing preserve core controls. No new runtime dependency. Mobile/desktop screenshots reviewed and reflow verified.

## Quality and release

✅ 158 application tests across 28 files passed. Formatting, zero-warning lint, TypeScript, runtime audit (zero vulnerabilities) and production build passed. All 86 local Chromium scenarios passed on the final run, including both authenticated fixture centers, filters/cursors, read controls, uncertain retries, private access/revocation, mobile header counts and keyboard/reflow checks.

The first browser run passed 81 scenarios immediately and four keyboard checks on retry. Those checks focused before page hydration settled; new notification checks now await network idle. The next run exposed a test interception pattern missing the commerce URL's query string; it was corrected. The existing Phase 9 settings keyboard check also now waits for page readiness. These were test synchronization/fixture issues, not changes to production authorization.

⚠️ Existing local Cloudinary DNS EAI_AGAIN warnings limit live-image acceptance. Security advisor has no new findings; private deny-all table INFO is intentional and the existing leaked-password-protection WARN remains external configuration. No cloud browser was used, admin password was not reset and no outbound email was sent.

## Remaining

Part 2 event registry/coverage, preferences and expanded operational delivery handling remain pending. Live signed-in owner acceptance of these new centers follows deployment. Real-product checkout acceptance remains deferred. Full Phase 10 is not claimed 100% complete.

One final main commit triggers the production deployment after local gates. Deployment/CI/public access checks are reported separately after release.
