# LabLink Ecosystem — Phase 2 Target Architecture & Roadmap

**Date:** 2026-07-07 (progress updated 2026-07-08)
**Status:** In progress — M0 and M1 complete; M2 complete
**Companion doc:** `docs/AUDIT.md` (Phase 1 findings)

> **Build progress**
> - **M0 (security hotfix):** ✅ done — rules hardened & deployed, dev-tool
>   pages removed, APIs authenticated, Next upgraded.
> - **M1 (foundation):** ✅ done — npm-workspaces monorepo (`apps/patient`,
>   `packages/core`), custom-claims RBAC (`scripts/set-role.mjs`), schema-v2
>   `orders` + custody rules, CI with typecheck/unit/rules tests, `lablink-staging`.
> - **M2 (patient app v2):** ✅ done — order model + chain-of-custody state
>   machine, server order service, patient & lab portals cut over to orders,
>   Paystack checkout (`ORDER_CREATED→PAYMENT_CONFIRMED`), and result-release
>   notifications (`PATIENT_NOTIFIED`). Full booking→paid→tested→released→
>   notified pipeline verified end-to-end.
> - **Next:** M3 (dedicated laboratory portal app) / M4 (collector portal).
>
> Deploy config the founder still owns: Vercel env vars
> `FIREBASE_SERVICE_ACCOUNT` (done) and `PAYSTACK_SECRET_KEY` (+ Paystack
> webhook URL → `/api/paystack/webhook`); optional `RESEND_API_KEY` for email.

---

## 1. Migration vs Rebuild — Recommendation

### Options considered

| Option | Effort | Outcome |
|---|---|---|
| **A. Expand in place** (keep current single app, bolt on collector/lab/admin) | Low upfront, compounding later | Fastest demo, but 4 role-based apps in one Next.js tree with client-side security collapses under its own weight; the security model cannot be patched incrementally to healthcare grade |
| **B. Full rebuild** (new stack, e.g. NestJS + Postgres + separate SPAs) | 4–6 months before feature parity | Cleanest theory; throws away ~3 months of working UI, loses Firebase's free realtime (GPS tracking, live jobs), highest risk for a solo founder |
| **C. Rebuild the foundation, port the product** (recommended) | ~2–3 weeks foundation, then incremental | Monorepo + shared backend layer + new data model + new security; existing UI/UX ported screen-by-screen |

### Recommendation: **Option C**

Reasoning:
1. **What's valuable in the current repo is the front of the house** — the design system, landing page, patient flows, lab-discovery UX. That's 60–70% reusable and represents most of the visible work done so far.
2. **What's unsalvageable is the trust model** — client-writable roles, permissive rules, unauthenticated APIs, no server layer, no event history. You cannot incrementally "harden" a model where the browser is trusted; it must be replaced (Admin-SDK server layer + custom claims + deny-by-default rules + new schema).
3. **Firebase stays.** The ecosystem's hardest realtime problems (collector GPS, live job dispatch, order tracking) are exactly what Firestore/RTDB gives you for free. Swapping to Postgres now would turn a 3-month plan into a 6-month plan for negligible near-term benefit. Revisit only if/when analytics/reporting outgrow Firestore (mitigate with BigQuery export, which Firebase offers natively).
4. **Effort estimate:** foundation 2–3 weeks; patient app reaches current feature parity (on the new model, plus payments) ~4–6 weeks in; each portal is then an incremental app in the same monorepo. A rebuild on a new stack would spend those same 6 weeks reaching feature parity with worse realtime support.

---

## 2. Target Architecture

### 2.1 Monorepo layout (Turborepo + pnpm)

```
lablink/
  apps/
    patient/        Next.js — public site + patient app (port of current app)
    collector/      Next.js (PWA-first) — collector portal; later React Native shares core packages
    lab/            Next.js — laboratory portal
    admin/          Next.js — internal admin/ops portal
  packages/
    core/           Domain types, zod schemas, status machines, constants (single source of truth)
    firebase/       Client SDK init + providers + typed converters (from current src/firebase)
    ui/             shadcn/ui components + Tailwind preset (from current src/components/ui)
    api-client/     Typed client for the server API
    ai/             AI interpreter service interface + providers (see §5)
  functions/        Cloud Functions: Firestore triggers, Paystack webhooks, scheduled jobs,
                    notifications (FCM/email/SMS), custody-event fan-out
  firebase/         firestore.rules, storage.rules, indexes — versioned, tested with emulator
  docs/
```

