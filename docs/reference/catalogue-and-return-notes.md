# Catalogue and return operating notes

Consolidated 19 October 2026 from the superseded root-level sample setup and return-draft notes. This preserves useful merchant context and asset provenance; it does not change products, stock, policy, Auth settings or checkout readiness. Git history retains the original documents.

## Illustrative catalogue assets

Four illustrative listings were created on 14 October 2026 with one SKU each, an existing category/collection, sample descriptions/prices and zero initial sellable inventory. The database order guard rejects sample products. These are not evidence of verified merchandise or current stock; the owner must approve real listings and inventory before launch.

| Concept               | Original sample price | Required local asset                         |
| --------------------- | --------------------: | -------------------------------------------- |
| Aurelia Table Lamp    |             PKR 8,900 | `public/products/aurelia-table-lamp.webp`    |
| Solenne Floor Lamp    |            PKR 18,900 | `public/products/solenne-floor-lamp.webp`    |
| Sable Ceramic Planter |             PKR 3,900 | `public/products/sable-ceramic-planter.webp` |
| Terra Stoneware Vase  |             PKR 4,500 | `public/products/terra-stoneware-vase.webp`  |

The assets are illustrative AI-generated studio images, optimized to 1200 × 1200 WebP and visually inspected at creation. Their shared direction was a warm cream plaster backdrop, soft side daylight, grounded shadows, tactile materials, generous margins and no text/logo/watermark. Subjects: antique bronze table lamp/ivory pleated linen shade; slender dark bronze floor lamp/cream conical shade; empty matte sage planter; empty sand-colored speckled stoneware vase. The original note records that generated PNGs were preserved; this cleanup does not reverify those external originals. Local WebPs remain required by existing catalogue/media references.

## Recorded return terms

The original seven-day proposal recorded:

- Request from the original account order within seven days of delivery; reasons include damaged, incorrect or change-of-mind items.
- Change-of-mind items should be unused with original packaging and proof of purchase; used candles are excluded from that reason.
- Report damaged/incorrect items to `dwellunestore@gmail.com` with the order reference and photographs. Inspection determines eligibility; opening packaging to inspect a damaged item does not itself disqualify the complaint.
- Obtain approval and return instructions before sending an item. The proposal assigns reasonable delivery costs for confirmed damage/incorrect items to DWELLUNE and change-of-mind delivery to the customer.
- Approved COD refunds use JazzCash or bank transfer after receipt/inspection and confirmation of amount, method and timing with the customer. No automatic payment, replacement, courier booking or credit is promised.

The owner approved JazzCash/bank-transfer refund methods in the earlier account work. A fixed warehouse/return address and automatic pickup were not supplied. Customers must receive a confirmed destination from support before shipping. The account's validated `returns.policy` configuration controls the implemented request flow; these notes do not publish or override that configuration. Return decisions, inspection, fulfillment and actual payouts remain later operational work.

The original proposal cited [Habitt](https://habitt.com/pages/habitt-policies-procedures) and [Interwood](https://interwood.pk/policies/refund-policy) as research context. DWELLUNE's proposed window and cost allocation are its own terms, not either retailer's exact policy. No new external policy research or legal acceptance is claimed by this consolidation.

## Current technical handoff

The current assignment is one owner in `app_private.store_owner`, with live-session authorization. Superseded instructions to assign a staff role are not a supported setup process. See [single-owner conversion](../maintenance/part-2-single-admin.md).

Transactional order email uses the owner-selected Gmail adapter; hosted Auth SMTP is configured separately. No Resend/domain purchase or new credential is required by this cleanup. Real mailbox, recovery and merchant-order acceptance remain open, with checkout disabled. See [final maintenance verification](../maintenance/part-4-final-verification.md) and the [current roadmap](../../PROJECT_PLAN.md).
