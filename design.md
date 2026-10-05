# House of Lume — Production Design System

**Status:** Final production baseline  
**Version:** 2.1  
**Product:** Production ecommerce storefront + internal commerce CRM  
**Launch payment model:** Cash on Delivery only  
**Design direction:** Luminous Domesticity  
**Accessibility target:** WCAG 2.2 AA minimum  
**Performance target:** Good Core Web Vitals at p75

---

## 1. Design Thesis

House of Lume is a modern home-living brand built around **light, greenery, material, shadow, quiet movement, and domestic atmosphere**.

The digital experience should feel closer to a curated interior publication and physical showroom than a template ecommerce site.

The core principle is:

> **Objects are not placed inside cards. They live in space.**

House of Lume must avoid repetitive rounded-card UI, generic SaaS composition, decorative glassmorphism, and animation added only to demonstrate technology.

The product should feel intentional because its composition, typography, materials, motion, and operational states are coherent.

---

## 2. Brand Character

### Primary attributes

- Warm
- Architectural
- Editorial
- Tactile
- Natural
- Contemporary
- Calm
- Precise
- Human
- Atmospheric
- Confident
- Durable

### The storefront should feel like

- entering a curated home
- warm evening light moving through a room
- an interior stylist presenting objects with context
- a premium print editorial translated into an interactive medium
- generous space around meaningful objects

### The CRM should feel like

- a calm operations workspace
- precise and dense without feeling cramped
- immediately scannable
- role-aware
- status-driven
- optimized for repetitive daily work

### Never default to

- generic Shopify layouts
- a three-card grid for every section
- giant dashboard cards with wasted space
- neon gradients
- excessive blur/glass
- magnetic buttons
- mouse-follow effects
- cursor attraction
- springy gimmicks
- tilt effects
- animation that delays shopping or staff workflows

---

## 3. Signature Visual Language

House of Lume uses five signature visual devices.

### 3.1 Lume Line

A fine architectural rule is the primary graphic motif.

Use it for:

- navigation hover/active states
- collection labels
- section transitions
- product metadata
- tabs
- focused form fields
- notification group dividers
- timeline continuity
- CTA hover reveals

The Lume Line may reveal, extend, brighten, or move subtly. It must never become a neon glow.

### 3.2 Object Stage

Products are presented on a **stage**, not inside a generic outer card.

An Object Stage may contain:

- isolated product imagery
- contextual photography
- tonal plaster/linen/stone surfaces
- one edge-aligned label group
- optional index
- restrained quick action

Metadata should align deliberately to the image geometry instead of floating inside a box.

### 3.3 Shelf Grid

Product collections can use a shared visual baseline that feels like objects arranged on a shelf.

Rules:

- varied image heights are allowed
- metadata aligns consistently
- rows may be offset
- whitespace controls rhythm
- a subtle Lume Line may anchor the shelf
- mobile collapses into clear vertical reading order

### 3.4 Split Plane

Large sections may divide into contrasting material planes:

- Canvas / Ink
- Paper / Olive
- image / typography
- object / room scene
- operational table / contextual inspector in CRM

The split must solve hierarchy or task flow, not exist as decoration.

### 3.5 Crop Window

Photography enters through controlled rectangular clipping.

Preferred:

- `overflow: clip`
- architectural crop reveals
- clean CSS masks when progressively enhanced
- object-focused framing

Avoid arbitrary blobs.

---

## 4. Color System

The palette references plaster, linen, aged bronze, olive leaves, clay, warm wood and evening shadow.

### Foundation

| Token | Hex | Role |
|---|---|---|
| Lume Canvas | `#F2EDE3` | Primary storefront background |
| Paper | `#FBF8F1` | Functional/elevated light surface |
| Chalk | `#E6DED0` | Secondary material plane |
| Ink | `#1E1D1A` | Primary text / dark surface |
| Graphite | `#383630` | Secondary dark |
| Ash | `#716C63` | Muted text |
| Bronze | `#96744D` | Primary brand accent |
| Olive | `#66705B` | Botanical/positive secondary accent |
| Clay | `#A9654C` | Selected warm editorial accent |

