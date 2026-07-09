'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/FirebaseProvider';

// Any signed-in user may reach the collector area (to apply); the jobs view
// itself gates on the collector claim, and Firestore rules enforce data access.
export default function CollectorLayout({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) router.push('/auth/signin');
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center gap-2">
                    <div className="bg-blue-900 text-white p-2 rounded font-bold text-sm">LC</div>
                    <span className="font-bold text-gray-900">LabLink Collector</span>
                </div>
            </nav>
            <main className="max-w-5xl mx-auto p-6">{children}</main>
        </div>
    );
}
