# LabLink — Phase 1 Technical Audit

**Date:** 2026-07-07
**Auditor:** Claude (technical architect role)
**Verdict (summary):** The codebase is a solid *prototype* of a patient-facing lab-booking site. It is not yet a foundation for a multi-app logistics platform, and it has **critical security issues that must be fixed immediately because it is deployed to production**. Recommended path: keep the stack and the UI, rebuild the foundation (see `docs/ARCHITECTURE.md`).

---

## 1. Current Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 15.1.6 (App Router), React 18.3, TypeScript |
| UI | Tailwind CSS + shadcn/ui (Radix primitives), Lucide icons |
| Backend | **None (serverless-lite).** Firebase client SDK called directly from React components; 5 Next.js API routes for Places search, upload proxy, and AI analysis |
| Database | Cloud Firestore (client SDK only — no Admin SDK anywhere) |
| Auth | Firebase Auth (email/password + Google), role field stored on the Firestore user document |
| Storage | Firebase Storage (results PDFs/images) |
| AI | Genkit + Gemini (symptom checker); raw `fetch` to Gemini REST API (result analyzer) |
| Maps | Google Places API (New) via API routes; Leaflet + `@vis.gl/react-google-maps` both installed |
| Hosting | Vercel (originated in Firebase Studio — `.idx/`, `apphosting.yaml` remnants) |

Architecture pattern: **client-heavy Firebase app**. Every read/write (bookings, results, role changes) happens in the browser with the client SDK; security relies entirely on Firestore rules, which are currently permissive. There is no server-side trust boundary.

## 2. Folder Structure (actual)

```
src/
  ai/                     Genkit setup + symptom-checker flow
  app/
    (app)/                Authenticated patient area (home, appointments, find-a-lab,
                          labs/[labId], results, reminders, schedule, settings/*, tests/*)
    admin/                Lab-admin portal (dashboard, bookings, labs, results, tests) — NO route guard
    api/                  labs/search, labs/[id], places/search, results/analyze, upload
    auth/                 signin, signup, lab/signin, lab-registration
    partner/              Second, parallel "lab partner" portal (auth + static dashboard)
    role-switcher/        DEV TOOL: any signed-in user can grant themselves lab_admin
    seed/, setup/         Client-side data seeding pages, publicly routable
    lab-search-demo/, waiting-list/, contact/
  components/             ~35 shadcn/ui primitives + feature components (booking-modal,
                          find-a-lab, symptom-checker, pdf-viewer, landing/*, auth/*)
  firebase/               Provider, client init, non-blocking write helpers, error emitter
  hooks/                  use-labs, use-results, use-admin-bookings, use-user-profile, use-toast
  lib/, types/            utils + single types file
scripts/                  14 one-off seeding/admin scripts (some with service-account usage)
docs/                     blueprint.md, backend.json (schema doc that does NOT match the code)
```

## 3. What's Implemented and Working

- **Patient auth:** email/password + Google sign-up/sign-in; user doc created on first login; redirect guard in `(app)/layout.tsx`.
- **Lab discovery:** search by city/state/keyword via Google Places (two overlapping API routes), Firestore-seeded labs for Abuja, lab detail pages, Leaflet map.
- **Booking:** patient books a test at a lab → `bookings` collection doc; appointments list; lab admin sees bookings filtered by `labId` (live via `onSnapshot`) and can update status.
- **Results:** lab admin uploads PDF/image or external link → `results` doc + booking status `result_ready`; patient views/downloads; patient can also self-upload a PDF.
- **AI:** symptom checker (Genkit/Gemini) suggests tests; result analyzer downloads the PDF, extracts text, sends to Gemini, renders a Markdown summary.
- **Content:** full landing page, contact, waiting list, settings screens (mostly shells).

## 4. Database Design (actual, not `docs/backend.json`)

Flat root collections, written ad-hoc from the client:

| Collection | Notes |
|---|---|
| `users/{uid}` | profile + `role` (`user` \| `lab_admin` \| `admin`) + `labId` — **role is client-writable** |
| `labs/{labId}` | seeded from Google Places + scripts; embedded `tests[]` array |
| `bookings/{id}` | flat; `userId`, `labId`, denormalized `labName`/`testName`/`price`, single `status` string |
| `results/{id}` | `userId`, `fileUrl`, `aiSummary`, `status`; not always linked to a booking |
| `labTests`, `testPackages`, `notifications`, `reminders` | catalog + user data |

`docs/backend.json` describes a *different*, nested schema (`users/{id}/appointments/...`) that was never implemented — it's a stale Firebase Studio artifact.

**Structural gaps for the ecosystem:** no order lifecycle (single mutable `status` string, no event history), no samples/chain-of-custody entities, no payments, no collector entities, no audit log, heavy denormalization with no update strategy.

## 5. APIs

| Route | Purpose | Auth? |
|---|---|---|
| `GET /api/labs/search` | Places text search + per-result details enrichment (N+1 fetch) | ❌ none |
| `GET /api/places/search` | Near-duplicate of the above (lat/lng variant) | ❌ none |
| `GET /api/labs/[id]` | Place details | ❌ none |
| `POST /api/upload` | Server-side upload proxy to Storage via **unauthenticated REST** with hardcoded bucket | ❌ none |
| `POST /api/results/analyze` | Fetch arbitrary `fileUrl` → parse PDF → Gemini → summary | ❌ none |

