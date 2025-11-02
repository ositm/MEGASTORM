'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  User,
  Lock,
  Bell,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

const settingsLinks = [
  { href: '/settings/profile', icon: User, label: 'Profile' },
  { href: '/settings/security', icon: Lock, label: 'Security' },
  { href: '/settings/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings/billing', icon: CreditCard, label: 'Billing' },
  { href: '/settings/privacy', icon: Shield, label: 'Privacy' },
  { href: '/settings/help', icon: HelpCircle, label: 'Help' },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {settingsLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'flex items-center justify-between p-4 rounded-lg transition-colors text-foreground hover:bg-muted',
            pathname === link.href && 'bg-muted'
          )}
        >
          <div className="flex items-center gap-4">
            <link.icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{link.label}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      ))}
    </nav>
  );
}
