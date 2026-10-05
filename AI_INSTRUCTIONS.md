# House of Lume — AI Engineering Instructions

**Status:** Mandatory  
**Version:** 2.0  
**Product:** Production ecommerce storefront + internal commerce CRM  
**Launch payment model:** Cash on Delivery only  
**Quality expectation:** Production-grade; no prototype shortcuts

---

## 1. Source-of-Truth Order

Before changing code, read these files in this order:

1. `AI_INSTRUCTIONS.md`
2. `design.md`
3. `PROJECT_PLAN.md`
4. the current repository structure and existing implementation

When instructions conflict, the user's latest explicit request wins. Otherwise:

- `AI_INSTRUCTIONS.md` controls engineering discipline and completion rules.
- `design.md` controls visual language, motion, layout, components and interaction style.
- `PROJECT_PLAN.md` controls scope, architecture, phase sequence and launch requirements.

Do not begin by blindly generating files.

---

## 2. Production-Only Mindset

This repository is not:

- a demo
- a prototype
- a portfolio mockup
- a throwaway MVP
- a visual-only implementation

Every implemented feature must be suitable for production or clearly marked as blocked/incomplete.

Do not present temporary shortcuts, fake data flows, placeholder integrations or unverified behavior as complete functionality.

If external credentials or infrastructure are unavailable, implement the safe production structure that can be completed, document the exact blocker, and do not fabricate success.

---

## 3. Mandatory Phase Workflow

Every phase follows this lifecycle.

### Step 1 — Scope

Create a complete checklist for the requested phase before substantial implementation.

The checklist must include, where relevant:

- functional requirements
- data/schema work
- security/authorization
- loading/empty/error states
- responsive behavior
- accessibility
- animation/motion behavior
- tests
- documentation
- regression checks
- build verification

Show the checklist in chat before implementation when the user asks to execute a phase.

### Step 2 — Implement

Work through the checklist item by item.

Do not mark an item complete because the UI exists. It must satisfy the functional and quality requirements for that item.

### Step 3 — Verify

Run the relevant verification:

- dependency install
- lint
- TypeScript check
- unit/integration/component tests
- end-to-end tests for critical flows
- production build
- route checks
- runtime console/error checks
- responsive checks
- accessibility checks
- database/RLS checks
- integration checks
- regression checks

### Step 4 — Audit

Perform a separate final audit against:

- the phase checklist
- `design.md`
- `PROJECT_PLAN.md`
- this file
- previously completed phases

### Step 5 — Final Report

Use only evidence-based status markers:

- ✅ verified complete
- ⚠️ implemented but not fully verifiable in the current environment
- ❌ failing or missing
- ⛔ blocked

Never state `100% complete` while any required item is missing, blocked, knowingly broken or unverified when verification is possible.

---

## 4. Completion Integrity

Forbidden:

- skipping a difficult requirement and still claiming 100%
- replacing required functionality with a placeholder without saying so
- hiding known bugs
- leaving required TODOs and calling the phase finished
- assuming an integration works without testing available paths
- marking UI-only implementation as a completed backend feature
- marking a database feature complete without authorization/RLS verification

A blocked required item means the phase is not 100% complete.

---

## 5. Styling Rules — Non-Negotiable

### No inline styles

Do not use React `style={{ ... }}` for normal styling.
Do not use HTML `style="..."`.

Use:

- Tailwind CSS
- semantic design tokens
- reusable component variants
- CSS Modules for complex art-directed components
- global token/base CSS where appropriate

### No duplicated class systems

Do not duplicate long class strings across multiple components.

If a visual pattern repeats:

1. extract a reusable component, or
2. create a CVA/component variant, or
3. create a semantic utility/token.

Do not create multiple CSS classes with different names that contain materially identical declarations.

### No design drift

Do not introduce random:

- colors
- shadows
- radii
- fonts
- spacing
- generic cards
- motion patterns

that conflict with `design.md`.

---

