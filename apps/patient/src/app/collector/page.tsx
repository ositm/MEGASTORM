'use client';

import { useState } from 'react';
import { useCollectorJobs, JobRow } from '@/hooks/use-collector-jobs';
import { useUser } from '@/firebase/FirebaseProvider';
import { advanceJobViaApi } from '@/lib/api-client';
import { JobAction, JOB_ACTION_LABELS, nextJobAction } from '@lablink/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CollectorJobsPage() {
    const { open, mine, loading } = useCollectorJobs();
    const { user } = useUser();
    const [busyId, setBusyId] = useState<string | null>(null);

    const act = async (job: JobRow, action: JobAction) => {
        if (!user) return;
        setBusyId(job.id);
        try {
            await advanceJobViaApi(user, job.id, action);
            toast.success(JOB_ACTION_LABELS[action]);
        } catch (e: any) {
            toast.error(e.message || 'Could not update job');
        } finally {
            setBusyId(null);
        }
    };

    const JobCard = ({ job }: { job: JobRow }) => {
        const next = nextJobAction(job.status);
        return (
            <Card>
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                            <Package className="h-4 w-4" /> Order #{job.orderId.slice(0, 6)}
                        </div>
                        {job.address && (
                            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                <MapPin className="h-4 w-4" /> {job.address}
                            </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1 capitalize">Status: {job.status}</div>
                    </div>
                    {next && (
                        <Button disabled={busyId === job.id} onClick={() => act(job, next)}>
                            {busyId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : JOB_ACTION_LABELS[next]}
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Collection Jobs</h1>
                <p className="text-gray-500 mt-1">Accept nearby requests and record each step of the collection.</p>
            </div>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">My active jobs</h2>
                {mine.length === 0 ? (
                    <p className="text-gray-400 text-sm">You have no active jobs.</p>
                ) : (
                    mine.map((job) => <JobCard key={job.id} job={job} />)
                )}
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Available jobs</h2>
                {open.length === 0 ? (
                    <p className="text-gray-400 text-sm">No open jobs right now.</p>
                ) : (
                    open.map((job) => <JobCard key={job.id} job={job} />)
                )}
            </section>
        </div>
    );
}