None of the API routes verify a Firebase ID token. `/api/results/analyze` is an **open proxy that will fetch any URL** (SSRF) and burns your Gemini quota for anyone on the internet. `/api/upload` lets anyone upload arbitrary files to your bucket.

## 6. Authentication & Authorization Flow

1. Client signs in via Firebase Auth (patient at `/auth/signin`, lab at `/auth/lab/signin` and a *second* parallel portal at `/partner/auth`).
2. `FirebaseProvider` exposes `user`; `(app)/layout.tsx` redirects unauthenticated users.
3. "Roles" = a `role` field on `users/{uid}` read by `use-user-profile`.

**Problems:**
- `/admin/*` layout has **no auth or role check at all** — guarding is per-page at best; the data it shows is protected only by Firestore rules that say `allow read, update: if request.auth != null`, so **any signed-in patient can read/update every booking**.
- `/role-switcher` lets any signed-in user set their own `role: 'lab_admin'` (and rules allow it, since `users/{uid}` is owner-writable including `role`).
- Roles in a user-writable document instead of custom claims = privilege escalation by design.
- Client-side-only route guards (flash of redirect, no middleware, no server enforcement).

## 7. Security Findings (CRITICAL — production is live)

1. **`storage.rules`: `allow read, write: if true`** — the entire bucket, containing **patient lab results (PHI)**, is publicly readable, writable, and deletable by anyone with the bucket name (which is hardcoded in the repo). This is the single most urgent issue.
2. **Privilege escalation:** `/role-switcher` + owner-writable `role` field + `bookings`/`results` rules of `if request.auth != null` → any account can become a lab admin and read all patients' bookings/results.
3. **Unauthenticated API routes** (SSRF + quota theft + anonymous uploads, §5).
4. **Firestore rules** are "simplified for debugging" throughout: `labs`, `labTests`, `testPackages` are world-writable to any signed-in user; `results` and `notifications` readable/writable by any signed-in user.
5. Firebase web config keys hardcoded as fallbacks in `src/firebase/config.ts` (acceptable for Firebase web apps *only if* rules are strong — they are not).
6. `/seed` and `/setup` pages routable in production.

## 8. Technical Debt

- **`next.config.ts` sets `ignoreBuildErrors: true` and `ignoreDuringBuilds: true`** — TypeScript and ESLint are disabled at build time; the type system is decorative.
- **Zero tests** of any kind; no CI.
- **Likely-broken AI parsing:** `api/results/analyze` reads `pdfData.formImage?.Pages`, but pdf2json v4 (installed) removed `formImage` — extracted text is silently empty, so Gemini analyzes nothing and improvises. Three PDF libraries installed (`pdf-lib`, `pdf-parse`, `pdf2json`); one used.
- **Two parallel lab portals** (`/admin` + `/partner`) and **two parallel places-search routes**; duplicated concepts everywhere.
- **Dashboards show hardcoded mock stats** ("1,248 bookings", "$45,231 revenue").
- Client-side sorting/filtering to avoid Firestore indexes (comments admit it); `firestore.indexes.json` defines indexes the queries no longer use.
- Non-blocking "fire and forget" write helpers swallow errors into a global emitter.
- Hardcoded bucket URLs in components; naming drift (`phone` vs `phone_number`, `address` vs `formatted_address` on the same type).
- Booking flow collects no payment, no time slot (date only), no home-collection option.
- Git history shows the repo originated as a Firebase Studio prototyper export (auto-generated commits), then was hand-patched to deploy on Vercel.

## 9. Keep / Remove / Redesign

**Keep (port as-is or with light cleanup):**
- The entire shadcn/ui component library and Tailwind design system
- Landing page, auth form UIs, patient dashboard/app shell and navigation
- Lab discovery UX (search + map + detail pages) — consolidate the duplicate routes
- `FirebaseProvider` pattern, `use-user-profile`-style hooks
- Test/package catalog concept and seeding scripts (as migration seeds)
- Booking and results **UI** (the screens, not the data writes behind them)

**Remove:**
- `/role-switcher`, `/seed`, `/setup`, `/lab-search-demo` (dev tools in prod)
- One of the two lab portals (`/partner` is mostly static — fold into `/admin`)
- One of the two places-search API routes
- `pdf-parse` + `pdf-lib` or `pdf2json` (keep one PDF path)
- `docs/backend.json` (stale, misleading)
- Non-blocking write helpers (replace with awaited server-mediated writes)

**Redesign:**
- **Authorization**: custom claims + deny-by-default rules + server-enforced role checks (highest priority)
- **Data model**: booking → order/sample lifecycle with append-only event log (chain of custody)
- **All privileged writes** (role grants, result upload/release, status transitions) moved behind a server layer using the Firebase Admin SDK
- **AI analyzer**: modular service with provider interface, real OCR path, auth, and disclaimers (current prompt says "reassuringly" and gives recommendations — wrong posture for a non-diagnostic tool)
- Booking flow: time slots, home-collection option, payment step