Each app deploys independently on Vercel (separate projects, path-filtered CI). One Firebase project per environment: `lablink-dev`, `lablink-staging`, `lablink-prod`.

### 2.2 Where server-side logic lives

Two complementary places, both using the **Firebase Admin SDK**:

- **Next.js Route Handlers / Server Actions** (in each app, wrapping shared service code): request/response work — create order, accept job, upload result, verify collector. Every handler verifies the Firebase ID token and role claim; the client SDK becomes read-mostly.
- **Cloud Functions**: things that must run regardless of a browser — Paystack webhooks, custody-event side effects (notifications, status fan-out), document-verification triggers, scheduled reconciliation, audit-log writes.

**Rule of thumb: clients never write privileged state directly.** Firestore rules allow clients to *read* what their role permits and write only trivially-owned data (e.g. their own profile fields, never `role`). All lifecycle transitions go through the server, which is the only writer of `orders`, `samples`, `custodyEvents`, `payments`, `verifications`.

### 2.3 AuthN / AuthZ

- Firebase Auth for identity (email/password, Google, phone later).
- **Roles as custom claims**: `patient`, `collector`, `lab_staff`, `lab_admin`, `admin` (+ `labId` claim for lab staff). Set exclusively by an admin-only server endpoint / verification workflow.
- Next.js middleware in each app verifies the session cookie and role before rendering protected routes (server-enforced, replacing the current client-only guards).
- Firestore rules deny by default; each collection's rules mirror the role matrix and are covered by **emulator rules tests** in CI.

### 2.4 Data model (Firestore, schema v2)

```
users/{uid}                 profile; role mirror (display only — claims are authoritative)
labs/{labId}                facility profile, geo, verification status
labs/{labId}/staff/{uid}
partner_applications/{id}   lab onboarding case: facility, licensing, director, capability,
                            document refs, status; server-written only. Approval creates
                            or claims labs/{labId} and grants the lab_admin claim.
labs/{labId}/tests/{testId} price/turnaround per lab (catalog ref)
catalog/tests/{testId}      canonical test defs incl. specimen type + reference ranges
catalog/packages/{pkgId}

orders/{orderId}            THE central entity (replaces "bookings")
  patientId, labId, items[], type: walk_in | home_collection
  amount, currency, paymentStatus, paymentRef
  status: one field, but transitions only via server state machine
orders/{orderId}/events/{eventId}    append-only chain of custody (see §4)

samples/{sampleId}          barcode id, orderId, specimen type, collectedAt, custody chain ref
jobs/{jobId}                collection job: orderId, geo, offer/accept lifecycle, collectorId
collectors/{uid}            profile, verification status, documents refs, rating, earnings summary
collectors/{uid}/documents/{docId}   license, ID, qualifications (Storage refs + review status)
presence/{collectorId}      RTDB or Firestore: online flag, last GPS, updated by collector app
tracks/{jobId}/points/*     GPS breadcrumbs during active jobs (RTDB preferred, TTL'd)

results/{resultId}          orderId, labId, files[], validation state, releasedAt, releasedBy
payments/{paymentId}        Paystack refs, webhook-confirmed states, immutable
verifications/{id}          collector/lab verification cases for admin queue
auditLogs/{id}              append-only, server-written, every privileged action
notifications/{uid}/items/*
disputes/{id}
```

Migration: one script maps `bookings` → `orders` (+ initial `events`), `results` → `results` v2, `users` roles → custom claims. Current production data volume is tiny, so migration is a script run, not a project.

### 2.5 Mapping & location

- **Nearby search:** keep Google Places for public lab discovery; registered labs get geohash fields (`geofire-common`) for "nearby labs with this test" queries from our own data.
- **Collector presence & tracking:** collector app writes GPS every ~10s during active jobs to RTDB (`presence/`, `tracks/`); patient's tracking screen subscribes to the single job path. RTDB over Firestore here: far cheaper for high-frequency ephemeral writes.
- **ETA:** Google Routes API server-side, refreshed on significant movement; cache aggressively.
- **Dispatch matching v1:** simple — server queries online collectors within X km (geohash), sends FCM offers in expanding radius, first-accept wins. No queue infrastructure needed at this scale.

---

## 3. The Three Applications (+ Admin)

### apps/patient (port of existing app)
Account, lab search + map, test catalog, order creation (walk-in or home collection), time slots, Paystack payment, live collector tracking, results inbox, AI interpreter, history, notifications. Reuses today's screens on the new order model.

