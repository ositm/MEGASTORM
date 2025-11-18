import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen bg-cover bg-center flex items-center text-white" style={{backgroundImage: "url('/images/lab-sign-in.jpg')"}}>
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative max-w-[1500px] px-6 mx-auto w-full flex flex-col lg:items-start items-center text-center lg:text-left">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl drop-shadow-lg">
          Test anywhere with, <br />
          <span className="text-primary ">Lab Link</span>
        </h1>
        <div className="flex space-x-4">
          <Button asChild size="lg">
            <Link href="/auth/signin">Book a Test</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="bg-white text-black">
            <Link href="/about">Learn more</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
