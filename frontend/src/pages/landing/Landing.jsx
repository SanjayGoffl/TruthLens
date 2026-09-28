import Hero from '../../components/landing/Hero';
import HowItWorks from '../../components/landing/HowItWorks';
import CredibilityFactors from '../../components/landing/CredibilityFactors';
import SuspiciousDemo from '../../components/landing/SuspiciousDemo';
import SampleCredibility from '../../components/landing/SampleCredibility';
import WhyTruthLens from '../../components/landing/WhyTruthLens';
import LandingFaq from '../../components/landing/LandingFaq';
import ExtensionCta from '../../components/landing/ExtensionCta';
import FinalCta from '../../components/landing/FinalCta';
export default function Landing() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CredibilityFactors />
      <SuspiciousDemo />
      <SampleCredibility />
      <WhyTruthLens />
      <LandingFaq />
      <ExtensionCta />
      <FinalCta />
    </>
  );
}
