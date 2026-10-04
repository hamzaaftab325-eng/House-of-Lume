# House of Lume — Production Design System

**Status:** Final  
**Version:** 2.0  
**Product intent:** Production ecommerce platform + internal commerce CRM  
**Design direction:** Luminous Domesticity  
**Quality bar:** Premium retail, editorial commerce, production-ready implementation  
**Accessibility target:** WCAG 2.2 AA minimum  
**Performance target:** Good Core Web Vitals at the 75th percentile

---

## 1. Design Thesis

House of Lume is not a template store.

It is a modern home-living brand built around **light, greenery, material, shadow, and domestic atmosphere**. The visual system should feel like an interior magazine and a well-designed physical showroom translated into a digital product.

The core idea is:

> **Objects are not placed inside cards. They live in space.**

The storefront must avoid the familiar ecommerce pattern of repeated rounded rectangles floating on neutral backgrounds. Instead, products are presented through architectural composition:

- shelves
- frames
- split planes
- stepped grids
- crop windows
- editorial captions
- illuminated rules
- edge labels
- object stages
- image-to-type relationships
- controlled negative space

The system should feel **2026-native without looking trend-dependent**.

---

## 2. Brand Character

### Primary attributes

- Warm
- Architectural
- Quietly expressive
- Natural
- Tactile
- Intelligent
- Editorial
- Contemporary
- Human
- Atmospheric
- Confident
- Precise

### The experience should feel like

- entering a curated home rather than browsing a catalogue
- evening light moving through a room
- a premium print editorial with digital depth
- a product showroom with intentional spacing
- an interior stylist explaining why an object belongs in a space

### The experience must never feel like

- a generic Shopify theme
- a SaaS dashboard applied to retail
- a collection of rounded cards
- an AI-generated landing page
- glassmorphism for decoration
- neon luxury
- gaming UI
- excessive gradients
- endless floating pills
- kinetic/magnetic cursor effects
- motion added simply because a library is available

---

## 3. Signature Visual Language

House of Lume uses five signature devices.

### 3.1 The Lume Line

A thin illuminated rule is the primary graphic motif.

Use it for:

- navigation hover states
- section transitions
- collection labels
- active tabs
- product metadata separators
- editorial callouts
- CTA hover reveals

Default:

```css
--lume-line: 1px;
--lume-line-strong: 2px;
```

The line may expand, reveal, travel, or brighten. It must never glow like neon.

---

### 3.2 Object Stage

Products are displayed on a **stage**, not in a card.

An Object Stage is:

- an image or rendered product area
- a supporting surface or tonal field
- minimal metadata aligned to an edge
- optional index number
- no unnecessary enclosing rounded rectangle

Examples:

- lamp floating against warm plaster
- planter cropped against stone
- vase extending beyond a grid boundary
- product image aligned to an architectural rule

The image itself may have a small radius where appropriate, but the entire product unit must not become a generic card container.

---

### 3.3 Shelf Grid

Collection layouts use horizontal baselines that feel like shelves.

Rules:

- metadata aligns to a shared baseline
- products can have different image heights
- whitespace provides rhythm
- rows may intentionally offset
- a thin rule may visually support the composition
- mobile collapses to a clear single-column rhythm

Avoid symmetrical 3-card / 4-card blocks unless business requirements specifically benefit from them.

---

### 3.4 Split Plane

Large sections may divide the viewport into two or more contrasting material planes.

Examples:

- warm ivory / deep ink
- plaster / botanical
- image / editorial copy
- product / contextual room photography

The split is structural, not decorative.

---

### 3.5 Crop Window

Photography can enter or leave the viewport through controlled clipping.

Use:

- `overflow: clip`
- CSS masks where supported
- rectangular / architectural reveals
- edge-to-edge crops
- object-focused framing

Avoid blobs and arbitrary organic masks.

---

## 4. Color System

The palette is inspired by plaster, linen, aged bronze, olive leaves, warm wood, and evening shadow.

### Foundation

| Token | Hex | Role |
|---|---|---|
| Lume Canvas | `#F2EDE3` | Primary background |
| Paper | `#FBF8F1` | Elevated light surface |
| Chalk | `#E6DED0` | Secondary plane |
| Ink | `#1E1D1A` | Primary text / dark surfaces |
| Graphite | `#383630` | Secondary dark |
| Ash | `#716C63` | Muted text |
| Bronze | `#96744D` | Primary brand accent |
| Olive | `#66705B` | Botanical accent |
| Clay | `#A9654C` | Warm editorial accent |

