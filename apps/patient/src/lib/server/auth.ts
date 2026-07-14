import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import { ActorRole } from '@lablink/core';
import { adminApp } from './firebase-admin';

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

/** Role from custom claims; accounts without a role claim act as patients. */
export function callerRole(decoded: DecodedIdToken): ActorRole {
    const role = decoded.role;
    if (role === 'admin' || role === 'lab_admin' || role === 'lab_staff' || role === 'collector' || role === 'dispatch') {
        return role;
    }
    return 'patient';
}
