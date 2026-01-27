'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { Lab, LabTest } from '@/types';
import { ArrowLeft, MapPin, Phone, Clock, Star, Beaker, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LabProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { firestore } = useFirebase();
    const [lab, setLab] = useState<Lab | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLab = async () => {
            if (!params.labId) return;

            try {
                const labId = Array.isArray(params.labId) ? params.labId[0] : params.labId;

                // 1. Try Firestore first
                if (firestore) {
                    const docRef = doc(firestore, 'labs', labId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setLab({ id: docSnap.id, ...docSnap.data() } as Lab);
                        setLoading(false);
                        return;
                    }
                }

                // 2. If not in Firestore, try Google Places API via our backend
                const response = await fetch(`/api/labs/${labId}`);
                if (response.ok) {
                    const googleLab = await response.json();
                    setLab(googleLab);

                    // Add a default "General Inquiry" test for booking if no tests exist
                    // This allows the user to verify the calendar/booking flow
                    if (!googleLab.tests || googleLab.tests.length === 0) {
                        setLab(prev => ({
                            ...prev!,
                            tests: [
                                {
                                    name: "General Consultation",
                                    price: 5000,
                                    description: "Initial consultation with a medical professional.",
                                    testId: "general-consultation",
                                    category: "Consultation"
                                },
                                {
                                    name: "Full Blood Count (FBC)",
                                    price: 3500,
                                    description: "Comprehensive blood test to check overall health.",
                                    testId: "fbc",
                                    category: "Pathology"
                                },
                                {
                                    name: "Malaria Parasite Test",
                                    price: 2000,
                                    description: "Microscopic examination for malaria parasites.",
                                    testId: "mp",
                                    category: "Pathology"
                                },
                                {
                                    name: "X-Ray (Chest)",
                                    price: 8000,
                                    description: "Digital chest X-ray imaging.",
                                    testId: "xray-chest",
                                    category: "Imaging"
                                },
                                {
                                    name: "Abdominal Ultrasound scan",
                                    price: 12000,
                                    description: "Ultrasound imaging of the abdominal organs.",
                                    testId: "uss-abdomen",
                                    category: "Imaging"
                                },
                                {
                                    name: "MRI Scan (Brain)",
                                    price: 85000,
                                    description: "Magnetic Resonance Imaging of the brain.",
                                    testId: "mri-brain",
                                    category: "Imaging"
                                },
                                {
                                    name: "Lipid Profile",
                                    price: 7000,
                                    description: "Cholesterol an triglyceride levels check.",
                                    testId: "lipid-profile",
                                    category: "Pathology"
                                },
                                {
                                    name: "Executive Health Check",
                                    price: 45000,
                                    description: "Comprehensive screening package.",
                                    testId: "exec-check",
                                    category: "Screening Packages"
                                }
                            ]
                        }));
                    }
                } else {
                    setError('Lab not found');
                }

            } catch (err) {
                console.error("Error fetching lab:", err);
                setError('Failed to load lab details');
            } finally {
                setLoading(false);
            }
        };

        fetchLab();
    }, [firestore, params.labId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !lab) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Lab Not Found</h2>
                <p className="text-gray-600 mb-6">{error || "The requested lab could not be found."}</p>
                <Button onClick={() => router.push('/home')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero Section */}
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

                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <h1 className="text-3xl font-bold text-gray-900">{lab.name}</h1>
                            {lab.rating && lab.rating > 0 && (
                                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                                    <span className="ml-1 font-semibold text-blue-900">{lab.rating}</span>
                                    {lab.reviewCount && lab.reviewCount > 0 && (
                                        <span className="ml-1 text-blue-600 text-sm">({lab.reviewCount} reviews)</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 text-gray-600">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span>{lab.address}</span>
                            </div>
                            {lab.phone && lab.phone !== 'N/A' && (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                        <a href={`tel:${lab.phone}`} className="hover:text-blue-600">{lab.phone}</a>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                        onClick={() => {
                                            const cleanPhone = lab.phone!.replace(/\D/g, '');
                                            const phoneWithCode = cleanPhone.startsWith('234') ? cleanPhone : `234${cleanPhone.replace(/^0/, '')}`;
                                            window.open(`https://wa.me/${phoneWithCode}`, '_blank');
                                        }}
                                    >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        WhatsApp
                                    </Button>
                                </div>
                            )}
                            {lab.website && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                    <a
                                        href={lab.website.startsWith('http') ? lab.website : `https://${lab.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        Visit Website
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact & Actions Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                <div className="bg-white rounded-xl shadow-lg border p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Contact Direct</h3>
                        <div className="flex gap-2">
                            {lab.phone && (
                                <>
                                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => {
                                        const cleanPhone = lab.phone!.replace(/\D/g, '');
                                        const phoneWithCode = cleanPhone.startsWith('234') ? cleanPhone : `234${cleanPhone.replace(/^0/, '')}`;
                                        window.open(`https://wa.me/${phoneWithCode}`, '_blank');
                                    }}>
                                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                                    </Button>
                                    <Button variant="outline" className="flex-1" onClick={() => window.open(`tel:${lab.phone}`, '_self')}>
                                        <Phone className="mr-2 h-4 w-4" /> Call
                                    </Button>
                                </>
                            )}
                            {(!lab.phone || lab.phone === 'N/A') && (
                                <p className="text-gray-500 italic">No direct contact available</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Location</h3>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mt-0.5 text-blue-600" />
                            <p>{lab.address}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Book Appointment</h3>
                        <Link href={`/tests?labId=${lab.id}`} className="w-full">
                            <Button className="w-full text-lg shadow-md bg-blue-700 hover:bg-blue-800">
                                Browse & Book Tests
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tests Section Link (Simpler now) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Services</h2>
                <div className="bg-blue-50 rounded-xl p-8 border border-blue-100 inline-block max-w-2xl w-full">
                    <Beaker className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <p className="text-lg text-gray-700 mb-6">
                        Explore the full list of medical tests and packages available at <strong>{lab.name}</strong>.
                    </p>
                    <Link href={`/tests?labId=${lab.id}`}>
                        <Button variant="outline" size="lg" className="border-blue-600 text-blue-700 hover:bg-blue-50">
                            View Full Catalog
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
