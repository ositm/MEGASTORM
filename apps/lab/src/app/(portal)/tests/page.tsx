'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { MedicalTest, LabTest } from '@lablink/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Search, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TestRow extends MedicalTest {
    isEnabled: boolean;
    customPrice: number;
}

export default function ManageTestsPage() {
    const { profile, loading: profileLoading } = useUserProfile();
    const { firestore } = useFirebase();

    const [tests, setTests] = useState<TestRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'enabled'>('all');

    useEffect(() => {
        const fetchData = async () => {
            if (!firestore || !profile?.labId) return;

            try {
                // 1. Fetch all catalog tests
                const catalogRef = collection(firestore, 'labTests');
                const catalogSnap = await getDocs(catalogRef);
                const catalogTests = catalogSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as MedicalTest[];

                // 2. Fetch lab's current tests
                const labRef = doc(firestore, 'labs', profile.labId);
                const labSnap = await getDoc(labRef);

                if (labSnap.exists()) {
                    const labData = labSnap.data();
                    const currentTests = (labData.tests || []) as LabTest[];

                    // 3. Merge data
                    const mergedTests = catalogTests.map(catalogTest => {
                        const existing = currentTests.find(t => t.testId === catalogTest.id || t.name === catalogTest.name);
                        return {
                            ...catalogTest,
                            isEnabled: !!existing,
                            customPrice: existing?.price || 0
                        };
                    });

                    // Sort by name
                    mergedTests.sort((a, b) => a.name.localeCompare(b.name));
                    setTests(mergedTests);
                }
            } catch (error) {
                console.error("Error fetching tests:", error);
                toast.error('Failed to load tests. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (!profileLoading && profile?.labId) {
            fetchData();
        } else if (!profileLoading && !profile?.labId) {
            setLoading(false); // No lab ID associated
        }
    }, [firestore, profile, profileLoading, toast]);

    const handleToggle = (testId: string, currentStatus: boolean) => {
        setTests(prev => prev.map(test =>
            test.id === testId ? { ...test, isEnabled: !currentStatus } : test
        ));
    };

    const handlePriceChange = (testId: string, price: string) => {
        const numPrice = parseInt(price.replace(/[^0-9]/g, '')) || 0;
        setTests(prev => prev.map(test =>
            test.id === testId ? { ...test, customPrice: numPrice } : test
        ));
    };

    const handleSave = async () => {
        if (!firestore || !profile?.labId) return;
        setSaving(true);

        try {
            const enabledTests = tests.filter(t => t.isEnabled);

            // Prepare data for Firestore
            const labTests: LabTest[] = enabledTests.map(t => ({
                testId: t.id,
                name: t.name,
                price: t.customPrice,
                description: t.description
            }));

            const availableTestIds = enabledTests.map(t => t.id);

            const labRef = doc(firestore, 'labs', profile.labId);
            await updateDoc(labRef, {
                tests: labTests,
                availableTestIds: availableTestIds
            });

            toast.success('Test catalog updated successfully.');
        } catch (error) {
            console.error("Error saving tests:", error);
            toast.error('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const filteredTests = tests.filter(test => {
        const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || (filter === 'enabled' && test.isEnabled);
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!profile?.labId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Lab Associated</h2>
                <p className="text-gray-500">Your account is not linked to any lab. Please contact support.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Tests</h1>
                    <p className="text-gray-500">Enable tests and set your prices.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search tests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        All Tests
                    </Button>
                    <Button
                        variant={filter === 'enabled' ? 'default' : 'outline'}
                        onClick={() => setFilter('enabled')}
                    >
                        Enabled ({tests.filter(t => t.isEnabled).length})
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4 w-20">Status</th>
                                <th className="px-6 py-4">Test Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 w-48">Price (₦)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTests.map((test) => (
                                <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <Switch
                                            checked={test.isEnabled}
                                            onCheckedChange={() => handleToggle(test.id, test.isEnabled)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {test.name}
                                        <p className="text-xs text-gray-500 font-normal truncate max-w-xs">
                                            {test.description}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                                            {test.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Input
                                            type="number"
                                            value={test.customPrice || ''}
                                            onChange={(e) => handlePriceChange(test.id, e.target.value)}
                                            disabled={!test.isEnabled}
                                            placeholder="0"
                                            className="w-32"
                                        />
                                    </td>
                                </tr>
                            ))}
                            {filteredTests.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No tests found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
