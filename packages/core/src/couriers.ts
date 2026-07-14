import { Timestamp } from 'firebase/firestore';
import { CollectorVerificationStatus, DocumentReviewStatus } from './collectors';

// Dispatch couriers carry samples between collectors and labs. Onboarding
// mirrors collectors: self-register + upload documents -> admin verifies ->
// dispatch custom claim granted.

export interface Courier {
    uid: string;
    displayName?: string;
    phone?: string;
    vehicleType?: string;
    verificationStatus: CollectorVerificationStatus;
    rating?: number;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export type CourierDocumentType = 'government_id' | 'drivers_license';

export interface CourierDocument {
    id?: string;
    type: CourierDocumentType;
    fileUrl: string;
    status: DocumentReviewStatus;
    uploadedAt: Timestamp;
    reviewedBy?: string;
    note?: string;
}
