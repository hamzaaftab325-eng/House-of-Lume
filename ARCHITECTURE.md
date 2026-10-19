# DWELLUNE — Application Architecture

## Current implementation and launch boundary

Private account/auth routes, `/api/auth`, `/api/account`, the Next.js 16 session-refresh proxy and validated customer services/forms are deployed. Recovery and email-change actions remain gated by `AUTH_EMAIL_READY`. Recovery uses a private HMAC secret and a short-lived HttpOnly grant bound to the verified user/session.

Account reads/writes verify identity, active customer and live Auth session. Restrictive session policies and narrower customer column grants protect internal notes and notification payloads. Existing Auth provisioners/email synchronization are reused. Browser session events hide stale private content and cancel commerce actions queued under an earlier identity. Background identity checks preserve form state. Order details show owned status history and exclude previously requested/excluded quantities from the return form. Notifications support all, unread, order, return and account filters. Deployed code is distinct from real-account/inbox acceptance; the current launch gates are recorded in `docs/maintenance/part-4-final-verification.md`.

**Status:** Maintained through single-owner conversion and storefront cleanup, 19 October 2026

**Applies with:** `AI_INSTRUCTIONS.md`, `design.md`, `PROJECT_PLAN.md`, `PHASE_EXECUTION_TEMPLATE.md`, and `SECURITY.md`

## 1. Architectural Principle

DWELLUNE uses a layered Next.js App Router architecture. UI, domain rules, server orchestration, and persistence must remain distinct so later commerce phases can grow without page-level business logic or duplicated data access.

Default flow:

```text
Route / Server Component
        ↓
Validated action or route boundary
        ↓
Application service
        ↓
Domain rules
        ↓
Data-access adapter
        ↓
Supabase/PostgreSQL
```

The browser must never become authoritative for prices, inventory, COD eligibility, permissions, order state, or settlement state.

## 2. Route Groups

### `(store)`

Public customer-facing commerce and editorial experience.

Examples later:

- home
- shop
- collections
- products
- search
- cart
- COD checkout

### `(account)`

Customer-owned authenticated surfaces protected by Supabase Auth and database ownership checks.

Examples later:

- profile
- addresses
- order history
- returns
- wishlist
- notification center

### `(crm)`

Owner-only operations. The current single-admin contract below supersedes historical role-based descriptions.

Examples later:

- orders
- customers
- products
- inventory
- notifications
- returns/RTO
- COD reconciliation
- analytics
- settings

Route grouping is organizational; authorization must still be enforced server-side.

## 3. Server and Client Boundaries

React Server Components are the default.

Use Client Components only when a component genuinely needs browser-only behavior such as:

- event-driven local interaction
- browser APIs
- Motion UI state
- client-only accessibility behavior
- interactive controls that cannot remain server-rendered

Do not mark a page or layout `use client` merely because one nested component is interactive.

Keep client boundaries as low in the tree as practical.

## 4. Domain Layer

Domain code expresses business meaning and should remain framework-light.

Examples in later phases:

- money/order-total rules
- inventory reservation rules
- COD eligibility
- valid order transitions
- valid fulfillment transitions
- COD settlement transitions
- return/RTO rules
- notification event definitions

Domain rules must not depend on React components.

## 5. Application Service Layer

Application services orchestrate business use cases.

Examples later:

- create COD order
- reserve inventory
- confirm order
- record delivery attempt
- initiate RTO
- reconcile COD settlement
- create notification event

A service may coordinate multiple domain rules and data-access operations. Atomic multi-step operations must use a transaction/RPC pattern when the database phase is introduced.

## 6. Data-Access Layer

Persistence code belongs in server-only data-access adapters.

Rules:

- components do not query Supabase directly by default
- persistence queries are centralized by domain/use case
- owner/customer authorization is enforced before private data is returned
- database result types are explicit
- N+1 query patterns are reviewed
- indexes follow real query patterns
- service-role access never reaches the browser

Concrete adapters live in `src/server` and `src/lib/supabase`; authoritative multi-step commerce writes run in database RPCs.

## 7. Validation Boundary

All untrusted input is validated at the first trusted server boundary.

Use Zod schemas for:

- Server Action inputs
- Route Handler payloads
- query/search parameters where needed
- environment variables
- external webhook/provider payloads when integrations are introduced

Domain schemas in `src/lib` and the services validate inputs with Zod `parse`/`safeParse` at the first trusted boundary. The unused generic validation wrapper was retired in maintenance Part 3.

Validation does not replace authorization.

