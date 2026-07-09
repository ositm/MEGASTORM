'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useOrderJob } from '@/hooks/use-order-job';
import TrackingMap from '@/components/map/tracking-map';
import { estimateEta, isJobTrackable } from '@lablink/core';
import { formatDistanceToNow } from 'date-fns';
import { Navigation } from 'lucide-react';

interface Props {
    orderId: string | null;
    open: boolean;
    onClose: () => void;
}

export default function TrackCollectorModal({ orderId, open, onClose }: Props) {
    const { job, loading } = useOrderJob(open ? orderId : null);
    const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // The patient is usually at the collection point while tracking, so their
    // location is the ETA destination. Captured client-side, never stored.
    useEffect(() => {
        if (!open || typeof navigator === 'undefined' || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setMyLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => setMyLocation(null),
            { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 }
        );
    }, [open]);

    const eta =
        job?.collectorLocation && myLocation && isJobTrackable(job.status)
            ? estimateEta(job.collectorLocation, myLocation)
            : null;

    const statusText =
        job?.status === 'accepted'
            ? 'Your collector is on the way.'
            : job?.status === 'arrived'
              ? 'Your collector has arrived.'
              : job?.status === 'collected' || job?.status === 'handed_over'
                ? 'Your sample has been collected.'
                : 'Waiting for a collector to be assigned.';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Track your collector</DialogTitle>
                    <DialogDescription>{statusText}</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="h-[320px] flex items-center justify-center text-gray-500">Loading…</div>
                ) : (
                    <div className="space-y-3">
                        {eta && (
                            <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 text-blue-700 py-3 font-medium">
                                <Navigation className="h-4 w-4" />
                                About {eta.minutes} min away · {eta.distanceKm} km
                            </div>
                        )}
                        <TrackingMap position={job?.collectorLocation ?? null} />
                        {job?.locationUpdatedAt?.toDate && (
                            <p className="text-xs text-gray-400 text-center">
                                Location updated {formatDistanceToNow(job.locationUpdatedAt.toDate(), { addSuffix: true })}
                            </p>
                        )}
                        {eta && (
                            <p className="text-[11px] text-gray-400 text-center">
                                Estimated from straight-line distance — actual time may vary with traffic.
                            </p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
