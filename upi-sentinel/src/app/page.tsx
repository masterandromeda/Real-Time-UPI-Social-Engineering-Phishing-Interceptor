import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import {
  CapabilitiesSection,
  LiveProtectionSection,
  DashboardPreview,
  HowItWorksSection,
  BusinessImpactSection,
  PricingSection,
  FAQSection,
  ContactSection,
  FooterSection,
} from '@/components/LandingSections';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <CapabilitiesSection />
        <LiveProtectionSection />
        <DashboardPreview />
        <HowItWorksSection />
        <BusinessImpactSection />
        <PricingSection />
        <FAQSection />
        <ContactSection />
      </main>
      <FooterSection />
    </>
  );
}
