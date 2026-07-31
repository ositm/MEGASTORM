import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@lablink/server/auth';
import { submitPartnerApplication } from '@lablink/server/partner-applications';
import { HttpError } from '@lablink/server/orders';

// Attachments are downloaded and emailed inline, so allow more than the
// default execution window on a cold start with several documents.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const caller = await getAuthenticatedUser(req);
        if (!caller) {
            return NextResponse.json({ error: 'Please sign in to submit an application.' }, { status: 401 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const result = await submitPartnerApplication(
            { uid: caller.uid, email: caller.email || '' },
            body
        );
        return NextResponse.json({ ok: true, ...result });
    } catch (e: any) {
        if (e instanceof HttpError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        console.error('Partner application submission failed:', e);
        return NextResponse.json({ error: 'Could not submit your application.' }, { status: 500 });
    }
}
