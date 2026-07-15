import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { adminApp, adminDb } from './firebase-admin';
import { HttpError } from './orders';

/**
 * Adds an existing LabLink user as lab_staff for the caller's lab. The staff
 * member gets a lab_staff custom claim scoped to that lab (which the lab
 * endpoints and rules trust). Refuses to touch accounts that already hold an
 * elevated role, so this can never hijack an admin/other-lab account.
 */
export async function addLabStaff(labId: string, email: string): Promise<{ uid: string }> {
    const auth = getAuth(adminApp());
    const db = adminDb();

    let userRecord;
    try {
        userRecord = await auth.getUserByEmail(email.trim());
    } catch {
        throw new HttpError(404, 'No LabLink account found for that email. Ask them to sign up first.');
    }

    const current = (userRecord.customClaims?.role as string) || 'user';
    if (['admin', 'lab_admin', 'lab_staff', 'collector'].includes(current)) {
        throw new HttpError(409, 'That account already has a role and cannot be added as staff.');
    }

    await auth.setCustomUserClaims(userRecord.uid, { role: 'lab_staff', labId });
    await db.collection('labs').doc(labId).collection('staff').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: userRecord.email ?? email.trim(),
        addedAt: FieldValue.serverTimestamp(),
    });
    await db.collection('users').doc(userRecord.uid).set({ role: 'lab_staff', labId }, { merge: true });
    return { uid: userRecord.uid };
}

/** Removes a staff member from the caller's lab and revokes their role. */
export async function removeLabStaff(labId: string, uid: string): Promise<void> {
    const db = adminDb();
    const staffRef = db.collection('labs').doc(labId).collection('staff').doc(uid);
    const snap = await staffRef.get();
    if (!snap.exists) throw new HttpError(404, 'That person is not on your staff.');

    await getAuth(adminApp()).setCustomUserClaims(uid, {}); // back to a plain user
    await staffRef.delete();
    await db.collection('users').doc(uid).set({ role: 'user', labId: FieldValue.delete() }, { merge: true });
}
