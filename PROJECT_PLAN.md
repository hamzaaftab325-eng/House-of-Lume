> Current scope override — 19 October 2026: operate with one owner admin. No staff accounts, role editor, permission matrix, staff activation or staff management route is planned. Historical completed phase descriptions retain prior terminology where they document existing contracts. Maintenance Part 2 converts those contracts to owner-only access without adding commerce features. Parts 3 (storefront cleanup) and 4 (final verification) remain separate.

# DWELLUNE — Production Build Plan

**Status:** Approved planning baseline  
**Product:** Production ecommerce storefront + internal commerce CRM  
**Payment model:** Cash on Delivery only at launch  
**Design source of truth:** `design.md`  
**Execution source of truth:** `AI_INSTRUCTIONS.md`  
**Plan source of truth:** `PROJECT_PLAN.md`

---

# 1. Product Goal

DWELLUNE is a production-grade home décor ecommerce platform for lighting, plants, planters, decorative objects, candles, mirrors, and future home categories.

It is not a prototype. It must be capable of real customer ordering, real inventory handling, real Cash on Delivery operations, real internal order management, real notifications, real customer accounts, and real production deployment.

The product contains two connected systems:

1. **Customer Storefront** — discovery, shopping, cart, COD checkout, order tracking, account, notifications.
2. **Internal CRM / Commerce Operations** — products, inventory, orders, COD verification, delivery tracking, RTO, customers, notifications, reviews, returns, analytics, audit logs, settings.

---

# 2. Launch Commerce Rules

## Payment

- Cash on Delivery only.
- No Stripe/card/wallet/bank-transfer implementation in launch scope.
- COD eligibility must be configurable.
- Order values, delivery charges, discounts, and inventory are always recalculated server-side before order creation.
- Order creation must be idempotent to prevent duplicates.

## Order lifecycle

Order status is separated from COD settlement status.

### Order lifecycle

```text
pending_verification
→ confirmed
→ processing
→ packed
→ ready_to_ship
→ shipped
→ out_for_delivery
→ delivered
```

Exception paths:

```text
pending_verification → cancelled
confirmed/processing → cancelled
shipped/out_for_delivery → delivery_failed
out_for_delivery → delivered
out_for_delivery → rto_initiated
rto_initiated → rto_in_transit → rto_received
```

### COD settlement lifecycle

```text
not_due
→ cash_expected
→ collected_by_courier
→ pending_reconciliation
→ reconciled
```

Exception states:

```text
short_received
disputed
written_off
```

These state machines must be separate in the database and application logic.

---

# 3. Production Architecture

## Frontend / application

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- CSS variables / semantic tokens
- CSS Modules only where complex art direction requires them
- CVA for reusable component variants where useful
- Lucide React icons

## Motion

- GSAP + ScrollTrigger for scroll choreography and scrub animation
- Lenis for storefront smooth scrolling where appropriate
- Motion / Framer Motion for UI state transitions
- SplitType for selected editorial typography
- CSS for normal hover/focus transitions

## Backend / data

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- RLS
- Database migrations
- Typed data access

## Email

- Owner-selected Gmail SMTP (`dwellunestore@gmail.com`) for transactional order email; Auth SMTP is configured separately in Supabase. This 14 October 2026 owner decision supersedes the original Resend/domain requirement.

## Hosting

- Vercel

## Testing

- unit tests
- integration tests
- component tests where valuable
- end-to-end tests for critical commerce/CRM flows

---

# 4. Global Definition of Done

No phase is 100% complete until applicable checks pass.

## Functional

- [ ] Required behavior implemented
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Error states implemented
- [ ] Disabled/pending states implemented
- [ ] Failure recovery implemented where relevant

## Design

- [ ] Matches `design.md`
- [ ] No generic card drift
- [ ] No inline styles
- [ ] No duplicated class systems
- [ ] Correct design tokens
- [ ] Correct interaction states
- [ ] Correct animation ownership

## Responsive

- [ ] Small mobile
- [ ] Standard mobile
- [ ] Large mobile
- [ ] Tablet portrait
- [ ] Tablet landscape
- [ ] Laptop
- [ ] Desktop
- [ ] Wide desktop
- [ ] Intermediate widths checked

## Accessibility

- [ ] Semantic HTML
- [ ] Keyboard complete
- [ ] Focus visible
- [ ] Focus not obscured
- [ ] Accessible names
- [ ] Form labels/errors
- [ ] Contrast
- [ ] Reduced motion
- [ ] No hover-only required functionality
- [ ] No drag-only required functionality

## Security / data

- [ ] Server validation
- [ ] Authorization enforced server-side
- [ ] RLS reviewed where applicable
- [ ] No secret exposure
- [ ] Input validation
- [ ] Abuse/rate-limit considerations
- [ ] Auditability for sensitive changes

## Quality

- [ ] Install succeeds
- [ ] Lint passes
- [ ] TypeScript passes
- [ ] Tests pass
- [ ] Production build passes
- [ ] No known runtime console errors
- [ ] Core routes verified
- [ ] Regression checks pass

---

