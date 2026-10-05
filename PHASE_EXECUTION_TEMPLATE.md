# House of Lume — Phase Execution Template

**Purpose:** Mandatory reusable template for every implementation phase.  
**Applies with:** `AI_INSTRUCTIONS.md`, `design.md`, and `PROJECT_PLAN.md`.

---

# Phase N — [Phase Name]

## 1. Goal

Write one concise paragraph describing the production outcome of this phase.

The goal must describe working product capability, not only visual output.

---

## 2. Scope Checklist

### Functional

- [ ] Primary user flow implemented
- [ ] Secondary/exception flows implemented
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Error state implemented
- [ ] Pending/disabled states implemented
- [ ] Retry/recovery behavior implemented where relevant
- [ ] Data persists correctly where relevant
- [ ] Business rules are enforced server-side where relevant

### Data / Domain

- [ ] Required entities/tables/types defined
- [ ] Relationships defined
- [ ] Constraints defined
- [ ] Status/state transitions defined
- [ ] Indexes reviewed
- [ ] Migration/reproducibility handled
- [ ] Seed/test data added where relevant

### Security / Authorization

- [ ] Authentication requirements defined
- [ ] Authorization enforced server-side
- [ ] RLS reviewed/tested where relevant
- [ ] Input validation implemented
- [ ] Sensitive data protected
- [ ] Secrets remain server-only
- [ ] Abuse/rate-limit considerations reviewed
- [ ] Sensitive/destructive actions are auditable

### Design System

- [ ] Matches `design.md`
- [ ] Uses semantic tokens
- [ ] No generic card drift
- [ ] No inline styles
- [ ] No duplicated class systems
- [ ] Reusable patterns extracted appropriately
- [ ] Lume Controls used correctly
- [ ] Typography hierarchy correct
- [ ] Spacing/grid/radius rules respected
- [ ] CRM and storefront visual roles remain distinct where applicable

### Motion / Interaction

- [ ] Correct animation owner selected
- [ ] GSAP/ScrollTrigger only for intended scroll choreography
- [ ] Motion/Framer Motion only for UI state where appropriate
- [ ] CSS used for simple hover/focus transitions
- [ ] No magnetic/kinetic cursor behavior
- [ ] Scroll scrub has a real storytelling purpose
- [ ] No animation blocks commerce or CRM actions
- [ ] Reduced-motion behavior implemented
- [ ] Animation contexts/listeners cleaned up correctly

### Responsive

- [ ] Small mobile checked
- [ ] Standard mobile checked
- [ ] Large mobile checked
- [ ] Tablet portrait checked
- [ ] Tablet landscape checked
- [ ] Laptop checked
- [ ] Desktop checked
- [ ] Wide desktop checked
- [ ] Intermediate widths checked
- [ ] No unintended horizontal overflow
- [ ] No hover-only required functionality

### Accessibility

- [ ] Semantic HTML/landmarks correct
- [ ] Heading hierarchy correct
- [ ] Keyboard path complete
- [ ] Focus visible
- [ ] Focus not obscured by sticky UI
- [ ] Accessible names present
- [ ] Form labels/descriptions/errors connected
- [ ] Dialog/menu focus management correct where applicable
- [ ] Live-region announcements used where appropriate
- [ ] Contrast checked
- [ ] Reflow/zoom behavior checked
- [ ] Touch/pointer targets adequate
- [ ] Reduced motion checked
- [ ] No drag-only required function

### Notifications / Operations

Complete when applicable.

- [ ] Domain events defined
- [ ] Customer notifications created where required
- [ ] CRM/staff notifications created where required
- [ ] Transactional email event created where required
- [ ] Deep links point to correct entity
- [ ] Deduplication/idempotency handled
- [ ] Retry/failure behavior handled
- [ ] Read/unread state handled where relevant
- [ ] Operational failures are observable

### COD / Fulfillment

Complete when applicable.

- [ ] Cash on Delivery is the only launch payment path
- [ ] Totals recalculated server-side
- [ ] COD eligibility validated server-side
- [ ] Duplicate order submission prevented
- [ ] Inventory reservation/release correct
- [ ] Order state transition validated
- [ ] Fulfillment state kept distinct from COD settlement
- [ ] Delivery failure/RTO impact handled
- [ ] COD reconciliation impact handled

