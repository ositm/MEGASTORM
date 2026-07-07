import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase/FirebaseProvider';
import { TestResult } from '@lablink/core';

export function useResults(limit?: number) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      if (!user || !firestore) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const resultsRef = collection(firestore, 'results');
        let q = query(
          resultsRef,
          where('userId', '==', user.uid)
          // orderBy('date', 'desc') // Removed to avoid index requirement
        );

        // Limit handled manually if needed, or apply limit after client-side sort if dataset is small
        // For now, we fetch all for the user (usually not too many)

        const snapshot = await getDocs(q);
        const fetchedResults = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as TestResult));

        // Sort client-side
        fetchedResults.sort((a, b) => {
          // Handle Timestamp objects or strings
          const dateA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date as any).getTime();
          const dateB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date as any).getTime();
          return dateB - dateA;
        });

        if (limit) {
          setResults(fetchedResults.slice(0, limit));
        } else {
          setResults(fetchedResults);
        }
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load results.");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [user, firestore, limit]);

  return { results, loading, error };
}
