# House of Lume — Dependency Security Policy

**Status:** Phase 0 production baseline  
**Last reviewed:** 2026-10-05

## Production dependency gate

Production/runtime dependencies must pass:

```bash
npm audit --omit=dev --audit-level=high
```

A high or critical vulnerability reachable through production dependencies blocks phase completion and production release until it is removed, patched, or the scope is explicitly changed by the project owner after a documented risk review.

## Development-tool advisories

Development-only tooling is reviewed separately because lint/test/build dependencies are not shipped as application runtime dependencies.

A dev-only advisory may be accepted temporarily only when all of the following are true:

1. it is not present in the production dependency audit;
2. it is not executed on untrusted customer-controlled input in the deployed application;
3. upstream has no compatible patched release;
4. avoiding it would require an unsafe framework downgrade or removing an important quality gate;
5. the advisory and dependency chain are documented here;
6. CI continues to enforce the production dependency audit;
7. the exception is reviewed when the affected upstream packages release updates.

An accepted dev-tool advisory is **not** described as fixed. It is an explicitly documented, isolated tooling risk.

## Current temporary dev-tool exception

### GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 — `braces`

- Severity: High
- Affected package: `braces <= 3.0.3`
- Patched upstream release: none as of 2026-10-05
- Current dependency path: `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`
- Scope in this repository: development lint tooling only
- Production runtime exposure: none when verified by `npm audit --omit=dev --audit-level=high`
- Reason not to apply npm's suggested forced fix: it proposes a breaking downgrade of `eslint-config-next`, which would move the project away from the supported Next.js 16.3.8 toolchain
- Mitigation: do not feed customer-controlled glob patterns into lint tooling; keep lint tooling CI/local only; continue production dependency auditing; update the Next.js lint dependency chain when upstream publishes a compatible remediation

### Review trigger

Re-review this exception whenever any of these change:

- `eslint-config-next`
- `@next/eslint-plugin-next`
- `fast-glob`
- `micromatch`
- `braces`
- Next.js minor/patch release

It must also be re-reviewed before the final production security-hardening phase.

## Lint toolchain support

The repository targets ESLint 10 with Next.js 16 flat configuration. Unsupported/EOL linter majors should not remain pinned in the foundation.

## Secret handling

- Never commit `.env*` secrets.
- `.env.example` contains names/examples only.
- Service-role/database/email credentials remain server-only.
- No secrets are allowed in screenshots, fixtures, logs, documentation, or test output.

## Reporting

Security issues discovered during implementation must be recorded in the active phase audit and may not be hidden to preserve a `100% complete` status.