# 5. Phase 0 — Repository, Architecture & Engineering Foundation

## Goal

Create a production-quality base that later phases do not need to rewrite.

## Checklist

### Repository foundation

- [ ] Initialize Next.js App Router
- [ ] Configure strict TypeScript
- [ ] Configure Tailwind CSS
- [ ] Configure ESLint
- [ ] Configure formatting rules
- [ ] Add `.editorconfig`
- [ ] Add `.gitignore`
- [ ] Add `.env.example`
- [ ] Add environment validation
- [ ] Add project README
- [ ] Preserve `design.md`
- [ ] Preserve `AI_INSTRUCTIONS.md`
- [ ] Preserve `PROJECT_PLAN.md`

### Architecture

- [ ] Define storefront route groups
- [ ] Define account route group
- [ ] Define CRM/admin route group
- [ ] Define server/client component boundaries
- [ ] Define data-access architecture
- [ ] Define service/domain layer pattern
- [ ] Define error handling pattern
- [ ] Define logging pattern
- [ ] Define API/action validation pattern

### Styling

- [ ] Implement design tokens from `design.md`
- [ ] Configure fonts
- [ ] Create base typography
- [ ] Create base focus styles
- [ ] Create responsive container utilities
- [ ] Create motion/reduced-motion foundation

### Testing

- [ ] Configure test runner
- [ ] Configure E2E framework
- [ ] Add smoke test

### Build gate

- [ ] Lint passes
- [ ] TypeScript passes
- [ ] Tests pass
- [ ] Production build passes

---

# 6. Phase 1 — Database, Domain Model & Security Foundation

**Status:** ✅ Complete — schema, authorization policies, public/private boundaries, and live RLS behavior were verified against the connected DWELLUNE Supabase project on 2026-10-13.

## Goal

Build the real commerce schema before hardcoding product/business logic into UI.

## Core entities

- [x] profiles
- [x] Single owner assignment (Part 2 supersedes the original staff/role/permission model)
- [x] Former access tables archived privately; read-only owner compatibility view
- [x] categories
- [x] collections
- [x] products
- [x] product_variants
- [x] product_media
- [x] inventory_locations if required
- [x] inventory_balances
- [x] inventory_ledger
- [x] customers
- [x] customer_addresses
- [x] carts
- [x] cart_items
- [x] wishlists
- [x] wishlist_items
- [x] discounts
- [x] discount_rules
- [x] orders
- [x] order_items
- [x] order_addresses
- [x] order_status_history
- [x] cod_verifications
- [x] cod_settlements
- [x] delivery_attempts
- [x] shipments
- [x] returns
- [x] return_items
- [x] reviews
- [x] support_threads/tickets if included
- [x] notifications
- [x] notification_deliveries
- [x] notification_preferences
- [x] email_events
- [x] abandoned_carts
- [x] activity_logs
- [x] audit_logs

## Data integrity

- [x] Foreign keys
- [x] Unique constraints
- [x] Check constraints
- [x] Money representation strategy
- [x] Timezone strategy
- [x] Slug uniqueness
- [x] SKU uniqueness
- [x] Inventory constraints
- [x] Status enum/state strategy
- [x] Useful indexes

## Security

- [x] RLS enabled for private data
- [x] Customer ownership policies
- [x] Owner authorization policies (Part 2)
- [x] Admin-only policies
- [x] Service-role usage server-only
- [x] Policy tests — live anonymous catalogue visibility, draft-product denial, private-order denial, and catalogue RPC behavior verified against the connected DWELLUNE Supabase project on 2026-10-13

## Seed data

- [x] Categories
- [x] Collections
- [x] Products
- [x] Variants
- [x] Inventory
- [x] Single owner assignment (Part 2)
- [x] Example customers/orders for development

**Phase 1 status: 100% complete.**

---

# 7. Phase 2 — Storefront Design System Implementation

**Status:** ✅ Complete — reusable storefront components, store shell, and motion infrastructure are implemented and verified by the current production quality gate.

## Goal

Translate `design.md` into reusable production components.

## Components

- [x] DwelluneButton
- [x] DwelluneLink
- [x] IconButton
- [x] DwelluneLine
- [x] ProductStage
- [x] ProductUnit
- [x] ShelfGrid
- [x] SplitPlane
- [x] CropWindow
- [x] EditorialChapter
- [x] MaterialStory
- [x] RoomStory
- [x] SearchOverlay shell
- [x] Drawer
- [x] Dialog
- [x] Accordion
- [x] Tabs
- [x] Inputs
- [x] Selects
- [x] Checkbox/radio
- [x] StatusBadge
- [x] Toast system

## Store shell

- [x] Header
- [x] Sticky header states
- [x] Mobile navigation
- [x] Footer
- [x] Announcement area if required
- [x] Global search trigger
- [x] Wishlist indicator
- [x] Bag indicator

## Motion infrastructure

- [x] GSAP registration
- [x] ScrollTrigger lifecycle helpers
- [x] Lenis integration
- [x] Motion/Framer Motion boundaries
- [x] SplitType helper
- [x] Reduced-motion mode
- [x] Route cleanup
- [x] Responsive motion behavior

