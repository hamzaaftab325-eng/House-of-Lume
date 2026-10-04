# House of Lume — Design System

**Status:** Finalized  
**Version:** 1.0  
**Brand direction:** Warm Editorial  
**Applies to:** Customer storefront, ecommerce flows, account area, and internal CRM/admin

---

## 1. Brand Direction

House of Lume is a premium home-living brand focused on:

- Lighting
- Indoor plants
- Planters
- Decorative objects
- Candles
- Mirrors
- Small furniture and future home categories

The visual identity should feel **warm, editorial, tactile, calm, and considered**.

The store must not look like a generic ecommerce template. Product photography, whitespace, typography, natural materials, and subtle motion should carry the experience.

### Brand keywords

- Warm
- Calm
- Tactile
- Natural
- Editorial
- Refined
- Human
- Modern
- Atmospheric
- Premium

### Avoid

- Neon colors
- Generic SaaS gradients
- Excessive glassmorphism
- Over-rounded "app" styling on the storefront
- Heavy shadows everywhere
- Constant animation
- Decorative motion that interferes with shopping
- Artificial luxury such as excessive gold
- Overly dark pages outside intentional editorial moments

---

## 2. Core Visual System

### Primary palette

| Token | Hex | Usage |
|---|---|---|
| Background | `#F4EFE6` | Main page background |
| Surface | `#FFFAF2` | Cards, panels, menus |
| Soft Surface | `#E9DFD0` | Secondary sections, image backdrops |
| Ink | `#211F1B` | Primary text, primary buttons |
| Muted Ink | `#716A60` | Secondary text |
| Lume Brown | `#8B6D45` | Primary brand accent |
| Botanical | `#64745A` | Secondary accent for plants/natural content |
| Warm White | `#FFFAF2` | Inverse text |
| Error | `#A94738` | Error/destructive states |
| Success | `#536C4D` | Success/confirmed states |
| Warning | `#A77A35` | Warning/pending states |

### CSS tokens

```css
:root {
  --color-bg: #F4EFE6;
  --color-surface: #FFFAF2;
  --color-surface-soft: #E9DFD0;

  --color-text: #211F1B;
  --color-text-muted: #716A60;

  --color-brand: #8B6D45;
  --color-botanical: #64745A;

  --color-success: #536C4D;
  --color-warning: #A77A35;
  --color-error: #A94738;

  --color-border: rgba(33, 31, 27, 0.14);
  --color-border-strong: rgba(33, 31, 27, 0.28);
}
```

### Color usage rules

1. Cream is the default canvas.
2. Ink is the primary content color.
3. Lume Brown is the main CTA/accent color.
4. Botanical green is a secondary accent, not a competing primary color.
5. Use dark full-width sections sparingly for campaign/editorial contrast.
6. Never rely on color alone to communicate status.

---

## 3. Typography

### Display typeface

**Cormorant Garamond**

Use for:

- Hero headlines
- Campaign statements
- Collection titles
- Editorial sections
- Selected large numbers

Do not use for:

- Form labels
- Navigation
- Product specifications
- CRM data tables
- Small interface text

### UI and body typeface

**Manrope**

Use for:

- Navigation
- Body copy
- Product information
- Buttons
- Forms
- Filters
- Cart
- Checkout
- Account pages
- CRM/admin interface

### Type scale

| Style | Desktop | Tablet | Mobile | Line height |
|---|---:|---:|---:|---:|
| Display XL | 112px | 84px | 58px | 0.90–0.96 |
| Display L | 80px | 64px | 46px | 0.95–1.00 |
| H1 | 64px | 52px | 40px | 1.00 |
| H2 | 48px | 42px | 34px | 1.05 |
| H3 | 32px | 30px | 27px | 1.10 |
| H4 | 24px | 23px | 22px | 1.20 |
| Body L | 18px | 18px | 17px | 1.70 |
| Body | 16px | 16px | 16px | 1.65 |
| Small | 14px | 14px | 14px | 1.55 |
| Caption | 12px | 12px | 12px | 1.45 |

### Typography rules

- Display headings may use `letter-spacing: -0.03em` to `-0.04em`.
- UI text should remain neutral, not overly tracked.
- Eyebrows use uppercase Manrope with `0.12em–0.18em` tracking.
- Product names should prioritize readability over decorative typography.
- Never use more than two typefaces in the product.

---

## 4. Spacing System

Use a consistent 4px base grid.

```text
4   = micro
8   = xs
12  = sm
16  = md
20  = md+
24  = lg
32  = xl
40  = 2xl
48  = 3xl
64  = 4xl
80  = 5xl
96  = 6xl
128 = editorial
```

### Section spacing

Desktop:
- Standard section: 96–128px vertical
- Editorial hero: 120–160px
- Compact commerce section: 72–96px

