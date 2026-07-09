import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';

/**
 * Creates a collection job for a paid home_collection order, if one does not
 * already exist. Idempotent (keyed by orderId). Server-only.
 */
export async function createJobForOrder(orderId: string): Promise<string | null> {
    const db = adminDb();
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) return null;
    const order = orderSnap.data()!;
    if (order.type !== 'home_collection') return null;

    // Idempotency: one job per order.
    const existing = await db.collection('jobs').where('orderId', '==', orderId).limit(1).get();
    if (!existing.empty) return existing.docs[0].id;

    const now = FieldValue.serverTimestamp();
    const jobRef = db.collection('jobs').doc();
    await jobRef.set({
        orderId,
        patientId: order.patientId,
        labId: order.labId,
        status: 'pending',
        address: order.address ?? null,
        collectorId: null,
        createdAt: now,
        updatedAt: now,
    });
    return jobRef.id;
}