## Verification

- [x] Formatting passes
- [x] Lint passes
- [x] TypeScript passes
- [x] Unit tests pass
- [x] Production build passes
- [x] Playwright end-to-end tests pass
- [x] Store shell and design-system interaction coverage passes
- [x] Responsive no-horizontal-overflow checks pass across the supported viewport set

**Phase 2 status: 100% complete.**

---

# 8. Phase 3 — Homepage & Brand Storytelling

**Status:** ✅ Complete — current homepage scope accepted by the user on 2026-10-12.

## Goal

Create and ship the premium DWELLUNE homepage and brand-storytelling experience. Commerce-data wiring and operational features that depend on later catalogue, customer, review, email, or CRM phases are intentionally deferred and are not Phase 3 blockers.

## Completed homepage scope

- [x] Premium hero with polished slide transitions and scroll movement
- [x] Featured collection / Explore the House introduction
- [x] Lighting storytelling represented across the hero, category composition, and product editorial
- [x] Product Shelf editorial presentation
- [x] Living Green / plants storytelling represented across the hero and category composition
- [x] Room discovery / Discover Spaces feature
- [x] Material Story / Material Library
- [x] Curated objects editorial treatment
- [x] Shop by category / space presentation
- [x] Brand story and trust presentation
- [x] Journal / inspiration feature through House Notes
- [x] Service / trust strip
- [x] Newsletter presentation shell for later functional integration
- [x] Storefront footer

## Deferred to later phases

These items are intentionally scheduled for later implementation when their supporting commerce systems exist:

- Real Supabase-backed homepage product and collection data
- Dedicated live New Arrivals data feed
- Live customer reviews / social proof data
- Functional newsletter persistence, validation, and Resend workflow
- Final catalogue/category routes and commerce destination wiring
- Any additional dedicated editorial chapters that become useful once real catalogue content exists

## Motion

- [x] Scroll choreography is meaningful and smooth
- [x] No magnetic / kinetic pointer effects
- [x] Responsive and mobile motion adaptation
- [x] Reduced-motion fallback
- [x] No core storefront action is blocked by animation

## Verification

- [x] Formatting passes
- [x] Lint passes
- [x] TypeScript passes
- [x] Unit tests pass
- [x] Production build passes
- [x] Playwright end-to-end tests pass
- [x] Responsive no-horizontal-overflow checks pass across the supported viewport set

**Phase 3 status: 100% complete for the accepted homepage scope.**

---

# 9. Phase 4 — Catalogue, Collections, Search & Discovery

**Status:** ✅ Complete — production catalogue, collections, URL-synchronized filtering/sorting, and search/discovery were implemented and verified on 2026-10-13. The connected production project currently has no published products, so the verified live storefront correctly renders the production empty state without fabricated catalogue data.

## Catalogue

- [x] `/shop`
- [x] Category pages
- [x] Collection pages
- [x] Product count
- [x] Sort
- [x] Availability filter
- [x] Price filter
- [x] Material filter
- [x] Color filter
- [x] Category filter
- [x] URL-synchronized filter state
- [x] Mobile filter drawer
- [x] Clear filters
- [x] Empty states

## Search

- [x] Predictive search
- [x] Product results
- [x] Category results
- [x] Editorial/collection discovery results
- [x] Recent searches
- [x] Keyboard navigation
- [x] No-results suggestions
- [x] Search result page

## Phase 4 production verification

- [x] Catalogue reads are centralized in the server-side catalogue service
- [x] `catalogue_product_index`, stock projection, catalogue RPCs, facets, and search indexes are committed as reproducible migrations
- [x] Live anonymous RLS verifies published-product visibility and draft/private-data denial
- [x] Live compound catalogue query verifies category, collection, stock, price, material, color, and text-search constraints together
- [x] Search requests are bounded, debounced, abortable, and keyboard accessible
- [x] Store navigation and Phase 3 homepage destinations connect to the live catalogue without redesigning the accepted homepage
- [x] Metadata/canonical behavior is implemented for shop, category, collection, and search surfaces
- [x] Production dependency audit passes
- [x] Formatting passes
- [x] ESLint passes
- [x] TypeScript passes
- [x] Unit tests pass
- [x] Production build passes
- [x] Playwright regression and Phase 4 E2E coverage passes
- [x] Vercel preview build succeeds

See `PHASE_4_AUDIT.md` for the complete evidence-based audit.

**Phase 4 status: 100% complete.**

---

# 10. Phase 5 — Product Detail Experience

**Status:** ✅ Complete — the production Product Detail Experience was implemented and verified on 2026-10-13. The connected production catalogue currently has no published products, so no fake production PDP content was introduced; deterministic CI-only fixtures and rolled-back live Supabase probes verify behavior and authorization.

- [x] Product gallery
- [x] Optimized media
- [x] Image zoom where useful
- [x] Variant selection
- [x] Variant-specific price
- [x] Variant-specific inventory
- [x] Variant-specific media where required
- [x] Quantity control
- [x] Add to Bag
- [x] Wishlist
- [x] Stock status
- [x] COD availability message
- [x] Delivery estimate framework
- [x] Product story
- [x] Dimensions
- [x] Materials
- [x] Care
- [x] Shipping/returns summary
- [x] Reviews summary
- [x] Related products
- [x] Recently viewed

