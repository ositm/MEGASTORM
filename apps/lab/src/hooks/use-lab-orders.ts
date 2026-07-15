import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Order } from '@lablink/core';

export type LabOrder = Order & { id: string };

/**
 * Live orders for the lab portal. lab_admin sees only their own lab's
 * orders (rules enforce it); platform admin sees all. Sorted newest first.
 */
export function useLabOrders() {
    const { firestore } = useFirebase();
    const { profile, loading: profileLoading } = useUserProfile();
    const [orders, setOrders] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || profileLoading) return;

        const ordersRef = collection(firestore, 'orders');
        const q =
            profile?.role === 'lab_admin' && profile.labId
                ? query(ordersRef, where('labId', '==', profile.labId))
                : profile?.role === 'admin'
                  ? query(ordersRef)
                  : null;

        if (!q) {
            setOrders([]);
            setLoading(false);
            return;
        }

        const unsub = onSnapshot(
            q,
            (snap) => {
                const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LabOrder));
                rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
                setOrders(rows);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching lab orders:', err);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [firestore, profile, profileLoading]);

    return { orders, loading };
}
