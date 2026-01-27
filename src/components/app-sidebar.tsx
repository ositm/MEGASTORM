'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, Beaker } from 'lucide-react';
import { useFirebase } from '@/firebase/provider';
import { signOut } from 'firebase/auth';

import { useUserProfile } from '@/hooks/use-user-profile';

const mainNav = [
  { href: '/home', icon: '/home.png', label: 'Home' },
  { href: '/tests', iconComponent: Beaker, label: 'Browse Tests' },
  { href: '/schedule', icon: '/calendar.png', label: 'Schedule Appointment' },
  { href: '/appointments', icon: '/time.png', label: 'My Appointments' },
  { href: '/results', icon: '/result.png', label: 'Test Results' },
  { href: '/settings', icon: '/settings.png', label: 'Settings' },
];

const otherNav = [
  { href: '/waiting-list', icon: '/faq.png', label: 'Support & FAQs' },
];

interface AppSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function AppSidebar({ sidebarOpen, setSidebarOpen }: AppSidebarProps) {
  const router = useRouter();
  const { auth } = useFirebase();
  const { profile } = useUserProfile();

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
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-full bg-white z-40 
    transition-transform duration-300 ease-in-out
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0 w-64 lg:w-[16%] xl:w-[14%] shadow-lg lg:shadow-none
    flex flex-col`}
      >
        <div className="hidden lg:flex items-center gap-2 p-4 border-b">
          <Image
            src="/lab-link-logo.png"
            alt="logo"
            width={50}
            height={50}
            className="w-[50px] h-[50px]"
          />
          <span className="font-bold text-lg">LabLink</span>
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-y-auto pt-16 lg:pt-0">
          <div>
            <nav className="flex flex-col py-4">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.iconComponent ? (
                    <item.iconComponent className="w-6 h-6" />
                  ) : (
                    <Image
                      src={item.icon!}
                      alt={item.label}
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                  )}
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="flex flex-col py-4">
              <span className="px-4 text-gray-400 font-light text-sm my-2">
                OTHER
              </span>
              {otherNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
              {(profile?.role === 'lab_admin' || profile?.role === 'admin') && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Image
                      src="/dashboard.png"
                      alt="Lab Terminal"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    <span className="text-sm">Lab Terminal</span>
                  </Link>
                  <Link
                    href="/partner/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded text-blue-700 font-bold text-xs">LP</span>
                    <span className="text-sm">Partner Portal</span>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-gray-600 hover:bg-primary hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
