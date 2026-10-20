# DWELLUNE — Production Build Plan

**Status:** Phase 12 foundation and selected-design revision implemented — 20 October 2026

**Product:** Production ecommerce storefront + internal commerce CRM  
**Payment model:** Cash on Delivery only at launch  
**Design source of truth:** `design.md`  
**Execution source of truth:** `AI_INSTRUCTIONS.md`  
**Plan source of truth:** `PROJECT_PLAN.md`

---

# Current position and next work

This is the current roadmap. Original phase numbers are preserved. The four maintenance parts are complete and are separate from build Phases 0–26. A checked implementation item means the code and stated regression checks exist; it does not establish real merchant, mailbox or launch acceptance. Future phase checklists remain unchecked until that phase is delivered and verified.

## Completed maintenance

| Part                   | Result                                                                                                           | Evidence                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1 — Baseline           | Inventory, regression baseline and recovery/drift findings recorded                                              | [Baseline](docs/maintenance/part-1-baseline.md)                     |
| 2 — Single admin       | One owner authority; staff management and role/permission editing retired; records retained privately            | [Single owner](docs/maintenance/part-2-single-admin.md)             |
| 3 — Storefront cleanup | Showcase, inactive newsletter/journal, ratings and new optional opt-ins retired; working shopping flows retained | [Storefront cleanup](docs/maintenance/part-3-storefront-cleanup.md) |
| 4 — Final verification | Browser-storage reliability fixes; local, database, CI and production checks passed                              | [Final verification](docs/maintenance/part-4-final-verification.md) |

