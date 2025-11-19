'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/30 backdrop-blur-lg shadow-lg border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex gap-2 text-white items-center uppercase font-bold text-secondary z-50">
            <Image src="/lab-link-logo.jpg" alt="Lab Link Logo" width={50} height={50} className="h-[50px] w-[50px]" />
            Lab Link
          </Link>

          <div className="hidden md:flex gap-4">
            <ul className="hidden md:flex items-center gap-8 text-white font-medium">
              <li className="relative flex items-center group">
                <Link href="/about" className="hover:text-primary transition-colors duration-300">About</Link>
                <span className="absolute left-0 bottom-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full w-0"></span>
              </li>
              <li className="relative flex items-center group">
                <Link href="/contact" className="hover:text-primary transition-colors duration-300">Contact</Link>
                <span className="absolute left-0 bottom-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full w-0"></span>
              </li>
            </ul>
            <Button asChild variant="ghost" className="text-white hover:text-primary hover:bg-white/10">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild className='text-white'>
              <Link href="/auth/signin">Book a Test</Link>
            </Button>
          </div>

          <button onClick={toggleMenu} className="md:hidden text-white relative z-50 p-2" aria-label="Open menu">
            <div className="relative w-8 h-8">
              <span className={`absolute block w-8 h-0.5 bg-white transform transition-all duration-300 ${isOpen ? 'top-4 rotate-45' : 'top-2'}`}></span>
              <span className={`absolute block w-8 h-0.5 bg-white transform transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100 top-4'}`}></span>
              <span className={`absolute block w-8 h-0.5 bg-white transform transition-all duration-300 ${isOpen ? 'top-4 -rotate-45' : 'top-6'}`}></span>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed z-[100] md:hidden inset-0 bg-black/80 backdrop-blur-lg transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className={`absolute right-0 top-0 h-full w-4/5 max-w-sm bg-gradient-to-b from-gray-900 to-black p-6 pt-24 transition-transform duration-500 ease-in-out shadow-xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <ul className="flex flex-col space-y-2">
                {['About', 'Contact'].map((item, index) => (
                  <li key={item} className={`transform transition-all duration-300 ${isOpen ? `delay-${100 * (index + 1)} translate-x-0 opacity-100` : 'translate-x-8 opacity-0'}`}>
                    <Link href={`/${item.toLowerCase()}`} className="flex items-center justify-between p-4 rounded-lg transition-all duration-300 text-white hover:bg-white/5">
                      <span className="text-lg">{item}</span>
                      <ChevronRight className="w-[18px] h-[18px] text-gray-400" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Button asChild variant="ghost" className="w-full mt-4 text-white hover:text-primary hover:bg-white/10">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild size="lg" className="w-full mt-4 text-white">
                <Link href="/auth/signin">Book a Test</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
