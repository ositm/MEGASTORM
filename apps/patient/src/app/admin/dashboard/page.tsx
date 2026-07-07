'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, DollarSign, TrendingUp } from "lucide-react";

import { useEffect, useState } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminDashboardPage() {
    const { profile } = useUserProfile();
    const { firestore } = useFirebase();
    const [labName, setLabName] = useState<string>('');

    useEffect(() => {
        const fetchLabName = async () => {
            if (profile?.labId && firestore) {
                try {
                    const labRef = doc(firestore, 'labs', profile.labId);
                    const labSnap = await getDoc(labRef);
                    if (labSnap.exists()) {
                        setLabName(labSnap.data().name);
                    }
                } catch (error) {
                    console.error("Error fetching lab name:", error);
                }
            }
        };
        fetchLabName();
    }, [profile, firestore]);

    // Mock Stats
    const stats = [
        {
            title: "Total Bookings",
            value: "1,248",
            change: "+12% from last month",
            icon: Calendar,
            color: "text-blue-600",
            bg: "bg-blue-100",
        },
        {
            title: "Pending Tests",
            value: "42",
            change: "Requires attention",
            icon: Users,
            color: "text-orange-600",
            bg: "bg-orange-100",
        },
        {
            title: "Completed Results",
            value: "1,105",
            change: "+8% from last month",
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-100",
        },
        {
            title: "Total Revenue",
            value: "$45,231",
            change: "+15% from last month",
            icon: DollarSign,
            color: "text-purple-600",
            bg: "bg-purple-100",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    {labName ? `${labName} Dashboard` : 'Dashboard Overview'}
                </h1>
                <p className="text-gray-500 mt-2">
                    {labName ? `Welcome back to ${labName}` : 'Welcome back, Lab Administrator'}. Here's what's happening today.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                {stat.change}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                            U{i}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">User {i}</p>
                                            <p className="text-sm text-gray-500">Full Blood Count</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                        Pending
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Revenue Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-gray-400">Chart Placeholder</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