### Semantic

| Token | Hex | Typical use |
|---|---|---|
| Success | `#526849` | Delivered, reconciled, in stock |
| Warning | `#9B6D2F` | Pending verification, low stock |
| Error | `#9E493D` | Failed delivery, invalid/error |
| Info | `#536B73` | Shipped, system information |

### Rules

- Status must never rely on color alone.
- Canvas is the default storefront background.
- Paper is preferred for checkout, forms, drawers and functional overlays.
- Bronze is deliberate—not the color of every CTA and icon.
- Olive should feel connected to plant/natural content or positive operational states.
- Dark sections must serve an editorial purpose.
- Gradients are not a default surface treatment.

---

## 5. Typography

### Display — Cormorant Garamond

Use for:

- campaign statements
- hero titles
- collection storytelling
- editorial chapters
- selected quotes

### Interface — Manrope

Use for:

- navigation
- product names and metadata
- price
- body copy
- buttons
- forms
- cart/checkout
- notifications
- account
- CRM
- tables
- analytics

### Scale

Use fluid type with `clamp()` rather than device-specific hard switches.

- Display Hero: `clamp(4.75rem, 8vw, 9rem)`
- Display 1: `clamp(3.75rem, 6.5vw, 7rem)`
- Display 2: `clamp(3rem, 5vw, 5.5rem)`
- H1: `clamp(2.75rem, 4vw, 4.5rem)`
- H2: `clamp(2.25rem, 3vw, 3.5rem)`
- H3: `clamp(1.65rem, 2vw, 2rem)`
- Body L: `1.125rem`
- Body: `1rem`
- Small: `.875rem`
- Label: `.75rem`

### Rules

- Display tracking: `-0.025em` to `-0.045em`
- Eyebrow tracking: about `0.12em`
- Do not center long paragraphs.
- Body measure: approximately 55–72 characters.
- Do not make every heading oversized.
- Operational CRM text prioritizes scanning over editorial drama.

---

## 6. Layout Architecture

### Widths

- Editorial wide: 1600px
- Commerce content: 1440px
- Standard content: 1280px
- Reading measure: 760px
- CRM workspace: fluid

### Page gutter

Use a fluid token such as:

```css
--page-gutter: clamp(1.25rem, 3vw, 3.5rem);
```

### Grid

- Desktop: 12 columns
- Tablet: 8 columns
- Mobile: 4 columns

Preferred compositions include:

- 5/7 split
- 7/5 split
- 4/8 split
- staggered 3-object arrangements
- intentional blank columns
- edge-aligned captions
- offset media

Avoid repeating centered title + centered paragraph + three equal cards.

---

## 7. Spacing

Base unit: 4px.