### Performance

- [ ] Images optimized
- [ ] Media dimensions/aspect ratios prevent layout shift
- [ ] Client JS minimized
- [ ] Heavy optional code dynamically loaded where appropriate
- [ ] No unnecessary dependency added
- [ ] No expensive uncontrolled scroll work
- [ ] Database query pattern reviewed
- [ ] No obvious N+1 issue
- [ ] LCP/INP/CLS impact reviewed

### SEO / Metadata

Complete when applicable.

- [ ] Metadata correct
- [ ] Canonical behavior correct
- [ ] Structured data added where relevant
- [ ] Heading/content structure search-friendly
- [ ] URLs stable and descriptive
- [ ] Index/noindex behavior intentional

### Testing

- [ ] Unit tests added where valuable
- [ ] Integration tests added where valuable
- [ ] Component tests added where valuable
- [ ] E2E tests added for critical flow
- [ ] Happy path verified
- [ ] Error path verified
- [ ] Permission boundary tested where relevant
- [ ] Duplicate/retry path tested where relevant

### Documentation

- [ ] Architecture changes documented
- [ ] Schema changes documented
- [ ] Environment changes documented
- [ ] Workflow changes documented
- [ ] `design.md` updated if design contract changed
- [ ] `PROJECT_PLAN.md` updated if scope changed
- [ ] `AI_INSTRUCTIONS.md` updated if execution rules changed

---

## 3. Implementation Notes

Before implementation, record:

- impacted routes
- impacted tables/entities
- impacted components
- server/client boundaries
- security concerns
- notification events
- expected tests
- known dependencies
- expected migrations

Do not use this section as a substitute for the checklist.

---

## 4. Verification Commands / Checks

Run all applicable checks.

```text
Install
Lint
TypeScript
Unit tests
Integration tests
E2E tests
Production build
Route/runtime checks
Responsive checks
Accessibility checks
Database/RLS checks
Security checks
Regression checks
```

Record failures before fixing them rather than hiding them.

---

## 5. Regression Checklist

Verify all previously completed affected areas still work.

- [ ] Navigation
- [ ] Search
- [ ] Authentication
- [ ] Catalogue
- [ ] Product detail
- [ ] Wishlist
- [ ] Cart
- [ ] COD checkout
- [ ] Customer account
- [ ] Notifications
- [ ] Order tracking
- [ ] Inventory
- [ ] CRM access/authorization
- [ ] Responsive layout
- [ ] Reduced-motion behavior

Mark non-applicable items explicitly rather than silently ignoring them.

---

## 6. Final Audit

Use this exact format at the end of a phase.

```text
Phase N — Final Audit

FUNCTIONAL
✅ ...
✅ ...

DATA / DOMAIN
✅ ...

DESIGN
✅ ...

RESPONSIVE
✅ ...

ACCESSIBILITY
✅ ...

SECURITY / AUTHORIZATION
✅ ...

NOTIFICATIONS / OPERATIONS
✅ ...

COD / FULFILLMENT
✅ ...

PERFORMANCE
✅ ...

QUALITY
✅ Install
✅ Lint
✅ TypeScript
✅ Relevant tests
✅ Production build
✅ Runtime/route checks
✅ Regression checks

Known issues: None

Phase N status: 100% complete
```

If a required item is not verified, use one of:

- ⚠️ implemented but not fully verifiable
- ❌ failing/missing
- ⛔ blocked

Do not write `100% complete` if any required phase item is ⚠️, ❌, or ⛔ unless the user explicitly re-scopes that item out of the phase.

---

## 7. Commit Gate

Before the final phase commit:

- [ ] No secrets committed
- [ ] No local environment file committed
- [ ] No debug artifacts committed
- [ ] No dead duplicate files
- [ ] No temporary `-old`, `-new`, `-final` implementation copies
- [ ] No commented-out obsolete implementation
- [ ] No known console noise
- [ ] Commit message is scoped and meaningful

---

## 8. Completion Principle

A phase is complete only when the intended product capability is implemented, verified, documented, and regression-safe.

Visual similarity alone is not completion.
A successful build alone is not completion.
A passing test suite alone is not completion.

The final standard is **verified production behavior across functionality, design, data, security, accessibility, responsiveness, performance, and operations**.
