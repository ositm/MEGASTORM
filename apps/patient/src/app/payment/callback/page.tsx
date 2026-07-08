'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase/FirebaseProvider';
import { verifyPaymentViaApi } from '@/lib/api-client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type State = 'verifying' | 'success' | 'failed';

function CallbackInner() {
    const params = useSearchParams();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const [state, setState] = useState<State>('verifying');

    // Paystack returns the reference as ?reference= or ?trxref=
    const reference = params.get('reference') || params.get('trxref');

    useEffect(() => {
        if (isUserLoading) return;
        if (!user || !reference) {
            setState('failed');
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await verifyPaymentViaApi(user, reference);
                if (!cancelled) setState(res.confirmed ? 'success' : 'failed');
            } catch {
                if (!cancelled) setState('failed');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user, isUserLoading, reference]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] p-4">
            <div className="bg-white rounded-xl shadow-md p-10 max-w-md w-full text-center">
                {state === 'verifying' && (
                    <>
                        <Loader2 className="h-14 w-14 text-blue-600 animate-spin mx-auto mb-4" />
                        <h1 className="text-xl font-semibold text-gray-900">Confirming your payment…</h1>
                        <p className="text-gray-500 mt-2">This only takes a moment.</p>
                    </>
                )}
                {state === 'success' && (
                    <>
                        <CheckCircle className="h-14 w-14 text-green-600 mx-auto mb-4" />
                        <h1 className="text-xl font-semibold text-gray-900">Payment confirmed</h1>
                        <p className="text-gray-500 mt-2 mb-6">Your order is now being processed.</p>
                        <Button onClick={() => router.push('/appointments')}>View my appointments</Button>
                    </>
                )}
                {state === 'failed' && (
                    <>
                        <XCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-semibold text-gray-900">We couldn't confirm this payment</h1>
                        <p className="text-gray-500 mt-2 mb-6">
                            If you were charged, it will be confirmed automatically shortly. You can
                            also retry from your appointments.
                        </p>
                        <Button variant="outline" onClick={() => router.push('/appointments')}>
                            Back to appointments
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
            <CallbackInner />
        </Suspense>
    );
}
