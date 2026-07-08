import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { initializeOrderPayment } from '@/lib/server/payments';
import { HttpError } from '@/lib/server/orders';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const caller = await getAuthenticatedUser(req);
        if (!caller) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!caller.email) {
            return NextResponse.json({ error: 'An email address is required to pay' }, { status: 400 });
        }

        const origin = req.headers.get('origin') || new URL(req.url).origin;
        const { id } = await ctx.params;
        const { authorizationUrl } = await initializeOrderPayment(caller.uid, id, caller.email, origin);
        return NextResponse.json({ authorizationUrl });
    } catch (e: any) {
        if (e instanceof HttpError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        console.error('Initialize payment failed:', e);
        return NextResponse.json({ error: 'Could not start payment' }, { status: 500 });
    }
}
