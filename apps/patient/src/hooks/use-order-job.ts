import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase/FirebaseProvider';
import { Job } from '@lablink/core';

/**
 * Live job for one of the patient's orders (for tracking). Subscribes to the
 * patient's jobs and picks the one for this order, so collector location
 * updates stream in.
 */
export function useOrderJob(orderId: string | null) {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [job, setJob] = useState<(Job & { id: string }) | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user || !orderId) {
            setLoading(false);
            return;
        }
        const q = query(collection(firestore, 'jobs'), where('patientId', '==', user.uid));
        const unsub = onSnapshot(
            q,
            (snap) => {
                const match = snap.docs.find((d) => d.data().orderId === orderId);
                setJob(match ? ({ id: match.id, ...match.data() } as Job & { id: string }) : null);
                setLoading(false);
            },
            (e) => {
                console.error('order job error:', e);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [firestore, user, orderId]);

    return { job, loading };
}
