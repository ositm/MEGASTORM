'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Calendar, Upload, Settings, LogOut, Beaker, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase/FirebaseProvider";
import { signOut } from "firebase/auth";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Manage Labs",
        href: "/admin/labs",
        icon: ShieldCheck,
    },
    {
        title: "Bookings",
        href: "/admin/bookings",
        icon: Calendar,
    },
    {
        title: "Manage Tests",
        href: "/admin/tests",
        icon: Beaker,
    },
    {
        title: "Upload Results",
        href: "/admin/results",
        icon: Upload,
    },
    {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { auth } = useFirebase();

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            router.push('/auth/signin');
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white w-64 border-r border-slate-800">
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
                        L
                    </div>
                    <span className="font-bold text-lg tracking-tight">LabLink Admin</span>
                </div>
            </div>

            <div className="flex-1 py-6 px-4 space-y-1">
                {sidebarItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            pathname === item.href
                                ? "bg-blue-600 text-white"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.title}
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
