'use client';

import Link from 'next/link';
import { Menu, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import React from 'react';

const navLinks = [
  { href: '/home', label: 'Home' },
  { href: '/schedule', label: 'Schedule Appointment' },
  { href: '/appointments', label: 'My Appointments' },
  { href: '/results', label: 'Test Results' },
  { href: '/settings', label: 'Settings' },
  { href: '/support', label: 'Support & FAQs' },
];

export default function Header() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline inline-block text-primary">LabLink</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" asChild>
                <Link href="#about">About</Link>
            </Button>
            <Button variant="ghost" asChild>
                <Link href="#contact">Contact</Link>
            </Button>
            <Button asChild>
                <Link href="/auth/signin">Sign In</Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-3/4 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6">
                    <Link href="/" className="mb-6 flex items-center space-x-2" onClick={() => setIsOpen(false)}>
                      <Stethoscope className="h-6 w-6 text-primary" />
                      <span className="font-bold font-headline inline-block text-primary">LabLink</span>
                    </Link>
                    <nav className="flex flex-col space-y-4">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                          onClick={() => setIsOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                  </div>
                  <div className="mt-auto p-6 border-t">
                     <Button asChild className="w-full">
                       <Link href="/auth/signin" onClick={() => setIsOpen(false)}>Sign In</Link>
                     </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