## Phase 5 production verification

- [x] `/products/[slug]` is server-rendered and restricted to active published products
- [x] Dynamic metadata, canonical URLs, Open Graph data, and Product JSON-LD are implemented
- [x] Variant selection owns price, stock, media, quantity bounds, and URL state
- [x] Public variant stock uses an RLS-protected projection; raw inventory balances remain private
- [x] Live anonymous RLS verifies published-variant visibility and draft-variant denial
- [x] Live inventory-reservation probe verifies available quantity and in-stock state update through the projection trigger
- [x] Public COD configuration and shipping estimate rule are consumed from the existing production data model
- [x] Bag/wishlist handoff is device-local and explicitly non-authoritative; full cart/wishlist/reservation ownership remains Phase 6
- [x] Catalogue and predictive search product destinations connect to the PDP
- [x] Product-detail unit tests pass
- [x] Product-detail Playwright E2E coverage passes
- [x] Phase 1–4 regression coverage remains green
- [x] Production dependency audit passes with zero production vulnerabilities
- [x] Formatting passes
- [x] ESLint passes
- [x] Strict TypeScript passes
- [x] Unit tests pass
- [x] Production build passes
- [x] Full Playwright Chromium suite passes
- [x] Exact-head Vercel preview build reaches READY
- [x] Supabase security advisor reports zero security lints

See `PHASE_5_AUDIT.md` for the complete evidence-based audit.

**Phase 5 status: 100% complete for Product Detail Experience implementation and verification.**

---

# 11. Phase 6 — Cart, Wishlist & Inventory Reservation

## Cart

- [x] Anonymous cart
- [x] Authenticated cart
- [x] Cart merge after sign-in
- [x] Cart persistence
- [x] Cart drawer
- [x] Full cart page
- [x] Quantity update
- [x] Remove/undo
- [x] Discount code
- [x] Delivery charge estimate
- [x] Server-side price recalculation
- [x] Server-side inventory revalidation

## Wishlist

- [x] Guest behavior decision
- [x] Signed-in persistence
- [x] Add/remove
- [x] Wishlist page
- [x] Move to cart

## Inventory

- [x] On-hand quantity
- [x] Reserved quantity
- [x] Available quantity
- [x] Reservation policy defined
- [x] Release policy defined
- [x] Inventory ledger

---

## Verification and phase boundary

- [x] Server-owned guest cookie; ownership derived from authenticated identity
- [x] Canonical price/stock/discount quotes; no browser totals trusted
- [x] Transactional inventory reservation/release and expiry job
- [x] Idempotent legacy device-bag import and atomic account wishlist move
- [x] Loading/empty/error/pending states and recoverable network failures
- [x] Keyboard, native drawer focus, reduced motion and 320–1920px reflow
- [x] 16 unit tests and 41 Playwright Chromium tests, including prior phases
- [x] 15 transactional database checks, including ownership and RLS isolation
- [x] Formatting, ESLint, strict TypeScript, dependency audit and production build

Guest wishlist IDs persist on this device; signed-in wishlist data persists in Supabase and merges on authentication. Guest carts use a 256-bit HttpOnly token whose SHA-256 digest isolates their database rows. Cart mutations revalidate canonical catalogue values. Inventory holds last the configured reservation period (30 minutes by default), refresh on cart mutations, and are released on removal/reduction/expiry. The scheduled database cleanup runs every five minutes. Cart retention is 30 days by default. Limits: 30 distinct cart variants, 99 units per variant, 50 wishlist entries.

The authentication interface remains Phase 7. Address-specific shipping, final checkout, COD order creation and checkout idempotency remain Phase 8; cart delivery amounts are estimates. The cart honestly states that order placement is not open yet. No payment gateway or placeholder order flow was added.

See `PHASE_6_AUDIT.md` for evidence and operational boundaries.

**Phase 6 status: 100% complete for Cart, Wishlist & Inventory Reservation implementation and verification.**

---

# 12. Phase 7 — Authentication & Customer Account

**Scope correction (14 October 2026):** Owner requests immediate password signup without verification email. Hosted Supabase Confirm Email must be OFF; signup installs a real session and redirects to account. Recovery and email changes remain secure email flows. Live signup acceptance is pending the provider toggle. The historical verification checklist below describes the earlier scope.

**Status:** Implementation prepared and migration applied once on 2026-10-14. Verified: 39 unit/route tests, 52 browser tests, 13 populated account database test groups, 15 cart/wishlist regression groups, privilege/session boundaries and post-apply advisors. JazzCash/bank refund instructions and an owner-authorized test product are configured. The owner requested production release for live acceptance; real Gmail links and signed-in UI checks remain pending owner confirmation. See `PHASE_7_AUDIT.md`.

