import { FieldValue } from 'firebase-admin/firestore';
import { ActorRole, JobAction, JOB_ACTION_MAP, isJobOpen } from '@lablink/core';
import { adminDb } from './firebase-admin';
import { appendOrderEvent, HttpError } from './orders';

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

/**
 * Advances a collection job. `accept` claims an open job and assigns the
 * collector to the order (COLLECTOR_ASSIGNED); the other actions record the
 * collector's on-site progress. All order events run through the custody
 * state machine in appendOrderEvent.
 */
export async function advanceJob(
    caller: { uid: string; role: ActorRole },
    jobId: string,
    action: JobAction
): Promise<void> {
    if (caller.role !== 'collector' && caller.role !== 'admin') {
        throw new HttpError(403, 'Only collectors can work jobs');
    }

    const db = adminDb();
    const jobRef = db.collection('jobs').doc(jobId);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) throw new HttpError(404, 'Job not found');
    const job = jobSnap.data()!;
    const now = FieldValue.serverTimestamp();

    if (action === 'accept') {
        if (!isJobOpen(job.status) || job.collectorId) {
            throw new HttpError(409, 'This job is no longer available');
        }
        await db.collection('orders').doc(job.orderId).update({ collectorId: caller.uid, updatedAt: now });
        await appendOrderEvent({ uid: 'system', role: 'system' }, job.orderId, 'COLLECTOR_ASSIGNED', {
            collectorId: caller.uid,
        });
        await jobRef.update({ collectorId: caller.uid, status: 'accepted', updatedAt: now });
        return;
    }

    // On-site steps require the assigned collector (admins may step in).
    if (job.collectorId !== caller.uid && caller.role !== 'admin') {
        throw new HttpError(403, 'This job is not assigned to you');
    }
    const step = JOB_ACTION_MAP[action];
    if (!step) throw new HttpError(400, `Unknown action: ${action}`);

    // State machine enforces the correct order; job status mirrors it.
    await appendOrderEvent(
        { uid: caller.uid, role: caller.role === 'admin' ? 'admin' : 'collector' },
        job.orderId,
        step.orderEvent
    );
    await jobRef.update({ status: step.jobStatus, updatedAt: now });
}
