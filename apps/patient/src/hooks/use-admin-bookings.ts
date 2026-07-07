import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { useUserProfile } from '@/hooks/use-user-profile';

export interface AdminBooking {
    id: string;
    userName: string;
    testName: string;
    date: any;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'result_ready' | 'processing';
    price: number;
    labId: string;
    [key: string]: any;
}

export function useAdminBookings() {
    const { firestore, user } = useFirebase();
    const { profile, loading: profileLoading } = useUserProfile();
    const [bookings, setBookings] = useState<AdminBooking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user || profileLoading) return;

        let q;
        const bookingsRef = collection(firestore, 'bookings');

        if (profile?.role === 'lab_admin' && profile.labId) {
            // Filter for specific lab
            q = query(
                bookingsRef,
                where('labId', '==', profile.labId)
                // orderBy('createdAt', 'desc') // Removed to avoid index requirement
            );
        } else {
            // Super admin or fallback: show all
            q = query(bookingsRef, orderBy('createdAt', 'desc'));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedBookings = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date?.toDate ? data.date.toDate().toLocaleDateString() : data.date,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
                } as unknown as AdminBooking;
            });

            // Sort client-side
            fetchedBookings.sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            });

            setBookings(fetchedBookings);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching admin bookings:", error);
            // If index error for compound query, we might need to handle it
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user, profile, profileLoading]);

    const updateStatus = async (id: string, newStatus: AdminBooking['status']) => {
        if (!firestore) return;

        try {
            const bookingRef = doc(firestore, 'bookings', id);
            await updateDoc(bookingRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating booking status:", error);
            alert("Failed to update status");
        }
    };

    return { bookings, updateStatus, loading };
}