- [ ] Sign up
- [ ] Sign in
- [ ] Sign out
- [ ] Email verification if enabled
- [ ] Password reset
- [ ] Session handling
- [ ] Profile
- [ ] Address book
- [ ] Order history
- [ ] Order detail
- [ ] Wishlist sync
- [ ] Notification center
- [ ] Notification preferences
- [ ] Return requests
- [ ] Account settings
- [ ] Secure ownership authorization

Guest COD checkout should remain possible unless business rules later require an account.

---

# 13. Phase 8 — COD Checkout & Order Creation

Part 1 implements checkout details and validated quotes. Part 2 order submission, confirmation and notification implementation is prepared locally; release remains blocked by operator, transactional email, real product and live acceptance gates. See `PHASE_8_PART_2_AUDIT.md`. See `PHASE_8_PART_1_AUDIT.md` for evidence and acceptance limits. No orders can be submitted in Part 1.

## Checkout

- [x] Guest checkout
- [x] Signed-in checkout
- [x] Contact details
- [x] Shipping address
- [x] Address validation rules
- [x] Delivery area eligibility
- [x] Delivery fee calculation
- [x] Order notes
- [x] Discount validation
- [x] Order summary
- [x] COD-only payment presentation
- [x] Terms acknowledgement where appropriate

## Server validation before order creation

Quote-time recalculation is implemented in Part 1 and repeated in the Part 2 order transaction. Items below remain unchecked until the gated application is released and live acceptance passes.

- [ ] Re-fetch product/variant state
- [ ] Recalculate prices
- [ ] Recalculate discounts
- [ ] Recalculate delivery fee
- [ ] Validate stock
- [ ] Validate COD eligibility
- [ ] Validate customer/order limits
- [ ] Idempotency key

## Order result

- [ ] Create order transactionally
- [ ] Create order items snapshot
- [ ] Create address snapshot
- [ ] Create initial status history
- [ ] Reserve inventory
- [ ] Create COD verification record if needed
- [ ] Create customer notification
- [ ] Create staff notification
- [ ] Queue confirmation email
- [ ] Confirmation page

---

# 14. Phase 9 — COD Verification & Fraud/Abuse Controls

- [x] Configurable verification requirement
- [x] Verification status
- [x] Staff verification queue
- [x] Customer contact workflow (manual app links and actual outcome recording)
- [x] Verification notes (staff-only)
- [x] Attempt tracking
- [x] Verified by staff
- [x] Verified timestamp
- [x] Reject/cancel flow (before shipment/collection)
- [x] Stock release on rejection/cancellation
- [x] Duplicate order detection signals
- [x] High-value COD threshold
- [x] Repeated failed-delivery customer signal
- [x] Rate limit order creation
- [x] Suspicious order flag
- [x] Manual review state

No fake AI fraud scoring should be added unless real data/modeling exists.

Part 1 implementation and rollback evidence are recorded in `PHASE_9_PART_1_AUDIT.md`. Part 2 configuration, deterministic review signals, manual review and identity limits are implemented and verified in `PHASE_9_PART_2_AUDIT.md`. The owner deferred real-product launch acceptance; checkout remains closed. This is not a full Phase 9 completion claim.

---

# 15. Phase 10 — Notification Platform

## Core architecture

- [x] Persistent notification table
- [x] Notification type registry
- [x] Recipient model
- [x] Entity/deep-link model
- [x] Priority
- [x] Read/unread
- [x] Read timestamp
- [x] Delivery channel
- [x] Delivery status
- [x] Retry/error metadata
- [x] Notification preferences

## Customer notification center

- [x] Header unread badge
- [x] Notification list
- [x] All/unread
- [x] Category filter
- [x] Mark one read
- [x] Mark all read
- [x] Deep-link to order/return/product
- [x] Empty state
- [x] Error state
- [x] Pagination/cursor loading

## CRM notification center

- [x] Staff unread badge
- [x] Operational categories
- [x] Priority handling
- [x] Entity links
- [x] Read management
- [x] Filter by severity/category

## Customer events

- [x] Order placed
- [x] Verification requested
- [x] Order confirmed
- [ ] Packed
- [ ] Shipped
- [ ] Out for delivery
- [ ] Delivered
- [ ] Delivery failed
- [x] Cancelled
- [ ] Return update
- [ ] RTO update where appropriate
- [ ] Back-in-stock when implemented

## Staff events

- [x] New COD order
- [x] Verification required
- [x] Suspicious order
- [x] Low stock
- [x] Out of stock
- [ ] Delivery failure
- [ ] RTO initiated
- [x] Return request
- [ ] Review requiring moderation
- [ ] Support escalation
- [ ] Settlement discrepancy
- [x] Existing email job failure and SMTP-health alerts
- [ ] Other background jobs when their producers exist

---

Part 1 notification centers and recipient-scoped read controls are implemented; evidence and acceptance limits are in `PHASE_10_PART_1_AUDIT.md`. Delivery metadata reuses the existing Phase 8 worker. Part 2 registry, scoped preferences, verification/manual-review/return-request/inventory/SMTP alerts and delivery visibility are verified in `PHASE_10_PART_2_AUDIT.md`. Shipping, return decisions, RTO, moderation, support, settlements and product subscriptions remain deferred registry entries until their validated workflows exist. These unchecked future producers are not presented as complete. Live owner acceptance follows deployment.

