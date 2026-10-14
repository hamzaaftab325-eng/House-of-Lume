# DWELLUNE — Application Architecture

## Pending Phase 7 account implementation

Private account/auth routes, `/api/auth`, `/api/account`, a Next.js 16 session-refresh proxy and validated customer services/forms are prepared locally. Email actions remain gated by `AUTH_EMAIL_READY`. Recovery uses a private HMAC secret and a short-lived HttpOnly grant bound to the verified user/session.

Account reads/writes verify identity, active customer and live Auth session. The applied migration adds restrictive session policies and narrower customer column grants to protect staff notes and notification payloads. Existing Auth provisioners/email synchronization are reused. Browser session events hide stale private content and cancel commerce actions queued under an earlier identity. Background identity checks preserve form state. Order details show owned status history and exclude previously requested/excluded quantities from the return form. Notifications support all, unread, order, return and account filters. Nothing in this section claims a deployed Phase 7; `PHASE_7_AUDIT.md` tracks the acceptance blockers.

**Status:** Phase 0 production baseline  
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

Customer-owned authenticated surfaces once Supabase Auth is introduced.

Examples later:

- profile
- addresses
- order history
- returns
- wishlist
- notification center

### `(crm)`

Staff-only operations once RBAC is introduced.

Examples later:

- orders
- customers
- products
- inventory
- notifications
- returns/RTO
- COD reconciliation
- analytics
- staff/settings

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
- staff/customer authorization is enforced before private data is returned
- database result types are explicit
- N+1 query patterns are reviewed
- indexes follow real query patterns
- service-role access never reaches the browser

The concrete Supabase adapters will be introduced in Phase 1.

## 7. Validation Boundary

All untrusted input is validated at the first trusted server boundary.

Use Zod schemas for:

- Server Action inputs
- Route Handler payloads
- query/search parameters where needed
- environment variables
- external webhook/provider payloads when integrations are introduced

`src/lib/validation.ts` provides the baseline parsing pattern.

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

- `src/lib/result.ts`
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `src/app/not-found.tsx`

Error messages shown to customers must not expose internal stack traces or sensitive data.

## 9. Logging and Observability

`src/server/logger.ts` is the initial structured logging boundary.

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

The Phase 0 global stylesheet establishes tokens, responsive shell behavior, focus treatment, and reduced-motion fallback only. Final reusable commerce components arrive in Phase 2.

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

The checkout UI uses a private context endpoint and strict same-origin quote endpoint. Server session/customer checks resolve saved addresses; the database computes canonical totals through `checkout_quote`. Quotes expire and are invalidated by cart/contact/address changes. Checkout does not submit orders; Part 2 must repeat validation inside its atomic order transaction. See `PHASE_8_PART_1_AUDIT.md`.

## Phase 8 Part 2 prepared application

COD order submission is deployed with a closed database release gate. The database atomically validates and snapshots orders, transfers inventory holds and emits in-app/email events. The owner selected Gmail SMTP (`dwellunestore@gmail.com`) in place of Resend for order confirmations. Supabase cron invokes a protected Node worker once per minute; Vault contains only its scoped capability and canonical HTTPS URL. The Gmail App Password remains server-only in Vercel. No application service-role credential is required. Owner/cookie-scoped attempt recovery supports ambiguous order network results. See `GMAIL_ORDER_EMAIL_AUDIT.md` and `PHASE_8_PART_2_AUDIT.md` for email behavior and pending launch gates.
