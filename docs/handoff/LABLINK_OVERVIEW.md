# LabLink — Platform Overview & Field Guide

*A diagnostic logistics ecosystem for Nigeria. This document describes what has been built, how the platform works, and how to test-drive every side of it.*

---

## 1. What LabLink is

LabLink connects four kinds of participants around a single, trustworthy record of every lab test:

- **Patients** find verified labs, book tests, pay online, track their sample, and receive results digitally.
- **Sample collectors** (phlebotomists) take home-collection jobs, share live GPS while en route, and log every custody step.
- **Dispatch couriers** carry collected samples from the field to the lab when the collector doesn't deliver directly.
- **Laboratories** receive samples, process them, and upload → validate → release results through their own portal.

A **platform admin** (LabLink staff) verifies every lab, collector, and courier before they can operate — trust is enforced, not assumed.

## 2. What exists today — live deployments

| Platform | URL | Who uses it |
|---|---|---|
| Patient app | https://megastorm-omega.vercel.app | Patients; also hosts collector & dispatch portals and the admin console |
| Laboratory portal | https://megastorm-lab-eight.vercel.app | Lab admins and lab staff |
| Admin console | https://megastorm-omega.vercel.app/admin/dashboard | Platform admin only |

Integrations in production: **Firebase** (auth, database, file storage), **Paystack** (payments, webhook-confirmed), **Resend** (result emails from noreply@healthesphere.com), **Google Places & Maps** (lab discovery with real contact details, live GPS tracking).

## 3. The core idea: chain of custody

Every order is an append-only sequence of events, written only by the server, with each event linked to the previous one — a tamper-evident chain. The full lifecycle:

```
ORDER_CREATED → PAYMENT_CONFIRMED
  → (home collection) COLLECTOR_ASSIGNED → COLLECTOR_ARRIVED → SAMPLE_COLLECTED
      → (optional courier leg) HANDED_TO_DISPATCH → DISPATCH_DELIVERED
  → LAB_RECEIVED → TESTING_STARTED → TESTING_COMPLETED
  → RESULT_UPLOADED → RESULT_VALIDATED → RESULT_RELEASED → PATIENT_NOTIFIED
```

Three properties make this trustworthy:

1. **A state machine rejects out-of-order events** — a result cannot be released before it is validated; a sample cannot be received before it is collected.
2. **A role matrix controls who can record what** — only a collector can log a collection; only a lab admin can validate and release a result (two-person control: the uploader need not be the releaser); payment confirmation comes only from the payment system.
3. **Every event links to its predecessor** — deleting or inserting history breaks the chain visibly.

## 4. How each journey works

### Patient journey
1. Sign up / sign in → browse the test catalog (34 tests, 4 bundled packages) or find a lab on the map (live Google data, phone/WhatsApp per lab).
2. Book a test: choose **Visit lab** or **Home collection** (with address), pick a lab, pay via Paystack checkout.
3. For home collection: watch the assigned collector approach on a live map with an ETA.
4. Get notified in-app and by email when the result is released; view/download it in the results inbox, with optional AI-assisted explanation.

### Collector journey
1. Open **/collector** → register (profile + government ID, license, qualification uploads) → wait for admin approval.
2. Once verified: see open jobs, accept one, share live location, mark **arrived** → **collected**, then either deliver to the lab directly or **hand over to a courier**.

