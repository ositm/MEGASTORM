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
    'handed_over', // passed to dispatch/lab
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
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/** Job statuses that are still available for a collector to accept. */
export const OPEN_JOB_STATUSES: readonly JobStatus[] = ['pending', 'offered'];

export function isJobOpen(status: JobStatus): boolean {
    return OPEN_JOB_STATUSES.includes(status);
}

// Collector-driven job actions and how each maps to a job status and the
// order custody event it records. `accept` is handled specially (assignment).
// The collector currently hands the sample directly to the lab; the separate
// dispatch leg (HANDED_TO_DISPATCH / DISPATCH_DELIVERED) arrives with the
// dispatch flow in a later milestone.
export type JobAction = 'accept' | 'arrive' | 'collect';

export const JOB_ACTIONS = ['accept', 'arrive', 'collect'] as const;

export const JOB_ACTION_MAP: Record<
    Exclude<JobAction, 'accept'>,
    { jobStatus: JobStatus; orderEvent: 'COLLECTOR_ARRIVED' | 'SAMPLE_COLLECTED' }
> = {
    arrive: { jobStatus: 'arrived', orderEvent: 'COLLECTOR_ARRIVED' },
    collect: { jobStatus: 'collected', orderEvent: 'SAMPLE_COLLECTED' },
};

export const JOB_ACTION_LABELS: Record<JobAction, string> = {
    accept: 'Accept job',
    arrive: 'Mark arrived',
    collect: 'Mark sample collected',
};

/** The next action a collector can take on a job in the given status. */
export function nextJobAction(status: JobStatus): JobAction | null {
    if (isJobOpen(status)) return 'accept';
    if (status === 'accepted') return 'arrive';
    if (status === 'arrived') return 'collect';
    return null;
}
