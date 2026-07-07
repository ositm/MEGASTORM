import Header from '@/components/landing/header';
import HeroSection from '@/components/landing/hero';
import FeaturesSection from '@/components/landing/features';
import ReliableTestingSection from '@/components/landing/reliable-testing';
import NewsletterFooter from '@/components/landing/newsletter-footer';
import CallToAction from '@/components/landing/cta';
import Footer from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#031f35]">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ReliableTestingSection />
        <CallToAction />
        <NewsletterFooter />
      </main>
      <Footer />
    </div>
  );
}
