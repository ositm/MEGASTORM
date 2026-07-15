import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';
import { appendOrderEvent, HttpError } from './orders';
import { initializeTransaction, verifyTransaction } from './paystack';
import { createJobForOrder } from './jobs';

/**
 * Starts a Paystack checkout for an unpaid order the caller owns.
 * Returns the hosted-checkout URL to redirect the patient to.
 */
export async function initializeOrderPayment(
    callerUid: string,
    orderId: string,
    email: string,
    origin: string
): Promise<{ authorizationUrl: string }> {
    const db = adminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) throw new HttpError(404, 'Order not found');

    const order = snap.data()!;
    if (order.patientId !== callerUid) throw new HttpError(403, 'This order is not yours');
    if (order.paymentStatus === 'paid') throw new HttpError(409, 'Order is already paid');
    if (order.status !== 'ORDER_CREATED') throw new HttpError(409, 'Order is not awaiting payment');

    // Unique per attempt; the orderId is carried in metadata for confirmation.
    const reference = `${orderId}-${Date.now()}`;
    const { authorizationUrl } = await initializeTransaction({
        email,
        amountKobo: Math.round(order.amount * 100),
        reference,
        callbackUrl: `${origin}/payment/callback`,
        metadata: { orderId },
    });

    await orderRef.update({ paymentRef: reference, updatedAt: FieldValue.serverTimestamp() });
    return { authorizationUrl };
}

/**
 * Confirms a payment by its Paystack reference. Idempotent and safe to call
 * from both the callback and the webhook. Verifies with Paystack, checks the
 * amount, marks the order paid, and appends PAYMENT_CONFIRMED (system actor).
 */
export async function confirmPaymentByReference(
    reference: string
): Promise<{ confirmed: boolean; alreadyPaid?: boolean; orderId?: string }> {
    const result = await verifyTransaction(reference);
    if (!result.success) return { confirmed: false };

    const orderId = String(result.metadata?.orderId || '');
    if (!orderId) throw new HttpError(400, 'Payment is missing its order reference');

    const db = adminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) throw new HttpError(404, 'Order not found');
    const order = snap.data()!;

    if (order.paymentStatus === 'paid') return { confirmed: true, alreadyPaid: true, orderId };

    // Guard against tampered amounts.
    if (result.amountKobo !== Math.round(order.amount * 100)) {
        throw new HttpError(400, 'Payment amount does not match the order');
    }

    await orderRef.update({ paymentStatus: 'paid', paymentRef: reference });
    await appendOrderEvent({ uid: 'system', role: 'system' }, orderId, 'PAYMENT_CONFIRMED', {
        paymentRef: reference,
    });

    // Home-collection orders spawn a collection job for collectors to accept.
    if (order.type === 'home_collection') {
        try {
            await createJobForOrder(orderId);
        } catch (e) {
            console.error('Job creation after payment failed:', e);
        }
    }

    return { confirmed: true, orderId };
}