Tablet:
- 72–96px

Mobile:
- 56–72px

Whitespace should be treated as an intentional brand element.

---

## 5. Layout

### Main container

```css
--container-max: 1280px;
--page-gutter-desktop: 40px;
--page-gutter-tablet: 28px;
--page-gutter-mobile: 20px;
```

For editorial hero sections, selected media can extend beyond the core content container.

### Grid

Desktop:
- 12-column grid

Tablet:
- 8-column grid

Mobile:
- 4-column grid

### Breakpoints

```text
Mobile: < 640px
Large Mobile: 640–767px
Tablet: 768–1023px
Desktop: 1024–1439px
Wide: 1440px+
```

Design fluidly between breakpoints; do not build five separate layouts.

---

## 6. Radius

Storefront should be softly rounded, not "bubble UI".

```css
--radius-xs: 6px;
--radius-sm: 10px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 32px;
--radius-pill: 999px;
```

Usage:

- Inputs: 10–12px
- Product images: 12–18px
- Cards: 16–24px
- Editorial media: 20–32px
- Buttons: pill or 10–12px depending on context
- CRM panels: 12–16px

---

## 7. Borders and Shadows

Prefer borders and spacing over heavy shadows.

### Border

```css
border: 1px solid rgba(33, 31, 27, 0.14);
```

### Primary floating shadow

```css
box-shadow: 0 24px 70px rgba(44, 35, 24, 0.12);
```

### Small UI shadow

```css
box-shadow: 0 8px 24px rgba(44, 35, 24, 0.08);
```

Use shadows mainly for:

- Cart drawer
- Menus
- Floating filters
- Modals
- Selected editorial cards

---

## 8. Buttons

### Primary

- Background: Ink
- Text: Warm White
- Border: Ink
- Preferred shape: pill
- Minimum height: 46px desktop / 48px mobile

### Brand CTA

- Background: Lume Brown
- Text: white
- Use for selected purchase/commit actions

### Secondary

- Transparent or Surface
- Ink border
- Ink text

### Text action

For links such as:

- View collection
- Discover lighting
- Read journal

Use a text label plus subtle directional icon/line.

### Interaction

Hover:
- Small `translateY(-2px)`
- Smooth background transition
- Optional arrow translation

Tap:
- Clear pressed state
- No animation delay before action

Focus:
- Visible keyboard focus ring

---

## 9. Navigation

### Storefront header

Desktop:
- Brand/logo left
- Collections/navigation centered or balanced
- Search, account, wishlist, cart right
- 72–80px height

Mobile:
- Menu
- Logo
- Search/cart
- Keep interface simple

Header behavior:
- Transparent over selected hero layouts
- Changes to cream/surface on scroll
- Never use distracting scroll-hide behavior during checkout

### Mega menu

Can include:

- Shop by category
- Featured collection
- Editorial image
- New arrivals
- Best sellers

Motion must remain subtle and quick.

---

## 10. Product Cards

Every card must prioritize:

1. Product photography
2. Product name
3. Category/variant context
4. Price
5. Relevant badge
6. Wishlist action

Optional:
- Quick add
- Alternate image on hover

### Product image ratio

Recommended:
- 4:5 default
- 1:1 for selected collections
- Avoid inconsistent ratios in the same grid

### Hover behavior

Desktop:
- Image scale 1.02–1.04
- Secondary image reveal when available
- Quick actions appear softly

Mobile:
- No hover-dependent functionality

---

## 11. Product Detail Page

Recommended structure:

1. Image/gallery area
2. Product title
3. Price
4. Rating/reviews
5. Short product story
6. Variants
7. Quantity
8. Add to cart
9. Buy now if enabled
10. Shipping/returns
11. Dimensions/materials/care
12. Accordion details
13. Styling/editorial imagery
14. Related products
15. Recently viewed

Sticky purchase information may be used on desktop if it improves usability.

---

## 12. Collection Pages

Collection pages should feel editorial, not like database output.

Include:

- Collection title
- Short narrative
- Optional hero image
- Product count
- Sort
- Filter
- Responsive product grid

Filters:
- Category
- Price
- Color
- Material
- Size
- Availability

Use an off-canvas filter drawer on mobile.

---

## 13. Cart and Checkout

### Cart

Use a drawer for quick access and a full cart page for deeper editing.

Cart drawer must include:

- Product image
- Product name
- Variant
- Quantity
- Price
- Remove
- Subtotal
- Checkout CTA

### Checkout

Checkout is functional UI first.

Reduce:
- Animation
- Decorative sections
- Navigation choices

Maximize:
- Trust
- Legibility
- Speed
- Error clarity
- Mobile ergonomics

---

## 14. Forms

