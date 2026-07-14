import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminApp, adminDb } from './firebase-admin';
import { HttpError } from './orders';

/**
 * Admin decision on a courier application. `approve` grants the dispatch
 * custom claim, marks the profile verified, approves the documents, and
 * mirrors the role onto the user doc. `reject` records the rejection.
 */
export async function decideCourier(uid: string, action: 'approve' | 'reject'): Promise<void> {
    const db = adminDb();
    const courierRef = db.collection('couriers').doc(uid);
    const snap = await courierRef.get();
    if (!snap.exists) throw new HttpError(404, 'Courier application not found');

    if (action === 'reject') {
        await courierRef.update({ verificationStatus: 'rejected', updatedAt: FieldValue.serverTimestamp() });
        return;
    }

    await getAuth(adminApp()).setCustomUserClaims(uid, { role: 'dispatch' });
    await courierRef.update({ verificationStatus: 'verified', updatedAt: FieldValue.serverTimestamp() });
    await db.collection('users').doc(uid).set({ role: 'dispatch' }, { merge: true });

    const docs = await courierRef.collection('documents').get();
    const batch = db.batch();
    docs.forEach((d) => batch.update(d.ref, { status: 'approved' }));
    await batch.commit();
}