### Semantic

| Token | Hex |
|---|---|
| Success | `#526849` |
| Warning | `#9B6D2F` |
| Error | `#9E493D` |
| Info | `#536B73` |

### Color rules

1. Canvas is the default page color.
2. Paper is used for functional overlays and checkout surfaces.
3. Ink is the dominant dark color.
4. Bronze is used deliberately, not everywhere.
5. Olive should appear where content relates naturally to living greenery or calm positive states.
6. Clay is reserved for selected editorial moments.
7. Gradients are not a default surface treatment.
8. Dark sections must have a reason: contrast, evening lighting story, or strong editorial transition.
9. Status meaning must include text/iconography, not color alone.

---

## 5. Typography

### Display family

**Cormorant Garamond**

Purpose:

- hero statements
- editorial headlines
- campaign titles
- collection storytelling
- selected pull quotes
- large prices only when art-directed

### Interface family

**Manrope**

Purpose:

- navigation
- product titles
- product metadata
- body text
- buttons
- forms
- checkout
- CRM
- tables
- analytics
- system messaging

### Typography behavior

House of Lume typography uses strong contrast between editorial scale and practical interface scale.

Do not make every heading oversized.

### Scale

| Token | Desktop | Tablet | Mobile | Family |
|---|---:|---:|---:|---|
| Display Hero | clamp(4.75rem, 8vw, 9rem) | fluid | fluid | Cormorant |
| Display 1 | clamp(3.75rem, 6.5vw, 7rem) | fluid | fluid | Cormorant |
| Display 2 | clamp(3rem, 5vw, 5.5rem) | fluid | fluid | Cormorant |
| H1 | clamp(2.75rem, 4vw, 4.5rem) | fluid | fluid | Cormorant |
| H2 | clamp(2.25rem, 3vw, 3.5rem) | fluid | fluid | Cormorant |
| H3 | 2rem | 1.875rem | 1.75rem | Manrope or Cormorant by context |
| H4 | 1.375rem | 1.375rem | 1.25rem | Manrope |
| Body L | 1.125rem | 1.125rem | 1.0625rem | Manrope |
| Body | 1rem | 1rem | 1rem | Manrope |
| Small | .875rem | .875rem | .875rem | Manrope |
| Label | .75rem | .75rem | .75rem | Manrope |

### Editorial rules

- Display tracking: `-0.025em` to `-0.045em`
- Interface tracking: normal
- Eyebrow tracking: `0.12em`
- Avoid uppercase paragraphs
- Body measure: 55–72 characters
- Do not center long paragraphs
- Preserve real typographic hierarchy

---

## 6. Layout Architecture

### Maximum widths

```text
Editorial wide: 1600px
Commerce content: 1440px
Standard content: 1280px
Reading measure: 760px
CRM workspace: fluid
```

### Page gutters

Use fluid gutters with `clamp()`.

```css
--page-gutter: clamp(1.25rem, 3vw, 3.5rem);
```

### Grid

Desktop:
- 12 columns
- asymmetry encouraged
- 24–32px column gap

Tablet:
- 8 columns

Mobile:
- 4 columns

### Composition rules

Use:

- 5/7 splits
- 4/8 splits
- 7/5 splits
- offset 3-column editorial arrangements
- stepped media positions
- intentional blank columns
- edge-aligned captions

Avoid making every section a centered title followed by a three-column grid.

---

## 7. Spacing

Base unit: 4px.