# 16. Phase 11 — Transactional Email

Use the owner-selected Gmail SMTP adapter for transactional email. Reconsider a dedicated provider when volume requires it; a Resend domain purchase is not a current launch prerequisite. SMTP acceptance and inbox delivery are separate statuses, and ambiguous sends require operator review.

- [x] Branded base email template (Phase 11 Part 1: HTML + text, approved logo, responsive/dark-mode fallback)
- [x] Order placed template and existing Gmail receipt sender integration; real-product checkout acceptance remains deferred
- [x] Verification request
- [x] Order confirmed
- [ ] Packed/dispatch update where useful
- [ ] Shipped
- [ ] Out-for-delivery if supported operationally
- [ ] Delivered
- [ ] Delivery failed
- [x] Cancelled
- [x] Return request received
- [ ] Return decision
- [ ] Password/account emails where applicable
- [ ] Abandoned cart reminder if enabled

Reliability:

- [x] Delivery event logging
- [x] Idempotent email jobs
- [x] Retry handling
- [x] Failure visibility in CRM
- [x] Replay suppression and safe retry handling; ambiguous SMTP acceptance requires manual mailbox review

Phase 11 Parts 1–2 implement branded receipts and supported event-email jobs for COD verification, confirmation, cancellation and return requests. Future fulfillment/return-decision/RTO templates are prepared; their producers remain deferred. The owner-approved Gmail adapter, durable receipts, private attempt logging, bounded retries and uncertain-send review are retained. Signup still logs in automatically without verification email. Hosted Auth template/allowlist and real live-order acceptance remain pending. See `PHASE_11_PART_1_AUDIT.md` and `PHASE_11_PART_2_AUDIT.md` for verified scope, eight recorded migrations, tests and acceptance limits.

---

# 17. Phase 12 — CRM Foundation & Owner Access

## Access

- [x] One owner Auth identity and live-session checks (maintenance Part 2)
- [x] Owner-only route/API/database authorization
- [x] Retire staff directory, role/permission management and activation workflows
- [x] Preserve former access records privately for recovery

## CRM shell

- [ ] Navigation rail
- [ ] Utility header
- [ ] Command/search interface
- [ ] Notification center
- [ ] Responsive admin behavior

## Primary routes

- [ ] Dashboard
- [ ] Orders
- [ ] Customers
- [ ] Products
- [ ] Collections
- [ ] Inventory
- [ ] Discounts
- [ ] Abandoned carts
- [ ] Reviews
- [ ] Returns
- [ ] Notifications
- [ ] COD reconciliation
- [ ] Analytics
- [ ] Audit logs
- [ ] Settings

---

# 18. Phase 13 — Product, Collection & Inventory Management

- [ ] Create product
- [ ] Edit product
- [ ] Archive product
- [ ] Publish/unpublish
- [ ] Product SEO
- [ ] Media upload
- [ ] Media reorder
- [ ] Variants
- [ ] SKUs
- [ ] Pricing
- [ ] Compare-at pricing if used
- [ ] Collection membership
- [ ] Category assignment
- [ ] Inventory adjustment
- [ ] Adjustment reason
- [ ] Inventory ledger
- [ ] Low-stock threshold
- [ ] Low-stock notifications
- [ ] Out-of-stock notifications
- [ ] Bulk operations where safe

---

# 19. Phase 14 — Order Operations, Fulfillment & Delivery Attempts

## Order workspace

- [ ] Order summary
- [ ] Customer details
- [ ] Address
- [ ] Items
- [ ] Timeline
- [ ] Internal notes
- [ ] Verification state
- [ ] Fulfillment state
- [ ] COD settlement state
- [ ] Notification/email history

## Fulfillment

- [ ] Confirm
- [ ] Processing
- [ ] Pack
- [ ] Ready to ship
- [ ] Add courier
- [ ] Add tracking/reference
- [ ] Mark shipped
- [ ] Out for delivery
- [ ] Delivered

## Delivery attempts

- [ ] Attempt number
- [ ] Attempt timestamp
- [ ] Attempt outcome
- [ ] Failure reason
- [ ] Customer contact notes
- [ ] Reattempt eligibility
- [ ] RTO decision

All status transitions must be validated server-side and logged.

---

# 20. Phase 15 — RTO, Returns & After-Sales

## RTO

- [ ] RTO initiated
- [ ] RTO reason
- [ ] RTO in transit
- [ ] RTO received
- [ ] Inventory disposition
- [ ] Customer history signal
- [ ] Settlement adjustment
- [ ] Audit trail

## Returns

- [ ] Return request
- [ ] Return reason
- [ ] Return items/quantity
- [ ] Eligibility validation
- [ ] Staff review
- [ ] Approve/reject
- [ ] Return shipment/reference if used
- [ ] Received inspection
- [ ] Inventory disposition
- [ ] Customer notification

