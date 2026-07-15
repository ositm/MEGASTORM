import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminApp, adminDb } from './firebase-admin';
import { appendOrderEvent } from './orders';

/** Sends an email via Resend if configured; a no-op otherwise. */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    const key = process.env.RESEND_API_KEY;
    if (!key) return; // Email is optional until a provider key is set.
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: process.env.RESEND_FROM || 'LabLink <onboarding@resend.dev>',
                to,
                subject,
                html,
            }),
        });
        if (!res.ok) console.error('Resend email failed:', res.status, await res.text());
    } catch (e) {
        console.error('Resend email error:', e);
    }
}

/**
 * Reacts to a released result: creates the patient's in-app notification,
 * appends the PATIENT_NOTIFIED custody event, and emails the patient (if
 * email is configured). Best-effort — callers should not fail the request
 * if this throws.
 */
export async function notifyResultReleased(orderId: string): Promise<void> {
    const db = adminDb();
    const snap = await db.collection('orders').doc(orderId).get();
    if (!snap.exists) return;
    const order = snap.data()!;
    const tests = (order.items || []).map((i: { name: string }) => i.name).join(', ') || 'your lab test';

    // In-app notification (read by the app header).
    await db.collection('notifications').add({
        userId: order.patientId,
        message: `Your results for ${tests} are ready to view.`,
        link: '/results',
        orderId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
    });

    // Close the custody chain.
    await appendOrderEvent({ uid: 'system', role: 'system' }, orderId, 'PATIENT_NOTIFIED');

    // Optional email to the patient's account address.
    try {
        const userRecord = await getAuth(adminApp()).getUser(order.patientId);
        if (userRecord.email) {
            await sendEmail(
                userRecord.email,
                'Your LabLink results are ready',
                `<p>Hi,</p><p>Your results for <strong>${tests}</strong> are ready to view in LabLink.</p>
                 <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/results">View your results</a></p>
                 <p>— The LabLink team</p>`
            );
        }
    } catch (e) {
        console.error('Could not send result-ready email:', e);
    }
}
