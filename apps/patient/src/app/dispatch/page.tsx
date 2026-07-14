'use client';

import { useState } from 'react';
import { useDispatchJobs, JobRow } from '@/hooks/use-dispatch-jobs';
import { useUser } from '@/firebase/FirebaseProvider';
import { advanceJobViaApi } from '@/lib/api-client';
import { JOB_ACTION_LABELS } from '@lablink/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, MapPin, Building2, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DispatchPage() {
    const { available, mine, loading } = useDispatchJobs();
    const { user } = useUser();
    const [busyId, setBusyId] = useState<string | null>(null);

    const deliver = async (job: JobRow) => {
        if (!user) return;
        setBusyId(job.id);
        try {
            await advanceJobViaApi(user, job.id, 'dispatch_deliver');
            toast.success('Marked delivered to lab');
        } catch (e: any) {
            toast.error(e.message || 'Could not update');
        } finally {
            setBusyId(null);
        }
    };

    const delivered = mine.filter((j) => j.status === 'delivered');

    const Row = ({ job, action }: { job: JobRow; action?: boolean }) => (
        <Card>
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Package className="h-4 w-4" /> Order #{job.orderId.slice(0, 6)}
                    </div>
                    {job.address && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                            <MapPin className="h-4 w-4" /> Picked up at {job.address}
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                        <Building2 className="h-4 w-4" /> Deliver to lab {job.labId}
                    </div>
                </div>
                {action ? (
                    <Button disabled={busyId === job.id} onClick={() => deliver(job)}>
                        {busyId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : JOB_ACTION_LABELS.dispatch_deliver}
                    </Button>
                ) : (
                    <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" /> Delivered
                    </span>
                )}
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
                <p className="text-gray-500 mt-1">Collect samples handed over by collectors and deliver them to the lab.</p>
            </div>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Awaiting delivery</h2>
                {available.length === 0 ? (
                    <p className="text-gray-400 text-sm">No samples awaiting delivery.</p>
                ) : (
                    available.map((job) => <Row key={job.id} job={job} action />)
                )}
            </section>

            {delivered.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Delivered by you</h2>
                    {delivered.map((job) => <Row key={job.id} job={job} />)}
                </section>
            )}
        </div>
    );
}
