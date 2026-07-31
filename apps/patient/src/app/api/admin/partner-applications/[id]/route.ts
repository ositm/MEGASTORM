import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callerRole, getAuthenticatedUser } from '@lablink/server/auth';
import {
    decidePartnerApplication,
    markPartnerApplicationUnderReview,
} from '@lablink/server/partner-applications';
import { HttpError } from '@lablink/server/orders';

const bodySchema = z.object({
    action: z.enum(['approve', 'reject', 'review']),
    note: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const caller = await getAuthenticatedUser(req);
        if (!caller) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (callerRole(caller) !== 'admin') {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const { id } = await ctx.params;

        if (parsed.data.action === 'review') {
            await markPartnerApplicationUnderReview(id, caller.uid);
            return NextResponse.json({ ok: true });
        }

        const result = await decidePartnerApplication(id, parsed.data.action, caller.uid, parsed.data.note);
        return NextResponse.json({ ok: true, ...result });
    } catch (e: any) {
        if (e instanceof HttpError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        console.error('Partner application decision failed:', e);
        return NextResponse.json({ error: 'Could not update the application' }, { status: 500 });
    }
}
