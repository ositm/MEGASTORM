'use client';

import AppSidebar from '@/components/app-sidebar';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase/client-provider';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white z-50 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu />
        </button>
        <Link href="/home" className="flex items-center gap-2">
          <Image
            src="/lab-link-logo.jpg"
            alt="logo"
            width={30}
            height={30}
            className="w-[30px] h-[30px]"
          />
          <span className="font-bold text-lg">LabLink</span>
        </Link>
        <div className="w-10"></div>
      </div>

      <AppSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 lg:flex overflow-hidden h-screen pt-14 lg:pt-0 bg-[#F7F8FA]">
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center shadow-lg">
        <div>
          <p className="font-medium text-slate-800">Install Lab Link App</p>
          <p className="text-sm text-slate-600">For faster access to your appointments</p>
        </div>
        <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md transition-colors">
          Install
        </button>
      </div>
    </div>
  );
}


export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </FirebaseClientProvider>
  );
}
