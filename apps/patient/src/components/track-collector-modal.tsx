'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useOrderJob } from '@/hooks/use-order-job';
import TrackingMap from '@/components/map/tracking-map';
import { formatDistanceToNow } from 'date-fns';

interface Props {
    orderId: string | null;
    open: boolean;
    onClose: () => void;
}

export default function TrackCollectorModal({ orderId, open, onClose }: Props) {
    const { job, loading } = useOrderJob(open ? orderId : null);

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
                        <TrackingMap position={job?.collectorLocation ?? null} />
                        {job?.locationUpdatedAt?.toDate && (
                            <p className="text-xs text-gray-400 text-center">
                                Location updated {formatDistanceToNow(job.locationUpdatedAt.toDate(), { addSuffix: true })}
                            </p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
