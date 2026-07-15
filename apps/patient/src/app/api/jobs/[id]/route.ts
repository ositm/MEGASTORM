import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { JOB_ACTIONS } from '@lablink/core';
import { callerRole, getAuthenticatedUser } from '@lablink/server/auth';
import { advanceJob } from '@lablink/server/jobs';
import { HttpError } from '@lablink/server/orders';

const bodySchema = z.object({ action: z.enum(JOB_ACTIONS) });

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const caller = await getAuthenticatedUser(req);
        if (!caller) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        await advanceJob({ uid: caller.uid, role: callerRole(caller) }, id, parsed.data.action);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        if (e instanceof HttpError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        console.error('Job action failed:', e);
        return NextResponse.json({ error: 'Could not update job' }, { status: 500 });
    }
}