## 6. Component Standards

Every component must:

- have one clear responsibility
- use typed props
- avoid duplicated business logic
- support required interaction states
- support keyboard use when interactive
- have accessible naming
- work across required breakpoints
- use design tokens
- avoid unnecessary client-side rendering
- clean up subscriptions/listeners/animation contexts

Prefer domain-specific components and composition.

Avoid vague names such as:

- `Card2`
- `SectionFinal`
- `WrapperNew`
- `TestComponent`
- `FinalHero`

Use names such as:

- `ProductStage`
- `ShelfGrid`
- `LumeButton`
- `OrderStatusTimeline`
- `NotificationCenter`
- `CodSettlementPanel`

---

## 7. TypeScript Rules

- strict mode enabled
- no implicit `any`
- no broad `any` used to silence errors
- type API boundaries
- type database results
- validate untrusted/external data
- prefer discriminated unions for complex states
- avoid unsafe casts
- document rare unavoidable assertions

A TypeScript error means the phase is not complete.

---

## 8. Next.js Rules

- App Router
- Server Components by default
- `use client` only at real interaction boundaries
- Server Actions/Route Handlers chosen intentionally
- correct metadata and canonical handling
- loading/error/not-found states implemented
- layouts used for shared structure
- no secret sent to browser
- no hardcoded environment-specific URLs in components
- no entire page converted to client rendering because one child is interactive
- route/cache strategy must be intentional for commerce data

---

## 9. Supabase and Data Rules

When Supabase is introduced:

- migrations are committed
- schema changes are reproducible
- private/business data uses RLS
- RLS policies are tested
- service-role key remains server-only
- least privilege is enforced
- database constraints protect integrity
- indexes support real query patterns
- timestamps use a consistent strategy
- destructive operations are audited where appropriate
- important multi-step writes use transactions/RPC patterns when atomicity is required

Never rely on hidden UI controls as authorization.

---

## 10. Launch Payment Rule — COD Only

House of Lume launches with **Cash on Delivery only**.

Do not add Stripe, PayPal, card checkout, wallet checkout or another online payment gateway unless the user explicitly changes the launch scope.

### Required payment model

Order payment method:

- `cash_on_delivery`

COD settlement must be modeled separately from order fulfillment.

Recommended settlement states:

- `pending_collection`
- `collected_by_courier`
- `reconciled`
- `refund_due`
- `refunded`
- `written_off` only through authorized admin workflow

Never treat `delivered` as automatically meaning `reconciled`.

### COD integrity

Server-side logic must own:

- item prices
- discount validity
- shipping fee
- COD eligibility
- order totals
- inventory availability
- final order creation
- settlement transitions

Support idempotency/deduplication for repeated order submission.

Never trust browser-provided totals.

---

## 11. Order and Fulfillment State Discipline

Do not overload one `status` column with every business concept.

Keep distinct state domains for:

- order lifecycle
- fulfillment/shipping lifecycle
- COD settlement
- return/RTO lifecycle

Example order/fulfillment progression:

`pending_confirmation → confirmed → processing → packed → shipped → out_for_delivery → delivered`

Exception states may include:

- `cancelled`
- `delivery_failed`
- `rto_in_transit`
- `rto_received`
- `return_requested`
- `return_approved`
- `return_rejected`
- `returned`

Transitions must be validated server-side and permission-controlled.

---

## 12. Inventory Integrity

Inventory must distinguish at minimum:

- on-hand quantity
- reserved quantity
- available quantity

Production behavior must define when inventory is reserved, released and finalized.

Required safeguards:

- atomic stock validation
- no negative availability
- release reservations on valid cancellation/expiry
- prevent overselling during concurrent orders
- audit manual inventory adjustments
- low-stock/out-of-stock notifications

---

## 13. Notification System Rules

Notifications are a first-class subsystem, not scattered `sendEmail()` calls.

### Required channels for launch

