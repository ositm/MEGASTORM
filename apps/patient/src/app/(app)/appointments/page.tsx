'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebase, useUser } from '@/firebase/FirebaseProvider';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Order, OrderStatus, ORDER_STATUS_LABELS, canTransition } from '@lablink/core';
import { appendOrderEventViaApi, startOrderPaymentViaApi } from '@/lib/api-client';
import { Calendar, Clock, MapPin, Beaker } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type OrderRow = Order & { id: string };

const READY_STATUSES: OrderStatus[] = ['RESULT_RELEASED', 'PATIENT_NOTIFIED'];

function statusClasses(status: OrderStatus): string {
  if (status === 'ORDER_CREATED') return 'bg-yellow-100 text-yellow-800';
  if (status === 'CANCELLED' || status === 'DISPUTED') return 'bg-gray-100 text-gray-700';
  if (READY_STATUSES.includes(status)) return 'bg-green-100 text-green-800';
  return 'bg-blue-100 text-blue-800';
}

export default function AppointmentsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!firestore || !user) return;
    try {
      const q = query(collection(firestore, 'orders'), where('patientId', '==', user.uid));
      const snapshot = await getDocs(q);
      const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OrderRow));
      // Sort newest first client-side (createdAt is a Timestamp).
      rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setOrders(rows);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [firestore, user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePay = async (order: OrderRow) => {
    if (!user) return;
    setPaying(order.id);
    try {
      const { authorizationUrl } = await startOrderPaymentViaApi(user, order.id);
      window.location.href = authorizationUrl;
    } catch (e: any) {
      toast.error(e.message || 'Could not start payment');
      setPaying(null);
    }
  };

  const handleCancel = async (order: OrderRow) => {
    if (!user) return;
    setCancelling(order.id);
    try {
      await appendOrderEventViaApi(user, order.id, 'CANCELLED', { reason: 'patient_cancelled' });
      toast.success('Appointment cancelled');
      await fetchOrders();
    } catch (e: any) {
      toast.error(e.message || 'Could not cancel');
    } finally {
      setCancelling(null);
    }
  };

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

      {orders.length === 0 ? (
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
          {orders.map((order) => {
            const title = order.items?.map((i) => i.name).join(', ') || 'Lab test';
            const canCancel = canTransition(order.status, 'CANCELLED');
            const isReady = READY_STATUSES.includes(order.status);
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-blue-600">
                <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses(order.status)}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{order.labName || 'Lab'}</span>
                      </div>
                      {order.scheduledFor && (
                        <>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{format(order.scheduledFor.toDate(), 'MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{format(order.scheduledFor.toDate(), 'h:mm a')}</span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Beaker className="h-4 w-4" />
                        <span>₦{order.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                    {order.status === 'ORDER_CREATED' && order.paymentStatus !== 'paid' && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={paying === order.id}
                        onClick={() => handlePay(order)}
                      >
                        {paying === order.id ? 'Redirecting…' : `Pay ₦${order.amount.toLocaleString()}`}
                      </Button>
                    )}
                    {isReady ? (
                      <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                        <a href="/results">View Results</a>
                      </Button>
                    ) : canCancel ? (
                      <Button
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        disabled={cancelling === order.id}
                        onClick={() => handleCancel(order)}
                      >
                        {cancelling === order.id ? 'Cancelling…' : 'Cancel'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
