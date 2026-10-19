# Part 3 — Storefront cleanup

Date: 19 October 2026. Starting commit: `2f6ee26fb7d430ad6bfb91443b83954546392564`. Scope: remove agreed optional/development presentation and unused code while preserving implemented shopping and owner operations. This is maintenance Part 3; original build Phase 3 is a separate historical milestone.

## Checklist

- [x] Read engineering, brand, design and project instructions; recover the agreed cleanup scope.
- [x] Preserve the one-owner access model and existing commerce data/contracts.
- [x] Remove public `/system` and its exclusive design-showcase/demo subtree.
- [x] Remove inactive newsletter capture and House Notes journal preview.
- [x] Keep the accepted hero, category/product shelf, room/material/service scenes, closing composition and footer.
- [x] Replace the disabled closing signup with a working catalogue link; make room/material actions open the catalogue.
- [x] Fix hero actions that pointed to missing `#shop`/`#collection` anchors. Slides now link to existing catalogue/category/collection destinations or real homepage sections.
- [x] Replace inactive room-tab styling with an honest static inspiration caption and remove noninteractive room-item navigation arrows.
- [x] Remove optional product rating presentation, aggregate-rating markup, payload fields and the review query; preserve Product/Offer metadata, images, price, stock and variants.
- [x] Remove new marketing/product opt-in controls and duplicate account-settings form; preserve withdrawal of existing optional consent.
- [x] Preserve essential customer/owner notices, recipient ownership, private APIs, immutable retries and live-session guards.
- [x] Remove confirmed unused helpers, styles, imports and showcase-only UI exports; preserve shared controls used by shopping/account/admin pages.
- [x] Review package/asset dependencies; preserve all required animation libraries, product WebPs, approved logo and email logo.
- [x] Update active architecture/project/design documentation without rewriting historical audits.
- [x] Complete local browser, visual, build and release gates before the one final production push.

## Removal and preservation map

| Area | Change | Preserved |
| --- | --- | --- |
| Development showcase | Delete `/system`, interactive/form/scroll samples, sample editorial art/components, showcase CSS and exclusive motion wrappers/status/radio/tab/accordion/empty-state helpers | Working search/product dialogs, navigation/cart drawers, toast feedback, used form fields and all runtime animation packages |
| Homepage | Remove House Notes articles and disabled newsletter/offers shell; remove their exclusive selectors | Brand palette/logo/type, hero/category/product presentation, room/material/service imagery and motion, closing composition/footer |
| Inactive affordances | Room/material/closing actions use `/shop`; room caption is static and room-item arrows are removed | Real navigation and core discovery/search/filters/sort/pagination |
| Product reviews | Remove star/empty-review summary, `reviewSummary` payload/type/fixture fields, aggregate-rating JSON-LD and approved-review lookup | Product/Offer JSON-LD, canonical/OpenGraph metadata, media, variants, inventory, price, COD/delivery facts, quantity, bag, wishlist, related/recent products |
| Optional marketing | Remove new opt-ins and the duplicate marketing account form | Existing preference data and guarded compatibility APIs; customers with prior consent can set both optional flags to false; essential notices stay enabled |
| Generic scaffolding | Delete unused result/validation/logger modules and the result helper's obsolete tests | Domain Zod schemas, service errors, Next.js error boundaries and generated database types |

No database migration, SQL write, Auth configuration change, data deletion, new email, real order or checkout enablement is part of this work. Reviews have no records at preflight; their table/policies/history remain intact. One account has saved optional consent, so removing every withdrawal path would break existing functionality. The UI therefore retains a withdrawal-only screen on the existing URL and API. No consent is changed automatically.

## Dependency audit

A source import graph rooted at Next.js route/layout/error/loading handlers and the proxy was recorded before and after cleanup. Removed helper modules were reachable only through the deleted showcase or through other unused helpers/tests. The remaining graph has no orphaned application module except intentionally retained `src/lib/supabase/database.types.ts`. This generated contract must not be deleted simply because clients currently validate domain results separately.

