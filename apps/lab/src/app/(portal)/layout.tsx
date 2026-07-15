'use client';

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LabSidebar } from "@/components/lab-sidebar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase/FirebaseProvider";
import { useUserProfile } from "@/hooks/use-user-profile";

const LAB_ROLES = ['lab_admin', 'lab_staff', 'admin'];

// UX guard only — actual data access is enforced by Firestore/Storage rules.
export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const { profile, loading: profileLoading } = useUserProfile();
    const router = useRouter();

    const isAuthorized = !!profile?.role && LAB_ROLES.includes(profile.role);

    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.push('/signin');
        }
    }, [user, isUserLoading, profileLoading, router]);

    if (isUserLoading || profileLoading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 p-6">
                <div className="max-w-md space-y-4 rounded-xl bg-white p-8 text-center shadow">
                    <h1 className="text-xl font-bold">This portal is for laboratory accounts</h1>
                    <p className="text-sm text-muted-foreground">
                        Your account isn&apos;t linked to a laboratory yet. Register your facility
                        and our team will verify it, or sign in with a lab account.
                    </p>
                    <div className="flex justify-center gap-3">
                        <Button asChild>
                            <Link href="/register">Register your lab</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/signin">Use another account</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <LabSidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