Since launch is COD-only, any monetary refund/credit procedure must be explicitly defined before implementation; do not invent a payout mechanism.

---

# 21. Phase 16 — COD Settlement & Reconciliation

## Goal

Track physical COD cash independently from delivery status.

- [ ] Expected COD amount
- [ ] Courier/source
- [ ] Collection date
- [ ] Amount reported collected
- [ ] Amount remitted
- [ ] Remittance date
- [ ] Reconciliation status
- [ ] Difference amount
- [ ] Discrepancy reason
- [ ] Staff notes
- [ ] Attach/reference settlement document if required
- [ ] Reconciled by
- [ ] Reconciled timestamp
- [ ] Audit log
- [ ] Staff notification on discrepancy
- [ ] Settlement reporting

---

# 22. Phase 17 — Customer Management & CRM Timeline

- [ ] Customer profile
- [ ] Contact details
- [ ] Addresses
- [ ] Order history
- [ ] Lifetime order value
- [ ] Delivered order count
- [ ] Cancellation count
- [ ] Delivery failure count
- [ ] RTO count
- [ ] Return count
- [ ] Tags
- [ ] Internal notes
- [ ] Notifications history
- [ ] Email history
- [ ] Activity timeline
- [ ] Support context
- [ ] Data correction controls
- [ ] Authorization/audit for edits

Do not expose internal risk notes to customers.

---

# 23. Phase 18 — Discounts, Reviews, Retention & Abandoned Carts

## Discounts

- [ ] Code creation
- [ ] Validity window
- [ ] Usage limits
- [ ] Customer eligibility
- [ ] Product/category eligibility
- [ ] Minimum spend
- [ ] Server-side validation

## Reviews

- [ ] Review submission
- [ ] Eligibility policy
- [ ] Rating
- [ ] Text
- [ ] Moderation
- [ ] Published/unpublished
- [ ] Report handling

## Abandoned carts

- [ ] Abandonment definition
- [ ] Cart capture
- [ ] Reminder eligibility
- [ ] Reminder scheduling
- [ ] Stop reminders after order
- [ ] Notification/email logging

---

# 24. Phase 19 — Background Jobs & Automation Reliability

- [ ] Job architecture chosen
- [ ] Email jobs
- [ ] Notification jobs
- [ ] Abandoned-cart jobs
- [ ] Verification reminder jobs
- [ ] Low-stock alert jobs
- [ ] Delivery follow-up jobs if required
- [ ] Settlement reminder jobs
- [ ] Idempotency
- [ ] Retry policy
- [ ] Failure tracking
- [ ] Manual retry path
- [ ] Dead-letter/manual review strategy where needed
- [ ] Job observability

No critical job may depend on a user keeping a browser page open.

---

# 25. Phase 20 — Analytics & Reporting

## Store metrics

- [ ] Orders
- [ ] Confirmed orders
- [ ] Delivered orders
- [ ] Cancelled orders
- [ ] Delivery success rate
- [ ] Delivery failure rate
- [ ] RTO rate
- [ ] Average order value
- [ ] Product/category performance
- [ ] Customer growth
- [ ] Repeat customer rate
- [ ] Abandoned cart recovery
- [ ] Discount performance
- [ ] Return rate

## COD metrics

- [ ] COD expected
- [ ] COD collected
- [ ] Pending reconciliation
- [ ] Reconciled amount
- [ ] Short received
- [ ] Disputed settlements
- [ ] Courier reconciliation performance

## Inventory metrics

- [ ] Low stock
- [ ] Out of stock
- [ ] Stock movement
- [ ] Inventory risk

---

# 26. Phase 21 — SEO, Content & Technical Discoverability

- [ ] Metadata
- [ ] Canonical URLs
- [ ] Product structured data
- [ ] Breadcrumb structured data
- [ ] Organization structured data
- [ ] Open Graph
- [ ] Social images
- [ ] XML sitemap
- [ ] Robots rules
- [ ] Semantic headings
- [ ] Descriptive URLs
- [ ] Product/collection indexing strategy
- [ ] 404
- [ ] Redirect strategy
- [ ] Journal/content architecture if included

---

# 27. Phase 22 — Security Hardening

- [ ] RLS audit
- [ ] Single-owner/customer authorization audit
- [ ] Authorization tests
- [ ] Privilege escalation tests
- [ ] IDOR tests
- [ ] Input validation audit
- [ ] Rate limits
- [ ] Order abuse controls
- [ ] Upload validation
- [ ] Secret review
- [ ] Environment separation
- [ ] Dependency audit
- [ ] Secure headers
- [ ] Audit logging coverage
- [ ] Sensitive-data logging review
- [ ] Destructive action safeguards

---

# 28. Phase 23 — Accessibility, Responsive & Motion QA

- [ ] WCAG 2.2 AA review
- [ ] Keyboard navigation
- [ ] Screen-reader semantics
- [ ] Focus order
- [ ] Focus visibility
- [ ] Sticky content focus obstruction
- [ ] Forms/errors
- [ ] Dialogs/drawers
- [ ] Search
- [ ] Filters
- [ ] Tables
- [ ] Notification center
- [ ] Reduced motion
- [ ] GSAP cleanup
- [ ] Lenis behavior
- [ ] Mobile scroll smoothness
- [ ] Intermediate viewport widths
- [ ] Zoom/reflow
- [ ] Touch targets

