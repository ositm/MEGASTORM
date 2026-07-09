import { useEffect, useState, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/FirebaseProvider';

const MIN_UPDATE_MS = 10_000; // throttle writes to at most one per 10s

/**
 * While `enabled`, watches the device's geolocation and writes throttled
 * updates to the job's collectorLocation (allowed for the assigned collector
 * by the security rules). Returns the sharing state and any error.
 */
export function useLocationSharing(jobId: string | null, enabled: boolean) {
    const { firestore } = useFirebase();
    const [error, setError] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);
    const lastWrite = useRef(0);

    useEffect(() => {
        if (!enabled || !jobId || !firestore) {
            setSharing(false);
            return;
        }
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setError('Location is not available on this device.');
            return;
        }

        setError(null);
        const watchId = navigator.geolocation.watchPosition(
            async (pos) => {
                const now = Date.now();
                if (now - lastWrite.current < MIN_UPDATE_MS) return;
                lastWrite.current = now;
                setSharing(true);
                try {
                    await updateDoc(doc(firestore, 'jobs', jobId), {
                        collectorLocation: {
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                        },
                        locationUpdatedAt: serverTimestamp(),
                    });
                } catch (e: any) {
                    console.error('location update failed:', e);
                    setError('Could not update location.');
                }
            },
            (geoErr) => {
                setError(geoErr.code === geoErr.PERMISSION_DENIED ? 'Location permission denied.' : 'Could not get your location.');
                setSharing(false);
            },
            { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
            setSharing(false);
        };
    }, [enabled, jobId, firestore]);

    return { sharing, error };
}
