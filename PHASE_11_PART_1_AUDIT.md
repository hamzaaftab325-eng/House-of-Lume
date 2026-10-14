# Phase 11 Part 1 — Branded transactional email

## Scope and checklist

- [x] Shared versioned HTML and plain-text renderer with DWELLUNE palette and approved logo.
- [x] Order receipt retains the durable database snapshot: items, quantities, PKR subtotal/discount/delivery/amount due and COD instructions.
- [x] Receipt sender uses the renderer; existing payloads default to `order.placed`.
- [x] Prepared templates: COD verification, confirmation, cancellation and return request received.
- [x] Fixed-recipient test sends only to owner-requested `hamzaaftab325@gmail.com`, clearly marked sample/no order/no payment.
- [x] Secure derived account/order links; no guest token, arbitrary URL, private staff note or credential in rendered mail.
- [x] Application password-reset and email-change callback paths reviewed; existing Auth tests retained.
- [x] Signup automatic login and closed checkout preserved.
- [x] Security, accessibility, responsive and stripped-CSS rendering tests.
- [x] Application/build and durable Gmail worker regression checks.
- [x] Documentation and final audit.

## Functional and design

The existing Gmail receipt worker sends multipart HTML/plain text. Five supported event templates use a shared shell, clear status language, support reply address and authenticated account navigation. The order-verification template explicitly distinguishes COD review from account activation. Return receipt makes no promise of approval/refund or instruction to ship items before review.

The logo PNG is a raster export of the approved `public/logo.svg`, not a replacement logo. Email-specific palette tokens mirror BRAND.md. Embedded CSS obeys the repository's no-inline-style requirement; presentation table attributes and text remain usable when a client strips CSS. Production logo images require the mail client to load remote images; text and actions remain readable with images disabled. Dark mode retains a cream logo plane to preserve artwork contrast. No web fonts, tracking pixels or new runtime dependencies.

## Security and operations

Subject/header inputs and identifiers are validated; customer text is HTML escaped and never converted into arbitrary links. Links use the configured trusted origin and UUID routes, which still require account ownership. Guests can reply with their order number; no bearer checkout token is mailed. The test action keeps its existing worker capability guard and fixed recipient. It creates no order or queued customer event.

Stable Message-ID now includes event, template version and durable job UUID. Message-ID is diagnostic, not a Gmail duplicate guarantee. Existing lease ownership, explicit temporary-rejection retries, bounded backoff and manual review of ambiguous DATA/acknowledgement failures remain unchanged. No database schema/privilege changes.

## Verification

- 182 application tests passed, including renderer escaping, unsafe origins, invalid events/UUIDs, header injection, text/HTML totals, fixed test recipient and SMTP acknowledgement behavior.
- Email rendering tested at 320, 375, 768 and 1440px, including unbroken long names, dark mode, logo loading and CSS-stripped content. Mobile/desktop/dark screenshots reviewed locally.
- 98 full browser regression tests passed, including existing account, cart, COD, staff verification, notification flows and the five email-rendering cases. The email cases were repeated after the final dark-logo change.
- Database rollback regression passed: worker capability/RLS, claim dedupe, leases, bounded backoff, uncertain/crashed sends, operator alerts, accepted-once acknowledgement and closed checkout. Fixture writes rolled back.
- Lint, TypeScript and production build passed; production dependency audit reports zero vulnerabilities. Final formatting/build gate repeated after the last changes.
- Database before release: zero orders, zero email jobs; checkout disabled.

## Release and acceptance gates

One final main commit is authorized for this batch. After Vercel reports READY, invoke the protected test once through the canonical worker URL using the existing Vault capability internally, without exposing credentials. Inspect that request's response. `accepted` proves SMTP acceptance only; inbox arrival/appearance requires owner confirmation. Do not retry an ambiguous test response automatically.

Part 2 connects the additional event templates to durable email jobs with per-event/recipient/version receipts and failure visibility. Future shipping/delivery/return-decision producers remain deferred until validated workflows exist. Full Phase 11 is not yet complete.

Hosted Supabase Auth template configuration and redirect allowlists are not exposed by the connected database plugin. Application reset calls target `/auth/callback?flow=recovery`, email changes target `/auth/callback`, and callback processing routes verified recovery to `/auth/update-password`; invalid/replayed tokens fail safely. Hosted template/allowlist inspection and real inbox recovery remain pending. No Auth email settings were changed in this batch.

Existing local Cloudinary DNS limitations can produce image-fetch warnings in fixture regressions; those checks do not establish live product imagery acceptance. Local Chromium verifies our markup, not every Gmail/Outlook rendering engine or mailbox placement. Confirm the sent test in the real inbox before claiming mailbox acceptance.
