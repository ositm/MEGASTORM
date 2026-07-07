# LabLink

Diagnostic logistics platform connecting patients, sample collectors, and
laboratories in Nigeria.

## Repository layout

```
apps/
  patient/        Next.js — public site + patient app (labs, bookings, results, AI interpreter)
packages/
  core/           @lablink/core — shared domain types
docs/             Architecture, audit, ADRs (start with ARCHITECTURE.md)
scripts/          One-off operational scripts
firestore.rules   Production Firestore security rules
storage.rules     Production Storage security rules
```

Planned apps (see `docs/ARCHITECTURE.md`): `apps/collector`, `apps/lab`, `apps/admin`.

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

## Deployment

- **App:** Vercel, from `main`. Project Root Directory must be `apps/patient`.
- **Rules:** `npm run deploy:rules` (Firebase project `lablink-df67e`).
