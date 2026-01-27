'use client';

import { DEFAULT_TESTS, DEFAULT_PACKAGES } from '@/data/default-tests';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase/provider';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { MedicalTest, TestPackage } from '@/types';
import { Search, Beaker, Package, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const categories = [
    'All',
    'Imaging',
    'Haematology',
    'Clinical Chemistry',
    'Microbiology',
    'Immunology/Serology',
    'Hormonal Assays',
    'Tumor Markers',
    'Coagulation Profile',
    'Cardiac Markers',
    'Urinalysis',
    'Stool Tests',
    'Genetic/Molecular',
    'Special Tests',
    'Marriage Tests (Church)'
];

export default function TestsPage() {
    const { firestore } = useFirebase();
    const [tests, setTests] = useState<MedicalTest[]>([]);
    const [packages, setPackages] = useState<TestPackage[]>([]);
    const [filteredTests, setFilteredTests] = useState<MedicalTest[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tests' | 'packages'>('packages');

    const searchParams = useSearchParams();
    const labId = searchParams.get('labId');
    const [lab, setLab] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // Default to our hardcoded data initially
            let loadedTests = DEFAULT_TESTS;
            let loadedPackages = DEFAULT_PACKAGES;

            // Fetch Lab if labId is present
            let currentLab: any = null;
            if (labId) {
                if (firestore) {
                    try {
                        const labRef = doc(firestore, 'labs', labId);
                        const labSnap = await getDoc(labRef);
                        if (labSnap.exists()) {
                            currentLab = { id: labSnap.id, ...labSnap.data() };
                        }
                    } catch (e) {
                        console.error("Error fetching lab", e);
                    }
                }

                // Fallback / Mock for lab if not found or no firestore (for demo consistency)
                if (!currentLab) {
                    // Try to find in our mock labs if we had them, OR just generic fallback name
                    // For now, we rely on firestore or just show generic if failed
                }
                setLab(currentLab);
            }

            if (firestore) {
                try {
                    // Fetch tests
                    const testsQuery = query(collection(firestore, 'labTests'), orderBy('name'));
                    const testsSnapshot = await getDocs(testsQuery);
                    const testsData = testsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as MedicalTest[];

                    if (testsData.length > 0) {
                        loadedTests = testsData;
                    }

                    // Fetch packages
                    const packagesQuery = query(collection(firestore, 'testPackages'));
                    const packagesSnapshot = await getDocs(packagesQuery);
                    const packagesData = packagesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as TestPackage[];

                    if (packagesData.length > 0) {
                        loadedPackages = packagesData;
                    }
                } catch (error) {
                    console.error('Error fetching data, using defaults:', error);
                }
            }

            // Filter by Lab if applicable
            if (currentLab && currentLab.availableTestIds) {
                loadedTests = loadedTests.filter(t => currentLab.availableTestIds.includes(t.id));
                // Note: Packages might not be strictly linked in this simple data model, 
                // but we could filter if we had package IDs in the lab.
                // For now, let's show all packages or assumption is they are generic.
                // Or better: Filter strictly? Let's filter tests strictly.
            } else if (currentLab && currentLab.tests) {
                // If lab has explicit 'tests' array (from Google Places or custom structure), use that to find matches
                // This is fuzzy matching if IDs don't align, but let's try ID match first
                const labTestIds = currentLab.tests.map((t: any) => t.testId).filter(Boolean);
                if (labTestIds.length > 0) {
                    loadedTests = loadedTests.filter(t => labTestIds.includes(t.id));
                }
            }

            setTests(loadedTests);
            setPackages(loadedPackages);
            setFilteredTests(loadedTests);
            setLoading(false);
        };

        fetchData();
    }, [firestore, labId]);

    useEffect(() => {
        let filtered = tests;

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(test => test.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(test =>
                test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                test.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredTests(filtered);
    }, [selectedCategory, searchQuery, tests]);

    const popularPackages = packages.filter(pkg => pkg.popular);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {lab ? (
                        <div className="mb-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg inline-flex items-center gap-4 border border-white/20">
                            <span className="font-medium">Showing tests available at <strong>{lab.name}</strong></span>
                            <Link href="/tests">
                                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-8">
                                    Clear Filter
                                </Button>
                            </Link>
                        </div>
                    ) : null}
                    <h1 className="text-4xl font-bold mb-4">Medical Test Catalog</h1>
                    <p className="text-xl text-blue-100 mb-8">
                        Browse our comprehensive catalog of medical tests and packages
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search for tests (e.g., Blood Sugar, HIV, Thyroid)..."
                                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b">
                    <button
                        onClick={() => setActiveTab('packages')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors ${activeTab === 'packages'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-blue-600'
                            }`}
                    >
                        <Package className="h-5 w-5" />
                        Test Packages
                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-sm">
                            {packages.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('tests')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors ${activeTab === 'tests'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-blue-600'
                            }`}
                    >
                        <Beaker className="h-5 w-5" />
                        Individual Tests
                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-sm">
                            {tests.length}
                        </span>
                    </button>
                </div>

                {/* Test Packages Tab */}
                {activeTab === 'packages' && (
                    <div>
                        {/* Popular Packages */}
                        {popularPackages.length > 0 && (
                            <div className="mb-12">
                                <div className="flex items-center gap-2 mb-6">
                                    <TrendingUp className="h-6 w-6 text-blue-600" />
                                    <h2 className="text-2xl font-bold text-gray-900">Popular Packages</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {popularPackages.map(pkg => (
                                        <Link key={pkg.id} href={`/tests/packages/${pkg.id}`}>
                                            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 cursor-pointer border-2 border-blue-100">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="text-4xl">{pkg.icon}</div>
                                                    {/* Discount badge removed */}
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                                                <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-500">
                                                        {pkg.tests.length} tests
                                                    </div>
                                                    <span className="text-blue-600 font-semibold text-sm">View Details →</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Packages */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Test Packages</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {packages.map(pkg => (
                                    <Link key={pkg.id} href={`/tests/packages/${pkg.id}`}>
                                        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 cursor-pointer">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="text-4xl">{pkg.icon}</div>
                                                {/* Discount badge removed */}
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{pkg.description}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-500">
                                                    {pkg.tests.length} tests
                                                </div>
                                                <span className="text-blue-600 font-semibold text-sm">View Details →</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Individual Tests Tab */}
                {activeTab === 'tests' && (
                    <div>
                        {/* Category Filter */}
                        <div className="mb-8">
                            <div className="flex flex-wrap gap-2">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-full font-medium transition-colors ${selectedCategory === category
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Results Count */}
                        <div className="mb-6">
                            <p className="text-gray-600">
                                Showing <span className="font-semibold">{filteredTests.length}</span> test{filteredTests.length !== 1 ? 's' : ''}
                                {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                                {searchQuery && ` matching "${searchQuery}"`}
                            </p>
                        </div>

                        {/* Tests Grid */}
                        {filteredTests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTests.map(test => (
                                    <Link key={test.id} href={`/tests/${test.id}${labId ? `?labId=${labId}` : ''}`}>
                                        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 cursor-pointer">
                                            <div className="flex items-start justify-between mb-3">
                                                <Beaker className="h-8 w-8 text-blue-600" />
                                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                                    {test.category}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">{test.name}</h3>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{test.description}</p>
                                            <div className="space-y-2 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Sample:</span>
                                                    <span>{test.sampleType}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Results:</span>
                                                    <span>{test.turnaroundTime}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Beaker className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No tests found matching your criteria</p>
                                <Button
                                    onClick={() => {
                                        setSelectedCategory('All');
                                        setSearchQuery('');
                                    }}
                                    className="mt-4"
                                    variant="outline"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
