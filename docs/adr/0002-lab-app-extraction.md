# ADR 0002 — Extract the laboratory portal into `apps/lab` with a shared `@lablink/server` package

- **Status:** accepted
- **Date:** 2026-07-15
- **Milestone:** M3 (architecture doc §3, §6)

## Context

All M3 lab-portal *features* (orders queue, result upload→release, staff management,
analytics, lab onboarding) were built incrementally inside `apps/patient` under
`/admin`, sharing a layout with platform-admin pages (verification queues for labs,
collectors, couriers). The architecture doc targets a separately deployed `apps/lab`
(`lab.lablink.*`) so labs get a focused product surface and the patient bundle stops
shipping lab code.

Blocking coupling: every Admin-SDK service lives in `apps/patient/src/lib/server/*`
and is reachable only through that app's route handlers. A second Next.js app cannot
import across app boundaries cleanly.

## Decision

1. **`packages/server` (`@lablink/server`)** — the Admin-SDK service layer
   (auth, orders, jobs, payments, paystack, notifications, collectors, couriers,
   lab-claims, lab-staff, firebase-admin bootstrap) moves out of `apps/patient`.
   Same zero-build pattern as `@lablink/core`: raw TS via subpath exports
   (`"./*": "./src/*.ts"`) + `transpilePackages` in each consuming app.
   The package is framework-decoupled: `getAuthenticatedUser` accepts a standard
   `Request` (NextRequest subclasses it), and the Admin-SDK projectId fallback reads
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID` instead of importing app config.
2. **`apps/lab`** — new workspace Next.js app for `lab_admin`/`lab_staff`:
   dashboard, orders, results, staff, analytics, tests, plus lab sign-in and
   registration/claim flow. It ships **its own thin API route handlers** that
   delegate to `@lablink/server` (no cross-origin calls to the patient app: avoids
   CORS/token-forwarding complexity; each Vercel deployment carries its own
   serverless API).
3. **`apps/patient/admin` shrinks to platform admin** — verification queues
   (labs, collectors, couriers) behind an `admin`-only gate. Lab-facing pages are
   removed from the patient app once live in `apps/lab`.
4. **shadcn/ui components are copied** into `apps/lab` (they are copy-paste by
   design). A shared `packages/ui` remains deferred until drift actually hurts.

## Consequences

- Founder creates a second Vercel project (Root Directory `apps/lab`, same env vars
  minus Paystack/Resend, plus the Firebase service account).
- Firestore rules/claims are unchanged — both apps talk to the same Firebase project;
  security still lives in rules + custom claims, not in either app.
- e2e scripts that exercise lab endpoints point at the lab app's origin in dev.
- CI builds both apps.

## Increments

1. Extract `packages/server`; rewrite `@/lib/server/*` imports → `@lablink/server/*`. Pure refactor, no behavior change.
2. Scaffold `apps/lab` (auth, layout, sidebar) + dashboard & orders pages + events/staff API routes.
3. Port results, staff, analytics, tests + registration flow.
4. Remove lab pages from `apps/patient`, tighten `/admin` gate to `admin`, CI + docs.
