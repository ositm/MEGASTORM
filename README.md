# LabLink

Diagnostic logistics platform connecting patients, sample collectors, and
laboratories in Nigeria.

## Repository layout

```
apps/
  patient/        Next.js — public site + patient app (labs, bookings, results, AI interpreter)
  lab/            Next.js — laboratory portal + partner onboarding
packages/
  core/           @lablink/core — shared domain types
  server/         @lablink/server — Admin-SDK service layer shared by route handlers
docs/             Architecture, audit, ADRs (start with ARCHITECTURE.md)
scripts/          One-off operational scripts
firestore.rules   Production Firestore security rules
storage.rules     Production Storage security rules
```

Planned apps (see `docs/ARCHITECTURE.md`): `apps/collector`, `apps/admin`.

## Partner onboarding

New laboratories apply at `/register` in the lab portal: a multi-step wizard
captures the facility's registration, licensing, leadership, location and
capability, plus supporting documents (CAC certificate, MLSCN licences,
permits). On submit the server files the case in `partner_applications`,
emails a formatted dossier — uploads attached — to the operations inbox, and
raises it in the platform admin's **Partner applications** queue
(`/admin/partners` in the patient app). Approving there publishes the facility
as a `labs/{labId}` record and grants the applicant the `lab_admin` claim.

## Development

```bash
npm install          # workspace install (root)
npm run dev          # patient app on http://localhost:9002
npm run typecheck    # all workspaces
npm run build        # production build of the patient app
npm run deploy:rules # deploy Firestore + Storage rules (needs firebase login)
```

Environment: create `apps/patient/.env.local` with `GOOGLE_API_KEY` (Gemini)
and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for the AI and maps features. Firebase
web config has checked-in fallbacks for project `lablink-df67e`.

Server-side env vars (Vercel, per app):

| Variable | Used by | Purpose |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | both | base64 service-account JSON — required for any Admin-SDK write |
| `PAYSTACK_SECRET_KEY` | patient | checkout + webhook verification |
| `RESEND_API_KEY` | both | outbound email; **without it partner-application emails are skipped** (the case is still queued) |
| `RESEND_FROM` | both | verified sender, e.g. `LabLink <partners@yourdomain>` |
| `PARTNER_APPLICATIONS_EMAIL` | lab | where partner dossiers are delivered (defaults to `healthesphere@gmail.com`) |
| `NEXT_PUBLIC_APP_URL` | both | patient/admin base URL — used for the "review this application" link |
| `NEXT_PUBLIC_LAB_APP_URL` | both | lab portal base URL — used in approval emails and legacy redirects |

## Deployment

- **App:** Vercel, from `main`. Project Root Directory must be `apps/patient`.
- **Rules:** `npm run deploy:rules` (Firebase project `lablink-df67e`).
