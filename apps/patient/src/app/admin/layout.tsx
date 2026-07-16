'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useUser } from "@/firebase/FirebaseProvider";
import { useUserProfile } from "@/hooks/use-user-profile";

// UX guard only — actual data access is enforced by Firestore/Storage rules.
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const { profile, loading: profileLoading } = useUserProfile();
    const router = useRouter();

    // Lab accounts use apps/lab now; /admin is platform-admin only.
    const isAuthorized = profile?.role === 'admin';

    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.push('/auth/signin');
        } else if (!isAuthorized) {
            router.push('/home');
        }
    }, [user, isUserLoading, profileLoading, isAuthorized, router]);

    if (isUserLoading || profileLoading || !user || !isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
