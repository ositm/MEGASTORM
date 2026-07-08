import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/server/paystack';
import { confirmPaymentByReference } from '@/lib/server/payments';

// Paystack's authoritative confirmation. Signature is verified against the
// raw body; confirmation is idempotent with the callback endpoint.
export async function POST(req: NextRequest) {
    const raw = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!verifyWebhookSignature(raw, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let event: any;
    try {
        event = JSON.parse(raw);
    } catch {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
        if (event?.event === 'charge.success' && event.data?.reference) {
            await confirmPaymentByReference(event.data.reference);
        }
    } catch (e) {
        // Log but still 200 so Paystack doesn't retry a permanent failure forever.
        console.error('Webhook confirmation error:', e);
    }

    // Always acknowledge receipt.
    return NextResponse.json({ received: true });
}
