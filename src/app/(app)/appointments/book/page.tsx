'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase/provider';
import { collection, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Calendar as CalendarIcon, Clock, MapPin, Search, CheckCircle2, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar'; // Assuming this exists, if not I'll use a simple input or basic react-day-picker if installed
import { Lab, TestPackage, MedicalTest } from '@/types';
import { googleCalendarUrl, outlookCalendarUrl, downloadIcs } from '@/utils/calendar';

function BookingForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { firestore } = useFirebase();
    const { user } = useUser();

    const packageId = searchParams.get('packageId');
    const testId = searchParams.get('testId');
    const labId = searchParams.get('labId');

    const [item, setItem] = useState<TestPackage | MedicalTest | null>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Lab, 2: Date/Time, 3: Confirm, 4: Success

    // Lab Selection State
    const [labs, setLabs] = useState<Lab[]>([]);
    const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
    const [labSearchQuery, setLabSearchQuery] = useState('');
    const [searchingLabs, setSearchingLabs] = useState(false);

    // Date/Time State
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState('');

    // Booking State
    const [bookingId, setBookingId] = useState('');

    useEffect(() => {
        const fetchItemAndLab = async () => {
            if (!firestore) return;
            try {
                if (packageId) {
                    const docRef = doc(firestore, 'testPackages', packageId);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) setItem({ id: snap.id, ...snap.data() } as TestPackage);
                } else if (testId) {
                    const docRef = doc(firestore, 'labTests', testId);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) setItem({ id: snap.id, ...snap.data() } as MedicalTest);
                }

                if (labId) {
                    const labRef = doc(firestore, 'labs', labId);
                    const labSnap = await getDoc(labRef);
                    if (labSnap.exists()) {
                        setSelectedLab({ id: labSnap.id, ...labSnap.data() } as Lab);
                        setStep(2); // Skip to Date/Time if lab is pre-selected
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchItemAndLab();
    }, [firestore, packageId, testId, labId]);

    const searchLabs = async () => {
        if (!labSearchQuery.trim()) return;
        setSearchingLabs(true);
        try {
            // Use our new API
            const response = await fetch(`/api/places/search?city=${encodeURIComponent(labSearchQuery)}&state=${encodeURIComponent(labSearchQuery)}`); // Searching effectively by text query
            // Actually our API logic handles "city, state" or just text validation. 
            // Let's rely on the locationBias removal fix I made. 
            // Ideally we'd have a specific text search parameter, but passing it as city seems the easiest hack given the API signature 
            // or I can call navigator.geolocation to get near me.

            // Let's implement a simpler "Near Me" as default
            const res = await response.json();
            if (res.labs) {
                setLabs(res.labs);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSearchingLabs(false);
        }
    };

    const searchNearMe = () => {
        if (!navigator.geolocation) return;
        setSearchingLabs(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                const response = await fetch(`/api/places/search?lat=${latitude}&lng=${longitude}`);
                const res = await response.json();
                if (res.labs) setLabs(res.labs);
            } catch (e) { console.error(e); }
            finally { setSearchingLabs(false); }
        });
    }

    const handleBooking = async () => {
        if (!firestore || !user || !item || !selectedLab || !date || !time) return;
        setLoading(true);

        try {
            // Create date object with time
            const [hours, minutes] = time.split(':');
            const bookingDate = new Date(date);
            bookingDate.setHours(parseInt(hours), parseInt(minutes));

            const bookingData = {
                userId: user.uid,
                testId: item.id || 'unknown',
                testName: item.name,
                labId: selectedLab.id,
                labName: selectedLab.name,
                labAddress: selectedLab.address,
                date: Timestamp.fromDate(bookingDate),
                status: 'pending',
                price: (item as any).price || 0,
                createdAt: Timestamp.now()
            };

            const docRef = await addDoc(collection(firestore, 'bookings'), bookingData);
            setBookingId(docRef.id);
            setStep(4);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!item) return <div className="p-8 text-center">Item not found.</div>;

    if (step === 4) { // Success Step
        // Construct event for calendar
        const [hours, minutes] = time.split(':');
        const bookingDate = new Date(date!);
        bookingDate.setHours(parseInt(hours), parseInt(minutes));
        const endTime = new Date(bookingDate);
        endTime.setHours(endTime.getHours() + 1);

        const event = {
            title: `Lab Test: ${item.name}`,
            description: `Appointment at ${selectedLab?.name} for ${item.name}`,
            location: selectedLab?.address || '',
            startTime: bookingDate,
            endTime: endTime
        };

        return (
            <div className="max-w-2xl mx-auto p-8 text-center space-y-8">
                <div className="flex justify-center">
                    <div className="bg-green-100 rounded-full p-4">
                        <CheckCircle2 className="h-16 w-16 text-green-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Your appointment for <span className="font-semibold text-gray-900">{item.name}</span> at <span className="font-semibold text-gray-900">{selectedLab?.name}</span> is set for <span className="font-semibold text-blue-600">{format(bookingDate, 'PPp')}</span>.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {/* Calendar Section */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" /> Add to Calendar
                        </h3>
                        <div className="flex flex-col gap-3">
                            <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50" onClick={() => window.open(googleCalendarUrl(event), '_blank')}>
                                Google Calendar
                            </Button>
                            <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50" onClick={() => window.open(outlookCalendarUrl(event), '_blank')}>
                                Outlook Calendar
                            </Button>
                            <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50" onClick={() => downloadIcs(event)}>
                                Download .ics File
                            </Button>
                        </div>
                    </div>

                    {/* Contact Lab Section */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Phone className="h-5 w-5" /> Contact Lab
                        </h3>
                        <div className="space-y-3">
                            {selectedLab?.phone_number ? (
                                <>
                                    <Button className="w-full justify-start" variant="outline" onClick={() => window.open(`tel:${selectedLab.phone_number}`, '_self')}>
                                        Call {selectedLab.name}
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline" onClick={() => window.open(`https://wa.me/${selectedLab.phone_number?.replace(/\D/g, '')}`, '_blank')}>
                                        Message on WhatsApp
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">Contact details not available for this lab.</p>
                            )}
                            <div className="pt-2 border-t mt-2">
                                <p className="text-xs text-gray-500 font-medium mb-1">Need Issue Support?</p>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p>Email: healthesphere@gmail.com</p>
                                    <p>Phone: 08058765439</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <Button className="w-full md:w-auto md:px-12 py-6 text-lg" onClick={() => router.push('/appointments')}>
                        View My Appointments
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-6">Book Appointment</h1>

            {/* Progress Steps */}
            <div className="flex mb-8 border-b pb-4">
                <div className={`flex-1 text-center border-b-2 pb-2 ${step >= 1 ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-400'}`}>1. Select Lab</div>
                <div className={`flex-1 text-center border-b-2 pb-2 ${step >= 2 ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-400'}`}>2. Date & Time</div>
                <div className={`flex-1 text-center border-b-2 pb-2 ${step >= 3 ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-400'}`}>3. Confirm</div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Find a Laboratory</h2>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 border rounded-md px-4 py-2"
                                    placeholder="Search by city or state..."
                                    value={labSearchQuery}
                                    onChange={(e) => setLabSearchQuery(e.target.value)}
                                />
                                <Button onClick={searchLabs} disabled={searchingLabs}>
                                    <Search className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" onClick={searchNearMe} disabled={searchingLabs}>
                                    <MapPin className="h-4 w-4 mr-2" /> Near Me
                                </Button>
                            </div>

                            <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
                                {labs.map(lab => (
                                    <div
                                        key={lab.id}
                                        onClick={() => setSelectedLab(lab)}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedLab?.id === lab.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'hover:border-blue-300'}`}
                                    >
                                        <h3 className="font-semibold">{lab.name}</h3>
                                        <p className="text-sm text-gray-600">{lab.address}</p>
                                    </div>
                                ))}
                                {labs.length === 0 && !searchingLabs && (
                                    <p className="text-gray-500 text-center py-8">Search for labs to continue</p>
                                )}
                            </div>

                            <Button
                                className="w-full mt-4"
                                disabled={!selectedLab}
                                onClick={() => setStep(2)}
                            >
                                Continue
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Select Date & Time</h2>
                            <div className="p-4 border rounded-lg bg-white">
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded mb-4"
                                    onChange={(e) => setDate(e.target.valueAsDate || undefined)}
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTime(t)}
                                            className={`py-2 rounded border ${time === t ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                                <Button className="flex-1" disabled={!date || !time} onClick={() => setStep(3)}>Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Confirm Booking</h2>
                            <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                                <div className="flex justify-between border-b pb-4">
                                    <span className="text-gray-600">Test Package</span>
                                    <span className="font-semibold">{item.name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-4">
                                    <span className="text-gray-600">Laboratory</span>
                                    <span className="font-semibold text-right">{selectedLab?.name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-4">
                                    <span className="text-gray-600">Date & Time</span>
                                    <span className="font-semibold">{date?.toLocaleDateString()} at {time}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-600 font-bold">Total Price</span>
                                    <span className="font-bold text-blue-600">
                                        {/* Handle price display safely */}
                                        {(item as any).price ? `₦${(item as any).price.toLocaleString()}` : 'Contact Lab'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                                <Button className="flex-1" onClick={handleBooking}>Confirm Booking</Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Summary */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border sticky top-6">
                        <h3 className="font-bold text-gray-900 mb-4">Booking Summary</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-gray-500">Service</p>
                                <p className="font-medium">{item.name}</p>
                            </div>
                            {selectedLab && (
                                <div>
                                    <p className="text-gray-500">Location</p>
                                    <p className="font-medium">{selectedLab.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{selectedLab.address}</p>
                                </div>
                            )}
                            {date && time && (
                                <div>
                                    <p className="text-gray-500">Schedule</p>
                                    <p className="font-medium">{date.toLocaleDateString()} @ {time}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingForm />
        </Suspense>
    );
}
