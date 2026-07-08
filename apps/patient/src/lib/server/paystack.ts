import crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';

function secretKey(): string {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) throw new Error('PAYSTACK_SECRET_KEY is not configured');
    return key;
}

export interface PaystackInitResult {
    authorizationUrl: string;
    reference: string;
}

/** Initializes a transaction; amount is in the smallest currency unit (kobo). */
export async function initializeTransaction(params: {
    email: string;
    amountKobo: number;
    reference: string;
    callbackUrl: string;
    metadata?: Record<string, unknown>;
}): Promise<PaystackInitResult> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secretKey()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: params.email,
            amount: params.amountKobo,
            currency: 'NGN',
            reference: params.reference,
            callback_url: params.callbackUrl,
            metadata: params.metadata,
        }),
    });
    const body = await res.json();
    if (!res.ok || !body.status) {
        throw new Error(body.message || 'Paystack initialization failed');
    }
    return { authorizationUrl: body.data.authorization_url, reference: body.data.reference };
}

export interface PaystackVerifyResult {
    success: boolean;
    amountKobo: number;
    reference: string;
    metadata: Record<string, unknown>;
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResult> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${secretKey()}` },
    });
    const body = await res.json();
    if (!res.ok || !body.status) {
        throw new Error(body.message || 'Paystack verification failed');
    }
    return {
        success: body.data.status === 'success',
        amountKobo: body.data.amount,
        reference: body.data.reference,
        metadata: body.data.metadata || {},
    };
}

/** Validates a Paystack webhook body against the x-paystack-signature header. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const hash = crypto.createHmac('sha512', secretKey()).update(rawBody).digest('hex');
    // Constant-time compare to avoid leaking via timing.
    const a = Buffer.from(hash);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
