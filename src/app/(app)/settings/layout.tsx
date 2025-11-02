import Link from 'next/link';
import { ArrowLeft, Bell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 border-b p-4">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <Link href="/home">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-xl font-bold font-headline">Settings</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
      <footer className="border-t p-4 mt-auto">
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className='flex items-center gap-2'>
            <Bell className='h-4 w-4' />
            <span>Notifications: On</span>
          </div>
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            <span>Health Reminders: Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