Inputs:

- Minimum 48px touch height
- Warm Surface or transparent background
- Clear border
- Persistent labels where possible
- Inline validation
- Strong focus state

Never use placeholder-only forms for important information.

Error messages:
- Explain the issue
- Tell the user how to fix it

---

## 15. Imagery

Photography is central to House of Lume.

### Preferred imagery

- Warm natural light
- Evening lamp glow
- Natural wood
- Linen
- Ceramic
- Stone
- Greenery
- Real lived-in spaces
- Strong close-up material shots

### Avoid

- Generic white-background stock images as primary campaign content
- Overly staged luxury
- Blue/cold commercial lighting
- Artificial HDR
- Inconsistent color grading

### Art direction

Hero photography should contain enough negative space for editorial typography when text overlays are used.

---

## 16. Iconography

Use **Lucide React** for UI icons.

Rules:

- Stroke icons only for core UI
- Consistent stroke weight
- 18–22px standard UI size
- 24px for large actions
- Never mix unrelated icon families

Decorative brand illustrations can be custom assets and do not need to follow Lucide styling.

---

## 17. Motion System

Motion should make the brand feel tactile and composed.

### Ownership

```text
GSAP + ScrollTrigger
→ Scroll choreography
→ Pinned storytelling
→ Image reveals
→ Parallax
→ Editorial transitions
→ Complex timelines

Lenis
→ Smooth scroll interpolation
→ Synchronized with ScrollTrigger

Framer Motion / Motion
→ React state changes
→ Cart drawer
→ Filters
→ Modals
→ Accordions
→ Route transitions
→ Shared layout transitions

SplitType
→ Selected hero and editorial typography reveals

CSS
→ Basic hover/focus states
→ Small transitions
```

### Critical rule

Do not let GSAP, Motion, and CSS transitions animate the same transform property on the same element at the same time.

### Durations

```text
Micro interaction: 160–240ms
Component reveal: 300–500ms
Page/section reveal: 600–900ms
Editorial hero sequence: 900–1400ms
Scroll animation: driven by ScrollTrigger progress
```

### Ease

Primary:
```text
cubic-bezier(0.2, 0.8, 0.2, 1)
```

GSAP:
```text
power3.out
power4.out
sine.inOut
```

Avoid bounce-heavy easing for premium storefront UI.

---

## 18. Scroll Motion Rules

Allowed:

- Subtle image parallax
- Mask reveals
- Text line reveals
- Product detail transitions
- Pinned campaign storytelling
- Horizontal editorial feature sections
- Controlled scale effects
- Background color transitions

Avoid:

- Constant horizontal drift
- Excessive rotation
- Huge scroll speed differences
- Scroll-jacking
- Mobile effects that cause jank
- Animating every section

The user must always feel in control of scroll.

---

## 19. Hero Direction

Default House of Lume hero should feel cinematic and calm.

Potential composition:

```text
HOUSE OF LUME

Objects for
a warmer home.

Considered lighting, greenery and objects
for rooms that feel lived in.

[Explore Collection]  [Our Story]
```

Hero imagery:
- Warm interior
- Visible lighting
- Natural material
- Plant presence where possible

Desktop can use more advanced composition and scroll motion.

Mobile must remain clear, fast, and readable.

---

## 20. Editorial Storytelling

Use storytelling to differentiate House of Lume from marketplace-style ecommerce.

Possible stories:

- The art of warm light
- Living with green
- Objects made to stay
- Material stories
- Rooms after dark
- How to layer lighting
- Small-space plant styling

Editorial content should connect naturally to purchasable products.

---

## 21. CRM / Admin Design

The CRM uses the same brand DNA but is more functional.

### CRM palette

Use:
- Surface white/cream
- Ink text
- Lume Brown for primary selected states
- Botanical for selected positive/natural categories

Avoid large decorative imagery inside the operational dashboard.

### CRM layout

Desktop:
- Left navigation
- Top utility bar
- Main workspace
- Optional right contextual panel

Core screens:

- Dashboard
- Orders
- Customers
- Products
- Inventory
- Collections
- Abandoned carts
- Discounts
- Marketing
- Reviews
- Returns
- Analytics
- Staff
- Settings

### CRM component behavior

Tables:
- Dense but readable
- Sticky headers for long tables
- Sorting
- Filters
- Search
- Pagination or virtualization

Status chips:
- Small
- Semantic
- Text + color

Cards:
- Lower radius than storefront
- Less decorative
- Minimal motion

---

## 22. Status System

### Order

- Pending → Warning
- Paid → Success
- Processing → Brand
- Shipped → Botanical
- Delivered → Success
- Cancelled → Muted/Error
- Refunded → Muted/Warning

### Inventory

