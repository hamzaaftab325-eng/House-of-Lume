# House of Lume — Phase 3 Homepage

## Source direction

The production homepage uses the approved **bright editorial-gallery concept** selected from the five new House of Lume visual directions. The design is intentionally different from the previous cinematic/torn-paper direction.

The homepage now uses:

- a mineral/off-white gallery canvas
- an object-led hero instead of a full-room hero
- a restrained cobalt accent
- asymmetric rectangular bento compositions
- editorial product stages rather than generic cards
- a House Edit / Editors' Picks shelf
- real-space inspiration
- a Material Archive
- a quiet service rail
- a light newsletter composition

The visual source is treated as art direction rather than production code. Fake product prices, ratings, stock claims, scarcity and customer counts from concept imagery are not copied into the application.

## Commerce integrity

The connected production catalogue currently contains no published product records. Phase 3 therefore renders the Editors' Picks area as a clearly labelled editorial preview. It does not invent purchasable inventory or prices. The visual shelf is structured so real catalogue ProductUnits can replace the editorial preview once catalogue data is published in the commerce phases.

## Existing design system

Phase 3 continues to use the Phase 2 production foundation:

- Cormorant Garamond display typography
- Manrope interface typography
- Lume Line principles
- rectangular Crop Windows
- Object Stage thinking
- GSAP + ScrollTrigger ownership for scroll choreography
- Lenis storefront scrolling where enabled
- Motion for UI overlays
- reduced-motion support

The reusable `TornDivider` component remains available in the design system but is not used by this homepage direction because the selected concept is based on clean architectural edges rather than torn-paper transitions.

## Production assets

Homepage imagery remains stored locally under `public/images/house-of-lume/` as optimized WebP assets. Runtime pages do not depend on temporary generation URLs or third-party stock-image hosts.

## Newsletter

The homepage newsletter persists to `public.newsletter_subscribers` through the existing validated server action. Email addresses are normalized, duplicate submissions are handled idempotently, and the honeypot field remains in place for lightweight abuse protection.

## SEO

The homepage provides route metadata, canonical URL, Open Graph data, Organization/WebSite JSON-LD, `robots.txt`, and `sitemap.xml`. Copy naturally describes House of Lume lighting, plants, home decor, Pakistan-wide delivery and Cash on Delivery without keyword stuffing or unsupported claims.

## Motion and responsive behavior

Desktop motion is deliberately restrained: hero-copy entrance, staged object entrance, crop-window reveals, photographic drift and short section reveals. Mobile uses shorter entrance reveals and native scrolling. Reduced-motion users receive static content without scroll choreography.

Required responsive verification covers 320, 375, 430, 768, 1024, 1440 and 1920 widths plus existing design-system/account/CRM regression routes.

## Completion gate

Phase 3 is complete only when:

- formatting passes
- lint passes
- strict TypeScript passes
- unit tests pass
- production build passes
- Playwright E2E passes
- responsive horizontal-overflow checks pass
- reduced-motion and keyboard regressions pass
- Supabase security checks relevant to existing Phase 3 data remain clear
- the final production commit receives successful CI and deployment status

Until those gates are green, Phase 3 must not be reported as 100% complete.
