import { NextRequest, NextResponse } from 'next/server';
import { callerRole, getAuthenticatedUser } from '@/lib/server/auth';
import { appendEventSchema, appendOrderEvent, HttpError } from '@/lib/server/orders';

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

        const parsed = appendEventSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid event', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { id } = await ctx.params;
        await appendOrderEvent(
            {
                uid: caller.uid,
                role: callerRole(caller),
                labId: typeof caller.labId === 'string' ? caller.labId : undefined,
            },
            id,
            parsed.data.type,
            parsed.data.meta
        );
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        if (e instanceof HttpError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        console.error('Append order event failed:', e);
        return NextResponse.json({ error: 'Could not update order' }, { status: 500 });
    }
}
