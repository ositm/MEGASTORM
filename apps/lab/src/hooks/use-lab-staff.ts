import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { useUserProfile } from '@/hooks/use-user-profile';

export interface StaffMember {
    id: string;
    uid: string;
    email: string;
}

/** Live staff roster for the lab admin's own lab. */
export function useLabStaff() {
    const { firestore } = useFirebase();
    const { profile, loading: profileLoading } = useUserProfile();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || profileLoading) return;
        if (profile?.role !== 'lab_admin' || !profile.labId) {
            setStaff([]);
            setLoading(false);
            return;
        }
        const unsub = onSnapshot(
            collection(firestore, 'labs', profile.labId, 'staff'),
            (snap) => {
                setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffMember)));
                setLoading(false);
            },
            (e) => {
                console.error('lab staff error:', e);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [firestore, profile, profileLoading]);

    return { staff, loading };
}