## 8. Result and Error Pattern

Expected business failures should use typed result/error values rather than throwing indiscriminately.

Examples:

- invalid input
- out of stock
- unsupported delivery area
- invalid status transition
- insufficient permission

Unexpected infrastructure failures may throw and should reach the application observability/error-boundary path.

Current primitives:

- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `src/app/not-found.tsx`

Error messages shown to customers must not expose internal stack traces or sensitive data.

## 9. Logging and Observability

The unused generic result/logger scaffolding was retired in maintenance Part 3. Domain services and Next.js error boundaries remain the active error/reporting paths; a future observability adapter must be wired into actual callers before being described as operational.

Rules:

- logs use structured event names and context
- secrets and sensitive customer data must not be logged
- expected UI state is not console noise
- production errors remain observable
- later monitoring integrations should be implemented behind this boundary or a dedicated observability adapter

## 10. Environment Strategy

Environment values are validated through `src/lib/env.ts`.

Rules:

- public values use `NEXT_PUBLIC_` only when browser exposure is intentional
- secrets never use `NEXT_PUBLIC_`
- `.env.example` contains names/examples only, never credentials
- development, preview, and production integrations remain separate

## 11. Styling Architecture

Production styling follows `design.md`.

- Tailwind CSS for layout/utilities
- semantic CSS variables for design tokens
- CSS Modules only for complex art-directed components where valuable
- reusable component variants instead of duplicated class strings
- no routine inline styles

The global stylesheet establishes tokens, responsive shell behavior, focus treatment and reduced-motion fallbacks. Shared controls and domain components live in `src/components`.

## 12. Motion Architecture

Phase 0 establishes reduced-motion and lifecycle expectations without prematurely loading animation libraries on every route.

When Phase 2 introduces motion libraries:

- GSAP + ScrollTrigger own scroll choreography
- Lenis owns optional storefront smooth-scroll behavior
- Motion / Framer Motion owns React UI-state transitions
- SplitType owns selected editorial text splitting
- CSS owns simple hover/focus transitions

One animated property should have one owner.

## 13. Testing Layers

### Unit / domain

Vitest tests isolated rules and utility behavior.

### Integration

Added as real data/services are introduced.

### E2E

Playwright verifies critical user/route behavior against a production build.

Phase 0 smoke coverage verifies:

- storefront foundation route
- account route
- CRM route
- key navigation targets

Later phases expand E2E coverage according to `PROJECT_PLAN.md`.

## 14. CI Quality Gate

The `CI` workflow runs on `main` pushes and pull requests using Node.js 24 LTS, current GitHub Actions runtime releases, and the committed dependency lockfile.

Required gates:

1. `npm ci`
2. production dependency audit (`npm audit --omit=dev --audit-level=high`)
3. Prettier formatting check
4. ESLint
5. TypeScript
6. Vitest
7. Next.js production build
8. Playwright Chromium E2E smoke tests

The production runtime audit must have no high/critical vulnerabilities. Development-only advisory handling and compatibility exceptions are governed by `SECURITY.md`.

A failing required gate means the phase is not complete.

## 15. Import Direction

Prefer dependencies flowing inward toward stable domain logic.

```text
UI / routes
   ↓
application services
   ↓
domain rules
   ↓
interfaces / data-access contracts
   ↓
server adapters / persistence
```

Avoid circular imports and avoid importing UI code into domain/server layers.

## 16. Phase 0 Boundary

Phase 0 intentionally does **not** implement:

- Supabase schema/auth
- product catalogue
- final storefront components
- GSAP/Lenis/Motion integrations
- cart/order logic
- notifications
- CRM authorization

Those belong to later phases defined in `PROJECT_PLAN.md`.

Phase 0 exists to make those implementations consistent, testable, secure, and maintainable from the beginning.


## Phase 6 commerce boundary

`StoreCommerceProvider` owns the shared browser view of the bag and saved objects. The header drawers and `/cart` and `/wishlist` pages reuse the same line controls. `/api/commerce` validates a bounded action payload, checks mutation Origin against the request host/protocol, sends private no-store responses, and issues the HttpOnly/SameSite guest identity. `commerce.service.ts` verifies the Auth session through `getUser()` and invokes the ownership-aware Supabase RPCs; no service-role credential is used.

Browser storage contains only guest wishlist IDs and a replayable legacy import receipt, never authoritative cart prices. Auth changes hide stale account data, trigger cart claiming and wishlist merging, and update all subscribed surfaces. Cross-tab events and visible-tab refresh keep quantities and reservation state current. Cart and wishlist pages use native scrolling; drawer interaction does not depend on editorial motion.

