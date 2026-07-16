'use client';

import { useEffect } from 'react';

// The lab portal moved to its own app (apps/lab). This page survives only to
// forward old links; NEXT_PUBLIC_LAB_APP_URL points at the deployed portal.
const LAB_APP_URL = process.env.NEXT_PUBLIC_LAB_APP_URL || 'http://localhost:9003';

export default function LabSignInForwarder() {
    useEffect(() => {
        window.location.replace(`${LAB_APP_URL}/signin`);
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <p className="text-sm text-muted-foreground">Taking you to the LabLink lab portal…</p>
        </div>
    );
}
