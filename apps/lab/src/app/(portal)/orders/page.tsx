'use client';

import { useState } from 'react';
import { useLabOrders } from '@/hooks/use-lab-orders';
import { useUser } from '@/firebase/FirebaseProvider';
import { appendOrderEventViaApi } from '@/lib/api-client';
import {
    OrderStatus,
    ORDER_STATUS_LABELS,
    EVENT_ACTION_LABELS,
    nextActionFor,
} from '@lablink/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function statusVariant(status: OrderStatus): string {
    if (status === 'ORDER_CREATED') return 'bg-yellow-100 text-yellow-800';
    if (status === 'CANCELLED' || status === 'DISPUTED') return 'bg-gray-100 text-gray-700';
    if (status === 'RESULT_RELEASED' || status === 'PATIENT_NOTIFIED') return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
}

export default function AdminOrdersPage() {
    const { orders, loading } = useLabOrders();
    const { user } = useUser();
    const [busyId, setBusyId] = useState<string | null>(null);

    // Lab staff perform lab-role transitions; a platform admin steps in as needed.
    const actorRole = 'lab_admin' as const;

    const advance = async (orderId: string, type: Parameters<typeof appendOrderEventViaApi>[2]) => {
        if (!user) return;
        setBusyId(orderId);
        try {
            await appendOrderEventViaApi(user, orderId, type);
            toast.success(`Updated: ${EVENT_ACTION_LABELS[type] ?? type}`);
        } catch (e: any) {
            toast.error(e.message || 'Could not update order');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                <p className="text-gray-500 mt-2">
                    Track incoming samples and move them through processing. Uploading a
                    result is done from the Results page once testing is complete.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Tests</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Next step</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading orders…
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                    No orders yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => {
                                const next = nextActionFor(actorRole, order.status);
                                return (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">#{order.id.slice(0, 6)}</TableCell>
                                        <TableCell>{order.items?.map((i) => i.name).join(', ')}</TableCell>
                                        <TableCell>₦{order.amount?.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
                                                {order.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={statusVariant(order.status)}>
                                                {ORDER_STATUS_LABELS[order.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {order.status === 'TESTING_COMPLETED' ? (
                                                <Button asChild size="sm" variant="outline">
                                                    <a href="/results">Upload result</a>
                                                </Button>
                                            ) : next ? (
                                                <Button
                                                    size="sm"
                                                    disabled={busyId === order.id}
                                                    onClick={() => advance(order.id, next)}
                                                >
                                                    {busyId === order.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        EVENT_ACTION_LABELS[next] ?? next
                                                    )}
                                                </Button>
                                            ) : (
                                                <span className="text-gray-400 text-sm">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