---

# 29. Phase 24 — Performance Optimization

Targets at p75:

- [ ] LCP ≤ 2.5s
- [ ] INP ≤ 200ms
- [ ] CLS ≤ 0.1

Audit:

- [ ] Hero/LCP media
- [ ] Fonts
- [ ] JS bundles
- [ ] Animation bundles
- [ ] Dynamic imports
- [ ] Images
- [ ] Lazy loading
- [ ] Cache behavior
- [ ] Database queries
- [ ] Indexes
- [ ] Hydration boundaries
- [ ] Third-party scripts
- [ ] Scroll performance
- [ ] Real mid-range mobile testing

---

# 30. Phase 25 — End-to-End Regression & Launch Readiness

## Customer journey

- [ ] Browse
- [ ] Search
- [ ] Filter
- [ ] PDP
- [ ] Variant
- [ ] Wishlist
- [ ] Cart
- [ ] Discount
- [ ] COD checkout
- [ ] Duplicate-submit prevention
- [ ] Order confirmation
- [ ] Customer notification
- [ ] Customer email
- [ ] Order tracking
- [ ] Account
- [ ] Return request

## Operations journey

- [ ] New order alert
- [ ] Verification
- [ ] Confirmation
- [ ] Inventory reservation
- [ ] Packing
- [ ] Shipping
- [ ] Delivery attempt
- [ ] Delivery
- [ ] COD collection state
- [ ] Settlement reconciliation
- [ ] Failed delivery
- [ ] RTO
- [ ] Return
- [ ] Notifications
- [ ] Audit logs

## Failure journeys

- [ ] Out-of-stock at checkout
- [ ] Invalid discount
- [ ] Duplicate order submission
- [ ] Unsupported delivery area
- [ ] Notification/email failure
- [ ] Unauthorized CRM action
- [ ] Failed delivery
- [ ] RTO
- [ ] Settlement discrepancy

## Production readiness

- [ ] Environment variables
- [ ] Migrations
- [ ] Storage policies
- [ ] Resend configuration
- [ ] Cron/job configuration
- [ ] Domain config
- [ ] SEO config
- [ ] Monitoring/logging
- [ ] Backup/recovery assumptions documented
- [ ] Rollback plan
- [ ] Smoke tests

---

# 31. Phase 26 — Production Deployment & Post-Launch Baseline

- [ ] Production Supabase project
- [ ] Production migrations applied
- [ ] Production storage configuration
- [ ] Production RLS verified
- [ ] Vercel production environment
- [ ] Domain
- [ ] Resend domain verification
- [ ] Background jobs/cron enabled
- [ ] Production admin account process
- [ ] Production smoke test
- [ ] COD test order
- [ ] Notification test
- [ ] Email test
- [ ] CRM fulfillment test
- [ ] Reconciliation test
- [ ] Error logging verified
- [ ] Initial backup/recovery procedure documented
- [ ] Launch sign-off

---

# 32. Recommended Build Sequence

Build vertical slices rather than creating all UI first and connecting backend later.

Example product slice:

```text
schema
→ security
→ query/service
→ storefront component
→ collection
→ PDP
→ CRM management
→ tests
→ responsive/a11y
→ audit
```

Example order slice:

```text
checkout
→ server validation
→ order transaction
→ inventory reservation
→ notifications
→ CRM queue
→ status transitions
→ delivery
→ COD reconciliation
→ tests
→ audit
```

This reduces fake completion and integration rewrites.

---

# 33. Environment Strategy

## Development

- local/development Supabase
- development Resend configuration
- test data

## Preview

- Vercel Preview
- non-production database/integrations
- safe QA data

## Production

- production Supabase
- production Resend
- production domain
- production jobs

Never perform destructive development/QA against production data.

---

# 34. Branch Strategy

Recommended:

- `main` — production-ready integrated code
- feature/phase branches — isolated implementation

Use focused commits.

Do not accumulate huge unreviewable commits across unrelated domains.

---

# 35. Launch Scope Principles

At launch, DWELLUNE should prioritize reliable core commerce over optional complexity.

Mandatory launch-quality areas:

- catalogue
- product pages
- search
- cart
- COD checkout
- inventory
- notifications
- transactional email
- customer accounts/order tracking
- CRM order operations
- COD verification
- fulfillment
- delivery attempts
- RTO
- COD reconciliation
- role security
- analytics essentials
- accessibility
- performance
- SEO
- production QA

Optional features must not destabilize these mandatory flows.

---

# 36. Final Completion Contract

For every phase:

1. Show the checklist in chat.
2. Implement each point.
3. Verify each point.
4. Run the build/quality gate.
5. Audit against earlier phases.
6. Share final check marks in chat.

A phase may be called **100% complete only when every required item is verified complete and no required blocker remains**.

---

**DWELLUNE Production Plan — COD Launch Baseline**