### Courier (dispatch) journey
1. Open **/dispatch** → register (government ID + driver's licence) → admin approval.
2. Once verified: see samples awaiting delivery, pick up a handed-over sample, mark **delivered** at the lab.

### Laboratory journey
1. On the lab portal: **Register your lab** (claim an existing listed facility with a signed-in account) → platform admin approves → the account becomes that lab's administrator.
2. Work the **Orders** queue: receive incoming samples, start/complete testing.
3. **Upload Results** (PDF/images) → a lab admin **validates** → **releases**; the patient is notified automatically.
4. Manage **Staff** (add/remove bench staff by email — staff can work orders and curate the catalog but cannot release results or change lab identity), review **Analytics** (volumes, revenue, turnaround), and curate **Manage Tests** (the lab's catalog and pricing).

### Platform-admin journey
1. Open **/admin/dashboard** on the patient app with an admin account.
2. The **Needs attention** row shows live counts: lab access requests, collectors and couriers awaiting verification, samples currently in transit — each linking to its decision queue.
3. Approve or reject from the queues; approval grants the applicant their role instantly (they re-login and are in business).

## 5. Test-drive instructions

> Everything below uses **Paystack test mode** — no real money moves. Test card: **4084 0840 8408 4081**, CVV **408**, any future expiry, any PIN/OTP.

### A. Test the patient flow (5 minutes)
1. Go to https://megastorm-omega.vercel.app and create an account (any email).
2. **Find a lab**: open *Find a Lab*, pick a state (e.g. Abuja) — labs appear with ratings, phone, WhatsApp, and map pins.
3. **Book**: choose a test → *Book* → select **Home collection** and enter any address → pay with the test card above.
4. Open *Appointments* — the order shows its live status; cancel is available pre-payment.

### B. Test the collector flow
1. In a second browser (or incognito), create a fresh account → visit `/collector` → **Apply** → fill the profile and upload any images/PDFs as documents → submit.
2. As **admin**, approve them under `/admin/collectors`.
3. Sign the collector out and in again (role refresh) → `/collector` now shows the open job from step A → **Accept** → toggle location sharing → **Arrived** → **Collected** → **Hand over** (for a courier) or deliver direct.
4. Back in the patient account: *Track collector* shows the live map while the job is active.

### C. Test the courier flow
1. Third account → `/dispatch` → register with ID + driver's licence → admin approves under `/admin/couriers` → re-login.
2. `/dispatch` lists the handed-over sample → **Delivered to lab** completes the transit leg.

### D. Test the laboratory flow
1. Fourth account → https://megastorm-lab-eight.vercel.app → **Register your Lab** → pick a listed facility → submit the claim.
2. As admin, approve it under `/admin/labs` (*Pending access requests*).
3. Re-login on the lab portal: the **Orders** queue shows the order → **Received** → **Start testing** → **Complete** → go to **Upload Results**, attach a PDF → back in Orders: **Validate** → **Release**.
4. The patient instantly gets an in-app notification and an email from noreply@healthesphere.com with the result.
5. Try **Staff**: add a fifth account's email as staff — that account can receive/test/upload but the *Validate/Release* actions are refused for it (two-step control).

### E. Test the admin console
Sign in with the platform-admin account → `/admin/dashboard`. Watch the *Needs attention* tiles change as registrations from B–D arrive; each tile links to its queue.

## 6. Under the hood (for technical audiences)

- **Monorepo**: `apps/patient` and `apps/lab` (Next.js 15 / React 18 / TypeScript / Tailwind), sharing `packages/core` (domain model + state machine) and `packages/server` (Firebase Admin service layer). Architecture decisions recorded in `docs/adr/`.
- **Security model**: deny-by-default Firestore/Storage rules; roles carried in Firebase custom claims (patient, collector, dispatch, lab_admin, lab_staff, admin); orders and custody events are **server-write-only**; lab data isolated per `labId`; API keys split (referrer-locked browser key / server-only Places key).
- **Verification discipline**: 18 unit tests on the domain core; 35 Firestore-rules tests run against the emulator in CI; end-to-end suites that exercise the deployed apps with disposable accounts (full lifecycle incl. the courier leg: 18/18; lab portal receive→release with role-matrix and cross-lab denials: 12/12); CI runs typecheck, tests, rules tests, and both app builds on every push.
- **Payments**: Paystack redirect checkout, server-side init, HMAC-SHA512-verified webhook, idempotent confirmation.
- **Notifications**: in-app + Resend email on result release, fired from the custody event itself — the workflow, not the UI, is the source of truth.

## 7. Where this goes next

- **Barcode / sample IDs**: QR-coded sample labels scanned at every handoff (the custody chain's physical anchor).
- **Drive-time ETAs** via Google Routes API; real-time location at scale via Firebase RTDB.
- **Dedicated collector app** (installable PWA → native) and an extracted admin app.
- **Pilot onboarding**: the platform is ready for 1–2 pilot labs and a small collector fleet today.

---

*Repository: github.com/ositm/MEGASTORM · Prepared 16 July 2026*
