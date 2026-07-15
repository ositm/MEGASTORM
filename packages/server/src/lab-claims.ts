import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminApp, adminDb } from './firebase-admin';
import { HttpError } from './orders';

/**
 * Admin decision on a lab access request (lab_claims). `approve` grants the
 * claimant the lab_admin custom claim scoped to the claimed lab (which the
 * rules and lab endpoints trust), marks the claim approved, activates the
 * lab, and mirrors the role onto the user doc. `reject` records the rejection.
 */
export async function decideLabClaim(claimId: string, action: 'approve' | 'reject'): Promise<void> {
    const db = adminDb();
    const claimRef = db.collection('lab_claims').doc(claimId);
    const snap = await claimRef.get();
    if (!snap.exists) throw new HttpError(404, 'Lab request not found');
    const claim = snap.data()!;

    if (action === 'reject') {
        await claimRef.update({ status: 'rejected', decidedAt: FieldValue.serverTimestamp() });
        return;
    }

    if (!claim.userId || !claim.labId) {
        throw new HttpError(400, 'Request is missing a user or lab reference');
    }

    // Grant lab_admin scoped to the claimed lab (authoritative for rules).
    await getAuth(adminApp()).setCustomUserClaims(claim.userId, { role: 'lab_admin', labId: claim.labId });

    await claimRef.update({ status: 'approved', decidedAt: FieldValue.serverTimestamp() });
    await db.collection('users').doc(claim.userId).set({ role: 'lab_admin', labId: claim.labId }, { merge: true });
    await db.collection('labs').doc(claim.labId).set({ verified: true, status: 'active' }, { merge: true });
}
