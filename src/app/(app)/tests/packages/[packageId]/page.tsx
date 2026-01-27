'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { TestPackage, MedicalTest, Lab } from '@/types';
import { ArrowLeft, CheckCircle2, Info, Package, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { DEFAULT_PACKAGES, DEFAULT_TESTS } from '@/data/default-tests';

// ... (imports remain)

export default function PackageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { firestore } = useFirebase();
    const [pkg, setPkg] = useState<TestPackage | null>(null);
    const [includedTests, setIncludedTests] = useState<MedicalTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPackageDetails = async () => {
            const packageId = Array.isArray(params.packageId) ? params.packageId[0] : params.packageId;
            if (!packageId) return;

            // Default fallback
            const defaultPkg = DEFAULT_PACKAGES.find(p => p.id === packageId);
            let foundPkg: TestPackage | null = defaultPkg || null;
            let foundTests: MedicalTest[] = [];

            if (firestore) {
                try {
                    // 1. Fetch Package Details
                    const pkgRef = doc(firestore, 'testPackages', packageId);
                    const pkgSnap = await getDoc(pkgRef);

                    if (pkgSnap.exists()) {
                        foundPkg = { id: pkgSnap.id, ...pkgSnap.data() } as TestPackage;
                    }

                    // 2. Fetch Included Tests Details
                    if (foundPkg && foundPkg.tests && foundPkg.tests.length > 0) {
                        const testsPromises = foundPkg.tests.map(testId =>
                            getDoc(doc(firestore, 'labTests', testId))
                        );

                        const testsSnaps = await Promise.all(testsPromises);
                        foundTests = testsSnaps
                            .filter(snap => snap.exists())
                            .map(snap => ({ id: snap.id, ...snap.data() } as MedicalTest));
                    }

                } catch (err) {
                    console.error("Error fetching package details:", err);
                }
            }

            // Fallback for tests if not found in Firestore or if Firestore failed
            if (foundPkg && foundTests.length === 0 && foundPkg.tests.length > 0) {
                foundTests = foundPkg.tests.map(testId =>
                    DEFAULT_TESTS.find(t => t.id === testId)
                ).filter(Boolean) as MedicalTest[];
            }

            if (foundPkg) {
                setPkg(foundPkg);
                setIncludedTests(foundTests);
            } else {
                setError('Package not found');
            }
            setLoading(false);
        };

        fetchPackageDetails();
    }, [firestore, params.packageId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !pkg) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Not Found</h2>
                <p className="text-gray-600 mb-6">{error || "The requested package could not be found."}</p>
                <Button onClick={() => router.push('/tests')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Catalog
                </Button>
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
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-4xl">{pkg.icon}</span>
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                    {pkg.category}
                                </span>
                                {pkg.popular && (
                                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                        <ShieldCheck className="h-4 w-4" />
                                        Popular Choice
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{pkg.name}</h1>
                            <p className="text-xl text-gray-600 max-w-3xl">{pkg.description}</p>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 min-w-[300px]">
                            <Button className="w-full text-lg py-6" onClick={() => router.push(`/find-a-lab?packageId=${pkg.id}`)}>
                                Book This Package
                            </Button>
                            <p className="text-xs text-center text-gray-500 mt-3">
                                *Contact lab for pricing
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Included Tests */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="p-6 border-b bg-gray-50">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    Included Tests ({includedTests.length})
                                </h2>
                            </div>
                            <div className="divide-y">
                                {includedTests.map((test) => (
                                    <div key={test.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                                            <div>
                                                <Link href={`/tests/${test.id}`} className="hover:underline">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{test.name}</h3>
                                                </Link>
                                                <p className="text-gray-600 text-sm mb-2">{test.description}</p>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                                        Sample: {test.sampleType}
                                                    </span>
                                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                                        TAT: {test.turnaroundTime}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-600" />
                                Why choose this package?
                            </h3>
                            <ul className="space-y-4 text-gray-600">
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600 font-bold text-sm">1</div>
                                    <span>Comprehensive assessment of your health status</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600 font-bold text-sm">2</div>
                                    <span>Cost-effective compared to individual tests</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600 font-bold text-sm">3</div>
                                    <span>Early detection of potential health issues</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
