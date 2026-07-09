'use client';

import { useMemo } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from 'recharts';
import { useLabOrders } from '@/hooks/use-lab-orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatus, ORDER_STATUS_LABELS } from '@lablink/core';
import { Loader2 } from 'lucide-react';

const BRAND = '#2563eb'; // single hue for magnitude/time — no categorical rainbow
const GRID = '#eef2f7';
const AXIS = '#94a3b8';
const READY: OrderStatus[] = ['RESULT_RELEASED', 'PATIENT_NOTIFIED'];

const ms = (t: any): number | null => (t?.toMillis ? t.toMillis() : t?.toDate ? t.toDate().getTime() : null);

export default function AdminAnalyticsPage() {
    const { orders, loading } = useLabOrders();

    const a = useMemo(() => {
        const paid = orders.filter((o) => o.paymentStatus === 'paid');
        const revenue = paid.reduce((s, o) => s + (o.amount || 0), 0);

        // Top tests by order volume (magnitude across categories -> single hue).
        const testCounts = new Map<string, number>();
        for (const o of orders) for (const it of o.items || []) testCounts.set(it.name, (testCounts.get(it.name) || 0) + 1);
        const topTests = [...testCounts.entries()].map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count).slice(0, 6);

        // Orders per day, last 14 days.
        const days: { day: string; count: number }[] = [];
        const byDay = new Map<string, number>();
        for (const o of orders) {
            const t = ms(o.createdAt);
            if (t) { const k = new Date(t).toISOString().slice(0, 10); byDay.set(k, (byDay.get(k) || 0) + 1); }
        }
        for (let i = 13; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const k = d.toISOString().slice(0, 10);
            days.push({ day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: byDay.get(k) || 0 });
        }

        // Status breakdown.
        const statusMap = new Map<OrderStatus, number>();
        for (const o of orders) statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
        const statuses = [...statusMap.entries()].map(([s, count]) => ({ label: ORDER_STATUS_LABELS[s], count })).sort((x, y) => y.count - x.count);

        // Avg completion time for released orders (createdAt -> last update).
        const completed = orders.filter((o) => READY.includes(o.status));
        const durations = completed.map((o) => { const c = ms(o.createdAt), u = ms(o.updatedAt); return c && u ? u - c : null; }).filter((d): d is number => d !== null && d >= 0);
        const avgHours = durations.length ? durations.reduce((s, d) => s + d, 0) / durations.length / 3_600_000 : null;

        const homeShare = orders.length ? Math.round((orders.filter((o) => o.type === 'home_collection').length / orders.length) * 100) : 0;

        return { revenue, topTests, days, statuses, avgHours, homeShare, total: orders.length, paidCount: paid.length };
    }, [orders]);

    const tiles = [
        { label: 'Total orders', value: a.total.toLocaleString() },
        { label: 'Paid revenue', value: `₦${a.revenue.toLocaleString()}` },
        { label: 'Avg. completion', value: a.avgHours == null ? '—' : a.avgHours < 48 ? `${a.avgHours.toFixed(1)} h` : `${(a.avgHours / 24).toFixed(1)} d` },
        { label: 'Home collection', value: `${a.homeShare}%` },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500 mt-2">Order volume, throughput, and revenue for your lab.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
            ) : a.total === 0 ? (
                <p className="text-gray-400">No orders yet — analytics will appear once orders come in.</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {tiles.map((t) => (
                            <Card key={t.label} className="border-none shadow-sm">
                                <CardContent className="p-5">
                                    <p className="text-sm text-gray-500">{t.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{t.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="border-none shadow-sm">
                            <CardHeader><CardTitle className="text-base">Orders — last 14 days</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={a.days} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                                        <CartesianGrid stroke={GRID} vertical={false} />
                                        <XAxis dataKey="day" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} interval={1} />
                                        <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                                        <Tooltip cursor={{ stroke: GRID }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                                        <Line type="monotone" dataKey="count" name="Orders" stroke={BRAND} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader><CardTitle className="text-base">Top tests by volume</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={a.topTests} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                                        <CartesianGrid stroke={GRID} horizontal={false} />
                                        <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                                        <Bar dataKey="count" name="Orders" fill={BRAND} radius={[0, 4, 4, 0]} barSize={16} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-sm">
                        <CardHeader><CardTitle className="text-base">Orders by status</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {a.statuses.map((s) => {
                                const pct = Math.round((s.count / a.total) * 100);
                                return (
                                    <div key={s.label} className="flex items-center gap-3">
                                        <span className="w-40 text-sm text-gray-600 shrink-0">{s.label}</span>
                                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: BRAND }} />
                                        </div>
                                        <span className="w-10 text-sm text-gray-500 text-right">{s.count}</span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
