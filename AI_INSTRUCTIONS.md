# House of Lume — AI Engineering Instructions

**Purpose:** Mandatory execution rules for any AI agent or developer working in this repository.  
**Priority:** Treat this file and `design.md` as project contracts.  
**Product:** Production ecommerce storefront + commerce CRM.  
**Quality expectation:** No prototype shortcuts.

---

## 1. Read Before Working

Before changing code:

1. Read this file completely.
2. Read `design.md` completely.
3. Inspect the current repository structure.
4. Inspect existing patterns before introducing new ones.
5. Identify the requested phase and its acceptance criteria.
6. Produce a complete phase checklist before implementation.

Do not begin by blindly generating files.

---

## 2. Production-Only Mindset

This repository is not:

- a demo
- a prototype
- a portfolio mockup
- a throwaway MVP
- a visual-only implementation

Every implemented feature must be capable of becoming part of the production application.

Temporary shortcuts must not be presented as completed functionality.

If a feature requires external credentials or unavailable infrastructure, implement everything that can be implemented safely, clearly identify the blocked integration, and do not fake success.

---

## 3. Phase Workflow — Mandatory

Every phase follows this exact lifecycle.

### Step 1 — Scope

Create a checklist of every requirement in the phase.

Example:

```text
Phase 2 — Product Catalogue

[ ] Product schema
[ ] Category schema
[ ] Product list
[ ] Product detail
[ ] Variants
[ ] Inventory state
[ ] Search
[ ] Filters
[ ] Loading states
[ ] Empty states
[ ] Error states
[ ] Mobile QA
[ ] Accessibility QA
[ ] Performance QA
```

The checklist must be shown in chat before substantial implementation when the user requests a phase.

### Step 2 — Implement

Work through all checklist items.

Do not mark an item complete until its implementation exists and has been verified as far as available tooling permits.

### Step 3 — Verify

Run the relevant:

- lint
- TypeScript check
- tests
- build
- route checks
- UI verification
- responsive checks
- accessibility checks
- database/security checks
- integration checks

### Step 4 — Audit

Perform a separate final audit against:

- original phase requirements
- `design.md`
- this instruction file
- regressions from earlier phases

### Step 5 — Final completion report

Share a final checklist in chat using check marks.

Example:

```text
Phase 2 Final Audit

✅ Product schema
✅ Category schema
✅ Product listing
✅ Product detail
✅ Mobile responsive
✅ Keyboard interaction
✅ Lint
✅ Type check
✅ Production build

Phase 2 status: 100% complete.
```

Never state "100% complete" when a required point is missing, untested, knowingly broken, or blocked.

---

## 4. No Partial Phase Completion Hidden as Done

Forbidden:

- "mostly complete"
- skipping a hard item and still claiming 100%
- silently replacing required functionality with placeholders
- hiding known bugs
- leaving TODO markers and calling the phase finished
- assuming an integration works without testing available paths

If something is blocked, mark it clearly:

```text
⚠️ Blocked — reason
```

A blocked required item means the phase is not 100% complete.

---

## 5. Styling Rules — Non-Negotiable

### No inline styles

Do not use:

```tsx
style={{ ... }}
```

Do not use HTML `style=""`.

Use:

- Tailwind
- semantic tokens
- reusable component variants
- CSS Modules for complex art-directed components
- global design tokens

### No duplicated class systems

Do not duplicate long class strings across files.

If repeated:

- extract component
- create CVA variant
- create semantic utility
- centralize tokens

Do not create aliases that contain the same declarations under different names.

### No arbitrary design drift

Do not introduce:

- random colors
- arbitrary radii
- arbitrary shadows
- random spacing
- generic cards
- unrelated fonts
- new animation language

without updating or complying with `design.md`.

---

## 6. Component Standards

A component must:

- have one clear responsibility
- have typed props
- avoid duplicated business logic
- support loading/disabled states when interactive
- support keyboard use
- have accessible naming
- respond correctly across breakpoints
- use project tokens
- avoid unnecessary client-side rendering

