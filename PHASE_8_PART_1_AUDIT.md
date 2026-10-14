# Phase 8 Part 1 — checkout details and validated quotes

Date: 2026-10-14. Scope: guest and account checkout preparation. Order submission remains Part 2.

## Delivered

- `/checkout` and private, uncached `/api/checkout` context/quote endpoints; bag links to checkout.
- Pakistan contact/address validation, saved address ownership checks, order notes, consent and COD presentation.
- Database quote recalculates current prices, discounts, availability, delivery zones, fees and COD limits. Client prices/customer IDs are rejected.
- Secure guest cookie hash and authenticated session checks reuse the existing commerce cart. Saved addresses are scoped to the current customer.
- Quote revision, bounded expiry, cart/form/discount change invalidation, cancellation of stale requests and account-change clearing.
- Quote reports stock revalidation requirements and clearly labels the demonstration product. It creates no orders, payment records or notifications and makes no new inventory reservations.
- Responsive semantic UI, native scrolling, loading/error/empty states and an intentionally disabled order submission button.

## Configuration and dependencies

Reuses the active Pakistan nationwide standard delivery rule: PKR 250, free delivery at the configured PKR 5,000 threshold, zero surcharge, current 2–7 day estimate. These are existing settings; the merchant must approve changes before live order launch. Active rules and settings, rather than browser constants, govern the quote. Current totals include subtotal, discount and delivery; no new tax rule was invented.

COD remains the only checkout payment method. JazzCash and bank transfer are manual refund methods in the existing returns policy, not payment gateways. No emails are sent by this part. No package dependencies were added.

Migration: `20261014072115_checkout_validated_quotes.sql`, applied to production project `hahlsfuxdyymrwinekjt`. Public SECURITY INVOKER wrapper calls a narrowly granted private SECURITY DEFINER function with empty search path, explicit identity guards and canonical cart access. Generated public database types include the RPC.

## Verification

- Local production HTTP smoke: checkout 200; anonymous context 200/private/no-store; cross-origin 403; tampered payload 400; missing cart 409. No order submitted. Explicit localhost binding resolved a workspace network-interface limitation.
- Runtime dependency audit: zero vulnerabilities.
- Full application check: formatting, zero-warning lint, TypeScript, 68 unit/route/service tests and production build passed.
- Initial transactional database suite passed canonical guest quotes/free delivery, stable revisions, rejected unsupported addresses/empty carts, discount threshold recalculation, COD maximum, surcharge, inactive discount rejection, account cart isolation, revoked sessions and no double reservations/new orders/notifications. Fixtures rolled back.
- Post-migration production RPC probe passed current price/total (PKR 18,900 for the demonstration variant), stable revision and demonstration marker; changes rolled back.
- Expanded reproducible rollback suite lives in `tests/database/phase8-part1.sql`. Connector request-state errors prevented confirmation of its additional expiry/stock/price/rule cases; do not count the extended suite as passed.
- Supabase security advisors show no new migration findings. Existing intentionally deny-all RLS on import receipts and disabled leaked-password protection remain baseline observations.

## Acceptance limits and Part 2 gates

Cloud browser was not opened, as requested. Interactive mobile/desktop and signed-in saved-address acceptance remain unverified; local Chromium installation was unavailable. Part 1 is implemented and application/database checks above pass, but this is not a claim that all Phase 8 acceptance is complete.

Before opening order placement, Part 2 must atomically revalidate prices/discounts/shipping/COD/stock, implement idempotency and order limits, transfer or replace existing reservations without duplication, snapshot items/address/totals, create status/verification records, queue customer/staff notifications and confirmation email safely, clear the submitted cart and deliver the confirmation page. Never authorize orders from the quote revision alone. Live email, full customer flows and visual acceptance must pass before Phase 8 is marked 100% complete.
