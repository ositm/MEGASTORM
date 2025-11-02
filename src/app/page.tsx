import Header from '@/components/landing/header';
import HeroSection from '@/components/landing/hero';
import FeaturesSection from '@/components/landing/features';
import ReliableTestingSection from '@/components/landing/reliable-testing';
import NewsletterFooter from '@/components/landing/newsletter-footer';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <ReliableTestingSection />
        <NewsletterFooter />
      </main>
    </div>
  );
}
