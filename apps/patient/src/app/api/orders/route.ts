import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { createOrder, createOrderSchema, HttpError } from '@/lib/server/orders';

export async function POST(req: NextRequest) {
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

        const parsed = createOrderSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid order', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const orderId = await createOrder(caller.uid, parsed.data);
        return NextResponse.json({ id: orderId }, { status: 201 });
    } catch (e: any) {
        if (e instanceof HttpError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        console.error('Create order failed:', e);
        return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
    }
}