Verified Part 4 release baseline: [`9a418ce`](https://github.com/hamzaaftab325-eng/House-of-Lume/commit/9a418ce541e9b2fa798fb4f5cf7175ff8c448837). [CI passed](https://github.com/hamzaaftab325-eng/House-of-Lume/actions/runs/39276828010). Vercel production deployment `dpl_5kPxnBTeazt2HKyPz5BnrzDiTSVw` is READY on [DWELLUNE](https://dwellune.vercel.app). These are the 19 October release observations, not a guarantee about future runtime state.

Part 4 verification baseline: 196 application tests, 107 browser tests with local retries disabled, 24 isolated database scripts, 23 live HTTP/security checks, formatting, lint, strict TypeScript, production build and zero runtime dependency vulnerabilities. The full development-tool audit still has its documented exception in `SECURITY.md`.

## Build-phase status

| Phase                          | Current position                                                                                     | Remaining boundary                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation                 | Implemented and regression verified                                                                  | Full production observability is a separate launch gate                                                                      |
| 1 — Database/security          | Connected schema, RLS and single-owner conversion verified; 41 migrations match live history         | Existing advisor findings and full backup/restore acceptance remain recorded                                                 |
| 2 — Storefront system          | Retained components and motion verified                                                              | Removed demonstration components are not requirements to rebuild                                                             |
| 3 — Homepage                   | Accepted editorial design retained; real navigation destinations repaired                            | Shelf imagery/content is editorial, not a live product feed; connect approved real products during catalogue management work |
| 4 — Catalogue/search           | Implemented; live browse/search/category/collection routes verified                                  | Five published listings include sample/test content; merchant catalogue acceptance remains pending                           |
| 5 — Product details            | Implemented; variants, stock, price, media controls and Product/Offer metadata verified              | Ratings retired; external-image visual acceptance remains limited                                                            |
| 6 — Cart/wishlist/reservations | Implemented; server ownership and expiry regression verified                                         | Real customer journey remains part of launch acceptance                                                                      |
| 7 — Accounts                   | Core account/session/ownership code deployed and regression verified                                 | Real signup/sign-in/sign-out and hosted recovery/email-change inbox acceptance pending                                       |
| 8 — COD checkout               | Atomic creation, quotes, confirmation, stock and idempotency implemented and regression verified     | **Production order gate remains OFF**; no real acceptance order has been placed                                              |
| 9 — COD verification           | Owner queue, contact, confirmation/cancellation and policy/review controls implemented               | Live merchant order acceptance remains pending                                                                               |
| 10 — Notifications             | Existing customer/owner inboxes, supported producers, withdrawal and delivery visibility implemented | Future fulfillment/return-decision/settlement events wait for their real workflows                                           |
| 11 — Transactional email       | Five supported business-event email paths and durable retry/uncertainty handling implemented         | Real order/inbox and hosted Auth acceptance pending; future producers remain deferred                                        |
| 12 — CRM foundation            | Branded owner workspace, authorized overview, verification and notification flows verified                | Approved workspace and local acceptance complete; audit and release gate recorded below                                                   |
| 13–18 — Operations modules     | Future build work; existing schema does not mean management UI is implemented                        | Build product/inventory, fulfillment, returns/RTO, settlement, customer and discount operations in order                     |
| 19–26 — Reliability and launch | Some foundations exist and were rechecked during maintenance                                         | Verify the completed future workflows, remaining security/SEO/accessibility/performance and full launch acceptance           |

## Scope that stays fixed

- Exactly one owner admin. No staff directory, invitations, role editor, permission matrix or staff activation workflow.
- Preserve owner/customer identity separation, essential notifications, commerce history, receipts, existing consent and private access archives.
- Keep legacy `staff` audience/RPC/actor names only where required for compatibility; they do not create additional administrators.
- No public `/system`, newsletter signup, House Notes/journal preview, ratings/reviews UI or new marketing/product-subscription opt-ins.
- Review moderation, campaigns, abandoned-cart recovery, command palettes and advanced analytics are outside the current lean implementation sequence unless explicitly requested. Existing schema/history is preserved.
- COD only. No online payment gateway. Refund instructions do not add a payment integration.
- Preserve the accepted brand, storefront layout and motion. Extend shared patterns only when a real retained workflow needs them.

## Next execution sequence

1. **Phase 12 — owner CRM foundation implemented and locally verified.** The approved branded sidebar/header, operational overview and retained working destinations are complete. The release gate checks CI and the canonical deployment; no later module starts automatically.
2. **Phase 13 — product, collection and inventory management.** Enable the owner to manage real catalogue/variant/media/pricing/stock data and connect selected real homepage products without redesigning the accepted storefront.
3. **Phases 14–16 — operational completion.** Implement validated fulfillment/delivery, returns/RTO and COD reconciliation, adding their essential notification/email producers with their actual workflows.
4. **Phases 17–18 — core customer and discount operations.** Reuse existing ownership/history and discount validation; optional retention/reviews remain excluded.
5. **Phases 19–26 — remaining reliability, security and launch acceptance.** Reuse existing jobs/tests/deployment; complete the remaining evidence and merchant journeys before launch sign-off.

For each approved phase: show its checklist, implement one coherent batch, verify locally, update evidence and make at most one final production push. Do not begin the next phase just because this roadmap lists it. The Phase 12 workspace now has its own implementation and verification record; Phase 13 remains the next separately directed build step. See [preparation evidence](docs/maintenance/phase-12-preparation.md).

## Launch gates still open

- [ ] Owner-approved real products, inventory, delivery/COD rules and operating process.
- [ ] Controlled real guest/customer order → owner verification → essential notification/email → mailbox acceptance after the required operational scope is ready.
- [ ] Real account and hosted password recovery/email-change callback/inbox acceptance; keep readiness flags gated until accepted.
- [ ] Full database/Auth/Vault backup availability and restore rehearsal. The prior scoped access checkpoint is not a full disaster-recovery backup.
- [ ] Resolve or explicitly assess the recorded security/tooling findings; keep default-deny private storage and protective indexes intact.
- [ ] Production observability access: the connected Vercel runtime-error query returned 403; clean logs are not established.
- [ ] External-image visual acceptance, full manual accessibility/device checks and field p75 LCP/INP/CLS evidence.
- [ ] Explicit launch sign-off before changing `checkout.orders_enabled` from false.

Checkout was still disabled at the latest post-release check. No plan update enables it or changes production data. See the Part 4 audit for exact evidence and limitations. Historical phase audits remain unchanged.

---

# 1. Product Goal

DWELLUNE is a production-grade home décor ecommerce platform for lighting, plants, planters, decorative objects, candles, mirrors, and future home categories.

It is not a prototype. It must be capable of real customer ordering, real inventory handling, real Cash on Delivery operations, real internal order management, real notifications, real customer accounts, and real production deployment.

The product contains two connected systems:

1. **Customer Storefront** — discovery, shopping, cart, COD checkout, order tracking, account, notifications.
2. **Internal CRM / Commerce Operations** — products, inventory, orders, COD verification, delivery tracking, RTO, customers, notifications, returns, essential reporting, audit logs and settings. Optional review/retention modules are excluded from the current roadmap.

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

**Status:** Foundation implemented and reverified during maintenance. Defining the logging boundary does not establish complete production monitoring; that remains an open launch gate.

## Goal

Create a production-quality base that later phases do not need to rewrite.

## Checklist

### Repository foundation

- [x] Initialize Next.js App Router
- [x] Configure strict TypeScript
- [x] Configure Tailwind CSS
- [x] Configure ESLint
- [x] Configure formatting rules
- [x] Add `.editorconfig`
- [x] Add `.gitignore`
- [x] Add `.env.example`
- [x] Add environment validation
- [x] Add project README
- [x] Preserve `design.md`
- [x] Preserve `AI_INSTRUCTIONS.md`
- [x] Preserve `PROJECT_PLAN.md`

### Architecture

- [x] Define storefront route groups
- [x] Define account route group
- [x] Define CRM/admin route group
- [x] Define server/client component boundaries
- [x] Define data-access architecture
- [x] Define service/domain layer pattern
- [x] Define error handling pattern
- [x] Define logging pattern
- [x] Define API/action validation pattern

### Styling

- [x] Implement design tokens from `design.md`
- [x] Configure fonts
- [x] Create base typography
- [x] Create base focus styles
- [x] Create responsive container utilities
- [x] Create motion/reduced-motion foundation

### Testing

- [x] Configure test runner
- [x] Configure E2E framework
- [x] Add smoke test

### Build gate

- [x] Lint passes
- [x] TypeScript passes
- [x] Tests pass
- [x] Production build passes

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

**Phase 1 status:** Schema/security foundation implemented and regression verified. Maintenance Part 2 supplies the current owner model; remaining advisor and backup gates are listed in the current-position summary.

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
- [x] Product image/object-stage patterns in catalogue and product details
- [x] ProductUnit
- [x] Shared shelf/grid product presentation
- [x] Working SearchOverlay with suggestions, keyboard navigation and recent-search fallback
- [x] Drawer
- [x] Dialog
- [x] Inputs
- [x] Selects
- [x] Used checkbox controls; unused radio demo retired
- [x] Toast system

Unused showcase-only components and wrappers were retired in maintenance Part 3. Reusable patterns are design guidance, not requirements to recreate deleted demo code.

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
- [x] ScrollTrigger integration and cleanup in retained components
- [x] Lenis integration
- [x] Motion/Framer Motion boundaries
- [x] SplitType integration in retained motion; unused showcase wrapper retired
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

**Phase 2 status:** Retained component/system implementation and recorded regression complete; deleted showcase components stay retired.

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
- [x] House Notes preview retired in maintenance Part 3
- [x] Service / trust strip
- [x] Inactive newsletter shell retired; closing action opens the catalogue (Part 3)
- [x] Storefront footer

## Deferred to later phases

The live catalogue/category/collection destinations are implemented. The accepted homepage product shelf is still editorial preview content. Only approved real catalogue wiring belongs in the upcoming product-management work:

- Real Supabase-backed homepage product and collection data
- Dedicated live New Arrivals data feed
- Customer reviews/social proof: outside current scope after maintenance Part 3
- Newsletter/marketing capture: outside current scope after maintenance Part 3
- Preserve working catalogue/category/collection destinations; no additional editorial chapter is required

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

**Phase 3 status:** Accepted homepage scope implemented and regression verified; real product-feed wiring and external-media acceptance remain as stated above.

---

# 9. Phase 4 — Catalogue, Collections, Search & Discovery

**Status:** Implemented and regression verified. Live catalogue/search/category/collection routes were rechecked during maintenance Part 4. The latest database check has five published listings, including sample/test content; real sellable catalogue acceptance is pending.

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
- [x] Latest maintenance production release and canonical catalogue routes verified; no new preview is required

See `PHASE_4_AUDIT.md` for the complete evidence-based audit.

**Phase 4 status:** Catalogue/discovery implementation and regression verified; merchant real-product acceptance remains open.

---

# 10. Phase 5 — Product Detail Experience

**Status:** Implemented and regression verified. Real published product routes and Product/Offer metadata were checked during maintenance Part 4. Local fixtures and isolated SQL tests verify variants/stock/ownership; merchant acceptance and full external-image visual checks remain separate.

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
- [x] Optional ratings summary retired in maintenance Part 3; product/offer metadata retained
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
- [x] Bag/wishlist controls use the Phase 6 server-owned commerce contracts; browser data is not authoritative
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
- [x] Latest maintenance production deployment reaches READY on the exact tested SHA
- [x] Current Supabase RLS/grants and advisor findings reviewed; existing warnings/default-deny notices are recorded in the Part 4 audit

See `PHASE_5_AUDIT.md` for the complete evidence-based audit.

**Phase 5 status:** Product-detail implementation and recorded regression complete; real catalogue and external-media acceptance remain separate.

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

Authentication is deployed through Phase 7. Phase 8 supplies address-specific quotes and gated atomic order creation/confirmation; cart delivery amounts remain estimates. Production checkout stays closed. No online payment gateway is introduced.

See `PHASE_6_AUDIT.md` for evidence and operational boundaries.

**Phase 6 status:** Cart, wishlist and reservation implementation/regression complete; full real-customer launch acceptance remains open.

---

# 12. Phase 7 — Authentication & Customer Account

**Status:** Core account implementation is deployed and regression verified. Signup uses the owner's immediate-password/no-verification-email model; provider configuration and real signup acceptance must still be verified. Recovery/email-change code remains gated until hosted SMTP/callback and real inbox acceptance pass. See `PHASE_7_AUDIT.md` and the current Part 4 acceptance record.

## Implemented account scope

- [x] Password signup flow with provider preflight and session installation
- [x] Sign in/sign out and live-session handling
- [x] Profile and address book
- [x] Owned order history/detail and wishlist sync
- [x] Notification center and withdrawal-only optional consent screen
- [x] Return-request and account-settings flows
- [x] Server/database ownership authorization and private no-store responses
- [x] Gated recovery/email-change implementation and safe invalid-link handling

## Remaining acceptance

- [ ] Real signup/sign-in/sign-out and account flows against the intended hosted provider settings
- [ ] Hosted password reset/recovery and email-change callback/inbox acceptance before email readiness is enabled

Verification email at signup is excluded by owner instruction. No new marketing/product opt-ins are required.

Guest COD checkout should remain possible unless business rules later require an account.

---

# 13. Phase 8 — COD Checkout & Order Creation

**Status:** Checkout details, validated quotes, atomic order submission/confirmation and supported notifications/email queue are deployed and regression verified. The production order gate remains closed pending real catalogue, operational and mailbox acceptance. The checkboxes below describe implementation/isolated regression, not live-order acceptance. See `PHASE_8_PART_1_AUDIT.md`, `PHASE_8_PART_2_AUDIT.md` and the Part 4 audit.

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

Quote-time recalculation is implemented in Part 1 and repeated atomically in the deployed Part 2 transaction. SQL/browser regression verifies the paths below; the separate real-order launch gate remains open.

- [x] Re-fetch product/variant state
- [x] Recalculate prices
- [x] Recalculate discounts
- [x] Recalculate delivery fee
- [x] Validate stock
- [x] Validate COD eligibility
- [x] Validate customer/order limits
- [x] Idempotency key

## Order result

- [x] Create order transactionally
- [x] Create order items snapshot
- [x] Create address snapshot
- [x] Create initial status history
- [x] Reserve inventory
- [x] Create COD verification record if needed
- [x] Create customer notification
- [x] Create owner-admin notification
- [x] Queue confirmation email
- [x] Confirmation page

---

# 14. Phase 9 — COD Verification & Fraud/Abuse Controls

- [x] Configurable verification requirement
- [x] Verification status
- [x] Owner-admin verification queue
- [x] Customer contact workflow (manual app links and actual outcome recording)
- [x] Verification notes (owner-only)
- [x] Attempt tracking
- [x] Verified by owner admin
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

- [x] Owner-admin unread badge
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

## Owner-admin events

- [x] New COD order
- [x] Verification required
- [x] Suspicious order
- [x] Low stock
- [x] Out of stock
- [ ] Delivery failure
- [ ] RTO initiated
- [x] Return request
      Review/moderation and support-escalation producers are excluded from the current lean scope; retained registry entries do not schedule their implementation.

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

Reliability:

- [x] Delivery event logging
- [x] Idempotent email jobs
- [x] Retry handling
- [x] Failure visibility in CRM
- [x] Replay suppression and safe retry handling; ambiguous SMTP acceptance requires manual mailbox review

Phase 11 Parts 1–2 implement branded receipts and supported event-email jobs for COD verification, confirmation, cancellation and return requests. Future fulfillment/return-decision/RTO templates are prepared; their producers remain deferred. The owner-approved Gmail adapter, durable receipts, private attempt logging, bounded retries and uncertain-send review are retained. Signup still logs in automatically without verification email. Hosted Auth template/allowlist and real live-order acceptance remain pending. See `PHASE_11_PART_1_AUDIT.md` and `PHASE_11_PART_2_AUDIT.md` for verified scope, eight recorded migrations, tests and acceptance limits.

---

# 17. Phase 12 — CRM Foundation & Owner Access

**Status:** Foundation and selected-design revision implemented and locally verified. The final release is checked against GitHub CI and the canonical Vercel deployment after the single production push. Later commerce/reporting phases remain separate.

## Existing foundation — retain

- [x] One owner Auth identity and live-session checks (maintenance Part 2)
- [x] Owner-only route/API/database authorization; customer accounts cannot promote themselves
- [x] Retired staff directory, role/permission management and activation workflows
- [x] Former access records retained privately for recovery
- [x] `/crm` owner workspace with working verification and notification entry points
- [x] Shared authenticated header/navigation, owner identity, sign-out and session invalidation
- [x] `/crm/verification` and owned order verification detail
- [x] `/crm/verification/settings` policy/review rules
- [x] `/crm/notifications` operational inbox and unread badge
- [x] `/crm/notifications/delivery` bounded delivery status and event registry
- [x] Current admin responsive, keyboard, API-authorization and revoked-session regression

## Approved workspace implementation

The selected [dashboard reference](docs/reference/owner-dashboard-selected.webp) and `design.md` section 19 define the shared CRM visual direction. Phase 12 delivers the owner workspace foundation and retained operational flows, not the later commerce modules pictured in the concept. Its sample data is never displayed in production.

### 20 October selected-design revision

- [x] Compact reference proportions, bronze active navigation, stronger Manrope hierarchy and centered empty icon.
- [x] Four individual real-data summary cards; preview amount is not revenue.
- [x] Two-column review/preview-breakdown layout and three lower operational panels.
- [x] Chart derives only from the shown authorized requests; zero state is unfilled and explicitly labelled.
- [x] Fresh responsive, keyboard, session/auth and full regression checks.
- [x] Clean production build and documentation review; exact CI/deployment/live verification is reported after the single production update.

### Phase 12 completion checklist

- [x] Branded desktop sidebar and compact utility header, using the actual logo, existing palette and owner identity.
- [x] Overview, verification, rules, notifications and delivery navigation; correct specific-route highlighting and breadcrumbs.
- [x] Accessible mobile navigation with native dialog, Escape, focus restoration and desktop-breakpoint dismissal.
- [x] Operational overview with real unread notifications, a clearly bounded pending-order preview and working action links.
- [x] Empty queue state and recoverable loading/error/session states; unavailable data is never represented as zero.
- [x] Shared compact typography/content layout across existing CRM pages; obsolete landing/header styles retired.
- [x] Existing server-side owner authorization, private responses, session invalidation, immutable verification retries and notification safeguards retained.
- [x] Responsive, keyboard, focus, contrast and authorized-route browser-runtime acceptance verified.
- [x] Locked install, formatting, zero-warning lint, strict/unused TypeScript, 196 application tests, 123 browser tests without retries, zero runtime vulnerabilities and clean production build verified.
- [x] Phase audit, rollback target and one-push release procedure recorded. Exact release SHA, CI, READY alias and live checks are verified after publication and reported with the release.

The previous partial release `a7f0c86864a46b89638e561ee7ab137de557baaa` introduced navigation and operational links but failed CI formatting. The completion batch replaces its horizontal/large-heading treatment with the approved workspace and includes the missing verification. No new schema, dependency, launch setting, administrator or outgoing test email is required.

### Data and later-module boundaries

| Reference area | Phase 12 result | Later functional expansion |
| -------------- | --------------- | -------------------------- |
| Sidebar/header | Branded, responsive and connected to working screens | Extend as each module ships |
| Action center | Verification, policy, notifications and delivery entry points | Each future workflow's real queue |
| Overview metrics | Authorized unread total and labelled bounded queue preview | Sales comparisons/reporting in Phase 20 |
| Products/inventory | No fake product metrics or dead management links | Phase 13 |
| General order fulfillment | Existing COD verification only | Phase 14 |
| Return decisions/RTO | Existing request/notification behavior retained | Phase 15 |
| COD reconciliation | No sample balances; delivery is not reconciliation | Phase 16 |
| Customers | Owner/customer access separation retained | Phase 17 |

### Verification and release sequence

1. Review selected design, owner boundaries and the latest `main`/production baseline.
2. Implement shared workspace, useful authorized overview and consistent retained screens.
3. Test navigation, responsive reflow, loading/empty/error/session recovery, keyboard and retained workflows.
4. Run the complete quality/build gate and record exact results in [the Phase 12 audit](docs/maintenance/phase-12-workspace.md).
5. Make one final commit/push on `main`; verify CI, deployed SHA, canonical READY alias and live smoke. No feature branch, preview or intermediate production push.

Rollback target for this visual revision is `96f4e0ea2f7e9c65d960459193c909b3328a3029`. Production data and migrations do not change. Earlier maintenance/real-merchant acceptance limitations remain separate launch gates; checkout remains disabled.

## Module ownership after the foundation

| Work                                                            | Planned phase |
| --------------------------------------------------------------- | ------------- |
| Products, collections, media, variants and inventory management | 13            |
| General orders, fulfillment and delivery attempts               | 14            |
| Return decisions and RTO operations                             | 15            |
| COD settlement/reconciliation                                   | 16            |
| Customer management and timeline                                | 17            |
| Discount management                                             | 18            |
| Essential reporting and later cross-cutting launch gates        | 19–26         |

Do not move these entire modules into Phase 12. The owner will manage all retained modules through the same single authority as they are built.

---

# 18. Phase 13 — Product, Collection & Inventory Management

**Status:** Owner-management workflows are future work. Reuse the existing catalogue/schema, stock projections, reservation ledger and threshold-notification producers. These unchecked items concern management UI and its verified integration, not recreating existing data infrastructure. Real homepage product selection/wiring belongs to this phase while preserving the accepted layout.

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

**Status:** General order/fulfillment workspace is future work. Existing COD verification contact, confirmation, eligible cancellation and stock-release safeguards remain implemented; reuse their transactions and authority rather than adding parallel transitions.

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
- [ ] Owner-admin review
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
- [ ] Owner-admin notes
- [ ] Attach/reference settlement document if required
- [ ] Reconciled by
- [ ] Reconciled timestamp
- [ ] Audit log
- [ ] Owner-admin notification on discrepancy
- [ ] Settlement reporting

---

# 22. Phase 17 — Customer Management & CRM Timeline

**Status:** Owner-facing customer management is future work. Customer self-service profile/addresses/owned orders already exist and are not being rebuilt in this phase.

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

# 23. Phase 18 — Discount Management

**Status:** Future owner-management UI. Existing server-side customer discount validation remains implemented and must be preserved.

- [ ] Owner-only code creation/editing and safe activation/deactivation
- [ ] Validity window
- [ ] Usage limits
- [ ] Customer eligibility
- [ ] Product/category eligibility
- [ ] Minimum spend
- [ ] Reuse canonical server-side validation and existing redemption safeguards
- [ ] Audit attribution, invalid/expired states and ownership/regression checks

Reviews/ratings, moderation, marketing campaigns and abandoned-cart reminder/recovery UI are excluded from the current implementation sequence. Their historical schema/records are not deleted, and they are not unchecked mandatory launch work. Reintroducing them requires an explicit scope change.

---

# 24. Phase 19 — Background Jobs & Automation Reliability

**Status:** Existing cron, email queue, leases/backoff and private job storage are already implemented. This phase extends/verifies reliability for later operational workflows, rather than rebuilding those foundations.

- [x] Existing job architecture chosen and deployed
- [x] Supported-event email jobs and bounded retry/uncertainty handling
- [x] Current transactional notification producers and recipient dedupe
- [x] Current inventory threshold alerts (event-driven; do not add a duplicate scanner)
- [ ] Delivery follow-up jobs if required
- [ ] Verify idempotency across all newly completed operational producers
- [ ] Verify retry policy across new producers while preserving current worker safeguards
- [ ] Failure tracking
- [ ] Manual retry path
- [ ] Dead-letter/manual review strategy where needed
- [ ] Complete production job observability and failure acceptance

No critical job may depend on a user keeping a browser page open.

---

# 25. Phase 20 — Analytics & Reporting

Keep reporting limited to trustworthy operational totals from implemented order, stock and settlement workflows. The metric checklist is evaluated within this phase; it does not authorize advanced forecasting, tracking products or an expanded analytics suite. No fabricated metrics are shown before their source workflows exist.

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
- [ ] Gmail transactional SMTP and separate Supabase Auth SMTP acceptance
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
- [ ] Selected Gmail sender and real inbox delivery acceptance; no Resend domain prerequisite
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
- isolated email adapter/test mailbox; suppress real customer delivery in local regression
- test data

## Routine verification

- local/off-remote production build and isolated regression data
- no routine preview deployment under the single-push workflow
- preview/branch work only if the owner explicitly changes that workflow

## Production

- production Supabase
- owner-selected Gmail SMTP; separate Supabase Auth SMTP configuration
- production domain
- production jobs

Never perform destructive development/QA against production data.

---

# 34. Branch Strategy

- Work against `main` with one coherent approved batch.
- Complete implementation, tests and audit locally before preparing one final commit.
- No feature/phase/preview branches or intermediate pushes unless explicitly requested.
- Move `main` once for the completed batch and verify the exact automatic production deployment.
- Do not create a separate workflow-only commit to publish a plan/formatting closeout; include prepared documentation in the next approved batch.
- Follow `AI_INSTRUCTIONS.md` for the authoritative single production-push rule.

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
- single-owner/customer security
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
