# House of Lume — Phase 3 Homepage

## Approved direction

The production homepage follows the approved dark cinematic House of Lume visual: an integrated hero/header, cream arched category plane, staged dark collection preview, full-width “Spaces with Soul” story, split craftsmanship chapter, service rail, scenic newsletter and compact dark footer.

## Production assets

All final homepage imagery is stored locally under `public/images/house-of-lume/` as optimized WebP assets. Runtime pages do not depend on temporary generation URLs.

## Commerce integrity

The production catalogue currently has no published products. Phase 3 therefore presents the featured area as an editorial collection preview and does not invent purchasable inventory or pricing. Live product cards and prices will be connected when published catalogue data exists in the appropriate commerce phase.

## Newsletter

The homepage newsletter persists to `public.newsletter_subscribers`. Storefront roles receive insert-only access through RLS and cannot read subscriber records. Duplicate email addresses are protected by a unique index.

## SEO

The homepage provides route metadata, canonical URL, Open Graph data, Organization/WebSite JSON-LD, `robots.txt`, and `sitemap.xml`.

## Motion and responsive behavior

Desktop uses restrained GSAP/ScrollTrigger reveals, photographic drift and hero parallax. Mobile uses short entrance reveals and native scrolling. Reduced-motion users receive static content without scroll choreography.

## Verification target

Phase 3 is complete only when formatting, lint, TypeScript, unit tests, production build and Playwright E2E all pass on the final commit, including horizontal-overflow checks from 320px through 1920px.