Approved scale:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 160`

Use fluid section spacing where useful.

Storefront should breathe.
CRM should be denser.

Do not introduce arbitrary one-off spacing values without a clear optical or functional reason.

---

## 8. Surfaces, Corners and Elevation

### Storefront

- editorial stage: often square/0 radius
- product image: 0–16px by composition
- input: 8–10px
- modal: 12–20px
- drawer: square edge-mounted form preferred
- product unit: no generic outer card

### CRM

- panel: 10–14px
- input: 8px
- table container: 12px max
- status chips may be pill-shaped

### Elevation

Use shadows only where something is actually elevated:

- menu/popover
- modal
- cart drawer
- notification tray
- command palette
- floating inspector when needed

Do not shadow every content module.

---

## 9. Lume Control System

Buttons must feel distinctive through structure and restrained light behavior—not cursor tricks.

### Primary — Lume Fill

- Ink background
- Paper text
- 8px radius or square editorial variant
- stable label
- optional right-side arrow
- thin lower Lume Line

Hover:

1. Bronze fill reveals horizontally.
2. Arrow translates approximately 4px.
3. Lower line brightens.
4. Label does not bounce or chase the pointer.
5. Duration approximately 320–420ms.

### Secondary — Frame

- transparent/Paper
- Ink border
- Ink text

Hover:

- inner fill reveals from bottom or side
- text transitions to inverse once contrast is safe
- border width remains stable

### Text CTA — Lume Link

Example:

`Explore lighting  ───→`

Hover:

- rule extends 12–20px
- arrow shifts slightly
- no opacity fading that harms readability

### Icon button

- preferred hit area: at least 44×44 CSS px
- visible focus state
- accessible label required

---

## 10. Navigation

### Desktop

- logo/wordmark
- primary categories
- search
- account
- wishlist
- bag

Header states:

1. integrated hero state where contrast permits
2. compact sticky Paper/Canvas state

Nav hover uses Lume Line expansion—not vertical jumping.

### Mobile

- menu
- wordmark
- search/bag
- full-height accessible menu
- focus management

Never squeeze the desktop menu into mobile.

---

## 11. Product Presentation

### Forbidden default

Do not use a generic ecommerce unit consisting of:

- rounded outer card
- rounded image
- title
- price
- button
- shadow

### Product Unit

A Product Unit contains:

1. Object Stage
2. optional index/category marker
3. product name
4. material/category context
5. price
6. optional rating/review summary
7. wishlist control
8. optional contextual quick-add

Desktop hover may use:

- alternate-image crossfade
- 1.02–1.04 image/object scale
- subtle crop shift
- subtle light-temperature change
- mask reveal

Metadata should remain spatially stable.

No critical action may depend on hover.

---

## 12. Collection Modules

Use several reusable compositions instead of a single repeated product grid.

### Shelf
Products share a visual baseline.

### Editorial Pair
Large contextual image + one featured product/object.

### Staggered Objects
Products intentionally occupy different vertical positions.

### Material Study
Close material image + related product + short text.

### Room Feature
Full/large room context with one or more clearly accessible product links.

### Quiet Grid
A conventional grid is allowed where usability demands it, but presentation remains flat, typographic and architectural—not card-heavy.

---

## 13. Product Detail Page

Preferred desktop composition: asymmetric 7/5 or 8/4.

### Media

- progressive gallery or rail
- optimized images
- zoom only when useful
- product video only when useful
- no controls obscuring important detail

### Purchase panel

Contains:

- breadcrumb
- product name
- descriptor
- price
- reviews summary
- variant controls
- quantity
- Add to Bag
- stock state
- **Cash on Delivery availability**
- delivery-area/estimate information when available
- returns summary

There is **no accelerated card/wallet checkout at launch**.

### Below fold

- story
- dimensions
- materials
- care
- delivery/shipping information
- product-in-space media
- styling suggestions
- related products
- recently viewed

---

## 14. Cart & COD Checkout

Cart and checkout are conversion surfaces, not animation showcases.

### Cart drawer

- edge-mounted
- strong product thumbnail
- name/variant
- quantity editing
- price
- remove/undo where practical
- delivery estimate or threshold only when truthful
- subtotal
- Checkout CTA

### COD checkout layout

Preferred desktop structure:

- customer/address form on main plane
- sticky order summary on secondary plane

Mobile:

- linear single-column flow
- order summary collapsible only if fully accessible
- primary order action remains obvious

### Checkout content

Must make clear:

- **Payment method: Cash on Delivery**
- order subtotal
- discount
- delivery fee
- final amount due on delivery
- delivery address
- COD eligibility
- terms/return information where appropriate

### COD trust treatment

Use a clear functional block such as:

**Pay when your order arrives**  
No online payment is collected at checkout.

Do not mimic card-entry UI.
Do not show disabled credit-card logos as decoration.

### Submit behavior

The Place Order control must have:

- idle
- focused
- pending
- success transition
- recoverable error
- duplicate-submit protection

Decorative animation is disabled or minimized on checkout.
Lenis should not interfere with form interaction.

---

## 15. Search & Discovery

Search is a core shopping surface.

Support:

- predictive search
- products
- categories
- editorial content
- recent searches
- keyboard navigation
- no-results suggestions

The search experience should use an architectural full-width plane rather than a tiny floating modal.

---

## 16. Forms

Required:

- persistent labels
- correct input types
- autocomplete attributes
- clear required/optional states
- inline accessible validation
- `aria-describedby` when appropriate
- strong focus treatment
- minimum practical touch target

Do not rely on placeholder-only labeling.

Address forms should optimize real checkout speed and mobile entry.

---

## 17. Notification Design System

Notifications are a real product surface, not merely toasts.

### Notification hierarchy

Use priority levels:

- routine
- important
- urgent

Priority changes iconography, semantic status and ordering—not giant color-filled cards.

### Customer notification center

Preferred structure:

- compact header with unread count
- filter row: All / Unread / Orders / Returns / Account
- chronological list separated by Lume Lines
- icon or small status marker
- title
- concise message
- relative time + accessible exact timestamp
- optional deep-link action

Avoid enclosing every notification in a large rounded card.

Unread state may use:

- small Bronze/Olive marker
- slightly stronger text weight
- subtle Paper surface

Read state remains fully legible.

### CRM notification center

Optimized for operations:

- severity
- event category
- entity reference
- timestamp
- staff state/read state
- direct deep link

Urgent examples:

- high-risk COD verification
- delivery failure
- settlement discrepancy
- failed job/email
- out of stock

### Toasts

Toasts are transient feedback only.
They never replace persisted notifications.

Toast rules:

- concise
- dismissible where appropriate
- no stacking storm
- accessible live-region behavior
- auto-dismiss only when safe

---

## 18. Order Tracking & Customer Status Timeline

Customer order detail should expose a simplified, understandable lifecycle.

Recommended customer-facing steps:

1. Order received
2. Confirmed
3. Processing
4. Packed
5. Shipped
6. Out for delivery
7. Delivered

Exceptions display clearly:

- verification needed
- delivery failed
- cancelled
- return in progress

Do not expose internal COD settlement details to the customer unless useful and appropriate.

Use a vertical timeline on mobile and flexible horizontal/vertical layout on desktop.

---

## 19. CRM Operations Language

The CRM inherits brand DNA while prioritizing speed.

### Avoid

- giant metric cards
- decorative homepage-style animations
- large empty spaces
- repeated rounded panels for every field

### Prefer

- Data Rail
- Metric Strip
- Filter Bar
- Data Table
- Split Workspace
- Inspector Panel
- Activity Timeline
- Status Band
- Command/Search interface

### Order workspace

Recommended desktop pattern:

- order list/table left or full-width base
- contextual inspector/detail plane
- order timeline
- delivery attempts
- verification
- customer context
- operational actions

Actions must have explicit permissions and confirmation where destructive.

---

## 20. COD Operational UI

### Verification

Pending verification is a Warning state.

Verification UI should show:

- reason verification is required
- customer/order context
- attempt history
- note field
- confirm/reject actions
- audit attribution

### Delivery attempts

Each attempt records:

- attempt number
- timestamp
- outcome
- failure reason
- note
- next action

Use timeline rows, not oversized cards.

### RTO

RTO has a distinct operational timeline:

- initiated
- in transit
- received
- inspected
- restocked/damaged/hold outcome

### COD reconciliation

Reconciliation UI must clearly show:

- order reference
- courier/batch if available
- expected amount
- received amount
- difference
- settlement state
- evidence/reference
- reconciled by
- timestamp

Discrepancies use Warning/Error semantics but remain readable and calm.

---

## 21. Inventory UI

Inventory presentation distinguishes:

- On hand
- Reserved
- Available

Never show only one stock number if reservation logic exists.

Inventory ledger rows include:

- timestamp
- SKU/variant
- delta
- reason
- reference
- actor
- resulting balance

Low-stock/out-of-stock states should be visible in both relevant CRM views and notification system.

---

## 22. Status System

Statuses use text + semantic color + optional icon.

Examples:

### Order

- Pending verification → Warning
- Confirmed → Info/Bronze
- Processing → Info
- Packed → Info
- Shipped → Info
- Out for delivery → Info/Olive
- Delivered → Success
- Delivery failed → Error
- Cancelled → Ash/Error

### COD settlement

- Not due → Ash
- Cash expected → Info
- Collected by courier → Warning/Info
- Pending reconciliation → Warning
- Reconciled → Success
- Short received → Error
- Disputed → Error
- Written off → Graphite/Error

### Inventory

- In stock → Success
- Low stock → Warning
- Out of stock → Error

---

## 23. Photography & Art Direction

Preferred characteristics:

- warm directional light
- realistic interiors
- natural materials
- visible texture
- human-scale rooms
- botanical life
- honest shadow
- premium but lived-in composition

Image hierarchy:

1. contextual room
2. isolated Object Stage
3. material detail
4. usage detail
5. scale/reference

Avoid inconsistent grading within a collection.

---

## 24. Motion System

Motion communicates:

- light changing
- depth
- object presence
- editorial pacing
- continuity

It does not communicate novelty for its own sake.

### Ownership

- GSAP + ScrollTrigger → scrub, pin, mask, parallax, scroll timelines
- Lenis → storefront smooth scroll where appropriate
- Motion / Framer Motion → UI state transitions
- SplitType → selected editorial headings
- CSS → ordinary hover/focus transitions

**One property = one animation owner.**

### No kinetic pointer effects

Do not implement:

- magnetic buttons
- mouse-follow buttons
- cursor attraction
- pointer tilt
- spring cursor effects

unless the design system is intentionally revised later.

---

## 25. Scroll Scrub Language

Scrub is a signature House of Lume storytelling tool.

Use for:

- Light Awakening hero
- product-to-room transitions
- material close-up to full-object reveal
- controlled crop motion
- image/type relationship shifts
- background tone transitions

### Soft scrub

Typically `scrub: 0.6–1.2` for parallax and slow visual transitions.

### Direct scrub

Use `scrub: true` only when exact mapping is useful.

### Narrative pin

Allowed when:

- the content genuinely benefits
- duration is controlled
- escape/scroll remains intuitive
- mobile receives a shorter or non-pinned alternative

### Constraints

- prefer transform/opacity/masks
- no layout-property scrubbing
- no huge 3D rotation
- no scroll hijacking
- no hundreds of independent triggers in product lists
- clean up triggers on unmount/navigation
- refresh correctly after responsive/media changes

---

## 26. Signature Motion Sequences

### Light Awakening Hero

As scroll progresses:

- room begins subdued
- practical lamp/light warms naturally
- foreground exposure changes subtly
- headline composition resolves into stable state
- shopping CTA remains available

### Object Reveal

- crop opens
- object moves a few percent
- Lume Line reveals
- metadata remains readable

### Material Transition

Material macro image transitions to full product through clipping/masking.

### Dark-to-Warm Chapter

Ink/evening visual state transitions into warm Canvas/room state around featured lighting.

---

## 27. Responsive Motion

### Desktop

Full editorial motion within performance budget.

### Tablet

Reduce:

- pin duration
- layer count
- travel distance

### Mobile

Prefer:

- native scroll
- short reveal
- minimal scale
- no long pinned sequences
- no heavy blur animation

Mobile is composed intentionally, not created by shrinking desktop.

---

## 28. Reduced Motion

When `prefers-reduced-motion: reduce`:

- Lenis disabled
- scrub replaced with stable final state or short fade
- parallax disabled
- decorative SplitType sequences disabled
- route transitions simplified/skipped

No information or functionality may be lost.

---

## 29. Accessibility Contract

Target WCAG 2.2 AA minimum.

Required:

- semantic landmarks
- logical headings
- skip link
- keyboard-complete interaction
- visible focus
- sticky UI does not obscure focus
- accessible dialogs/menus
- correct labels/errors
- meaningful image alternatives
- sufficient contrast
- reflow/zoom resilience
- suitable pointer targets
- reduced-motion behavior
- no hover-only actions
- no drag-only functionality
- accessible status/live-region behavior for async order/cart updates

Accessibility is part of completion, not polish.

---

## 30. Performance Contract

Targets at p75:

- LCP ≤ 2.5s
- INP ≤ 200ms
- CLS ≤ 0.1

Required practices:

- optimized responsive images
- correct media dimensions/aspect ratio
- deliberate LCP image priority
- lazy loading below fold
- minimal client JS
- dynamic import for heavy optional animation
- no uncontrolled scroll listeners
- transform/opacity animation
- font optimization
- minimize third-party scripts
- database query review where UI depends on data

Test on representative mobile hardware, not desktop only.

---

## 31. CSS & Styling Architecture

### Non-negotiable

**No inline styles for normal design implementation.**

Do not use React `style={{...}}` or HTML `style="..."` as routine styling.

Use:

- Tailwind CSS
- semantic CSS variables/tokens
- CVA/component variants
- CSS Modules for complex art-directed pieces
- global base/token styles

### Duplication rule

If the same visual pattern appears repeatedly:

1. extract a reusable component, or
2. create a component variant, or
3. create a semantic utility/token.

Do not create differently named classes with materially identical declarations.

---

## 32. Component Language

### Primitives

- Button / LumeButton
- IconButton
- Link / LumeLink
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

### Commerce

- ProductStage
- ProductUnit
- ProductGallery
- VariantSelector
- QuantityControl
- AddToBag
- CartLine
- CartDrawer
- CollectionShelf
- SearchOverlay
- ReviewSummary
- OrderStatusTimeline

### Editorial

- LumeHero
- LumeLine
- SplitPlane
- CropWindow
- EditorialChapter
- MaterialStory
- RoomStory

### Operations / CRM

- DataRail
- MetricStrip
- FilterBar
- DataTable
- InspectorPanel
- ActivityTimeline
- NotificationCenter
- NotificationRow
- VerificationPanel
- DeliveryAttemptTimeline
- RtoTimeline
- CodSettlementPanel
- InventoryLedger

---

## 33. Responsive Principles

Storefront priorities on mobile:

1. discovery
2. search
3. product imagery
4. price/variants
5. Add to Bag
6. COD checkout
7. order status/account

CRM priorities on smaller screens:

1. search/filter
2. entity identity/status
3. primary operational action
4. timeline/details

Avoid horizontal overflow unless the component intentionally provides an accessible scroll region.

---

## 34. Production Design Definition of Done

A page is not design-complete because it resembles a screenshot.

It is complete only when applicable items are verified:

- visual language follows Luminous Domesticity
- typography/tokens correct
- no generic card drift
- Lume Controls used correctly
- COD information is truthful and unambiguous
- notifications/statuses use the defined hierarchy
- desktop/tablet/mobile compositions intentional
- hover/focus/active/disabled/pending states exist
- scrub motion is meaningful and smooth
- reduced-motion fallback works
- no inline styling
- no duplicated styling system
- accessibility behavior works
- product imagery is consistent
- loading/empty/error states exist
- core commerce actions are immediate
- no obvious layout shift
- performance budget respected

---

## 35. Final Design Rule

When choosing between:

- decoration vs better object presentation → choose the object
- more animation vs better interaction → choose interaction
- trend vs identity → choose identity
- generic card vs composition → choose composition
- extra JS vs stable platform capability → choose the platform
- desktop spectacle vs mobile reliability → choose reliability
- decorative checkout vs COD clarity → choose clarity
- pretty status UI vs operational truth → choose truth

House of Lume should be memorable because **light, material, composition, typography, motion and operational precision form one coherent system**.

---

**House of Lume Design System v2.1 — Production Baseline**