### apps/collector
Registration + document upload (license, government ID, qualifications) → verification case → admin approval sets `collector` claim. Online/offline toggle, job offers (FCM push), accept/reject, navigation link-out, per-order collection checklist (identity check, tube types from `catalog.specimenType`, barcode generate/scan), custody events at every step, handover to dispatch/lab, earnings ledger, job history, support chat (v1: WhatsApp/link-out; v2: in-app).

### apps/lab
Partner application (`/register`): a multi-step wizard capturing facility registration (CAC/RC), regulatory licensing (MLSCN facility licence + expiry, state premises permit, accreditations), the laboratory director's identity and registration, location (with an optional GPS pin), operating capability (test categories, capacity, turnaround, staffing, hours), and required documents. Submission is server-validated, stored in `partner_applications`, emailed as a formatted dossier with the uploads attached to the ops inbox, and queued for the platform admin. Approval publishes `labs/{labId}` and grants `lab_admin`. Then: staff management (invite → `lab_staff` claim scoped by `labId`). Incoming samples queue, barcode scan to receive, processing-stage updates, result upload (PDF/images), **two-step validate → release** (uploader ≠ releaser where staffing allows), test/price catalog management, analytics (orders, turnaround, revenue).

### apps/admin
Verification queues (collectors, labs) with document viewer, user management + role grants, live ops map (active jobs), full audit-log browser, dispute handling, platform metrics. Internal only — IP-restrict or SSO-gate it.

---

## 4. Chain of Custody

Append-only `orders/{id}/events` subcollection; **only the server writes events**; no updates or deletes (rules-enforced). Each event:

```ts
{
  type: 'ORDER_CREATED' | 'PAYMENT_CONFIRMED' | 'COLLECTOR_ASSIGNED' | 'COLLECTOR_ARRIVED'
      | 'SAMPLE_COLLECTED' | 'HANDED_TO_DISPATCH' | 'DISPATCH_DELIVERED' | 'LAB_RECEIVED'
      | 'TESTING_STARTED' | 'TESTING_COMPLETED' | 'RESULT_UPLOADED' | 'RESULT_VALIDATED'
      | 'RESULT_RELEASED' | 'PATIENT_NOTIFIED' | 'CANCELLED' | 'DISPUTED',
  at: serverTimestamp, actor: { uid, role }, location?: GeoPoint,
  sampleIds?: string[], meta?: {...}, prevEventId: string   // hash-chain for tamper evidence
}
```

A single state machine in `packages/core` defines legal transitions; the server rejects out-of-order events. `orders.status` is a denormalized projection of the latest event (updated in the same transaction). Every event also mirrors to `auditLogs`. Barcodes: server-generated sample IDs rendered as QR/Code128; scans at each handover create the corresponding event.

---

## 5. AI Result Interpreter (modular service)

`packages/ai` defines a provider-agnostic interface:

```ts
interface ResultInterpreter {
  interpret(input: { files: FileRef[] }): Promise<Interpretation>
}
// Interpretation = { values: ExtractedValue[], flags: Flag[], plainLanguage: string,
//                    disclaimers: string[], confidence: 'high'|'medium'|'low' }
```

Pipeline (v1 all Gemini, swappable per stage):
1. **Extraction:** send the PDF/image *directly* to Gemini multimodal (fixes the current broken pdf2json text path and handles image reports/OCR in one step). Structured output (zod schema) of analyte / value / unit / stated reference range.
2. **Comparison:** deterministic code (not the LLM) compares values against the report's own ranges, falling back to `catalog` reference ranges; flags high/low.
3. **Explanation:** LLM writes plain-language education from the *structured* findings only.
4. **Guardrails:** fixed system prompt — educational only, never diagnose, never recommend treatment, always advise consulting a qualified professional; mandatory disclaimer block rendered by the UI (not the model); refuse non-lab-report inputs.

Served via authenticated endpoint; only callable on results the user owns; interpretations stored on the result doc with model/version metadata.

---

## 6. Phased Roadmap

> Milestones are sequential but sized for one founder + Claude Code, in small reviewable increments. "Backend" = Admin-SDK route handlers / functions; "DB" = Firestore schema + rules + indexes; "Testing" = what CI must prove before deploy.

### M0 — Production security hotfix (do first, ~1 day, on the EXISTING app)
- **Objective:** stop active PHI exposure without waiting for the new architecture.
- Storage rules → authenticated, path-scoped (`results/{uid}/...` owner-or-lab only). Firestore: bookings/results readable only by owner (`request.auth.uid == resource.data.userId`); `role`/`labId` fields made non-writable by owners; labs/catalog writes denied from clients.
- Remove/410 `role-switcher`, `seed`, `setup`, `lab-search-demo` routes; add ID-token verification to `upload` and `analyze` routes (and restrict `analyze` to Firebase Storage URLs).
- Rotate the Google API key; add referrer/API restrictions in Google Cloud Console.
- **Testing:** manual verification with two accounts; rules emulator smoke test. **Deploy immediately.**

