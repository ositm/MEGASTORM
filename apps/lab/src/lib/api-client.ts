import type { User } from 'firebase/auth';
import type { JobAction, OrderEventType, OrderItem, OrderType, PartnerApplicationInput } from '@lablink/core';

async function apiPost<T>(user: User, path: string, body: unknown): Promise<T> {
    const token = await user.getIdToken();
    const res = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data as T;
}

export interface CreateOrderRequest {
    labId: string;
    labName?: string;
    type: OrderType;
    items: OrderItem[];
    scheduledFor?: string;
    address?: string;
}

export function createOrderViaApi(user: User, input: CreateOrderRequest): Promise<{ id: string }> {
    return apiPost(user, '/api/orders', input);
}

export function appendOrderEventViaApi(
    user: User,
    orderId: string,
    type: OrderEventType,
    meta?: Record<string, unknown>
): Promise<{ ok: true }> {
    return apiPost(user, `/api/orders/${orderId}/events`, { type, meta });
}

export function startOrderPaymentViaApi(user: User, orderId: string): Promise<{ authorizationUrl: string }> {
    return apiPost(user, `/api/orders/${orderId}/pay`, {});
}

export function verifyPaymentViaApi(
    user: User,
    reference: string
): Promise<{ confirmed: boolean; alreadyPaid?: boolean; orderId?: string }> {
    return apiPost(user, '/api/payments/verify', { reference });
}

export function advanceJobViaApi(user: User, jobId: string, action: JobAction): Promise<{ ok: true }> {
    return apiPost(user, `/api/jobs/${jobId}`, { action });
}

export function decideCollectorViaApi(
    user: User,
    uid: string,
    action: 'approve' | 'reject'
): Promise<{ ok: true }> {
    return apiPost(user, `/api/admin/collectors/${uid}`, { action });
}

export function decideLabClaimViaApi(
    user: User,
    claimId: string,
    action: 'approve' | 'reject'
): Promise<{ ok: true }> {
    return apiPost(user, `/api/admin/lab-claims/${claimId}`, { action });
}

export function addLabStaffViaApi(user: User, email: string): Promise<{ ok: true; uid: string }> {
    return apiPost(user, '/api/lab/staff', { action: 'add', email });
}

export function removeLabStaffViaApi(user: User, uid: string): Promise<{ ok: true }> {
    return apiPost(user, '/api/lab/staff', { action: 'remove', uid });
}

export interface PartnerApplicationResult {
    ok: true;
    id: string;
    reference: string;
    emailed: boolean;
}

export function submitPartnerApplicationViaApi(
    user: User,
    application: PartnerApplicationInput
): Promise<PartnerApplicationResult> {
    return apiPost(user, '/api/partner-applications', application);
}

export function decideCourierViaApi(
    user: User,
    uid: string,
    action: 'approve' | 'reject'
): Promise<{ ok: true }> {
    return apiPost(user, `/api/admin/couriers/${uid}`, { action });
}
