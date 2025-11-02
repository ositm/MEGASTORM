import Link from 'next/link';
import { Stethoscope } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewsletterFooter() {
  return (
    <footer id="contact" className="w-full bg-primary/5">
      <div className="container mx-auto px-4 md:px-6">
        <div id="newsletter" className="py-12 md:py-16 lg:py-20 text-center">
          <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl text-primary">
            Join Our Health Insights Mailing List
          </h2>
          <form className="mt-6 flex max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-r-none focus:ring-accent"
              aria-label="Email for newsletter"
            />
            <Button type="submit" className="rounded-l-none bg-accent hover:bg-accent/90 text-accent-foreground">
              Subscribe →
            </Button>
          </form>
        </div>
        <div className="grid gap-8 py-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex flex-col items-start gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              <span className="font-bold font-headline text-lg inline-block text-primary">LabLink</span>
            </Link>
            <p className="text-sm text-foreground/70">
              Our mission is to provide accessible, reliable, and convenient lab testing to empower individuals on their health journey.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold font-headline">Company</h4>
            <ul className="space-y-1">
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-foreground">About Us</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-foreground">Careers</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-foreground">Press</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold font-headline">Legal</h4>
            <ul className="space-y-1">
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-foreground">Cookie Policy</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold font-headline">Contact</h4>
            <p className="text-sm text-foreground/70">123 Health St.<br />Wellness City, HC 45678</p>
            <p className="text-sm text-foreground/70">
              <a href="mailto:contact@lablink.com" className="hover:text-foreground">contact@lablink.com</a>
            </p>
          </div>
        </div>
        <div className="border-t py-4 text-center text-sm text-foreground/60">
          © 2025 Lab Link. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
