'use client';

import { useState } from 'react';
import { useLocationSharing } from '@/hooks/use-location-sharing';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';

/** Toggle for a collector to share live location during an active job. */
export function LocationShare({ jobId }: { jobId: string }) {
    const [enabled, setEnabled] = useState(false);
    const { sharing, error } = useLocationSharing(jobId, enabled);

    return (
        <div className="space-y-1">
            <Button
                type="button"
                variant={enabled ? 'default' : 'outline'}
                size="sm"
                className={enabled ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setEnabled((v) => !v)}
            >
                {enabled && sharing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                    <MapPin className="h-4 w-4 mr-1" />
                )}
                {enabled ? 'Sharing location' : 'Share live location'}
            </Button>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
