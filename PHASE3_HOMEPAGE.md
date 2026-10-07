# House of Lume — Phase 3 Homepage

## Source direction

The production homepage is based on the user-supplied `v18 integrated section tears` homepage reference. The implementation preserves its strongest ideas—cinematic House of Lume imagery, an integrated hero/header, warm green/cream material planes, editorial category discovery, room storytelling, craftsmanship, service information, newsletter and torn paper transitions—while converting the prototype into reusable Next.js production components.

The uploaded prototype is treated as visual direction rather than production code. Prototype-only fake cart, wishlist, ratings, product counts, prices and newsletter JavaScript are not copied into the application.

## Torn divider system

`TornDivider` is a reusable editorial component with `fine`, `wide` and `rough` variants and top/bottom placement. It uses pure-white SVG edges with no gray stroke, blur or shadow, matching the approved torn-paper treatment while avoiding duplicated section-specific CSS.

The component is used across multiple homepage transitions so the torn edge becomes a deliberate House of Lume visual signature rather than a one-off decoration.

## Production assets

Homepage imagery is stored locally under `public/images/house-of-lume/` as optimized WebP assets. Runtime pages do not depend on temporary generation URLs or third-party stock-image hosts.

## Commerce integrity

The connected production catalogue currently has no published products. Phase 3 therefore presents the featured area as a clearly labelled editorial House Edit and does not invent purchasable inventory, prices, review counts or scarcity. Live product units will connect when published catalogue data exists in the catalogue/product phases.

## Newsletter

The homepage newsletter persists to `public.newsletter_subscribers` through a validated server action. Email addresses are normalized to lowercase, duplicate submissions are handled idempotently, and a honeypot field provides a lightweight spam control.

Storefront `anon` and `authenticated` roles receive `INSERT` only through RLS and cannot publicly select, update or delete subscriber records.

## SEO

The homepage provides route metadata, canonical URL, Open Graph data, Organization/WebSite JSON-LD, `robots.txt`, and `sitemap.xml`. Copy naturally describes House of Lume lighting, living plants, home decor, Pakistan-wide delivery and Cash on Delivery without keyword stuffing or unsupported commercial claims.

## Motion and responsive behavior

Desktop uses restrained GSAP/ScrollTrigger reveals, crop-window image reveals, photographic drift and hero parallax. Mobile uses short entrance reveals and native scrolling. Reduced-motion users receive static content without scroll choreography.

Required responsive verification covers 320, 375, 430, 768, 1024, 1440 and 1920 widths plus the existing design-system/account/CRM regression routes.

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
- the Supabase security advisor reports no actionable findings
- the final `main` commit receives successful CI and deployment status

Until those gates are green, Phase 3 must not be reported as 100% complete.
