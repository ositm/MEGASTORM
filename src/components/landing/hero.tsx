import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="w-full py-20 md:py-32 lg:py-40 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-1 lg:gap-12 xl:grid-cols-1">
          <div className="flex flex-col justify-center space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline text-primary">
                Ready to Take Charge of Your Health?
              </h1>
              <p className="mx-auto max-w-[700px] text-lg text-foreground/80 md:text-xl">
                Trusted lab, accurate & timely results, supporting your health journey.
              </p>
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/auth/signin">Book a test</Link>
              </Button>
              <Button asChild variant="link" size="lg" className="text-accent-foreground/80">
                <Link href="#about">Learn more</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
