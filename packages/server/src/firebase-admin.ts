import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// FIREBASE_SERVICE_ACCOUNT holds the base64-encoded service-account JSON
// (locally in .env.local, on Vercel as an env var). Without it the app can
// still verify ID tokens (public certs), but Firestore writes will fail.
export function adminApp(): App {
    if (!getApps().length) {
        const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (b64) {
            const creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
            initializeApp({ credential: cert(creds), projectId: creds.project_id });
        } else {
            console.warn('FIREBASE_SERVICE_ACCOUNT not set — Admin SDK writes will fail.');
            initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lablink-df67e' });
        }
    }
    return getApps()[0];
}

export function adminDb(): Firestore {
    return getFirestore(adminApp());
}
