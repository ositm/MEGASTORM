import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callerRole, getAuthenticatedUser } from '@/lib/server/auth';
import { decideCollector } from '@/lib/server/collectors';
import { HttpError } from '@/lib/server/orders';

const bodySchema = z.object({ action: z.enum(['approve', 'reject']) });

export async function POST(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
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

        const { uid } = await ctx.params;
        await decideCollector(uid, parsed.data.action);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        if (e instanceof HttpError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        console.error('Collector decision failed:', e);
        return NextResponse.json({ error: 'Could not update collector' }, { status: 500 });
    }
}
