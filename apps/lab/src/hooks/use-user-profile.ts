import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/FirebaseProvider';

import { UserProfile } from '@lablink/core';

export function useUserProfile() {
    const { firestore, user } = useFirebase();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            if (!firestore || !user) {
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(firestore, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
                } else {
                    // If no profile exists, default to basic user
                    setProfile({
                        uid: user.uid,
                        email: user.email || '',
                        role: 'user'
                    });
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [firestore, user]);

    return { profile, loading };
}
