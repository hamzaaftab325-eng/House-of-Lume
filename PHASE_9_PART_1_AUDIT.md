# Phase 9 Part 1 — staff COD verification

Date: 14 October 2026. Scope: manual verification workflow. Part 2 fraud/abuse controls and merchant-led live order acceptance remain separate.

## Checklist and implementation

- Protected `/crm/verification` queue: pending, confirmed, cancelled and all orders; bounded 20-row keyset pagination with deterministic timestamp/UUID ordering.
- Protected order review: snapshot items, totals, customer contact, delivery address, customer note, verification status and progress. Server Components render private data; the interactive form receives only order ID, revision and permission booleans.
- Manual phone/WhatsApp/email links. Opening a link is not an outbound contact event. Staff record actual method, outcome and private note. No automated phone, WhatsApp or email message is sent by this feature.
- Confirm, reject and eligible cancellation. Confirmation records acting staff and verified timestamp, leaving inventory reserved and COD settlement unchanged. Rejection/cancellation use the existing atomic stock-release trigger.
- Cancellation is limited to pending/confirmed orders with no shipment and `not_due` settlement. Later fulfillment/return/refund actions are outside this workflow. No reopening action is provided.
- Required private notes and explicit decision review in the UI. Customers see safe owned status/history and in-app confirmation/cancellation notifications, never verification notes or staff audit payloads. Contact attempts do not themselves confirm orders.
- Every RPC requires an active Super Admin and live Auth session, independent of user-editable metadata. Staff identity comes from Auth, not caller input. Revocation is rechecked by `/api/admin/session`; cross-tab changes hide stale private screens.
- Optimistic revision checks prevent stale tabs from overwriting another decision. Actor-scoped request receipts preserve replay after a state transition. Identical retries do not create extra attempts, stock ledger entries, notifications or audit records. Changed payloads conflict.
- Infrastructure/result uncertainty remains HTTP 503. The form freezes its original payload/key and offers a same-attempt retry. Deterministic conflicts require reviewing a refreshed order. No contact/address payload is persisted in localStorage.
- Responsive brand-token styles, keyboard labels, fieldset/legend, decision checkbox, live feedback, noindex/private/no-store routes, loading/empty/error and denied-access states. No new runtime dependency.

## Data changes

`20261014115449_phase9_staff_cod_verification.sql` adds order verification revision, structured contact/action metadata, private idempotency receipts, queue index and guarded queue/detail/action RPCs. Customer access to `cod_verifications` is revoked to keep staff notes private. Existing order/history/customer permissions remain narrow. Applied migrations are immutable; TypeScript database types were regenerated.

## Verification

- 131 application tests across 24 files passed, including strict input/contact URL validation, safe error mapping, uncertainty preservation and production fixture-bypass denial.
- Real database rollback tests passed active staff/session boundaries, metadata spoof denial, contact replay/conflict, stale revision, staff/time attribution, confirmation stock/COD separation, cancellation stock release exactly once, rejection, safe customer progress, deduplicated notifications/audit, bounded queue pagination and shipped/collected/inactive-staff denial.
- Database test fixtures, sessions, orders and notifications were rolled back. No live customer order or contact message was created.
- Formatting, zero-warning lint, TypeScript and production build passed. All 69 local Chromium browser scenarios passed, including single-request double-click protection, authenticated fixture contact/confirm/cancel/reject, immutable uncertain retries, stale conflicts, cross-tab staff revocation, keyboard focus and 375/768/1440px reflow. Mobile/desktop screenshots were visually reviewed. Existing Cloudinary fixture DNS warnings do not establish live image acceptance; no cloud browser was opened.
- Supabase's applied migration versions were compared with the repository. Seven preparation-timestamp filenames were aligned with their actual history versions, preserving the applied SQL byte-for-byte. Documentation references were updated; no migration was reapplied or changed.
- The final browser run completed 69 scenarios: 68 passed immediately and an existing short-mobile hero timing check passed on retry. An initial double-click test looked for the idle button label after it changed to “Saving…”; its selector was corrected and the single-request safeguard passed.
- Local UI fixtures require a loopback URL, the CI placeholder database, the explicit commerce fixture flag and absence of Vercel. Production never uses them; fixture cookie alone cannot confer staff access.
- Advisor INFO for the private receipt table is intentional deny-all access. Existing external leaked-password-protection warning remains unchanged.

## Remaining

The user deferred real-product checkout/merchant acceptance until products are added. Checkout remains disabled. Product management and complete fulfillment CRM are later work. Part 2 still needs verification configuration, duplicate/high-value/failed-delivery signals, manual review flags and strengthened abuse controls. No claim that the full Phase 9 is 100% complete is made.
