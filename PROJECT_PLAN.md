# House of Lume — Production Build Plan

**Status:** Approved planning baseline  
**Product:** Production ecommerce storefront + internal commerce CRM  
**Payment model:** Cash on Delivery only at launch  
**Design source of truth:** `design.md`  
**Execution source of truth:** `AI_INSTRUCTIONS.md`  
**Plan source of truth:** `PROJECT_PLAN.md`

---

# 1. Product Goal

House of Lume is a production-grade home décor ecommerce platform for lighting, plants, planters, decorative objects, candles, mirrors, and future home categories.

It is not a prototype. It must be capable of real customer ordering, real inventory handling, real Cash on Delivery operations, real internal order management, real notifications, real customer accounts, and real production deployment.

The product contains two connected systems:

1. **Customer Storefront** — discovery, shopping, cart, COD checkout, order tracking, account, notifications.
2. **Internal CRM / Commerce Operations** — products, inventory, orders, COD verification, delivery tracking, RTO, customers, notifications, reviews, returns, analytics, staff, audit logs, settings.

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

- Resend for transactional email

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

## Goal

Build the real commerce schema before hardcoding product/business logic into UI.

## Core entities

- [ ] profiles
- [ ] staff_profiles
- [ ] roles
- [ ] permissions
- [ ] role_permissions
- [ ] categories
- [ ] collections
- [ ] products
- [ ] product_variants
- [ ] product_media
- [ ] inventory_locations if required
- [ ] inventory_balances
- [ ] inventory_ledger
- [ ] customers
- [ ] customer_addresses
- [ ] carts
- [ ] cart_items
- [ ] wishlists
- [ ] wishlist_items
- [ ] discounts
- [ ] discount_rules
- [ ] orders
- [ ] order_items
- [ ] order_addresses
- [ ] order_status_history
- [ ] cod_verifications
- [ ] cod_settlements
- [ ] delivery_attempts
- [ ] shipments
- [ ] returns
- [ ] return_items
- [ ] reviews
- [ ] support_threads/tickets if included
- [ ] notifications
- [ ] notification_deliveries
- [ ] notification_preferences
- [ ] email_events
- [ ] abandoned_carts
- [ ] activity_logs
- [ ] audit_logs

## Data integrity

- [ ] Foreign keys
- [ ] Unique constraints
- [ ] Check constraints
- [ ] Money representation strategy
- [ ] Timezone strategy
- [ ] Slug uniqueness
- [ ] SKU uniqueness
- [ ] Inventory constraints
- [ ] Status enum/state strategy
- [ ] Useful indexes

## Security

- [ ] RLS enabled for private data
- [ ] Customer ownership policies
- [ ] Staff authorization policies
- [ ] Admin-only policies
- [ ] Service-role usage server-only
- [ ] Policy tests

## Seed data

- [ ] Categories
- [ ] Collections
- [ ] Products
- [ ] Variants
- [ ] Inventory
- [ ] Staff roles
- [ ] Example customers/orders for development

---

# 7. Phase 2 — Storefront Design System Implementation

## Goal

Translate `design.md` into reusable production components.

## Components

- [ ] LumeButton
- [ ] LumeLink
- [ ] IconButton
- [ ] LumeLine
- [ ] ProductStage
- [ ] ProductUnit
- [ ] ShelfGrid
- [ ] SplitPlane
- [ ] CropWindow
- [ ] EditorialChapter
- [ ] MaterialStory
- [ ] RoomStory
- [ ] SearchOverlay shell
- [ ] Drawer
- [ ] Dialog
- [ ] Accordion
- [ ] Tabs
- [ ] Inputs
- [ ] Selects
- [ ] Checkbox/radio
- [ ] StatusBadge
- [ ] Toast system

## Store shell

- [ ] Header
- [ ] Sticky header states
- [ ] Mobile navigation
- [ ] Footer
- [ ] Announcement area if required
- [ ] Global search trigger
- [ ] Wishlist indicator
- [ ] Bag indicator

## Motion infrastructure

- [ ] GSAP registration
- [ ] ScrollTrigger lifecycle helpers
- [ ] Lenis integration
- [ ] Motion/Framer Motion boundaries
- [ ] SplitType helper
- [ ] Reduced-motion mode
- [ ] Route cleanup
- [ ] Responsive motion behavior

---

# 8. Phase 3 — Homepage & Brand Storytelling

## Goal

Create a premium homepage connected to real commerce data.

## Proposed structure

- [ ] Hero — Light Awakening scrub sequence
- [ ] Featured collection introduction
- [ ] Lighting editorial chapter
- [ ] Product Shelf
- [ ] Living Green / plants section
- [ ] Room discovery feature
- [ ] Material Story
- [ ] New arrivals
- [ ] Curated objects
- [ ] Shop by category/space
- [ ] Brand story
- [ ] Reviews/social proof
- [ ] Journal/inspiration feature
- [ ] Service/trust strip
- [ ] Newsletter
- [ ] Footer

## Motion

- [ ] Scroll scrub meaningful and smooth
- [ ] No magnetic/kinetic pointer effects
- [ ] Mobile alternate choreography
- [ ] Reduced-motion fallback
- [ ] No blocked ecommerce actions due to animation

---

# 9. Phase 4 — Catalogue, Collections, Search & Discovery

## Catalogue

- [ ] `/shop`
- [ ] Category pages
- [ ] Collection pages
- [ ] Product count
- [ ] Sort
- [ ] Availability filter
- [ ] Price filter
- [ ] Material filter
- [ ] Color filter
- [ ] Category filter
- [ ] URL-synchronized filter state
- [ ] Mobile filter drawer
- [ ] Clear filters
- [ ] Empty states

