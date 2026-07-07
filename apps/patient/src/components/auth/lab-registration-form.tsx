'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Lab {
    id: string;
    name: string;
}

export function LabRegistrationForm() {
    const router = useRouter();
    const { user, firestore, isUserLoading } = useFirebase();
    const [labs, setLabs] = useState<Lab[]>([]);
    const [selectedLabId, setSelectedLabId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [existingClaim, setExistingClaim] = useState(false);

    useEffect(() => {
        if (!firestore || !user) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Check for existing claims
                const claimsRef = collection(firestore, 'lab_claims');
                const q = query(claimsRef, where('userId', '==', user.uid));
                const claimSnap = await getDocs(q);

                if (!claimSnap.empty) {
                    setExistingClaim(true);
                    setLoading(false);
                    return;
                }

                // 2. Fetch Labs
                const labsRef = collection(firestore, 'labs');
                const labsSnap = await getDocs(labsRef);
                const fetchedLabs = labsSnap.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setLabs(fetchedLabs);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load labs.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [firestore, user]);

    const handleSubmit = async () => {
        if (!selectedLabId || !user || !firestore) return;
        setSubmitting(true);
        setError(null);

        try {
            const selectedLab = labs.find(l => l.id === selectedLabId);

            await addDoc(collection(firestore, 'lab_claims'), {
                userId: user.uid,
                userEmail: user.email,
                labId: selectedLabId,
                labName: selectedLab?.name || 'Unknown',
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            setSuccess(true);
        } catch (err) {
            console.error("Error submitting claim:", err);
            setError("Failed to submit request. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (isUserLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 relative">
                            <Image src="/lab-link-logo.png" alt="Logo" fill className="object-contain" />
                        </div>
                        <CardTitle>Partner with LabLink</CardTitle>
                        <CardDescription>
                            To register your lab, please sign in or create an account first.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button asChild className="w-full">
                            <Link href="/auth/signin?redirect=/auth/lab-registration">Sign In</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/auth/signup?redirect=/auth/lab-registration">Create Account</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (existingClaim) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CheckCircle className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
                        <CardTitle>Request Pending</CardTitle>
                        <CardDescription>
                            You have already submitted a request to manage a lab.
                            Our team is reviewing your application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link href="/home">Go to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
                        <CardTitle>Request Submitted!</CardTitle>
                        <CardDescription>
                            Your request to manage <strong>{labs.find(l => l.id === selectedLabId)?.name}</strong> has been received.
                            We will notify you via email once approved.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/home">Return Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Claim Your Lab</CardTitle>
                    <CardDescription>
                        Select the lab you wish to manage. You will need to provide verification documents later.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Select Lab</Label>
                        <Select onValueChange={setSelectedLabId} value={selectedLabId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Search for your lab..." />
                            </SelectTrigger>
                            <SelectContent>
                                {labs.map((lab) => (
                                    <SelectItem key={lab.id} value={lab.id}>
                                        {lab.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={!selectedLabId || submitting}
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Claim
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
