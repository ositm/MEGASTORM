# ADR 0001: Monorepo via npm workspaces

**Date:** 2026-07-07
**Status:** Accepted

## Context

The LabLink ecosystem (docs/ARCHITECTURE.md) calls for four applications sharing
domain types, UI components, and Firebase wiring. docs/ARCHITECTURE.md §2.1
proposed Turborepo + pnpm.

## Decision

Use **npm workspaces** (no Turborepo, no pnpm) for the initial monorepo:

- `apps/patient` — the existing Next.js app, moved intact
- `packages/core` — shared domain types (`@lablink/core`), consumed as raw
  TypeScript via Next `transpilePackages`

Deviation from the architecture doc's pnpm+Turborepo, because: the repo already
has an npm lockfile and `.npmrc` (`legacy-peer-deps`) that Vercel's build
depends on; there is exactly one app today, so build orchestration/caching buys
nothing yet; fewer moving parts during the restructure.

## Consequences

- Vercel project must set **Root Directory = `apps/patient`** (with "Include
  source files outside of Root Directory" enabled). Until that setting changes,
  this branch must not be merged to main.
- Revisit Turborepo (and optionally pnpm) when the second app
  (`apps/lab`, M3) lands and task orchestration starts to matter.
- `packages/core` ships TS source, not compiled JS — consumers must transpile
  (Next does via `transpilePackages`; future non-Next consumers may force a
  build step, acceptable to defer).
- Dropped from dependencies during the move (verified unreferenced):
  `pdf-lib`, `pdf-parse`, `@types/pdf-parse`, `patch-package`;
  `firebase-tools` moved to root devDependencies; `eslint-config-next` to app
  devDependencies.
