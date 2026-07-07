'use client';

import { useEffect, useState } from 'react';
import { useFirebase, useFirestore } from '@/firebase/FirebaseProvider';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ShieldCheck } from 'lucide-react';

interface Lab {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    verified?: boolean;
    status?: string;
}

export default function AdminLabsPage() {
    const { firestore } = useFirebase();
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLabs = async () => {
        if (!firestore) return;
        setLoading(true);
        try {
            const labsCol = collection(firestore, 'labs');
            const snapshot = await getDocs(labsCol);
            const labsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lab));
            setLabs(labsData);
        } catch (error) {
            console.error('Error fetching labs:', error);
            toast.error('Failed to load labs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabs();
    }, [firestore]);

    const handleVerify = async (labId: string) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'labs', labId), { verified: true, status: 'active' });
            toast.success('Lab verified successfully');
            fetchLabs();
        } catch (error) {
            console.error('Verify error:', error);
            toast.error('Failed to verify lab');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading labs...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lab Verification</h1>
                    <p className="text-gray-500">Manage and verify laboratory accounts.</p>
                </div>
            </div>

            <div className="grid gap-4">
                {labs.map(lab => (
                    <Card key={lab.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 shadow-sm border-gray-100">
                        <div className="mb-4 md:mb-0">
                            <h3 className="font-semibold text-lg text-gray-900">{lab.name}</h3>
                            <div className="text-sm text-gray-500 space-y-1">
                                <p>{lab.email}</p>
                                <p>{lab.phone || 'No phone provided'}</p>
                                <p className="text-xs text-gray-400 mt-1">{lab.address || 'No address provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {lab.verified ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 h-8 px-3">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                </Badge>
                            ) : (
                                <>
                                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 h-8 px-3">Pending</Badge>
                                    <Button size="sm" onClick={() => handleVerify(lab.id)} className="gap-2 bg-green-600 hover:bg-green-700 shadow-sm">
                                        <CheckCircle className="w-4 h-4" /> Approve Lab
                                    </Button>
                                </>
                            )}
                        </div>
                    </Card>
                ))}
                {labs.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No labs found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
