import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase/FirebaseProvider';
import { Collector } from '@lablink/core';

/** Live collector profile for the signed-in user (null if none yet). */
export function useCollectorProfile() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [profile, setProfile] = useState<(Collector & { id: string }) | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user) {
            setLoading(false);
            return;
        }
        const unsub = onSnapshot(
            doc(firestore, 'collectors', user.uid),
            (snap) => {
                setProfile(snap.exists() ? ({ id: snap.id, ...snap.data() } as Collector & { id: string }) : null);
                setLoading(false);
            },
            (e) => {
                console.error('collector profile error:', e);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [firestore, user]);

    return { profile, loading };
}