`commerce.fixture.ts` is reachable only when the explicit test flag, placeholder Supabase URL and localhost site URL all match. It supplies canonical test products for browser regression tests. Production always calls Supabase. Database transaction tests separately verify the real RPC contract, stock/price changes, guest/account ownership, failed-write rollback, imports and expiry.

## Phase 8 Part 1 checkout

The checkout UI uses a private context endpoint and strict same-origin quote endpoint. Server session/customer checks resolve saved addresses; the database computes canonical totals through `checkout_quote`. Quotes expire and are invalidated by cart/contact/address changes. The deployed Part 2 order transaction repeats validation atomically, but production order submission remains closed by its release gate. See `PHASE_8_PART_1_AUDIT.md` and `PHASE_8_PART_2_AUDIT.md`.

## Phase 8 Part 2 prepared application

COD order submission is deployed with a closed database release gate. The database atomically validates and snapshots orders, transfers inventory holds and emits in-app/email events. The owner selected Gmail SMTP (`dwellunestore@gmail.com`) in place of Resend for order confirmations. Supabase cron invokes a protected Node worker once per minute; Vault contains only its scoped capability and canonical HTTPS URL. The Gmail App Password remains server-only in Vercel. No application service-role credential is required. Owner/cookie-scoped attempt recovery supports ambiguous order network results. See `GMAIL_ORDER_EMAIL_AUDIT.md` and `PHASE_8_PART_2_AUDIT.md` for email behavior and pending launch gates.

## Admin COD verification

`/crm/verification` and its order pages use singleton owner/live-session checks and guarded database RPCs. The queue uses 20-row keyset pagination. Manual contact logs, confirmation and eligible cancellation record private notes, staff attribution and audit entries. Actor/request receipts deduplicate retries, while an order revision rejects stale decisions. Cancellation shares checkout's commerce lock ordering and existing reservation-release trigger; settlement remains independent. Customer notifications/history carry safe status only. `/api/admin/session` supplements cross-tab account invalidation with fresh owner/session checks. See `PHASE_9_PART_1_AUDIT.md` for tests and deferred launch acceptance.

## COD review policy and signals

`/crm/verification/settings` loads guarded policy data on the server. Its same-origin private API accepts a strict policy action with expected revision, staff reason and immutable request ID. Ambiguous writes freeze the original values for a safe retry; stale conflicts require reload. Policy receipts and audit entries share the database transaction. Settings cannot alter roles, SMTP or checkout enablement.

Queue/detail RPCs expose recorded review state to staff. Signal snapshots include canonical total threshold, recent matching normalized-phone/total orders and distinct prior failed-delivery/RTO orders. No score or automatic rejection is fabricated. Staff may flag a pending order, clear it with a note, then confirm separately. Confirmation/fulfillment/active-shipment guards enforce pending review in the database. Customer views retain only safe status/history; review notes and signals remain private. Admin review alerts use existing in-app notification records without sending extra contact emails.

## Notification centers

A shared server-rendered notification page loads a bounded, recipient-scoped feed for customer or staff audience. `/api/notifications` validates strict bounded requests, uses fresh account/staff checks, returns private no-store responses and rejects foreign-origin mutations. No service-role credential is used. Account profile snapshots now count only customer notices and avoid loading unused notification bodies. Existing account read actions delegate to the same guarded RPC.

A small client boundary handles read controls and keeps an immutable action/cutoff during uncertain results. Local/cross-tab read signals refresh counts; only event markers are stored, never notice content. Visible-page polling/return and manual refresh update inboxes without a Realtime dependency. Auth generation checks/abort cleanup prevent outdated badge requests from applying after identity changes. Staff session guards hide stale private screens after revocation. Header badges display unknown counts honestly after failures.

Only existing order/return/product/account routes become links; unimplemented CRM return/product-management routes have no fabricated links. Part 2 remains responsible for complete event coverage, preferences and notification delivery operations.

## Notification producers and operations

A private registry holds event/audience/category/priority/essential status and active/deferred producer dependencies. Only trusted database producers invoke `emit_notification`; it atomically claims a recipient receipt before recording or suppressing an optional notice. Current state transitions reuse real order/return/inventory/worker records. No public event-emission endpoint or fake future fulfillment event is provided.

