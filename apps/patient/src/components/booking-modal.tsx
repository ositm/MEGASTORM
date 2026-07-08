'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useUser } from '@/firebase/FirebaseProvider';
import { createOrderViaApi } from '@/lib/api-client';
import { Lab, LabTest } from '@lablink/core';
import { Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    lab: Lab;
    test: LabTest;
}

export default function BookingModal({ isOpen, onClose, lab, test }: BookingModalProps) {
    const { user } = useUser();
    const router = useRouter();

    const [date, setDate] = useState<Date | undefined>(new Date());
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleBooking = async () => {
        if (!date || !user) {
            setError("Please select a date and ensure you are logged in.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (!lab.id) {
                throw new Error('This lab cannot be booked yet.');
            }

            await createOrderViaApi(user, {
                labId: lab.id,
                labName: lab.name,
                type: 'walk_in',
                items: [{ testId: test.testId, name: test.name, price: test.price }],
                scheduledFor: date.toISOString(),
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
                router.push('/appointments');
            }, 2000);
        } catch (err: any) {
            console.error("Booking error:", err);
            setError("Failed to book appointment. Please try again. " + (err.message || ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Book Appointment</DialogTitle>
                    <DialogDescription>
                        Schedule your <strong>{test.name}</strong> at <strong>{lab.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900">Booking Confirmed!</h3>
                        <p className="text-gray-500 text-center mt-2">Redirecting to your appointments...</p>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border"
                                disabled={(date) => date < new Date()}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </div>
                )}

                {!success && (
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button onClick={handleBooking} disabled={!date || loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Booking...
                                </>
                            ) : (
                                'Confirm Booking'
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
