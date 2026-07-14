import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import {
    ActorRole,
    ORDER_EVENT_TYPES,
    OrderEventType,
    canTransition,
    roleMayEmit,
} from '@lablink/core';
import { adminDb } from './firebase-admin';

export class HttpError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
        this.name = 'HttpError';
    }
}

export const createOrderSchema = z
    .object({
        labId: z.string().min(1),
        labName: z.string().max(200).optional(),
        type: z.enum(['walk_in', 'home_collection']),
        items: z
            .array(
                z.object({
                    testId: z.string().optional(),
                    name: z.string().min(1).max(200),
                    price: z.number().nonnegative().finite(),
                })
            )
            .min(1)
            .max(25),
        scheduledFor: z.string().datetime({ offset: true }).optional(),
        address: z.string().max(500).optional(),
    })
    .refine((d) => d.type !== 'home_collection' || !!d.address, {
        message: 'home_collection orders require an address',
    });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Creates the order and its ORDER_CREATED custody event atomically. */
export async function createOrder(callerUid: string, input: CreateOrderInput): Promise<string> {
    const db = adminDb();
    const orderRef = db.collection('orders').doc();
    const eventRef = orderRef.collection('events').doc();
    const amount = input.items.reduce((sum, item) => sum + item.price, 0);
    const now = FieldValue.serverTimestamp();

    await db.runTransaction(async (tx) => {
        tx.create(orderRef, {
            patientId: callerUid,
            labId: input.labId,
            labName: input.labName ?? null,
            type: input.type,
            items: input.items,
            amount,
            currency: 'NGN',
            paymentStatus: 'unpaid',
            status: 'ORDER_CREATED' satisfies OrderEventType,
            scheduledFor: input.scheduledFor ? Timestamp.fromDate(new Date(input.scheduledFor)) : null,
            address: input.address ?? null,
            createdAt: now,
            updatedAt: now,
        });
        tx.create(eventRef, {
            type: 'ORDER_CREATED' satisfies OrderEventType,
            at: now,
            actor: { uid: callerUid, role: 'patient' satisfies ActorRole },
            patientId: callerUid,
            labId: input.labId,
            prevEventId: null,
        });
    });

    return orderRef.id;
}

export const appendEventSchema = z.object({
    type: z.enum(ORDER_EVENT_TYPES),
    meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Appends a custody event, enforcing the state machine, the actor-role
 * matrix, and the caller's scope over this order. Everything runs in one
 * transaction so concurrent transitions cannot fork the chain.
 */
export async function appendOrderEvent(
    caller: { uid: string; role: ActorRole; labId?: string },
    orderId: string,
    type: OrderEventType,
    meta?: Record<string, unknown>
): Promise<void> {
    if (!roleMayEmit(caller.role, type) && caller.role !== 'admin') {
        throw new HttpError(403, `Role ${caller.role} may not record ${type}`);
    }

    const db = adminDb();
    const orderRef = db.collection('orders').doc(orderId);

    await db.runTransaction(async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists) throw new HttpError(404, 'Order not found');
        const order = orderSnap.data()!;

        // Scope: callers may only touch orders they are party to. 'system' is
        // trusted server context (e.g. payment confirmation), never a user token.
        const inScope =
            caller.role === 'admin' ||
            caller.role === 'system' ||
            (caller.role === 'patient' && order.patientId === caller.uid) ||
            ((caller.role === 'lab_admin' || caller.role === 'lab_staff') && order.labId === caller.labId) ||
            (caller.role === 'collector' && order.collectorId === caller.uid) ||
            // Dispatch couriers carry samples between collector and lab.
            // roleMayEmit + the state machine restrict them to DISPATCH_DELIVERED
            // from HANDED_TO_DISPATCH, so order-party scoping isn't required.
            caller.role === 'dispatch';
        if (!inScope) throw new HttpError(403, 'This order is not yours to update');

        if (!canTransition(order.status, type)) {
            throw new HttpError(409, `Cannot go from ${order.status} to ${type}`);
        }

        const lastEvent = await tx.get(orderRef.collection('events').orderBy('at', 'desc').limit(1));
        const now = FieldValue.serverTimestamp();

        tx.create(orderRef.collection('events').doc(), {
            type,
            at: now,
            actor: { uid: caller.uid, role: caller.role },
            patientId: order.patientId,
            labId: order.labId,
            prevEventId: lastEvent.empty ? null : lastEvent.docs[0].id,
            ...(meta ? { meta } : {}),
        });
        tx.update(orderRef, { status: type, updatedAt: now });
    });
}
