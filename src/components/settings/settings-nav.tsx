'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  User,
  Lock,
  Bell,
  CreditCard,
  Shield,
  HelpCircle,
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

  const isLinkActive = (href: string) => {
    if (href === '/settings/profile' && pathname === '/settings') {
      return true;
    }
    return pathname === href;
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 pt-6">
        <div className="space-y-2">
          {settingsLinks.map((link) => (
            <Button
              key={link.href}
              variant={isLinkActive(link.href) ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              asChild
            >
              <Link href={link.href}>
                <link.icon className="mr-3 h-5 w-5" />
                {link.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
