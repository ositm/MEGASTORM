import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { confirmPaymentByReference } from '@/lib/server/payments';
import { HttpError } from '@/lib/server/orders';

// Called from the Paystack callback page after the patient returns.
// Confirmation is idempotent, so the webhook and this endpoint are safe to
// both fire for the same payment.
export async function POST(req: NextRequest) {
    try {
        const caller = await getAuthenticatedUser(req);
        if (!caller) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let reference: string | undefined;
        try {
            reference = (await req.json()).reference;
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        if (!reference) {
            return NextResponse.json({ error: 'reference is required' }, { status: 400 });
        }

        const result = await confirmPaymentByReference(reference);
        return NextResponse.json(result);
    } catch (e: any) {
        if (e instanceof HttpError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        console.error('Verify payment failed:', e);
        return NextResponse.json({ error: 'Could not verify payment' }, { status: 500 });
    }
}
