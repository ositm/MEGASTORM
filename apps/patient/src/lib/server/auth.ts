import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import { firebaseConfig } from '@/firebase/config';

// Token verification only needs the project id (signatures are checked against
// Google's public certs), so no service-account credential is required here.
function adminApp() {
    if (!getApps().length) {
        initializeApp({ projectId: firebaseConfig.projectId });
    }
    return getApps()[0];
}

/**
 * Verifies the Firebase ID token from the Authorization: Bearer header.
 * Returns the decoded token, or null if missing/invalid.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<DecodedIdToken | null> {
    const authHeader = req.headers.get('authorization') || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) return null;

    try {
        return await getAuth(adminApp()).verifyIdToken(match[1]);
    } catch (e) {
        console.error('ID token verification failed:', e);
        return null;
    }
}
