import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingsNav from '@/components/settings/settings-nav';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-4 mb-6 p-4 border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/home">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      </div>
      <div className="grid md:grid-cols-[250px_1fr] gap-8">
        <SettingsNav />
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          {children}
        </div>
      </div>
    </div>
  );
}
