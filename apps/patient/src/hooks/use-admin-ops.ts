'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { useUserProfile } from '@/hooks/use-user-profile';
import { JobStatus } from '@lablink/core';

// Jobs holding a sample that hasn't reached a lab yet.
const IN_TRANSIT: JobStatus[] = ['accepted', 'arrived', 'collected', 'handed_over'];

export interface AdminOpsStats {
    pendingLabClaims: number;
    pendingCollectors: number;
    pendingCouriers: number;
    jobsInTransit: number;
}

/**
 * Live operational counts for the platform-admin dashboard: verification
 * queues that need a decision and samples currently in the field. Rules
 * restrict these collection reads to admins; the hook stays dormant for
 * everyone else.
 */
export function useAdminOps() {
    const { firestore } = useFirebase();
    const { profile, loading: profileLoading } = useUserProfile();
    const [stats, setStats] = useState<AdminOpsStats>({
        pendingLabClaims: 0,
        pendingCollectors: 0,
        pendingCouriers: 0,
        jobsInTransit: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || profileLoading) return;
        if (profile?.role !== 'admin') {
            setLoading(false);
            return;
        }

        const watches: Array<{ q: ReturnType<typeof query>; key: keyof AdminOpsStats }> = [
            { q: query(collection(firestore, 'lab_claims'), where('status', '==', 'pending')), key: 'pendingLabClaims' },
            { q: query(collection(firestore, 'collectors'), where('verificationStatus', '==', 'pending_review')), key: 'pendingCollectors' },
            { q: query(collection(firestore, 'couriers'), where('verificationStatus', '==', 'pending_review')), key: 'pendingCouriers' },
            { q: query(collection(firestore, 'jobs'), where('status', 'in', IN_TRANSIT)), key: 'jobsInTransit' },
        ];

        let arrived = 0;
        const unsubs = watches.map(({ q, key }) =>
            onSnapshot(
                q,
                (snap) => {
                    setStats((prev) => ({ ...prev, [key]: snap.size }));
                    if (arrived < watches.length) {
                        arrived += 1;
                        if (arrived >= watches.length) setLoading(false);
                    }
                },
                (err) => {
                    console.error(`Admin ops watch failed (${key}):`, err);
                    setLoading(false);
                }
            )
        );
        return () => unsubs.forEach((u) => u());
    }, [firestore, profile?.role, profileLoading]);

    return { stats, loading };
}
