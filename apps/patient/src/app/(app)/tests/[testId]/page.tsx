'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { MedicalTest, Lab } from '@lablink/core';
import { ArrowLeft, Clock, FileText, Info, MapPin, Phone, Star, Beaker, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getWhatsAppLink } from '@/utils/whatsapp';

import { DEFAULT_TESTS } from '@/data/default-tests';

// ... (imports remain)

export default function TestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { firestore } = useFirebase();
    const [test, setTest] = useState<MedicalTest | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');



    useEffect(() => {
        const fetchTestAndLabs = async () => {
            // 1. Fetch Test
            const testId = Array.isArray(params.testId) ? params.testId[0] : params.testId;
            if (!testId) return;

            const defaultTest = DEFAULT_TESTS.find(t => t.id === testId);
            let foundTest: MedicalTest | null = defaultTest || null;

            if (firestore) {
                try {
                    const testRef = doc(firestore, 'labTests', testId);
                    const testSnap = await getDoc(testRef);
                    if (testSnap.exists()) {
                        foundTest = { id: testSnap.id, ...testSnap.data() } as MedicalTest;
                    }
                } catch (err) {
                    console.error("Error fetching test details:", err);
                }
            }

            if (foundTest) setTest(foundTest);
            else setError('Test not found');



            setLoading(false);
        };

        fetchTestAndLabs();
    }, [firestore, params.testId, searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !test) {
        // ... (Keep existing error UI, not modifying lines 83-93 in this chunk for safety)
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Not Found</h2>
                <Button onClick={() => router.push('/tests')}>Back to Catalog</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Button
                        variant="ghost"
                        className="mb-6 text-gray-600 hover:text-blue-600 pl-0"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                    {test.category}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{test.name}</h1>
                            <p className="text-xl text-gray-600 max-w-3xl">{test.description}</p>
                        </div>

                        <Button className="py-6 text-lg px-8" onClick={() => router.push('/find-a-lab')}>
                            Find a Lab
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Test Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Key Information */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-600" />
                                Key Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-50 p-2 rounded-lg">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Turnaround Time</p>
                                        <p className="text-gray-600">{test.turnaroundTime}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="bg-purple-50 p-2 rounded-lg">
                                        <Beaker className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Sample Type</p>
                                        <p className="text-gray-600">{test.sampleType}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="bg-green-50 p-2 rounded-lg">
                                        <FileText className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Preparation</p>
                                        <p className="text-gray-600">{test.preparation}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Common Uses */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Common Uses</h2>
                            <ul className="space-y-2">
                                {test.commonUses.map((use, index) => (
                                    <li key={index} className="flex items-center gap-2 text-gray-700">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                        {use}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Find a Provider</h2>
                            <div className="bg-blue-50 rounded-xl border border-blue-100 p-8 text-center">
                                <p className="text-lg text-gray-700 mb-6">
                                    Compare prices and locations to find the best lab for your <strong>{test.name}</strong>.
                                </p>
                                <Link href="/find-a-lab">
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                                        Find a Lab Near You
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Quick Actions / Summary (Optional, maybe for future ads or related tests) */}
                    <div className="space-y-6">
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                            <h3 className="font-bold text-blue-900 mb-2">Need Help?</h3>
                            <p className="text-blue-700 text-sm mb-4">
                                Not sure if this is the right test for you? Consult with a doctor first.
                            </p>
                            <Button variant="outline" className="w-full bg-white text-blue-600 border-blue-200 hover:bg-blue-50">
                                Talk to a Doctor (Coming Soon)
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