Preferences derive customer identity from the live session and cannot select recipients or disable essential updates. The client freezes choices during uncertain saves and retries those same values. The staff delivery view uses a guarded bounded RPC and exposes job IDs, status, attempts and safe error codes, never SMTP secrets, payloads or guest email addresses. It reports latest matching jobs plus full queue counts and registry dependencies. It offers no resend action for uncertain SMTP acceptance. Existing scheduler, durable leases, bounded retry rules and readiness checks remain the delivery authority.

## Phase 11 event email pipeline

Supported business transactions enqueue receipt/verification/confirmation/cancellation/return-request email snapshots. Durable event/recipient receipts serialize duplicate events; the Gmail worker claims a stored versioned payload and retains bounded retry/lease rules. Ambiguous sends require manual mailbox review. Failure alerts identify the job, and staff delivery operations exposes event/version without recipient/payload secrets. Future fulfillment/return-decision/RTO templates are renderable but have no active email producer. Auth SMTP remains independently configured. See PHASE_11_PART_2_AUDIT.md for verification and deferred acceptance.

## Single owner authorization — maintenance Part 2

The authoritative assignment is `app_private.store_owner`: one `singleton=true` row referencing `auth.users`. `is_owner()` checks the live verified, non-anonymous Auth session, ban state and access-valid-after floor. `owner_require()` locks that row during admin transactions; `owner_context()` returns only the authenticated owner user ID/email. The server validates this context against `auth.getUser()`. It never infers admin access from email text, user metadata or customer profile state. `/api/admin/session` returns `userId`; the CRM session guard uses that identity. Customer guards retain `customerId`.

Every existing verification, policy, notification and delivery operation uses the same owner authority. Notification producers target the owner directly. `is_super_admin()` remains a thin policy alias; persisted audience `staff`, receipt actor fields and verification RPC names remain stable. These are protocol compatibility, not separate roles or configurable permissions. The old directory/context/access-action RPCs and permission helpers are removed. Role/profile/permission tables and access receipts are retained as client-inaccessible `app_private.legacy_*` archives. Verification receipts are now `admin_verification_receipts`.

For rolling deployment compatibility, `public.staff_profiles` is a read-only security-invoker view exposing the one owner only to that owner's valid session. The new application does not query it. Database changes deploy before application code; the preceding application can continue its owner lookup against this bridge. A private scoped checkpoint contains pre-change function definitions/grants, access rows and tested reverse SQL. It is not a full Supabase/Auth/Vault backup.

## Storefront scope — maintenance Part 3

The public design showcase (`/system`) is removed along with exclusive editorial demo art/components, sample status/radio/tab/accordion controls, showcase motion wrappers and unused generic scaffolding. Working dialogs/drawers, toast feedback, form fields, product controls and every animation dependency remain reachable from production routes. Generated database types remain intentionally retained.

The homepage keeps its hero, categories, product shelf, room/material/service scenes, motion, closing composition and footer. Inactive journal/newsletter previews are removed. Closing and room/material actions lead to `/shop`; static room content does not pretend to switch to unpublished room experiences.

The product loader no longer queries reviews or serializes review summaries. The purchase panel and Product JSON-LD no longer present ratings. The review table and historical migrations remain intact. Category/options/variants/media/stock/shipping/related-product queries and Product/Offer metadata are unchanged.

Notification settings are withdrawal-only in the current UI: no new marketing/product opt-ins are offered. The existing guarded endpoint is retained for deployment compatibility; the UI submits both optional flags as false and verifies the returned values. Pending writes are locked; uncertain results retry the same off-values. One stored optional consent existed at preflight and is preserved until that customer chooses to withdraw it. Essential notification rules, existing recipient ownership, Auth guards and all SQL remain unchanged.

Hero animation ownership is isolated from the homepage editorial animator. Motion-mode changes revert hero text splits and clear interrupted child/filter state before showing the selected slide, preventing hidden content after a reduced-motion change.

## Final maintenance verification — Part 4

Optional recent-search and recently-viewed storage is best effort. Browser denial or quota failures must not throw through a product render, prevent keyboard search navigation, or block search controls. Recently viewed retains its bounded in-memory snapshot when persistence fails; authoritative cart, account and order data continue to use their existing server contracts.

The final maintenance audit consolidates Parts 1–3, local regression evidence, live read-only database/job checks, release/rollback steps and remaining launch gates. Retained `staff` audiences/RPC names and the read-only rollout bridge are compatibility contracts, not staff-management features. Do not remove private archives, migration history, existing consent or operational receipts to simplify terminology. See `docs/maintenance/part-4-final-verification.md`.