Core spacing tokens:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 160
```

Use `clamp()` for section rhythm where appropriate.

Storefront sections should breathe.

CRM spacing should be more compact.

No arbitrary one-off spacing values unless required by optical alignment and documented.

---

## 8. Surfaces, Corners, and Borders

### Storefront

Corners are restrained.

- image: 0–16px depending on composition
- drawer: 0px or 16px on exposed corners
- modal: 12–20px
- input: 8–10px
- editorial stage: often 0px
- product unit: no outer card radius because there is no outer generic card

### CRM

- panel radius: 10–14px
- input radius: 8px
- status chip: 999px allowed
- table container: 12px maximum

### Borders

Primary border:

```css
1px solid color-mix(in srgb, var(--color-ink) 14%, transparent)
```

Strong rule:

```css
1px solid color-mix(in srgb, var(--color-ink) 30%, transparent)
```

Shadows are reserved for actual elevation:

- drawers
- popovers
- command palette
- modal
- sticky purchase panel where required

Do not add shadows to every section or product item.

---

## 9. Button System — Lume Controls

Buttons must be visually ownable without relying on magnetic or kinetic cursor behavior.

### 9.1 Primary — Lume Fill

Appearance:

- rectangular with restrained 8px radius or square editorial variant
- Ink background
- Paper text
- left-aligned label where space allows
- thin Lume Line on lower edge

Hover:

1. Bronze fill grows horizontally from left to right beneath the existing background.
2. Label remains stable.
3. Arrow shifts 4px.
4. Lower Lume Line brightens.
5. Total duration: 320–420ms.

No cursor chasing.
No tilt.
No spring bounce.

### 9.2 Secondary — Frame Button

Appearance:

- transparent
- Ink border
- Ink text

Hover:

- inner fill reveals from bottom
- text switches to inverse at the midpoint
- border does not jump in size

### 9.3 Text CTA — Lume Link

Structure:

```text
Explore lighting  ───→
```

Hover:

- rule extends 12–20px
- arrow shifts slightly
- text opacity remains 100%

### 9.4 Icon button

- clear 44px preferred hit area
- visible focus
- no unlabeled icon controls
- use tooltip only as support, never as accessible name

---

## 10. Navigation

### Desktop header

Height:
- 76–88px depending on page state

Structure:

- logo / wordmark
- primary categories
- search
- account
- wishlist
- bag

Hover behavior:

- nav label does not move vertically
- Lume Line grows beneath active/hovered item
- dropdown reveal uses opacity + clip, not scale bounce

### Scroll states

State A:
- integrated with hero

State B:
- compact sticky header
- Paper or Canvas background
- backdrop filter only when it improves legibility
- thin bottom rule

Sticky UI must not obscure keyboard focus.

### Mobile

- menu trigger
- wordmark
- search / bag
- full-height menu with proper focus management
- no horizontally squeezed desktop navigation

---

## 11. Product Presentation

### Do not build old-style product cards

Forbidden default pattern:

```text
rounded container
  rounded image
  title
  price
  button
shadow
```

Instead use **Product Units**.

### Product Unit anatomy

1. Product Stage
2. Optional index
3. Name
4. category/material
5. price
6. optional rating
7. wishlist
8. optional Quick Add revealed contextually

### Desktop interaction

Image behavior may use:

- alternate image crossfade
- subtle object scale
- light temperature change
- crop shift
- image mask reveal

Metadata stays physically stable.

### Mobile

No critical functionality can depend on hover.

---

## 12. Collection Modules

Create multiple compositional patterns instead of one repeated grid.

### Module A — Shelf

Products sit across a shared visual baseline.

### Module B — Editorial Pair

Large contextual image + one featured product.

### Module C — Staggered Objects

Three products at intentionally different vertical positions.

### Module D — Material Study

Close-up material image + product + short editorial copy.

### Module E — Full-Bleed Feature

One hero product inside a room context with hotspot/CTA.

These modules can be reused, but section order and composition should avoid repetition.

---

## 13. Product Detail Page

Desktop uses an asymmetric 7/5 or 8/4 composition.

### Media

- image rail or progressive gallery
- zoom where useful
- video only if product understanding improves
- media background based on product photography
- no carousel arrows covering essential product detail

### Purchase panel

Contains:

- breadcrumb
- product name
- short descriptor
- price
- review summary
- variant controls
- quantity
- Add to Bag
- accelerated checkout where approved
- stock state
- delivery estimate
- returns summary

### Below fold

- story
- dimensions
- materials
- care
- shipping
- product-in-space imagery
- styling suggestions
- related objects
- recently viewed

Sticky behavior must not trap scrolling.

---

## 14. Cart and Checkout

These are conversion surfaces, not animation showcases.

### Cart drawer

- edge-mounted
- no floating rounded mobile-card look
- strong product thumbnails
- direct quantity editing
- clear subtotal
- shipping threshold if real
- primary checkout CTA
- undo after remove where practical

### Checkout

Prioritize:

- speed
- trust
- clear validation
- keyboard navigation
- strong order summary
- address correctness
- payment clarity

Disable unnecessary smooth-scroll and decorative animations during checkout.

---

## 15. Search and Discovery

Search is a core shopping tool.

Implement:

- predictive search
- products
- categories
- editorial content
- recent searches
- keyboard navigation
- empty-state suggestions

Search overlay uses an architectural full-width plane, not a tiny floating modal.

---

## 16. Forms

Requirements:

- labels are persistent
- minimum 44px preferred interactive height
- inline error association
- `aria-describedby` where relevant
- autocomplete attributes
- correct input types
- clear required/optional states
- no placeholder-only labels
- no disabled-looking enabled controls

Focus states use Lume Line + high-contrast outline.

---

## 17. Iconography

Use Lucide React for operational interface icons.

Rules:

- one icon family
- consistent stroke
- no decorative icon clutter
- labels accompany ambiguous icons
- custom brand symbols may exist separately

---

## 18. Photography and Art Direction

### Required characteristics

- warm directional light
- realistic interiors
- natural material detail
- visible texture
- human-scale spaces
- botanical life
- evening atmosphere
- honest shadows
- premium but lived-in

### Image hierarchy

1. contextual room scene
2. isolated product stage
3. material detail
4. usage detail
5. scale/detail reference

Do not mix wildly different color grades in one collection.

---

## 19. Motion Philosophy

Motion communicates:

- light turning on
- depth changing
- objects entering space
- editorial pacing
- navigation continuity

Motion must not communicate:

- technological novelty for its own sake
- game-like physics
- cursor tricks
- constant activity

### Library ownership

```text
GSAP + ScrollTrigger
  scroll timelines
  scrub animation
  pinning
  masks
  parallax
  image sequences
  section choreography

