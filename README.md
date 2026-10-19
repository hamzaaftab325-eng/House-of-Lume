# DWELLUNE

Production ecommerce storefront and internal commerce CRM for DWELLUNE.

Production storefront: https://dwellune.vercel.app. Set `NEXT_PUBLIC_SITE_URL` to this origin in the Vercel production environment; local development uses its own localhost origin.

The Vercel project has a permanent, host-specific routing rule that directs former store addresses to this origin while preserving paths and query parameters. This project-level rule survives deployments.

## Launch model

- Cash on Delivery only
- Next.js App Router
- React + strict TypeScript
- Tailwind CSS design tokens
- Connected Supabase/PostgreSQL with RLS and live-session authorization
- Owner-selected Gmail SMTP for order confirmations; Supabase SMTP for Auth emails
- Vercel production deployment

## Production contracts

Read these before implementation work:

1. `AI_INSTRUCTIONS.md` — engineering and completion rules
2. `BRAND.md` — active identity, logo and palette
3. `design.md` — visual, interaction, accessibility and motion system
4. `PROJECT_PLAN.md` — scope, phases and COD operations architecture
5. `PHASE_EXECUTION_TEMPLATE.md` — mandatory phase checklist/audit format
6. `ARCHITECTURE.md` — route, domain, service, validation and data-access boundaries
7. `SECURITY.md` — dependency-security gates and documented tooling exceptions

## Current architecture

```text
src/
├── app/
│   ├── (store)/       storefront route group
│   ├── (account)/     customer account route group
│   ├── (crm)/         internal operations route group
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   ├── env.ts         environment validation
│   ├── product-detail.ts product contracts
│   └── supabase/      clients and generated database types
└── server/
    ├── catalogue/     catalogue and product queries
    ├── commerce/      cart and wishlist services
    ├── account/       customer services
    ├── admin/         owner-only operations
    └── notifications/ recipient-scoped notifications
```

The complete dependency and boundary rules live in `ARCHITECTURE.md`.

Future domain code is organized by responsibility rather than by page. Server-owned pricing, inventory, COD eligibility and order state must never be delegated to browser state.

## Route boundaries

- `(store)` is public commerce/discovery.
- `(account)` is authenticated customer space with owned account/order/return data.
- `(crm)` is restricted to the single store owner through live Auth sessions and database authorization.
- Server Components are the default. Client Components are introduced only at real interaction boundaries.

## Styling rules

- No inline styles.
- Use semantic design tokens from `design.md`.
- Do not duplicate long class systems.
- Do not use generic rounded-card composition as the default storefront language.
- Accessibility and reduced motion are part of completion.

## Environment

Account routes and services are deployed; real-account and inbox acceptance remain separate launch gates. Recovery and email-change actions default to closed through `AUTH_EMAIL_READY=false`. Enable them only after production SMTP, DWELLUNE Auth redirects and real inbox flows are verified. `AUTH_RECOVERY_SECRET` is a private random secret for recovery grants; configure it securely and never commit its value. Signup without verification email is the owner's chosen behavior and is separate from recovery readiness. Gmail SMTP is the selected provider. See `docs/maintenance/part-4-final-verification.md` for the current readiness record and `PHASE_7_AUDIT.md` for historical implementation evidence.

Copy `.env.example` to `.env.local` for local development.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

No secret values belong in source control.

## Development

```bash
npm ci
npm run dev
```

## Quality gates

