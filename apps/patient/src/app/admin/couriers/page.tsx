'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase/FirebaseProvider';
import { decideCourierViaApi } from '@/lib/api-client';
import { Courier, CourierDocument } from '@lablink/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Applicant = Courier & { id: string; documents: (CourierDocument & { id: string })[] };

export default function AdminCouriersPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        if (!firestore) return;
        const q = query(collection(firestore, 'couriers'), where('verificationStatus', '==', 'pending_review'));
        const unsub = onSnapshot(q, async (snap) => {
            const rows = await Promise.all(
                snap.docs.map(async (d) => {
                    const docsSnap = await getDocs(collection(firestore, 'couriers', d.id, 'documents'));
                    return {
                        id: d.id,
                        ...d.data(),
                        documents: docsSnap.docs.map((x) => ({ id: x.id, ...x.data() } as CourierDocument & { id: string })),
                    } as Applicant;
                })
            );
            setApplicants(rows);
            setLoading(false);
        });
        return () => unsub();
    }, [firestore]);

    const decide = async (uid: string, action: 'approve' | 'reject') => {
        if (!user) return;
        setBusyId(uid);
        try {
            await decideCourierViaApi(user, uid, action);
            toast.success(action === 'approve' ? 'Courier approved' : 'Application rejected');
        } catch (e: any) {
            toast.error(e.message || 'Could not update');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Courier Verification</h1>
                <p className="text-gray-500 mt-2">Review applications and approve verified dispatch couriers.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
            ) : applicants.length === 0 ? (
                <p className="text-gray-500">No pending applications.</p>
            ) : (
                <div className="space-y-4">
                    {applicants.map((a) => (
                        <Card key={a.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">{a.displayName || 'Unnamed applicant'}</CardTitle>
                                <p className="text-sm text-gray-500">{a.phone}{a.vehicleType ? ` · ${a.vehicleType}` : ''}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    {a.documents.map((doc) => (
                                        <a
                                            key={doc.id}
                                            href={doc.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline border rounded px-3 py-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {doc.type.replace(/_/g, ' ')}
                                        </a>
                                    ))}
                                    {a.documents.length === 0 && <span className="text-sm text-gray-400">No documents uploaded.</span>}
                                </div>
                                <div className="flex gap-3">
                                    <Button className="bg-green-600 hover:bg-green-700" disabled={busyId === a.id} onClick={() => decide(a.id, 'approve')}>
                                        <Check className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" disabled={busyId === a.id} onClick={() => decide(a.id, 'reject')}>
                                        <X className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
