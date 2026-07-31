# Project State — resume from here

*Snapshot taken 16 July 2026, commit `7f573c7` on `main`. Give this file to your AI pair (or a new engineer) at the start of the next session.*

## Where everything lives

- **Code**: `D:\LabLink\MEGASTORM` (external drive — connect it first; check `Test-Path D:\LabLink\MEGASTORM`). GitHub: `ositm/MEGASTORM`, branch `main`, everything pushed.
- **Deployments** (Vercel, auto-deploy on push to main; hobby plan queues builds — a production deploy can take 30+ min when both apps build):
  - Patient app: project *megastorm* → https://megastorm-omega.vercel.app (Root Directory `apps/patient`)
  - Lab portal: project *megastorm-lab* → https://megastorm-lab-eight.vercel.app (Root Directory `apps/lab`)
- **Firebase**: production `lablink-df67e`, staging `lablink-staging` (CLI logged in as healthesphere@gmail.com). Rules deployed to both as of this snapshot.
- **Memory**: the AI session memory (auto-loaded) has the full milestone history in `lablink-ecosystem-plan`.

## Monorepo map

```
apps/patient        patient app + collector/dispatch portals + /admin console (dev: npm run dev, port 9002)
apps/lab            laboratory portal (dev: npm run dev:lab, port 9003)
packages/core       domain types + order state machine + role matrix (18 unit tests)
packages/server     Firebase Admin service layer shared by both apps' API routes
packages/rules-tests  35 emulator-backed Firestore rules tests
scripts/            set-role.mjs, seed-catalog.mts, e2e-lab-portal.mts (12/12 vs deployed lab app)
docs/               AUDIT, ARCHITECTURE, adr/0001 (monorepo), adr/0002 (lab-app extraction), handoff/ (this folder)
```

## Key commands

```bash
cd /d/LabLink/MEGASTORM            # bash sessions may start elsewhere — always cd first
npm run dev                        # patient app on :9002
npm run dev:lab                    # lab portal on :9003
npm test                           # unit tests (all workspaces)
npm run test:rules                 # rules tests (Firestore emulator on port 8114 — kill stale listeners first)
npm run build && npm run build:lab # both production builds
npm run deploy:rules               # firestore+storage rules → production
node --import tsx scripts/e2e-lab-portal.mts   # full lab-side e2e vs the deployed portal
node scripts/set-role.mjs --list   # inspect / grant role claims
```

## Environment variables (names only — values in Vercel and local .env.local files)

| Variable | Patient project | Lab project |
|---|---|---|
| FIREBASE_SERVICE_ACCOUNT | ✓ | ✓ |
| PAYSTACK_SECRET_KEY | ✓ | – |
| RESEND_API_KEY / RESEND_FROM | ✓ | ✓ |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (referrer-locked) | ✓ | – |
| GOOGLE_PLACES_SERVER_KEY (unrestricted, Places-only) | ✓ | – |
| NEXT_PUBLIC_LAB_APP_URL (= lab portal URL) | ✓ | – |
| NEXT_PUBLIC_APP_URL (= patient URL, for email links) | – | ✓ |
| PARTNER_APPLICATIONS_EMAIL (optional; defaults to healthesphere@gmail.com) | – | optional |

Google key security: browser key is restricted to `megastorm-omega.vercel.app`, `localhost:3000`, `localhost:9002`; server key is API-restricted to Places API (New).

## Operational notes / gotchas

- **npm cache moved to `D:\npm-cache`** — npm install fails if the external drive is unplugged.
- Firestore emulator port **8114** often stays occupied after a run — kill the listener before `test:rules`.
- CI requires **Node 22** (test-runner glob patterns) — fixed in `.github/workflows/ci.yml`; don't downgrade.
- Old project folder on `C:\Users\...\Desktop` is an empty locked shell — reopen the editor on `D:\LabLink\MEGASTORM` and delete it.
- The GitHub repo answered unauthenticated API calls during this session — i.e. it appears **public**. Decide if that's intended (Settings → change visibility) before adding anything sensitive.

## Completed milestone summary

M0 security hotfix → M1 monorepo + custom-claims RBAC + rules tests + staging → M2 orders/chain-of-custody/payments/notifications → M4 collector portal + GPS + ETA → dispatch courier leg + courier onboarding → lab onboarding + staff mgmt + analytics → catalog seeding, find-a-lab/contact/booking prod fixes → Google key split → **M3 lab-app extraction** (ADR 0002, `packages/server`, `apps/lab` deployed) → lab_staff access fix → lab portal e2e 12/12 → admin ops dashboard → staff catalog permissions. CI green; 35 rules tests; 18 unit tests.

## Open options for next session (founder to choose)

1. Barcode / sample-ID chain of custody (architecture §4 — the `samples` collection is unbuilt).
2. Google Routes API drive-time ETA (needs destination coordinates captured at booking).
3. Firebase RTDB for high-frequency GPS at scale.
4. Extract `apps/collector` / `apps/admin` (mirror ADR 0002 — but consider Vercel Pro first; the build queue is already slow with two projects).
5. Pilot-lab onboarding and real-user feedback.
