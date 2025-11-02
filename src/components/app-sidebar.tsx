'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Stethoscope,
  Home,
  CalendarPlus,
  CalendarCheck2,
  ClipboardList,
  Settings,
  LifeBuoy,
  LogOut,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';

const mainNav = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/schedule', icon: CalendarPlus, label: 'Schedule Appointment' },
  { href: '/appointments', icon: CalendarCheck2, label: 'My Appointments' },
  { href: '/results', icon: ClipboardList, label: 'Test Results' },
];

const otherNav = [
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/support', icon: LifeBuoy, label: 'Support & FAQs' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you'd clear the user session here
    router.push('/auth/signin');
  };

  const closeSidebar = () => setOpenMobile(false);

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Stethoscope className="size-6 text-primary" />
          <span className="text-lg font-bold font-headline text-primary">LabLink</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {mainNav.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  onClick={closeSidebar}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarSeparator className="my-4" />

        <SidebarMenu>
          {otherNav.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  onClick={closeSidebar}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
           <SidebarMenuItem>
             <SidebarMenuButton onClick={handleLogout} className="justify-start" tooltip="Logout">
              <LogOut />
              <span>Logout</span>
             </SidebarMenuButton>
           </SidebarMenuItem>
         </SidebarMenu>
        <div className="flex items-center gap-3 p-3">
          <Avatar>
            <AvatarImage src="https://picsum.photos/seed/user/40/40" />
            <AvatarFallback>CW</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="truncate font-semibold">chukwu</p>
            <p className="truncate text-xs text-muted-foreground">chukwu@example.com</p>
          </div>
        </div>
      </SidebarFooter>
    </>
  );
}
