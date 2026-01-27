import { Timestamp } from 'firebase/firestore';

// Medical test from catalog
export interface MedicalTest {
    id: string;
    name: string;
    category: string;
    description: string;
    preparation: string;
    sampleType: string;
    turnaroundTime: string;
    commonUses: string[];
}

// Test offered by a lab (with pricing)
export interface LabTest {
    name: string;
    price: number;
    description?: string;
    testId?: string; // Reference to MedicalTest
    category?: string;
}

// Test package/bundle
export interface TestPackage {
    id: string;
    name: string;
    description: string;
    tests: string[]; // Array of test IDs
    category: string;
    icon: string;
    popular: boolean;
    estimatedPrice: number;
    discount: number;
}

export interface Lab {
    id?: string;
    name: string;
    address: string;
    description?: string;
    imageUrl?: string;
    rating?: number;
    latitude: number;
    longitude: number;
    isOpen?: boolean;
    tests?: LabTest[];
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
    reviewCount?: number;
    website?: string;
    googleMapsUrl?: string;
    types?: string[];
    distance?: number; // Distance in km from user location
    availableTestIds?: string[]; // Array of test IDs for efficient querying
    phone_number?: string;
    formatted_address?: string;
}

export interface Booking {
    id?: string;
    userId: string;
    labId: string;
    labName: string;
    testName: string;
    price: number;
    date: Timestamp;
    status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'result_ready';
    createdAt: Timestamp;
}

export interface TestResult {
    id: string;
    userId: string;
    labName: string;
    testName: string;
    date: Timestamp;
    status: 'normal' | 'abnormal';
    aiSummary: string;
    fileUrl: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    role?: 'admin' | 'lab_admin' | 'user';
    labId?: string;
    preferences?: {
        emailNotifications: boolean;
        smsNotifications: boolean;
    };
}
