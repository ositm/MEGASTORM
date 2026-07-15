import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminApp, adminDb } from './firebase-admin';
import { HttpError } from './orders';

/**
 * Admin decision on a collector application. `approve` grants the collector
 * custom claim (which the security rules and job endpoints trust), marks the
 * profile verified, approves the documents, and mirrors the role onto the
 * user doc. `reject` records the rejection without granting anything.
 */
export async function decideCollector(uid: string, action: 'approve' | 'reject'): Promise<void> {
    const db = adminDb();
    const collectorRef = db.collection('collectors').doc(uid);
    const snap = await collectorRef.get();
    if (!snap.exists) throw new HttpError(404, 'Collector application not found');

    if (action === 'reject') {
        await collectorRef.update({ verificationStatus: 'rejected', updatedAt: FieldValue.serverTimestamp() });
        return;
    }

    // Grant the collector role via custom claims (authoritative for rules).
    await getAuth(adminApp()).setCustomUserClaims(uid, { role: 'collector' });

    await collectorRef.update({ verificationStatus: 'verified', updatedAt: FieldValue.serverTimestamp() });

    // Mirror onto the user doc for display, and approve their documents.
    await db.collection('users').doc(uid).set({ role: 'collector' }, { merge: true });
    const docs = await collectorRef.collection('documents').get();
    const batch = db.batch();
    docs.forEach((d) => batch.update(d.ref, { status: 'approved' }));
    await batch.commit();
}
