# Phase 8 Part 2 — order creation and confirmation

Date: 2026-10-14. Application code is prepared for a gated production update; real order launch remains pending external release gates. This is not a 100% completion claim.

## Implementation

- Strict same-origin COD submission endpoint with cookie-based guest identity and verified account/session identity. Browser totals and customer IDs are rejected.
- Atomic order RPC revalidates catalogue, address, stock, actual delivery-zone discount eligibility, COD rules and configurable 24-hour phone/customer/guest order limits. Purchase snapshots are protected against concurrent catalogue/rule edits. The existing commerce advisory lock serializes stock and discount redemption operations at current launch scale.
- Idempotency is scoped to the actual customer or guest cookie; matching retry returns the original order, changed details conflict. Replay works after cart conversion or gate closure. Cookie/owner-scoped recovery by attempt ID resolves lost responses without exposing another order. The browser stores only an attempt UUID, never checkout contact/address data.
- Item, SKU/options, address, total, initial history and COD verification snapshots. COD settlement remains independent. Verification defaults to pending admin review. No outbound WhatsApp message is implied.
- Missing/expired cart holds are reacquired atomically. Existing holds transfer to durable order reservations without incrementing inventory balances twice. Converted guest cart identity is archived under a new hash, leaving the old cookie available for receipt access and a fresh bag. Cancellation releases active order holds once and writes inventory ledger records. Fulfillment consumption and operational cancellation UI remain later phase workflows.
- Customer in-app notification (registered customers), staff in-app notification and one transactional email event per order. Guest email events do not require a fabricated customer account.
- Private durable email outbox and versioned plain-text template. The owner-selected Gmail worker now replaces the original Resend dispatcher; cron uses a Vault capability, while SMTP credentials remain in Vercel. Temporary rejection or pre-DATA failures retry with bounded backoff within 22 hours. SMTP uncertainty requires operator review rather than automatic resend. Payload and sender stay fixed. Provider acceptance is recorded as `sent`; mailbox delivery is not falsely reported as verified.
- Secure, noindex, uncached confirmation route, mobile layout, status/total summary, pending/failed email messages and account order link. Cart/contact/address changes invalidate quotes; uncertain submissions retain their original payload/key for retry.

## Applied database changes

`20261014094842_phase8_cod_order_creation.sql`, `20261014100953_phase8_order_attempt_recovery.sql` and `20261014102616_phase8_address_discount_validation.sql` were applied to production with `checkout.orders_enabled=false`. Production cannot place orders through these functions while the gate is closed. Applied migrations are immutable.

Private receipt and email-outbox tables have RLS enabled and no anonymous/customer grants or policies, intentionally denying direct access. Order inventory reservations expose only staff reads. Public RPCs are invoker wrappers around explicit guarded private functions with empty search paths. New advisor information for the private deny-all tables is intentional; the pre-existing disabled leaked-password-protection warning remains.

## Verification evidence

- Migration compilation passed in a rollback transaction before application.
- Real database rollback tests passed guest and account orders, matching replay, conflicting replay denial, foreign guest/account receipt denial, cleared active cart, reservation transfer, cancellation release once, item/address/history/verification snapshots, canonical signed-in email, customer/staff notifications and one email queue event.
- Address-scoped discount application, configured city delivery fee, wrong-zone rejection and removal passed in a rolled-back database transaction.
- Smaller post-application tests passed stale-price rejection with no surviving order, revised canonical-price submission, owner-only attempt recovery and restored inventory after cancellation.
- Demonstration product rejection passed. Fixtures, test users and queued test emails were rolled back; no emails were sent.
- Final production HTTP checks passed: checkout/context 200 with private/no-store context; closed order gate 409 with no order created; absent attempt recovery returns private null; cross-origin order 403; tampered discount 400; foreign confirmation reveals no order details.
- Runtime dependency audit: zero vulnerabilities.
- Formatting, zero-warning lint, TypeScript, 83 unit/route/service/component tests and a production build passed. An additional build hit a workspace Turbopack persistence-cache error; removing generated build output allowed a clean rebuild to pass.
- Local packaged Chromium ran all 58 browser scenarios successfully under CI settings, including mobile checkout reflow, keyboard focus, quote invalidation, uncertain-response retry and stale-total rejection. A prior parallel run had one baseline hero timing failure; its targeted rerun and the CI-style full run passed. Cloud browser was never opened. Workspace image-fetch DNS errors affected existing Cloudinary fixture images; this does not establish live visual/image acceptance. After final discount and infrastructure-error hardening, all five focused checkout browser scenarios passed again. Test email provider and live mailbox acceptance remain blocked by missing configuration.

## Release gates still required

1. Resolved: the owner requested a new administrator. A dedicated login tied to the owner’s supplied Gmail inbox was created through Supabase Auth, granted the single active Super Admin role, and verified with password sign-in, live-session validation and RLS. Its credentials are never committed. Administrator access now also requires a live, unrevoked Auth session.
2. Updated owner decision: use `dwellunestore@gmail.com` for sender/reply/support, without a sending domain or paid Resend subscription. The owner saved a Production Gmail App Password. The Gmail worker replaces Resend for order confirmations; SMTP credentials are independent of the settings saved in Supabase Auth. See `GMAIL_ORDER_EMAIL_AUDIT.md` for verification and remaining acceptance.
3. Run an authorized live confirmation-email test and verify receipt, sender, totals and reply address. Failed email must remain queued/flagged without duplicating the order. Complete signed-in/guest browser acceptance against real account data.
4. Merchant confirms real product stock, price and fulfillment details. The owner requested four realistic-looking listings: four polished sample concepts and AI-generated images have been added with zero sellable stock and explicit sample labels. These are not proof of owned inventory; order RPC rejects sample products.
5. Confirm delivery/COD/return configuration and operating arrangements. Only after all gates pass should `checkout.orders_enabled` be enabled and one final application production push made. The latest owner request permits publishing the administrator and sample-catalogue update with the order gate still disabled. No preview deployment is used.

Phase 8 remains incomplete until these gates pass. The gated update can publish the prepared Part 2 application without enabling order placement. Full Phase 8 acceptance and real transactional email remain pending.