- In stock → Success
- Low stock → Warning
- Out of stock → Error

Never represent status by color alone.

---

## 23. Data Visualization

CRM charts should be simple and legible.

Use:
- Ink
- Lume Brown
- Botanical
- Muted neutral tones

Avoid rainbow chart palettes.

Recommended charts:

- Revenue trend
- Orders trend
- Average order value
- Customer acquisition
- Repeat customer rate
- Abandoned cart recovery
- Product/category performance
- Inventory risk

---

## 24. Accessibility

Minimum target: **WCAG 2.2 AA**.

Requirements:

- Semantic HTML
- Keyboard-accessible navigation
- Visible focus states
- Form labels
- Error messaging
- Sufficient contrast
- Accessible names for icon buttons
- Alt text for meaningful imagery
- Decorative imagery ignored by assistive technology
- Dialog focus trapping
- Escape-to-close where appropriate
- Minimum 44×44 interactive touch targets where possible

### Reduced motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Reduced-motion users should receive:

- No smooth-scroll interpolation
- No large parallax
- No decorative text splitting
- Short fades only where useful

Commerce functionality must never depend on animation.

---

## 25. Performance Rules

Visual quality cannot compromise shopping performance.

### Required practices

- Next.js image optimization
- Responsive `srcset`
- AVIF/WebP where appropriate
- Lazy load below-the-fold media
- Preload only true critical assets
- Local/self-hosted fonts where appropriate in production
- Use transform/opacity for animation
- Avoid layout-triggering scroll animation
- Dynamically load heavy non-critical libraries
- Keep animation work off inactive/offscreen elements
- Avoid unnecessary video autoplay on mobile

### Targets

Aim for:

- LCP ≤ 2.5s
- CLS ≤ 0.1
- INP ≤ 200ms

Performance budgets will be validated on real mobile hardware, not desktop only.

---

## 26. Responsive Principles

Desktop is not simply scaled down for mobile.

### Mobile priorities

1. Product discovery
2. Search
3. Product media
4. Price/options
5. Add to cart
6. Checkout
7. Account/orders

Reduce complex storytelling motion on smaller devices.

Use native-feeling touch scrolling.

Avoid:
- fixed full-screen effects that trap users
- tiny controls
- hover-only information
- extremely tall pinned sections
- large decorative gaps

---

## 27. Technology Alignment

Final application stack:

```text
Framework       Next.js
UI              React
Language        TypeScript / TSX
Styling         Tailwind CSS + CSS variables
Scroll motion   GSAP + ScrollTrigger
Smooth scroll   Lenis
UI motion       Framer Motion / Motion
Text motion     SplitType
Icons           Lucide React
Forms           React Hook Form + Zod
Database        Supabase PostgreSQL
Authentication  Supabase Auth
Storage         Supabase Storage
Security        Supabase RLS
Payments        Stripe
Email           Resend
Hosting         Vercel
Repository      GitHub
```

---

## 28. Design Token Naming

Use semantic tokens rather than hard-coded colors inside components.

Example:

```ts
const tokens = {
  color: {
    background: "#F4EFE6",
    surface: "#FFFAF2",
    surfaceSoft: "#E9DFD0",
    text: "#211F1B",
    textMuted: "#716A60",
    brand: "#8B6D45",
    botanical: "#64745A",
    success: "#536C4D",
    warning: "#A77A35",
    error: "#A94738",
  },
};
```

Prefer:

```tsx
className="bg-background text-foreground"
```

over:

```tsx
className="bg-[#F4EFE6] text-[#211F1B]"
```

when building the production application.

---

## 29. Component Principle

Every production component should be:

- Reusable
- Responsive
- Accessible
- Token-driven
- Keyboard-friendly where interactive
- Animation-safe
- Compatible with reduced motion
- Tested with real content lengths

Avoid one-off styling unless the element is intentionally editorial.

---

## 30. Brand Consistency Rule

The official House of Lume design direction is:

> **Warm Editorial with a restrained Botanical accent.**

All future design decisions should support this direction unless the design system itself is intentionally revised.

When there is tension between "more animation" and "better commerce usability", choose usability.

When there is tension between "more decoration" and "stronger product presentation", choose the product.

When there is tension between trendiness and longevity, choose longevity.

---

## 31. Design Approval Baseline

Before any page is considered design-complete, verify:

- Correct typography
- Correct color tokens
- Correct spacing scale
- Consistent radius
- Consistent button hierarchy
- Responsive behavior
- Accessible interaction states
- Mobile touch usability
- Reduced-motion handling
- Smooth but restrained animation
- Product photography consistency
- No generic template sections
- No unnecessary visual effects
- Storefront and CRM share the same brand DNA

---

**House of Lume Design System v1.0 — Finalized**
