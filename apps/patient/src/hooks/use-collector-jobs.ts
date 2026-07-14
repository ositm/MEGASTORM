import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase/FirebaseProvider';
import { Job, OPEN_JOB_STATUSES } from '@lablink/core';

export type JobRow = Job & { id: string };

/**
 * Live jobs for the collector portal: open jobs anyone can accept, plus the
 * jobs assigned to this collector. Two queries because Firestore can't OR
 * across different fields; merged and de-duplicated here.
 */
export function useCollectorJobs() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [open, setOpen] = useState<JobRow[]>([]);
    const [mine, setMine] = useState<JobRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user) return;
        const jobsRef = collection(firestore, 'jobs');

        const unsubOpen = onSnapshot(
            query(jobsRef, where('status', 'in', OPEN_JOB_STATUSES as unknown as string[])),
            (snap) => {
                setOpen(snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobRow)));
                setLoading(false);
            },
            (e) => {
                console.error('open jobs error:', e);
                setLoading(false);
            }
        );

        const unsubMine = onSnapshot(
            query(jobsRef, where('collectorId', '==', user.uid)),
            (snap) => setMine(snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobRow))),
            (e) => console.error('my jobs error:', e)
        );

        return () => {
            unsubOpen();
            unsubMine();
        };
    }, [firestore, user]);

    // Active jobs the collector still needs to work. Keep 'collected' (so they
    // can hand over to dispatch); drop terminal states.
    const activeMine = mine
        .filter((j) => !['handed_over', 'delivered', 'cancelled'].includes(j.status))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

    return { open, mine: activeMine, loading };
}
