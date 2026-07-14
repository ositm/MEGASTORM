import { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Collectors are verified lab scientists who perform home sample collection.
// A Job is the unit of work offered to and executed by a collector; it tracks
// the physical collection leg that feeds the order's chain of custody.
// ---------------------------------------------------------------------------

export type CollectorVerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';

export interface Collector {
    uid: string;
    displayName?: string;
    phone?: string;
    verificationStatus: CollectorVerificationStatus;
    online?: boolean;
    rating?: number;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export type CollectorDocumentType = 'government_id' | 'practicing_license' | 'qualification';
export type DocumentReviewStatus = 'pending' | 'approved' | 'rejected';

export interface CollectorDocument {
    id?: string;
    type: CollectorDocumentType;
    fileUrl: string;
    status: DocumentReviewStatus;
    uploadedAt: Timestamp;
    reviewedBy?: string;
    note?: string;
}

// Job lifecycle mirrors the collector-side custody events but is a separate,
// operational status the collector app filters on.
export const JOB_STATUSES = [
    'pending', // created, not yet offered/accepted
    'offered', // sent to one or more nearby collectors
    'accepted', // a collector took it
    'arrived', // collector reached the patient
    'collected', // sample taken
    'handed_over', // passed to dispatch, awaiting pickup/delivery
    'delivered', // dispatch delivered to the lab
    'cancelled',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export interface Job {
    id?: string;
    orderId: string;
    patientId: string;
    labId: string;
    status: JobStatus;
    address?: string;
    location?: { latitude: number; longitude: number };
    collectorId?: string | null;
    /** Assigned dispatch courier, set when a handed-over job is picked up. */
    dispatchId?: string | null;
    /** Live collector position, updated by the collector during an active job. */
    collectorLocation?: { latitude: number; longitude: number };
    locationUpdatedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/** Job statuses during which the collector shares live location. */
export const TRACKABLE_JOB_STATUSES: readonly JobStatus[] = ['accepted', 'arrived'];

export function isJobTrackable(status: JobStatus): boolean {
    return TRACKABLE_JOB_STATUSES.includes(status);
}

/** Job statuses that are still available for a collector to accept. */
export const OPEN_JOB_STATUSES: readonly JobStatus[] = ['pending', 'offered'];

export function isJobOpen(status: JobStatus): boolean {
    return OPEN_JOB_STATUSES.includes(status);
}

// Job actions and how each maps to a job status and the order custody event
// it records. `accept` and `dispatch_pickup` are handled specially (they
// assign a worker rather than emit a custody event via the shared map).
//
// The collector may hand a collected sample directly to the lab (lab posts
// LAB_RECEIVED) OR hand it to a dispatch courier (`handover`); a dispatch then
// delivers it to the lab (`dispatch_deliver`).
export type JobAction = 'accept' | 'arrive' | 'collect' | 'handover' | 'dispatch_deliver';

export const JOB_ACTIONS = ['accept', 'arrive', 'collect', 'handover', 'dispatch_deliver'] as const;

export const JOB_ACTION_MAP: Record<
    Exclude<JobAction, 'accept'>,
    { jobStatus: JobStatus; orderEvent: 'COLLECTOR_ARRIVED' | 'SAMPLE_COLLECTED' | 'HANDED_TO_DISPATCH' | 'DISPATCH_DELIVERED' }
> = {
    arrive: { jobStatus: 'arrived', orderEvent: 'COLLECTOR_ARRIVED' },
    collect: { jobStatus: 'collected', orderEvent: 'SAMPLE_COLLECTED' },
    handover: { jobStatus: 'handed_over', orderEvent: 'HANDED_TO_DISPATCH' },
    dispatch_deliver: { jobStatus: 'delivered', orderEvent: 'DISPATCH_DELIVERED' },
};

export const JOB_ACTION_LABELS: Record<JobAction, string> = {
    accept: 'Accept job',
    arrive: 'Mark arrived',
    collect: 'Mark sample collected',
    handover: 'Hand to dispatch',
    dispatch_deliver: 'Mark delivered to lab',
};

/** The next action a collector can take on a job in the given status. */
export function nextJobAction(status: JobStatus): JobAction | null {
    if (isJobOpen(status)) return 'accept';
    if (status === 'accepted') return 'arrive';
    if (status === 'arrived') return 'collect';
    if (status === 'collected') return 'handover'; // optional dispatch route
    return null;
}

/** Job statuses a dispatch courier can pick up (awaiting delivery). */
export const DISPATCHABLE_JOB_STATUSES: readonly JobStatus[] = ['handed_over'];

/** The next action a dispatch courier can take on a job. */
export function nextDispatchAction(status: JobStatus): JobAction | null {
    if (status === 'handed_over') return 'dispatch_deliver';
    return null;
}