- customer in-app notifications when authenticated
- CRM/admin in-app notifications
- transactional email through Resend

Browser push/SMS may be added later through an adapter, but are not launch dependencies unless explicitly requested.

### Event-driven requirement

Business actions emit domain events. Notification delivery consumes those events.

Examples:

- order placed
- order confirmed
- order packed
- order shipped
- out for delivery
- delivered
- delivery failed
- cancelled
- return requested/approved/rejected
- RTO started/received
- COD collected/reconciled
- low stock
- out of stock
- new review requiring moderation
- abandoned cart eligible for recovery
- notification delivery failure

### Notification records should support

- recipient/user
- audience/role
- event type
- entity type and entity id
- title/body
- deep link
- priority
- channel
- read/unread
- archived state
- delivery state
- attempt count
- scheduled time
- sent time
- read time
- dedupe/idempotency key
- failure reason

### Reliability

Notification delivery must support:

- retries with bounded backoff
- deduplication
- failure logging
- template versioning
- transactional vs marketing preference rules
- no duplicate emails for the same idempotent event

Transactional notifications must not be disabled by marketing opt-out.

---

## 14. Background Work and Jobs

Time-based or retryable work must not depend on an open browser session.

Examples:

- notification retries
- abandoned cart qualification
- low-stock scans where needed
- scheduled marketing campaigns
- stale reservation cleanup
- operational reconciliation tasks

Use a production-capable scheduler/job mechanism selected during architecture setup.

Jobs must be idempotent.

---

## 15. Security Baseline

For every feature consider:

- authentication
- authorization
- input validation
- output encoding
- CSRF where relevant
- rate limiting where relevant
- abuse prevention
- bot/spam protection where relevant
- secret handling
- secure redirects
- file upload validation
- least privilege
- auditability
- dependency risk

No secret keys in source control.
No credentials in committed documentation.

---

## 16. Animation Engineering

Follow `design.md`.

Ownership:

- GSAP + ScrollTrigger → scroll choreography/scrub
- Lenis → storefront smooth scrolling
- Motion/Framer Motion → React UI state transitions
- SplitType → selected editorial text sequences
- CSS → normal hover/focus transitions

Do not make two systems animate the same transform/property simultaneously.

Do not implement magnetic buttons, cursor attraction, pointer tilt or mouse-follow interactions unless the user explicitly changes the design system.

All scrub/pinned motion must:

- have a storytelling reason
- prefer transform/opacity/masks
- include reduced-motion fallback
- avoid mobile jank
- clean up on unmount/navigation
- avoid leaking ScrollTriggers
- never delay core commerce actions

---

## 17. Accessibility Definition of Done

Target WCAG 2.2 AA.

Verify:

- semantic landmarks
- logical heading structure
- keyboard-complete interaction
- visible focus
- focus not obscured by sticky UI
- labels and descriptions
- accessible validation errors
- dialog/menu focus management
- live-region announcements where appropriate
- meaningful image alternatives
- contrast
- zoom/reflow
- adequate pointer targets
- reduced motion
- no drag-only function
- no hover-only function

Accessibility is not a later polish phase.

---

## 18. Performance Definition of Done

Target field-like p75 Core Web Vitals:

- LCP ≤ 2.5s
- INP ≤ 200ms
- CLS ≤ 0.1

Requirements:

- optimized responsive images
- explicit media dimensions/aspect ratios
- minimal client JavaScript
- dynamic loading for heavy optional animation
- no unnecessary dependencies
- lazy loading below fold
- correct LCP resource priority
- no expensive uncontrolled scroll handlers
- animation without layout thrash
- database queries reviewed for avoidable N+1 patterns

A visually impressive page with poor performance is incomplete.

---

## 19. Responsive Definition of Done

Test at minimum:

- small mobile
- standard mobile
- large mobile
- tablet portrait
- tablet landscape
- laptop
- desktop
- wide desktop

Also test intermediate widths.

