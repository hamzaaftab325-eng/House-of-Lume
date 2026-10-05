# House of Lume

Production ecommerce storefront and internal commerce CRM for House of Lume.

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

Future domain code should be organized by responsibility rather than by page. Server-owned pricing, inventory, COD eligibility and order state must never be delegated to browser state.

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

Copy `.env.example` to `.env.local` for local development.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

No secret values belong in source control.

## Development

```bash
npm install
npm run dev
```

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

A phase cannot be marked 100% complete if an applicable quality gate is failing or unverified when verification is available.

## Node.js

Use Node.js 24 LTS. `.nvmrc` is committed and `package.json` constrains the supported major version.