```bash
npm run audit:prod
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

The same gates are enforced by GitHub Actions using Node.js 24 LTS and the committed dependency lockfile.

The production dependency audit must report no high/critical runtime vulnerabilities. Development-tool advisory handling is defined in `SECURITY.md` and must never be silently ignored.

A phase cannot be marked 100% complete if an applicable quality gate is failing or unverified when verification is available.

## Node.js

Use Node.js 24 LTS. `.nvmrc` is committed and `package.json` constrains the supported major version.


### Immediate password signup

The owner requested signup without a verification email. In the hosted Supabase project, turn **Confirm Email OFF** under Authentication > Sign In / Providers > Email. Signup uses a nonpersisting password Auth client and installs the returned session through the SSR cookie client. The endpoint checks the setting before signup, preventing an unintended verification email while configuration is pending. Recovery and email changes still require functioning SMTP and production callback URLs.

## Phase 8 Part 1

Checkout details and validated COD quotes are available at `/checkout`. Atomic order creation and confirmation are deployed, while order placement remains disabled by the production launch gate. Verification evidence and remaining acceptance are in `PHASE_8_PART_1_AUDIT.md` and `PHASE_8_PART_2_AUDIT.md`.

## Phase 8 Part 2 release preparation

Order creation, secure confirmation and a durable transactional email queue are deployed with checkout disabled. The Owner admin is configured. The owner selected Gmail SMTP for order emails using `dwellunestore@gmail.com`; the protected worker uses Production `SMTP_APP_PASSWORD` and `ORDER_EMAIL_WORKER_SECRET`. Auth SMTP remains independently configured in Supabase. Real inventory, merchant operating details and live checkout/mailbox acceptance remain launch gates. See `PHASE_8_PART_2_AUDIT.md` and `GMAIL_ORDER_EMAIL_AUDIT.md`; do not enable checkout before these checks pass.

## Phase 9 Part 1 — COD verification

Owner admin can open `/crm/verification` to review pending orders, record actual phone/WhatsApp/email contact, confirm orders, or reject/cancel eligible orders before shipment and COD collection. Required private notes, staff timestamps, stale-order protection and idempotent retries safeguard the workflow. Customer account status/progress and in-app notices update without exposing staff notes. Product management is still later work, and checkout remains closed pending real-product acceptance. See `PHASE_9_PART_1_AUDIT.md`; Part 2 adds editable verification rules, deterministic review signals, mandatory review clearance and rolling phone/account/guest order limits. See `PHASE_9_PART_2_AUDIT.md`.

## Phase 9 Part 2 — review controls

Open `/crm/verification/settings` as Owner admin to edit rules with an audit reason. Defaults: PKR 25,000 high-value threshold, 24-hour duplicate window, two prior failed/RTO orders within 180 days, three orders per hour and five per 24 hours. Possible duplicates match normalized phone and canonical total. Signals require staff review; they do not automatically reject customers. Clear manual review with a private note, then confirm separately. Settings never enable checkout. Real-product merchant acceptance remains deferred.

## Phase 10 Part 1 — notification centers

Customer inbox: `/account/notifications`. Admin inbox: `/crm/notifications`. Both support all/unread, category filters, bounded cursor pages, single-read and whole-inbox mark-all. The admin additionally filter priority and see operational urgency. Inboxes are recipient-scoped, including for Owner admin; staff and customer notices stay separate. Badges refresh after reads, cross-tab changes, visible-tab return and a 60-second visible-page poll. Reading notices does not alter orders or imply email delivery. Part 2 event coverage/preferences remain separate. See `PHASE_10_PART_1_AUDIT.md`.

## Phase 10 Part 2 — events and delivery controls

`/account/notifications/preferences` allows withdrawal of previously saved optional consent; the current UI offers no new opt-ins. Essential order/verification/account notices and transactional emails remain enabled. `/crm/notifications/delivery` shows bounded email-job views, full queue counts, SMTP health and active/deferred event coverage. SMTP acceptance is separate from inbox delivery. Uncertain sends have no automatic resend action.

Current producers include order placement/confirmation/cancellation, verification/manual review, return requests, eligible inventory threshold crossings, email job failure and SMTP authentication failure. Durable per-recipient receipts prevent replay and preserve optional suppression. Existing email lease/backoff safeguards remain intact. Future fulfillment/RTO/moderation/support/settlement/product-subscription events stay deferred. See `PHASE_10_PART_2_AUDIT.md`.

Phase 11 Part 1 adds branded HTML/plain-text order receipts through the existing Gmail worker, using the approved DWELLUNE logo and safe account links. COD verification, confirmation, cancellation and return-request templates are prepared; their outgoing email producers belong to Part 2. The protected owner test sends a clearly labelled sample to `hamzaaftab325@gmail.com`. Mailbox receipt is separate from SMTP acceptance. See `PHASE_11_PART_1_AUDIT.md` for scope and remaining acceptance gates.

Phase 11 Part 2 adds durable supported-event email jobs, private attempt logs, per-job failure alerts, event/version labels in delivery operations, and future templates without enabling their producers. Eight migrations are applied and hosted rollback tests pass. The final main production release follows the single-push workflow. Live product/order acceptance and hosted Auth template/recovery checks remain pending. See `PHASE_11_PART_2_AUDIT.md`.

## Single owner access (maintenance Part 2)

The shop has one administrator. `app_private.store_owner` is the only active admin assignment, protected by a singleton constraint, Auth foreign key, live-session validation and RLS. No staff directory, role assignments, invitations or permission editor is supported. All existing admin operations use that owner; customer accounts and commerce workflows remain separate. Admin access does not require a customer profile.

The conversion reconciles two previously live-only migrations and a Phase 5 version mismatch. Never reapply that reconciled history to production. Archived access records stay private for recovery. Legacy `staff_verification_*` RPC names, the persisted `staff` notification audience and `is_super_admin()` policy helper are compatibility contracts; each now resolves to the same owner check. A read-only `staff_profiles` view supports the preceding deployment during rollout. It cannot manage staff. See `docs/maintenance/part-2-single-admin.md` for checks, recovery and remaining launch acceptance.

## Storefront cleanup (maintenance Part 3)

The public `/system` development showcase and its exclusive sample components, hooks, styles and unused scaffolding are retired. The homepage no longer promotes an inactive journal or newsletter signup; its closing section links to the working catalogue. Static room inspiration is labelled as such. Optional product ratings, aggregate-rating markup and the product-page review query are removed; product/offer metadata, pricing, stock and purchase controls remain.

Marketing and product-subscription opt-in controls are not part of the current storefront. Existing consent records and guarded compatibility APIs remain, and `/account/notifications/preferences` lets customers withdraw previously enabled optional updates while essential order/account notices remain enabled. Account settings links to that same screen. No database migration or production-data deletion is included. Product images, email branding, animation dependencies, checkout safeguards and the single-owner access model are retained. See `docs/maintenance/part-3-storefront-cleanup.md`.

## Final maintenance verification (Part 4)

The four-part cleanup preserves the single owner and implemented shopping/account/notification workflows. Part 4 adds regression coverage and guards optional recent-search/recently-viewed persistence so blocked or full browser storage cannot interrupt shopping. No dependency, schema, consent, order, email or launch-setting change is included.

The current audit and release/rollback procedure are in `docs/maintenance/part-4-final-verification.md`. It distinguishes verified maintenance work from remaining merchant acceptance, external-media/performance evidence, observability and backup gates. Completing this maintenance batch does not certify all future build phases or open checkout.
