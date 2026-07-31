'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle, DollarSign, Loader2, ShieldCheck, UserCheck, Truck, Navigation, Handshake } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useLabOrders } from '@/hooks/use-lab-orders';
import { useAdminOps } from '@/hooks/use-admin-ops';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { doc, getDoc } from 'firebase/firestore';
import { ORDER_STATUS_LABELS, OrderStatus } from '@lablink/core';

const READY: OrderStatus[] = ['RESULT_RELEASED', 'PATIENT_NOTIFIED'];

function statusClasses(status: OrderStatus): string {
    if (status === 'ORDER_CREATED') return 'bg-yellow-100 text-yellow-700';
    if (status === 'CANCELLED' || status === 'DISPUTED') return 'bg-gray-100 text-gray-600';
    if (READY.includes(status)) return 'bg-green-100 text-green-700';
    return 'bg-blue-100 text-blue-700';
}

export default function AdminDashboardPage() {
    const { profile } = useUserProfile();
    const { firestore } = useFirebase();
    const { orders, loading } = useLabOrders();
    const { stats: ops } = useAdminOps();
    const [labName, setLabName] = useState<string>('');

    useEffect(() => {
        const fetchLabName = async () => {
            if (profile?.labId && firestore) {
                try {
                    const labSnap = await getDoc(doc(firestore, 'labs', profile.labId));
                    if (labSnap.exists()) setLabName(labSnap.data().name);
                } catch (e) {
                    console.error('Error fetching lab name:', e);
                }
            }
        };
        fetchLabName();
    }, [profile, firestore]);

    const metrics = useMemo(() => {
        const paid = orders.filter((o) => o.paymentStatus === 'paid');
        const revenue = paid.reduce((sum, o) => sum + (o.amount || 0), 0);
        const pending = orders.filter((o) => o.status === 'ORDER_CREATED').length;
        const completed = orders.filter((o) => READY.includes(o.status)).length;
        const inProgress = orders.filter(
            (o) => o.paymentStatus === 'paid' && !READY.includes(o.status) && o.status !== 'CANCELLED'
        ).length;
        return { total: orders.length, revenue, pending, inProgress, completed };
    }, [orders]);

    const recent = orders.slice(0, 6);

    const stats = [
        { title: 'Total Orders', value: metrics.total.toLocaleString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Revenue (paid)', value: `₦${metrics.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
        { title: 'Awaiting payment', value: metrics.pending.toLocaleString(), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
        { title: 'Completed', value: metrics.completed.toLocaleString(), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    ];

    // Verification queues awaiting a decision + samples in the field.
    const attention = [
        { title: 'Partner applications', value: ops.pendingPartnerApplications, icon: Handshake, href: '/admin/partners' },
        { title: 'Lab access requests', value: ops.pendingLabClaims, icon: ShieldCheck, href: '/admin/labs' },
        { title: 'Collectors to verify', value: ops.pendingCollectors, icon: UserCheck, href: '/admin/collectors' },
        { title: 'Couriers to verify', value: ops.pendingCouriers, icon: Truck, href: '/admin/couriers' },
        { title: 'Samples in transit', value: ops.jobsInTransit, icon: Navigation, href: null },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{labName ? `${labName} Dashboard` : 'Dashboard Overview'}</h1>
                <p className="text-gray-500 mt-2">
                    {labName ? `Live metrics for ${labName}.` : 'Live platform metrics.'}
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <Card key={i} className="border-none shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Needs attention</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {attention.map((item) => {
                                const card = (
                                    <Card className={`border-none shadow-sm ${item.href ? 'transition-shadow hover:shadow-md' : ''} ${item.value > 0 ? 'ring-1 ring-amber-300' : ''}`}>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm font-medium text-gray-500">{item.title}</CardTitle>
                                            <div className={`p-2 rounded-lg ${item.value > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                                                <item.icon className={`h-4 w-4 ${item.value > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-gray-900">{item.value.toLocaleString()}</div>
                                            {item.href && item.value > 0 && (
                                                <p className="text-xs text-amber-600 mt-1">Review now →</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                                return item.href
                                    ? <Link key={item.title} href={item.href}>{card}</Link>
                                    : <div key={item.title}>{card}</div>;
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="border-none shadow-sm lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Recent Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recent.length === 0 ? (
                                    <p className="text-gray-400 py-8 text-center">No orders yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recent.map((o) => (
                                            <div key={o.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{o.items?.map((i) => i.name).join(', ') || 'Lab test'}</p>
                                                    <p className="text-sm text-gray-500 font-mono">#{o.id.slice(0, 6)} · ₦{o.amount?.toLocaleString()}</p>
                                                </div>
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusClasses(o.status)}`}>
                                                    {ORDER_STATUS_LABELS[o.status]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>At a glance</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">In progress</span>
                                    <span className="font-semibold text-gray-900">{metrics.inProgress}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Awaiting payment</span>
                                    <span className="font-semibold text-gray-900">{metrics.pending}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Completed</span>
                                    <span className="font-semibold text-gray-900">{metrics.completed}</span>
                                </div>
                                <div className="flex justify-between border-t pt-3">
                                    <span className="text-gray-500">Avg. order value</span>
                                    <span className="font-semibold text-gray-900">
                                        ₦{metrics.total ? Math.round(metrics.revenue / Math.max(1, orders.filter((o) => o.paymentStatus === 'paid').length)).toLocaleString() : 0}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
