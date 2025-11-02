import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const benefits = [
  'Timely diagnosis',
  'Home test convenience',
  'Accurate results',
  'Continuity of care',
];

const anchorLinks = [
  { href: '#consultation', label: 'Why Need Consultation?' },
  { href: '#why-choose-us', label: 'Why Choose Us' },
  { href: '#how-it-works', label: 'How it Works' },
];

export default function ReliableTestingSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
      <div className="container mx-auto grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-wider text-accent-foreground/80">
            YOUR HEALTH, OUR PRIORITY
          </p>
          <h2 className="text-3xl font-bold font-headline tracking-tighter md:text-4xl/tight text-primary">
            Reliable Lab Testing for All Your Health Needs
          </h2>
          <div className="flex justify-center space-x-4 py-4">
            {anchorLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center text-sm font-medium text-foreground/70 hover:text-foreground"
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <hr className="my-8" />
        <div className="mx-auto max-w-3xl space-y-6">
          <h3 className="text-2xl font-bold font-headline tracking-tighter">
            Why Regular Lab Testing Matters
          </h3>
          <p className="text-foreground/80">
            Staying informed about your health is essential for early detection, effective treatment, and peace of mind.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center">
                <CheckCircle2 className="mr-3 h-5 w-5 flex-shrink-0 text-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