### M1 — Foundation (~2–3 weeks)
- **Objective:** monorepo + trust model the ecosystem is built on.
- Turborepo scaffold; move current app → `apps/patient`; extract `packages/ui`, `packages/core`, `packages/firebase`. Re-enable TypeScript/ESLint build errors and fix fallout.
- Firebase Admin server layer + session-cookie middleware + custom-claims RBAC; admin script to grant roles.
- Schema v2 collections + deny-by-default rules + emulator rules tests; migration script bookings→orders.
- CI (GitHub Actions): typecheck, lint, rules tests, build per app; dev/staging/prod Firebase projects.
- **Deploy:** staging env live; prod still runs M0-patched old app.

### M2 — Patient app v2 (~3–4 weeks)
- **Objective:** current UX on the new model, plus the two missing table-stakes features.
- **Features:** order flow with time slots + home-collection option; **Paystack** payment (init server-side, confirm via webhook function); notifications (FCM + email via Trigger Email extension or Resend); results inbox on results v2; AI interpreter v1 (§5 pipeline, replacing the broken analyzer).
- **DB:** orders/events/payments live; **API:** create-order, pay, cancel, list; interpret-result.
- **Testing:** unit tests for state machine + payment webhook (signed payload fixtures); Playwright happy-path booking→payment→result. **Deploy:** patient v2 replaces old prod app. Old `/admin` kept temporarily for the pilot lab.
- *Requires from you:* Paystack account/keys.

### M3 — Laboratory portal (~3–4 weeks)
- **Objective:** labs self-serve the fulfillment side; retire `/admin` + `/partner`.
- **Features:** lab registration → verification case; staff invites; incoming orders queue; barcode scan receive (`LAB_RECEIVED`); stage updates; result upload → validate → release (release triggers patient notification); catalog/pricing management; basic analytics from real data.
- **DB:** labs/staff/results v2 + verifications; **API:** ~10 lab endpoints; **Testing:** rules tests proving lab A cannot see lab B; e2e receive→release.
- **Deploy:** `lab.lablink.…` on Vercel; onboard 1–2 pilot labs.

### M4 — Collector portal (~4 weeks)
- **Objective:** verified collectors executing home collections with full custody logging.
- **Features:** registration + document upload; admin verification (M5 queue, or temporary script); online/offline; job offers + accept/reject (FCM); collection checklist; barcode generation + label; custody events `COLLECTOR_ASSIGNED→…→HANDED_TO_DISPATCH`; earnings ledger; history.
- **DB:** collectors, jobs, samples, presence; **API:** job lifecycle endpoints; matching v1 (expanding-radius offer).
- **Testing:** state-machine unit tests incl. rejection/timeout/reassignment; field test with a phone.
- **Deploy:** `collector.lablink.…` as installable PWA (defer native app).

### M5 — Live tracking + Admin portal (~3–4 weeks)
- **Objective:** patients watch the collector arrive; you get the ops cockpit.
- **Features:** GPS breadcrumbs → patient tracking map + Routes-API ETA; dispatch handover flow completing the custody chain; admin app: verification queues with doc viewer, user/role management, live jobs map, audit-log browser, disputes, metrics.
- **DB:** tracks (RTDB) + TTL cleanup function; **Testing:** simulated GPS runs; load-test presence writes.
- **Deploy:** `admin.lablink.…` (access-restricted).

### M6 — Hardening & scale-out (ongoing)
- Security review/pen-test of rules + endpoints; BigQuery export for analytics; performance/cost pass (Firestore read audits); offline resilience for collector PWA; then React Native (Expo) collector app reusing `packages/core` + `api-client`; logistics-partner integration interface (the `HANDED_TO_DISPATCH` event is the seam).

---

## 7. Working Agreement (how we build)

- Trunk-based with short-lived feature branches → PRs; CI must pass (typecheck, lint, rules tests, unit, build).
- Small increments: one endpoint/screen/rule-set per PR; architectural decisions recorded in `docs/adr/` before major changes.
- No client-side privileged writes, no `ignoreBuildErrors`, no mock data presented as real, no dev tools routed in prod — enforced by review.
- Secrets only in Vercel/Firebase env config; `.env*` gitignored; the checked-in fallback keys rotated.
