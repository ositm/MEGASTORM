import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase/FirebaseProvider';
import { Job } from '@lablink/core';

export type JobRow = Job & { id: string };

/**
 * Live jobs for the dispatch portal: samples handed over and awaiting
 * delivery, plus the ones this courier has delivered. Two rules-valid
 * queries merged here.
 */
export function useDispatchJobs() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [available, setAvailable] = useState<JobRow[]>([]);
    const [mine, setMine] = useState<JobRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user) return;
        const jobsRef = collection(firestore, 'jobs');

        const unsubAvail = onSnapshot(
            query(jobsRef, where('status', '==', 'handed_over')),
            (snap) => {
                setAvailable(snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobRow)));
                setLoading(false);
            },
            (e) => {
                console.error('dispatch available error:', e);
                setLoading(false);
            }
        );
        const unsubMine = onSnapshot(
            query(jobsRef, where('dispatchId', '==', user.uid)),
            (snap) => setMine(snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobRow))),
            (e) => console.error('dispatch mine error:', e)
        );

        return () => {
            unsubAvail();
            unsubMine();
        };
    }, [firestore, user]);

    return { available, mine, loading };
}
