import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase/FirebaseProvider';
import { Courier } from '@lablink/core';

/** Live courier profile for the signed-in user (null if none yet). */
export function useCourierProfile() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [profile, setProfile] = useState<(Courier & { id: string }) | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user) {
            setLoading(false);
            return;
        }
        const unsub = onSnapshot(
            doc(firestore, 'couriers', user.uid),
            (snap) => {
                setProfile(snap.exists() ? ({ id: snap.id, ...snap.data() } as Courier & { id: string }) : null);
                setLoading(false);
            },
            (e) => {
                console.error('courier profile error:', e);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [firestore, user]);

    return { profile, loading };
}
