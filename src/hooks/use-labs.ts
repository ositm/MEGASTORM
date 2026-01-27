
import { useState, useCallback } from 'react';
import { LabResponseItem } from '@/app/api/labs/search/route';

interface SearchParams {
    city?: string;
    state?: string;
    keyword?: string;
    type?: string;
    open_now?: boolean;
    rating?: number;
    pageToken?: string;
}

interface UseLabSearchResult {
    labs: LabResponseItem[];
    loading: boolean;
    error: string | null;
    nextPageToken: string | null;
    searchLabs: (params: SearchParams) => Promise<void>;
    loadMore: () => Promise<void>;
}

export function useLabSearch(): UseLabSearchResult {
    const [labs, setLabs] = useState<LabResponseItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [lastParams, setLastParams] = useState<SearchParams>({});

    const searchLabs = useCallback(async (params: SearchParams) => {
        setLoading(true);
        setError(null);
        setLastParams(params);

        try {
            const queryParams = new URLSearchParams();
            if (params.city) queryParams.append('city', params.city);
            if (params.state) queryParams.append('state', params.state);
            if (params.keyword) queryParams.append('keyword', params.keyword);
            if (params.type) queryParams.append('type', params.type);
            if (params.open_now) queryParams.append('open_now', 'true');
            if (params.rating) queryParams.append('rating', params.rating.toString());
            if (params.pageToken) queryParams.append('pageToken', params.pageToken);

            const response = await fetch(`/api/labs/search?${queryParams.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch labs');
            }

            const data = await response.json();

            if (params.pageToken) {
                setLabs(prev => [...prev, ...data.labs]);
            } else {
                setLabs(data.labs);
            }

            setNextPageToken(data.nextPageToken || null);
        } catch (err: any) {
            console.error("Lab Search Error:", err);
            setError(err.message || 'An error occurred while fetching labs');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (nextPageToken) {
            await searchLabs({ ...lastParams, pageToken: nextPageToken });
        }
    }, [nextPageToken, lastParams, searchLabs]);

    return { labs, loading, error, nextPageToken, searchLabs, loadMore };
}