Lenis
  storefront smooth-scroll integration
  never checkout-critical
  never used to fight native mobile behavior

Motion / Framer Motion
  React state transitions
  drawers
  modal
  accordion
  filters
  shared layout
  route UI

SplitType
  selected campaign/editorial headings

CSS
  hover
  focus
  simple state transitions
```

One property = one animation owner.

---

## 20. Scroll Scrub System

Scrub animation is a core House of Lume signature.

### Scrub principle

The animation responds directly to scroll progress instead of simply triggering on entry.

Use for:

- hero light transition
- product-to-room storytelling
- image crop movement
- editorial type/image relationships
- section color transitions
- controlled object scale
- pinned product narratives

### Scrub presets

#### Soft Scrub

```text
scrub: 0.6–1.2
```

Use for:
- parallax
- background transitions
- slow image transforms

#### Direct Scrub

```text
scrub: true
```

Use when exact scroll-to-motion mapping is necessary.

#### Narrative Pin

Use:

- pin
- controlled section duration
- clear progress
- no more than necessary
- mobile alternate layout

### Scrub constraints

- transform and opacity preferred
- do not scrub layout properties
- no large 3D rotations
- no scroll hijacking
- avoid long pinned sequences on mobile
- refresh ScrollTrigger correctly after responsive/media changes
- do not create independent ScrollTriggers for hundreds of product items

---

## 21. Signature Motion Sequences

### 21.1 Light Awakening Hero

Scroll 0–100%:

- room begins subdued
- lamp warmth increases
- foreground gains subtle exposure
- headline shifts from large editorial state to stable layout
- supporting CTA appears without delayed usability

The effect should feel photographic, not like an overlay changing opacity.

### 21.2 Object Reveal

Product enters through a rectangular crop window.

- mask opens
- image moves 3–6%
- metadata rule reveals
- product name remains readable immediately

### 21.3 Material Transition

Close-up texture gradually gives way to the full product through scrubbed clipping.

### 21.4 Shelf Progression

Products cross a shared horizontal visual line while the viewport moves vertically.

Avoid fake horizontal scrolling unless it meaningfully improves the narrative.

### 21.5 Dark-to-Warm Editorial Chapter

Background transitions from Ink to Canvas while the featured lamp/context changes from night to warm interior.

---

## 22. Page Transitions

Use native View Transitions where they provide progressive enhancement and do not compromise routing/accessibility.

Rules:

- navigation must work without transitions
- feature detection required
- no transition longer than 500–600ms for normal commerce navigation
- Product → Product Detail may use shared image continuity if robust
- respect reduced motion
- never block navigation while waiting for decorative animation

---

## 23. Reduced Motion

When `prefers-reduced-motion: reduce`:

- Lenis disabled
- scrub effects replaced by static states or short opacity transitions
- parallax disabled
- SplitType entrance choreography disabled
- view transitions simplified or skipped
- no loss of information
- no loss of functionality

---

## 24. Responsive Motion

### Desktop

Full editorial choreography allowed within performance budget.

### Tablet

Reduce:
- pin duration
- image travel
- simultaneous layers

### Mobile

Prefer:
- short reveal
- minimal scale
- native scroll
- no long pinning
- no essential lateral motion
- no heavy blur animation

Mobile is designed intentionally, not obtained by shrinking desktop.

---

## 25. CRM Visual System

The CRM inherits the brand, not the storefront layout.

### CRM design character

- dense
- precise
- calm
- data-first
- low decoration
- fast scanning

### CRM layout

- fixed/collapsible navigation rail
- utility header
- fluid workspace
- optional contextual inspector
- command/search interface

### Avoid

- large decorative cards for every metric
- giant dashboard numbers with wasted space
- ecommerce storytelling animations
- excessive rounded containers

### Instead

Use:

- data rails
- sectional rules
- compact metric bands
- table views
- inline trends
- split workspace
- contextual drawers

---

## 26. Data Presentation

Charts use:

- Ink
- Bronze
- Olive
- Clay
- muted neutrals

Avoid rainbow visualization.

Charts must include:

- textual labels
- accessible summary where needed
- clear units
- useful hover/focus states
- no misleading axes

---

## 27. Accessibility Contract

Target: WCAG 2.2 AA minimum.

Mandatory:

- semantic landmarks
- logical heading hierarchy
- skip link
- correct button/link semantics
- keyboard-complete interaction
- visible focus
- focus not hidden beneath sticky UI
- accessible dialogs
- focus return on dialog close
- sufficient contrast
- meaningful image alternatives
- form labels and associated errors
- status announcement for async changes
- no drag-only actions
- pointer targets meeting minimum requirements
- zoom/reflow resilience
- reduced-motion behavior
- no hover-only commerce controls

Preferred target size for primary controls: 44×44 CSS px or larger.

---

## 28. Performance Contract

Core Web Vitals must be measured in field-like conditions.

Targets at p75:

- LCP ≤ 2.5s
- INP ≤ 200ms
- CLS ≤ 0.1

Engineering requirements:

- use Next.js image optimization
- responsive image sizes
- prevent image layout shifts
- optimize above-fold LCP image deliberately
- no autoplay hero video by default on constrained devices
- code-split non-critical animation
- use dynamic import for heavy optional experiences
- self-host or optimize fonts
- subset fonts where reasonable
- minimize third-party scripts
- no animation library loaded for pages that do not require it when avoidable
- avoid JS-driven layout where CSS can solve it
- use transforms instead of layout-thrashing animation
- test on real mid-range mobile hardware

---

## 29. CSS and Styling Architecture

### Non-negotiable

**No inline styles.**

Forbidden:

```tsx
<div style={{ color: "#fff" }} />
```

Forbidden:

```html
<div style="padding: 20px">
```

### Styling stack

- Tailwind CSS for tokens/layout/utilities
- global CSS for tokens/base/reset
- component styles only when necessary
- CSS Modules permitted for complex art-directed components
- CVA permitted for component variants
- `clsx` / `cn` permitted for conditional class composition

### Duplicate class rule

Do not copy long repeated class strings between components.

If the same visual pattern appears more than once:

1. make it a reusable component, or
2. make it a component variant, or
3. create a semantic utility/token when appropriate.

Do not create multiple CSS classes with different names that contain materially identical declarations.

### Naming

Use semantic component names:

- `ProductStage`
- `LumeButton`
- `ShelfGrid`
- `EditorialSplit`
- `MaterialStory`

Avoid:

- `Box1`
- `CardNew`
- `Section2`
- `WrapperFinal`

---

## 30. Component Architecture

Every component must have a clear responsibility.

### UI primitives

Examples:

- Button
- IconButton
- Link
- Input
- Select
- Checkbox
- Radio
- Dialog
- Drawer
- Accordion
- Tabs
- Tooltip
- Toast
- StatusBadge

### Commerce components

- ProductStage
- ProductUnit
- Price
- ProductGallery
- VariantSelector
- QuantityControl
- AddToBag
- CartLine
- CartDrawer
- CollectionShelf
- SearchOverlay
- ReviewSummary

### Editorial components

- LumeHero
- SplitPlane
- CropWindow
- EditorialChapter
- MaterialStory
- RoomStory
- LumeRule
- QuoteBlock

### CRM components

- DataRail
- MetricStrip
- DataTable
- FilterBar
- InspectorPanel
- ActivityTimeline
- StatusBadge
- ChartPanel

Components must not duplicate business logic.

---

## 31. Code Quality Rules

Production means:

- TypeScript strict mode
- no `any` without documented exceptional reason
- no dead code
- no commented-out obsolete implementation
- no console noise in production
- no duplicated fetch logic
- no hardcoded secrets
- no environment-specific URLs in components
- centralized configuration
- validated environment variables
- schemas for external/untrusted data
- server/client boundaries intentional
- no unnecessary `use client`
- no effect used where derived state is sufficient
- clean loading/error/empty states
- error boundaries where appropriate

---

## 32. State and Data Rules

- server state and UI state are separate concepts
- URL owns shareable filter/search state where sensible
- cart actions are resilient to refresh
- optimistic UI only where rollback is reliable
- mutations communicate pending/success/error states
- inventory is never trusted from client-only state
- prices are authoritative on the server
- checkout totals are recalculated server-side

---

## 33. Ecommerce Trust Rules

Production ecommerce must communicate trust clearly.

Required:

- shipping information
- return policy
- privacy policy
- terms
- secure payment messaging
- stock states
- delivery estimates where data supports them
- order confirmation
- customer support path
- clear refund status
- accessible error recovery

Never fabricate scarcity or fake urgency.

---

## 34. SEO and Structured Data

Implement:

- unique metadata
- canonical URLs
- Product structured data
- Breadcrumb structured data
- Organization data
- Open Graph
- social imagery
- XML sitemap
- robots configuration
- semantic headings
- descriptive URLs
- server-rendered critical product content

Avoid duplicate collection/product metadata.

---

## 35. 2026 Progressive Enhancement

Use modern platform capabilities when stable and useful, but never make them prerequisites.

Candidates:

- View Transitions API
- container queries
- `:has()`
- CSS `subgrid`
- `text-wrap: balance` / `pretty`
- modern viewport units
- `content-visibility` where validated
- native popover/dialog features where appropriate

Every enhancement requires a robust fallback.

---

## 36. Completion Definition for Design Implementation

A page is not complete because it visually resembles a mockup.

It is complete only when:

- layout matches this system
- typography follows tokens
- no generic card patterns have leaked in
- buttons follow Lume Controls
- hover/focus/active/disabled states exist
- mobile is intentionally designed
- animations have reduced-motion fallback
- scroll scrub is smooth
- loading/error/empty states exist where applicable
- keyboard interaction works
- no obvious CLS
- core images are optimized
- code has no inline styles
- duplicate patterns are componentized
- lint/type/build pass
- functional behavior is tested
- final phase audit is complete

---

## 37. Design Review Checklist

Before approving any customer-facing page:

- [ ] Uses Luminous Domesticity visual language
- [ ] No generic rounded-card grid used as default composition
- [ ] Object Stages or editorial modules used appropriately
- [ ] Lume Line motif used consistently
- [ ] Button hierarchy follows Lume Controls
- [ ] No magnetic/kinetic cursor effects
- [ ] Hover states are refined and non-disruptive
- [ ] Scroll scrub has a meaningful storytelling purpose
- [ ] Mobile has a specific composition
- [ ] Reduced motion works
- [ ] Typography hierarchy is correct
- [ ] Photography is art-directed consistently
- [ ] Focus states are visible
- [ ] Sticky elements do not obscure focused content
- [ ] No inline styles
- [ ] No duplicate CSS patterns/classes
- [ ] No one-off un-tokenized values without reason
- [ ] Performance budget respected
- [ ] Ecommerce actions remain immediate

---

## 38. Final Design Rule

When choosing between:

- more visual decoration vs better object presentation → **choose the object**
- more animation vs better interaction → **choose interaction**
- trendy styling vs long-term identity → **choose identity**
- a generic card vs architectural composition → **choose composition**
- extra JavaScript vs native CSS/browser capability → **choose the platform**
- desktop spectacle vs mobile reliability → **choose reliability**

House of Lume should feel memorable because its **composition, light, material, and restraint** are coherent—not because it uses more effects than other stores.

---

**House of Lume Design System v2.0 — Production Baseline**