A CSS-module selector/reference scan found no unreferenced module class after cleanup. Shared overlay/form selectors were pruned by selector group so live drawer/dialog/field rules remain. The unused global showcase width utility is removed; design tokens are preserved. No application dependency or lockfile change is made: all runtime packages still have real callers. All six public assets remain required by application, email, fixture or live catalogue references.

## Hero reliability correction

Browser verification reproduced the existing motion-preference race noted during baseline: a transition can be interrupted after it hides split words/supporting text. Killing its timeline and showing the parent does not restore those child styles. Two systems also targeted the same hero text: the hero and the homepage editorial animation.

The hero now exclusively owns its text animation. On a motion-mode change it reverts its text splits and clears interrupted text/filter state before displaying the selected slide. A dedicated browser test changes to reduced motion mid-transition and checks that title, action and settled state remain visible. The visual language and slide controls remain the same. The new link audit also found that all hero actions used missing `#shop`/`#collection` anchors. Each slide now has an explicit existing destination; the dining scene’s shop label is changed to décor to match its real destination.

## Quality and release gates

- Formatting, lint and TypeScript pass against the final source. Production build passes on Node 24.21.0 with the existing isolated CI environment; `/system` is absent from its route manifest.
- **196 application tests across 30 files pass.** The two deleted tests belonged solely to the removed unused generic result helper.
- **104 browser tests pass**, including full storefront/account/cart/wishlist/checkout/notification/admin regression coverage. New checks verify `/system` returns 404, the homepage has no newsletter/journal preview or missing internal anchor, the closing action opens `/shop`, ratings are absent while Product/Offer data and purchase controls remain, consent can be withdrawn, uncertain withdrawal retries identical off-values, and motion changes mid-transition retain selected content. The motion regression also returns to the previous slide and checks that an interrupted blur was cleared.
- The earlier test pass exposed a duplicate broad link selector, an existing hidden-text motion race and missing hero anchor destinations. The selector was scoped to its shelf and the two real storefront bugs were corrected before release. No test failure was dismissed as a pass.
- Supported homepage widths include 320, 375, 430, 768, 1024, 1440 and 1920px; existing affected operational and product tests add keyboard, focus, reduced-motion and reflow coverage. The closing section was inspected visually; external imagery could not be verified because Cloudinary DNS fails in this environment.
- A local Turbopack persistence cache failed to reopen once. Removing only that generated cache restored a clean build; no source/dependency workaround was introduced.
- Production dependency audit reports **zero vulnerabilities**. Dependency manifests/lockfile, all six public assets and all SQL migrations are unchanged.
- Final read-only Supabase comparison: five products, two customers, zero orders, zero reviews, one saved optional consent, one owner, 41 migrations, checkout disabled. No production data/consent/Auth configuration was changed.
- Import and CSS audits were recomputed after removal: generated database types are intentionally retained; no other unreachable source module or unreferenced CSS-module class was found.

The release uses exactly one final main update after these local checks. CI, production deployment SHA and canonical route checks are verified after that update and reported in chat; this pre-push audit does not predict their outcome. The preceding production deployment is `dpl_7pQcTiExpos9dydiFjEkYKDYXxbT` on commit `2f6ee26`. Because this part changes no schema or stored contract, reverting application code to that commit requires no database restore.

## Existing limits and separate Part 4 scope

Checkout remains closed under its existing launch gate. Real-product/order acceptance, real inbox/password-recovery acceptance, full production observability, field Core Web Vitals and external-media visual verification are not established by local fixtures. Cloudinary DNS failures in this execution environment are carried forward from the baseline; do not describe a noisy image-test runtime as entirely clean. Production runtime-log access previously returned 403, so absent log evidence is not a clean-log claim. Part 4 remains a separate final verification task.
