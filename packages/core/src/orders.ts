import { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Chain of custody: an order's lifecycle is an append-only sequence of events.
// `Order.status` is always a projection of the latest event's type; only the
// server (Admin SDK) writes orders or events. See docs/ARCHITECTURE.md §4.
// ---------------------------------------------------------------------------

export const ORDER_EVENT_TYPES = [
    'ORDER_CREATED',
    'PAYMENT_CONFIRMED',
    'COLLECTOR_ASSIGNED',
    'COLLECTOR_ARRIVED',
    'SAMPLE_COLLECTED',
    'HANDED_TO_DISPATCH',
    'DISPATCH_DELIVERED',
    'LAB_RECEIVED',
    'TESTING_STARTED',
    'TESTING_COMPLETED',
    'RESULT_UPLOADED',
    'RESULT_VALIDATED',
    'RESULT_RELEASED',
    'PATIENT_NOTIFIED',
    'CANCELLED',
    'DISPUTED',
] as const;

export type OrderEventType = (typeof ORDER_EVENT_TYPES)[number];

/** Order.status mirrors the latest event type. */
export type OrderStatus = OrderEventType;

export type ActorRole = 'patient' | 'collector' | 'lab_admin' | 'lab_staff' | 'admin' | 'system';

export type OrderType = 'walk_in' | 'home_collection';

export interface OrderItem {
    /** Reference into the test catalog, when the item came from it. */
    testId?: string;
    name: string;
    price: number;
}

export interface Order {
    id?: string;
    patientId: string;
    labId: string;
    labName?: string;
    type: OrderType;
    items: OrderItem[];
    amount: number;
    currency: 'NGN';
    paymentStatus: 'unpaid' | 'paid' | 'refunded';
    paymentRef?: string;
    status: OrderStatus;
    /** Requested appointment / collection time. */
    scheduledFor?: Timestamp;
    /** Collection address, for home_collection orders. */
    address?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface OrderEvent {
    id?: string;
    type: OrderEventType;
    at: Timestamp;
    actor: { uid: string; role: ActorRole };
    /** Denormalized from the order so security rules stay cheap. */
    patientId: string;
    labId: string;
    /** Hash-chain pointer for tamper evidence; null on the first event. */
    prevEventId: string | null;
    location?: { latitude: number; longitude: number };
    sampleIds?: string[];
    meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Legal transitions. walk_in orders skip the collector/dispatch chain:
// after payment the patient brings themselves to the lab (LAB_RECEIVED).
// SAMPLE_COLLECTED -> LAB_RECEIVED covers collectors delivering in person.
// ---------------------------------------------------------------------------

export const ORDER_TRANSITIONS: Record<OrderEventType, readonly OrderEventType[]> = {
    ORDER_CREATED: ['PAYMENT_CONFIRMED', 'CANCELLED'],
    PAYMENT_CONFIRMED: ['COLLECTOR_ASSIGNED', 'LAB_RECEIVED', 'CANCELLED'],
    COLLECTOR_ASSIGNED: ['COLLECTOR_ARRIVED', 'COLLECTOR_ASSIGNED', 'CANCELLED'],
    COLLECTOR_ARRIVED: ['SAMPLE_COLLECTED', 'CANCELLED'],
    SAMPLE_COLLECTED: ['HANDED_TO_DISPATCH', 'LAB_RECEIVED'],
    HANDED_TO_DISPATCH: ['DISPATCH_DELIVERED'],
    DISPATCH_DELIVERED: ['LAB_RECEIVED'],
    LAB_RECEIVED: ['TESTING_STARTED'],
    TESTING_STARTED: ['TESTING_COMPLETED'],
    TESTING_COMPLETED: ['RESULT_UPLOADED'],
    RESULT_UPLOADED: ['RESULT_VALIDATED'],
    RESULT_VALIDATED: ['RESULT_RELEASED'],
    RESULT_RELEASED: ['PATIENT_NOTIFIED', 'DISPUTED'],
    PATIENT_NOTIFIED: ['DISPUTED'],
    CANCELLED: [],
    DISPUTED: [],
};

/** Which roles may append each event type (server enforces this). */
export const EVENT_ACTOR_ROLES: Record<OrderEventType, readonly ActorRole[]> = {
    ORDER_CREATED: ['patient'],
    PAYMENT_CONFIRMED: ['system', 'admin'],
    COLLECTOR_ASSIGNED: ['system', 'admin'],
    COLLECTOR_ARRIVED: ['collector'],
    SAMPLE_COLLECTED: ['collector'],
    HANDED_TO_DISPATCH: ['collector'],
    DISPATCH_DELIVERED: ['system', 'admin'],
    LAB_RECEIVED: ['lab_admin', 'lab_staff'],
    TESTING_STARTED: ['lab_admin', 'lab_staff'],
    TESTING_COMPLETED: ['lab_admin', 'lab_staff'],
    RESULT_UPLOADED: ['lab_admin', 'lab_staff'],
    RESULT_VALIDATED: ['lab_admin'],
    RESULT_RELEASED: ['lab_admin'],
    PATIENT_NOTIFIED: ['system'],
    CANCELLED: ['patient', 'admin'],
    DISPUTED: ['patient', 'admin'],
};

/** Patient-facing labels for each order status. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    ORDER_CREATED: 'Awaiting payment',
    PAYMENT_CONFIRMED: 'Paid — awaiting processing',
    COLLECTOR_ASSIGNED: 'Collector assigned',
    COLLECTOR_ARRIVED: 'Collector arrived',
    SAMPLE_COLLECTED: 'Sample collected',
    HANDED_TO_DISPATCH: 'Sample in transit',
    DISPATCH_DELIVERED: 'Delivered to lab',
    LAB_RECEIVED: 'Received by lab',
    TESTING_STARTED: 'Testing in progress',
    TESTING_COMPLETED: 'Testing completed',
    RESULT_UPLOADED: 'Result being reviewed',
    RESULT_VALIDATED: 'Result being reviewed',
    RESULT_RELEASED: 'Result ready',
    PATIENT_NOTIFIED: 'Result ready',
    CANCELLED: 'Cancelled',
    DISPUTED: 'Disputed',
};

export function canTransition(from: OrderStatus, to: OrderEventType): boolean {
    return (ORDER_TRANSITIONS[from] ?? []).includes(to);
}

export class IllegalTransitionError extends Error {
    constructor(
        public readonly from: OrderStatus,
        public readonly to: OrderEventType
    ) {
        super(`Illegal order transition: ${from} -> ${to}`);
        this.name = 'IllegalTransitionError';
    }
}

export function assertTransition(from: OrderStatus, to: OrderEventType): void {
    if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
}

export function roleMayEmit(role: ActorRole, type: OrderEventType): boolean {
    return EVENT_ACTOR_ROLES[type].includes(role);
}

/** True when the order can no longer change. */
export function isTerminal(status: OrderStatus): boolean {
    return ORDER_TRANSITIONS[status].length === 0;
}

/**
 * The next custody action a given role can take on an order in `status`,
 * if exactly one forward step is available to that role. Used to drive the
 * lab/collector portals' single-action buttons. Excludes CANCELLED/DISPUTED.
 */
export function nextActionFor(role: ActorRole, status: OrderStatus): OrderEventType | null {
    const candidates = (ORDER_TRANSITIONS[status] ?? []).filter(
        (t) => t !== 'CANCELLED' && t !== 'DISPUTED' && t !== status && roleMayEmit(role, t)
    );
    return candidates.length === 1 ? candidates[0] : null;
}

/** Human-readable label for the button that performs `type`. */
export const EVENT_ACTION_LABELS: Partial<Record<OrderEventType, string>> = {
    LAB_RECEIVED: 'Mark received',
    TESTING_STARTED: 'Start testing',
    TESTING_COMPLETED: 'Mark testing complete',
    RESULT_VALIDATED: 'Validate result',
    RESULT_RELEASED: 'Release to patient',
    COLLECTOR_ARRIVED: 'Mark arrived',
    SAMPLE_COLLECTED: 'Mark sample collected',
    HANDED_TO_DISPATCH: 'Hand to dispatch',
};