No unintended horizontal overflow.
No desktop-only hover dependency.
No long mobile pinning that damages usability.

---

## 20. State Completeness

Every data-driven surface must consider:

- loading
- success
- empty
- error
- partial data
- unauthorized/forbidden
- network failure where meaningful

Interactive actions must consider:

- idle
- hover
- focus
- active
- pending
- success
- error
- disabled

Missing required states mean the implementation is incomplete.

---

## 21. Testing Strategy

Maintain an appropriate mix of:

- unit tests
- integration tests
- component tests
- end-to-end tests

Critical E2E flows include:

- browse/search/filter
- product variant selection
- wishlist
- add/update/remove cart item
- COD checkout
- duplicate-submit protection
- order confirmation
- customer order history
- admin order workflow
- fulfillment transitions
- delivery failure/RTO flow
- COD collection/reconciliation
- return flow
- notification creation/read state
- transactional email dispatch path
- role/permission boundaries

Tests should verify behavior, not implementation details only.

---

## 22. Build Gate

Before marking a coding phase complete:

- [ ] install succeeds
- [ ] lint passes
- [ ] TypeScript passes
- [ ] relevant tests pass
- [ ] production build passes
- [ ] no known runtime console errors
- [ ] core affected routes load
- [ ] requested functionality is verified
- [ ] security/RLS checks pass when relevant
- [ ] regression checks pass

Never ignore build errors because the page looks correct.

---

## 23. Dependency Rule

Before adding a dependency ask:

1. Can the web platform solve this?
2. Can an existing dependency solve this?
3. Is the library maintained?
4. What is its client cost?
5. Is it required on every route?
6. Can it be dynamically imported?
7. Does it overlap an existing library?

Do not add overlapping libraries without a clear documented reason.

---

## 24. Git and File Hygiene

Use meaningful scoped commits such as:

- `feat: add COD order workflow`
- `feat: add notification event pipeline`
- `fix: release inventory reservation on cancellation`
- `a11y: improve collection filter keyboard flow`

Avoid meaningless commit messages like `update`, `final`, `fix things`.

Do not create duplicate files such as:

- `page-old.tsx`
- `component-final.tsx`
- `component-new.tsx`

Use version control instead.

Do not commit secrets, local environment files, debug artifacts or unnecessary build output.

---

## 25. Documentation Rule

When architecture, schema, environment or workflows change materially, update the relevant documentation in the same phase.

- `design.md` → design/motion/UI source of truth
- `PROJECT_PLAN.md` → scope/architecture/phase source of truth
- `AI_INSTRUCTIONS.md` → execution/completion source of truth

Do not knowingly allow documentation to drift from implementation.

---

## 26. Audit Format

Every completed phase ends with:

```text
Phase N — Final Audit

FUNCTIONAL
✅ ...

DESIGN
✅ ...

RESPONSIVE
✅ ...

ACCESSIBILITY
✅ ...

SECURITY / DATA
✅ ...

NOTIFICATIONS / OPERATIONS
✅ ... (when applicable)

QUALITY
✅ Lint
✅ TypeScript
✅ Tests
✅ Production build

Known issues: None

Phase N status: 100% complete
```

If known required issues exist, list them and do not report 100%.

---

## 27. Regression Rule

Later phases must verify they did not silently break earlier completed workflows, especially:

- navigation
- authentication
- search
- catalogue
- cart
- COD checkout
- account
- notification center
- order state transitions
- inventory
- CRM authorization
- responsive layout

Regression checking is part of phase completion.

---

## 28. Final Product Principle

The goal is not maximum code volume.

The goal is a stable, distinctive, secure, maintainable, accessible, operationally complete and high-performance ecommerce product.

Prefer:

- verified behavior over claims
- architecture over duplication
- domain integrity over UI shortcuts
- native capabilities over unnecessary dependencies
- coherent design over visual noise
- production reliability over demo shortcuts

**These instructions remain active for every future phase unless the user explicitly changes them.**