Prefer composition over giant configurable components.

Do not create components such as:

- `Card` for everything
- `SectionWrapper2`
- `NewButton`
- `FinalHero`
- `TestComponent`

Use domain names.

---

## 7. TypeScript Rules

- strict mode enabled
- no implicit `any`
- no broad `any` to silence errors
- prefer discriminated unions for complex states
- validate external data
- type API boundaries
- type database results
- avoid unsafe casts
- document rare unavoidable type assertions

A type error means the phase is not complete.

---

## 8. Next.js Rules

- App Router architecture
- Server Components by default
- `use client` only at interaction boundaries
- Server Actions or route handlers chosen intentionally
- metadata generated correctly
- loading/error/not-found states implemented
- layouts used for shared structure
- data fetching placed at the correct layer
- no secret sent to browser
- no environment-specific hardcoded URLs

Do not move whole pages to client rendering simply because one child is interactive.

---

## 9. Data and Supabase Rules

When Supabase is introduced:

- migrations are committed
- schema changes are reproducible
- RLS enabled for private/business data
- policies tested
- service-role key server-only
- least privilege
- database constraints enforce integrity
- indexes added for real query patterns
- timestamps handled consistently
- destructive operations audited where appropriate

Never rely on UI hiding as authorization.

---

## 10. Ecommerce Integrity

Authoritative values are server-side.

Never trust the browser for:

- price
- discount validity
- inventory availability
- order totals
- shipping eligibility
- payment state
- role permissions

Revalidate before order/payment creation.

Handle idempotency where duplicate submission is possible.

---

## 11. Security Baseline

For every feature consider:

- authentication
- authorization
- input validation
- output encoding
- CSRF where relevant
- rate limiting where relevant
- abuse prevention
- secret handling
- auditability
- secure redirects
- file upload validation
- least privilege
- dependency risk

No secret keys in source control.

No credential values in chat-generated committed files.

---

## 12. Animation Engineering

Follow `design.md`.

### Ownership

- GSAP/ScrollTrigger → scroll choreography
- Lenis → storefront smooth scrolling
- Motion/Framer Motion → component/UI state
- SplitType → selected text sequences
- CSS → normal hover/focus transitions

Do not make two systems animate the same transform at the same time.

### No kinetic/magnetic effects

Do not implement:

- magnetic buttons
- mouse-follow buttons
- cursor attraction
- pointer tilt
- spring cursor effects

unless the user explicitly overrides the design system later.

### Scrub

Scrub animations must:

- have a storytelling reason
- use transform/opacity/masks where possible
- be responsive
- include reduced-motion behavior
- avoid mobile jank
- clean up correctly on route/unmount
- not leak ScrollTriggers

---

## 13. Accessibility Definition of Done

Target WCAG 2.2 AA.

Verify:

- keyboard path
- focus visibility
- focus not obscured
- semantic elements
- labels
- errors
- dialogs
- menus
- accordions
- live updates
- alt text
- contrast
- reflow
- touch/pointer targets
- reduced motion
- no drag-only function
- no hover-only function

Accessibility is a completion requirement, not a later polish phase.

---

## 14. Performance Definition of Done

Target Core Web Vitals at p75:

- LCP ≤ 2.5s
- INP ≤ 200ms
- CLS ≤ 0.1

During implementation:

- optimize images
- define image dimensions
- avoid layout shifts
- minimize client JS
- code-split heavy motion
- avoid unnecessary dependencies
- lazy load below fold
- protect LCP resource priority
- avoid expensive scroll handlers
- verify animations do not cause layout thrash

A visually impressive page that performs poorly is not complete.

---

## 15. Responsive Definition of Done

Test at minimum:

- small mobile
- standard mobile
- large mobile
- tablet portrait
- tablet landscape
- laptop
- desktop
- wide desktop

