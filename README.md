# DWELLUNE

Production ecommerce storefront and internal commerce CRM for DWELLUNE.

Production storefront: https://dwellune.vercel.app. Set `NEXT_PUBLIC_SITE_URL` to this origin in the Vercel production environment; local development uses its own localhost origin.

The Vercel project has a permanent, host-specific routing rule that directs former store addresses to this origin while preserving paths and query parameters. This project-level rule survives deployments.

## Launch model

- Cash on Delivery only
- Next.js App Router
- React + strict TypeScript
- Tailwind CSS design tokens
- Supabase/PostgreSQL in the database phase
- Resend in the transactional-email phase
- Vercel production deployment

## Production contracts

Read these before implementation work:

1. `AI_INSTRUCTIONS.md` — engineering and completion rules
2. `design.md` — visual, interaction, accessibility and motion system
3. `PROJECT_PLAN.md` — scope, phases and COD operations architecture
4. `PHASE_EXECUTION_TEMPLATE.md` — mandatory phase checklist/audit format
5. `ARCHITECTURE.md` — route, domain, service, validation and data-access boundaries
6. `SECURITY.md` — dependency-security gates and documented tooling exceptions

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
│   ├── result.ts      domain result primitive
│   └── validation.ts  schema-validation boundary
└── server/
    └── logger.ts      structured server logging foundation
```

The complete dependency and boundary rules live in `ARCHITECTURE.md`.

Future domain code is organized by responsibility rather than by page. Server-owned pricing, inventory, COD eligibility and order state must never be delegated to browser state.

## Route boundaries

- `(store)` is public commerce/discovery.
- `(account)` becomes authenticated customer space when auth is introduced.
- `(crm)` becomes staff-only operational space when staff auth/RBAC is introduced.
- Server Components are the default. Client Components are introduced only at real interaction boundaries.

## Styling rules

- No inline styles.
- Use semantic design tokens from `design.md`.
- Do not duplicate long class systems.
- Do not use generic rounded-card composition as the default storefront language.
- Accessibility and reduced motion are part of completion.

## Environment

Phase 7 is prepared locally, awaiting merchant inputs and acceptance; see `PHASE_7_AUDIT.md`. Email actions default to closed through `AUTH_EMAIL_READY=false`. Enable them only after production SMTP, DWELLUNE Auth redirects and real inbox flows are verified. `AUTH_RECOVERY_SECRET` is a private random secret for recovery grants; configure it securely and never commit its value. The Phase 7 migration was applied exactly once on 14 October 2026, and database types were regenerated. The application release is still held for real email/account acceptance and return operating details. Gmail SMTP is the merchant-selected testing provider; no sending-domain purchase is required for that setup.

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

Checkout details and validated COD quotes are available at `/checkout`. Order placement remains disabled until Part 2 delivers atomic order creation and confirmation. Verification evidence and remaining acceptance are in `PHASE_8_PART_1_AUDIT.md`.
