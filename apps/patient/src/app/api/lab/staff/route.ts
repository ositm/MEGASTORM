import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callerRole, getAuthenticatedUser } from '@/lib/server/auth';
import { addLabStaff, removeLabStaff } from '@/lib/server/lab-staff';
import { HttpError } from '@/lib/server/orders';

const bodySchema = z.union([
    z.object({ action: z.literal('add'), email: z.string().email() }),
    z.object({ action: z.literal('remove'), uid: z.string().min(1) }),
]);

export async function POST(req: NextRequest) {
    try {
        const caller = await getAuthenticatedUser(req);
        if (!caller) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (callerRole(caller) !== 'lab_admin') {
            return NextResponse.json({ error: 'Only a lab admin can manage staff' }, { status: 403 });
        }
        const labId = typeof caller.labId === 'string' ? caller.labId : null;
        if (!labId) {
            return NextResponse.json({ error: 'Your account is not linked to a lab' }, { status: 400 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        if (parsed.data.action === 'add') {
            const result = await addLabStaff(labId, parsed.data.email);
            return NextResponse.json({ ok: true, ...result });
        }
        await removeLabStaff(labId, parsed.data.uid);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        if (e instanceof HttpError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        console.error('Lab staff update failed:', e);
        return NextResponse.json({ error: 'Could not update staff' }, { status: 500 });
    }
}