Do not only test breakpoint endpoints.

Check intermediate widths.

No horizontal overflow unless intentionally designed and accessible.

---

## 16. State Completeness

Every data-driven surface must consider:

- loading
- success
- empty
- error
- partial data
- unauthorized
- offline/network failure where meaningful

Interactive actions must consider:

- idle
- hover
- focus
- active
- pending
- success
- error
- disabled

Missing states mean the implementation is incomplete.

---

## 17. Testing Strategy

As the project grows, maintain an appropriate mix of:

- unit tests
- integration tests
- component tests
- end-to-end tests

Critical ecommerce flows deserve end-to-end coverage:

- authentication
- browse/search
- variant selection
- add to cart
- cart updates
- checkout initiation
- successful order path
- failure/retry path
- account order viewing
- admin order handling

Tests must verify behavior, not implementation details only.

---

## 18. Build Gate

Before marking a coding phase complete:

- [ ] install succeeds
- [ ] lint passes
- [ ] type check passes
- [ ] tests pass
- [ ] production build passes
- [ ] no known runtime console errors
- [ ] core routes load
- [ ] requested functionality works

Never ignore build errors because the visual page "looks fine."

---

## 19. Dependency Rule

Before adding a dependency ask:

1. Can the platform solve this?
2. Is an existing dependency already capable?
3. Is the library maintained?
4. What is its client cost?
5. Is it required on every route?
6. Can it be dynamically imported?

Do not add overlapping libraries for the same job without a clear reason.

---

## 20. Git Discipline

Commits should be meaningful and scoped.

Prefer:

- `feat: add product catalogue foundation`
- `fix: prevent cart quantity race condition`
- `refactor: centralize product pricing logic`
- `a11y: improve collection filter keyboard flow`

Avoid:

- `update`
- `final`
- `fix things`
- `changes`

Do not commit generated secrets, local env files, debug artifacts, or unnecessary build output.

---

## 21. File Hygiene

Do not create duplicate files such as:

- `component-final.tsx`
- `component-new.tsx`
- `component-working.tsx`
- `page-old.tsx`

Use version control instead.

Remove dead files after a migration when safe.

---

## 22. Documentation Rule

When architecture, environment, schema, or workflow changes materially:

- update the relevant docs in the same phase
- do not let documentation knowingly drift from implementation

`design.md` is the source of truth for design.

This file is the source of truth for execution discipline.

---

## 23. Audit Format

Every completed phase must end with an audit in this shape:

```text
Phase N — Final Audit

FUNCTIONAL
✅ ...
✅ ...

DESIGN
✅ ...
✅ ...

RESPONSIVE
✅ ...
✅ ...

ACCESSIBILITY
✅ ...
✅ ...

SECURITY / DATA
✅ ...
✅ ...

QUALITY
✅ Lint
✅ TypeScript
✅ Tests
✅ Production build

Known issues: None

Phase N status: 100% complete
```

If known issues exist, list them and do not report 100%.

---

## 24. Regression Rule

Before finishing a later phase, verify that earlier completed workflows still work.

New work must not silently break:

- navigation
- authentication
- cart
- checkout
- account
- admin access
- product rendering
- responsive layout

Regression checking is part of the phase.

---

## 25. Communication Rule

Be precise about status.

Use:

- ✅ verified complete
- ⚠️ implemented but not fully verifiable in current environment
- ❌ failing/missing
- ⛔ blocked

Do not use ✅ based only on assumption.

---

## 26. Final Product Principle

The goal is not to generate the most code.

The goal is to build a stable, distinctive, secure, maintainable, accessible, high-performance ecommerce product that can be deployed and operated in production.

Prefer:

- clarity over cleverness
- architecture over duplication
- verified behavior over claims
- native capabilities over unnecessary dependencies
- coherent design over visual noise
- production reliability over demo shortcuts

---

**These instructions remain active for every future phase unless the user explicitly changes them.**