## Search

- [ ] Predictive search
- [ ] Product results
- [ ] Category results
- [ ] Editorial results
- [ ] Recent searches
- [ ] Keyboard navigation
- [ ] No-results suggestions
- [ ] Search result page

---

# 10. Phase 5 — Product Detail Experience

- [ ] Product gallery
- [ ] Optimized media
- [ ] Image zoom where useful
- [ ] Variant selection
- [ ] Variant-specific price
- [ ] Variant-specific inventory
- [ ] Variant-specific media where required
- [ ] Quantity control
- [ ] Add to Bag
- [ ] Wishlist
- [ ] Stock status
- [ ] COD availability message
- [ ] Delivery estimate framework
- [ ] Product story
- [ ] Dimensions
- [ ] Materials
- [ ] Care
- [ ] Shipping/returns summary
- [ ] Reviews summary
- [ ] Related products
- [ ] Recently viewed

---

# 11. Phase 6 — Cart, Wishlist & Inventory Reservation

## Cart

- [ ] Anonymous cart
- [ ] Authenticated cart
- [ ] Cart merge after sign-in
- [ ] Cart persistence
- [ ] Cart drawer
- [ ] Full cart page
- [ ] Quantity update
- [ ] Remove/undo
- [ ] Discount code
- [ ] Delivery charge estimate
- [ ] Server-side price recalculation
- [ ] Server-side inventory revalidation

## Wishlist

- [ ] Guest behavior decision
- [ ] Signed-in persistence
- [ ] Add/remove
- [ ] Wishlist page
- [ ] Move to cart

## Inventory

- [ ] On-hand quantity
- [ ] Reserved quantity
- [ ] Available quantity
- [ ] Reservation policy defined
- [ ] Release policy defined
- [ ] Inventory ledger

---

# 12. Phase 7 — Authentication & Customer Account

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

## Checkout

- [ ] Guest checkout
- [ ] Signed-in checkout
- [ ] Contact details
- [ ] Shipping address
- [ ] Address validation rules
- [ ] Delivery area eligibility
- [ ] Delivery fee calculation
- [ ] Order notes
- [ ] Discount validation
- [ ] Order summary
- [ ] COD-only payment presentation
- [ ] Terms acknowledgement where appropriate

## Server validation before order creation

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

- [ ] Configurable verification requirement
- [ ] Verification status
- [ ] Staff verification queue
- [ ] Customer contact workflow
- [ ] Verification notes
- [ ] Attempt tracking
- [ ] Verified by staff
- [ ] Verified timestamp
- [ ] Reject/cancel flow
- [ ] Stock release on rejection/cancellation
- [ ] Duplicate order detection signals
- [ ] High-value COD threshold
- [ ] Repeated failed-delivery customer signal
- [ ] Rate limit order creation
- [ ] Suspicious order flag
- [ ] Manual review state

No fake AI fraud scoring should be added unless real data/modeling exists.

---

# 15. Phase 10 — Notification Platform

## Core architecture

- [ ] Persistent notification table
- [ ] Notification type registry
- [ ] Recipient model
- [ ] Entity/deep-link model
- [ ] Priority
- [ ] Read/unread
- [ ] Read timestamp
- [ ] Delivery channel
- [ ] Delivery status
- [ ] Retry/error metadata
- [ ] Notification preferences

## Customer notification center

- [ ] Header unread badge
- [ ] Notification list
- [ ] All/unread
- [ ] Category filter
- [ ] Mark one read
- [ ] Mark all read
- [ ] Deep-link to order/return/product
- [ ] Empty state
- [ ] Error state
- [ ] Pagination/cursor loading

## CRM notification center

- [ ] Staff unread badge
- [ ] Operational categories
- [ ] Priority handling
- [ ] Entity links
- [ ] Read management
- [ ] Filter by severity/category

## Customer events

- [ ] Order placed
- [ ] Verification requested
- [ ] Order confirmed
- [ ] Packed
- [ ] Shipped
- [ ] Out for delivery
- [ ] Delivered
- [ ] Delivery failed
- [ ] Cancelled
- [ ] Return update
- [ ] RTO update where appropriate
- [ ] Back-in-stock when implemented

## Staff events

- [ ] New COD order
- [ ] Verification required
- [ ] Suspicious order
- [ ] Low stock
- [ ] Out of stock
- [ ] Delivery failure
- [ ] RTO initiated
- [ ] Return request
- [ ] Review requiring moderation
- [ ] Support escalation
- [ ] Settlement discrepancy
- [ ] Failed background job/email

---

# 16. Phase 11 — Transactional Email

Use Resend.

- [ ] Branded base email template
- [ ] Order placed
- [ ] Verification request
- [ ] Order confirmed
- [ ] Packed/dispatch update where useful
- [ ] Shipped
- [ ] Out-for-delivery if supported operationally
- [ ] Delivered
- [ ] Delivery failed
- [ ] Cancelled
- [ ] Return request received
- [ ] Return decision
- [ ] Password/account emails where applicable
- [ ] Abandoned cart reminder if enabled

Reliability:

- [ ] Delivery event logging
- [ ] Idempotent email jobs
- [ ] Retry handling
- [ ] Failure visibility in CRM
- [ ] No duplicate email from retry

---

# 17. Phase 12 — CRM Foundation & Staff Access

## Access

- [ ] Staff authentication
- [ ] Roles
- [ ] Permissions
- [ ] Route guards
- [ ] Server-side authorization
- [ ] Staff activation/deactivation

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
- [ ] Staff
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
- [ ] Role/permission matrix audit
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

At launch, House of Lume should prioritize reliable core commerce over optional complexity.

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

**House of Lume Production Plan — COD Launch Baseline**
