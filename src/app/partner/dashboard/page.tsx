'use client';

import { useEffect, useState } from 'react';
import { useFirebase, useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FlaskConical, Settings, LogOut } from 'lucide-react';

export default function PartnerDashboard() {
    const { user, isUserLoading, auth } = useUser();
    const router = useRouter();
    const [stats, setStats] = useState({
        appointments: 0,
        tests: 12,
        revenue: '₦0.00'
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/partner/auth');
        }
    }, [user, isUserLoading, router]);

    const handleSignOut = async () => {
        if (auth) await auth.signOut();
        router.push('/partner/auth');
    };

    if (isUserLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center">Loading Portal...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-900 text-white p-2 rounded font-bold">LP</div>
                    <span className="font-bold text-gray-900">Lab Partner Portal</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{user.email}</span>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-600">Welcome back, {user.displayName || 'Partner'}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="bg-blue-100 p-4 rounded-full mr-4">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Pending Appointments</p>
                                <h3 className="text-2xl font-bold">{stats.appointments}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="bg-purple-100 p-4 rounded-full mr-4">
                                <FlaskConical className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Active Tests</p>
                                <h3 className="text-2xl font-bold">{stats.tests}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="bg-green-100 p-4 rounded-full mr-4">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Patients</p>
                                <h3 className="text-2xl font-bold">0</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Recent Bookings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-gray-500">
                                    No booking data available yet.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button className="w-full justify-start" variant="outline">
                                    <FlaskConical className="mr-2 h-4 w-4" /> Add New Test
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    <Settings className="mr-2 h-4 w-4" /> Lab Settings
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    <Users className="mr-2 h-4 w-4" /> Manage Staff
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
