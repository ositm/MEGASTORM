import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase/provider';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export interface Result {
    id: string;
    labName: string;
    date: string;
    tests: string[];
    downloadUrl: string;
    userId: string;
}

export function useResults(limitCount?: number) {
    const { firestore, user } = useFirebase();
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchResults() {
            if (!firestore || !user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const resultsRef = collection(firestore, 'results');

                // Build query with proper constraint types
                let q = query(
                    resultsRef,
                    where('userId', '==', user.uid),
                    orderBy('date', 'desc')
                );

                if (limitCount) {
                    q = query(q, limit(limitCount));
                }

                const querySnapshot = await getDocs(q);

                const fetchedResults: Result[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // Handle date if it's a Timestamp
                    let dateStr = data.date;
                    if (data.date instanceof Timestamp) {
                        dateStr = data.date.toDate().toLocaleDateString();
                    }

                    fetchedResults.push({
                        id: doc.id,
                        labName: data.labName || 'Unknown Lab',
                        date: dateStr || new Date().toLocaleDateString(),
                        tests: data.tests || [],
                        downloadUrl: data.downloadUrl || '#',
                        userId: data.userId,
                    });
                });

                setResults(fetchedResults);
            } catch (err: any) {
                console.error('Error fetching results:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchResults();
    }, [firestore, user, limitCount]);

    return { results, loading, error };
}
