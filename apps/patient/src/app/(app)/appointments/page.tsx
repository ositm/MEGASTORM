'use client';

import { useEffect, useState } from 'react';
import { useFirebase, useUser } from '@/firebase/FirebaseProvider';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Booking } from '@lablink/core';
import { Calendar, Clock, MapPin, Beaker, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function AppointmentsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      if (!firestore || !user) return;

      try {
        const bookingsRef = collection(firestore, 'bookings');
        const q = query(
          bookingsRef,
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setBookings(fetchedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [firestore, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Appointments</h1>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Appointments Yet</h2>
          <p className="text-gray-500 mb-6">You haven't scheduled any lab tests yet.</p>
          <Button asChild>
            <a href="/find-a-lab">Book a Test</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-blue-600">
              <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{booking.testName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                      ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{booking.labName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{format(booking.date.toDate(), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{format(booking.date.toDate(), 'h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Beaker className="h-4 w-4" />
                      <span>₦{booking.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                  {booking.status === 'result_ready' ? (
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      View Results
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
