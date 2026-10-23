import Hero from '../../components/landing/Hero';
import HowItWorks from '../../components/landing/HowItWorks';
import CredibilityFactors from '../../components/landing/CredibilityFactors';
import SuspiciousDemo from '../../components/landing/SuspiciousDemo';
import SampleCredibility from '../../components/landing/SampleCredibility';
import WhyTruthLens from '../../components/landing/WhyTruthLens';
import LandingFaq from '../../components/landing/LandingFaq';
import ExtensionCta from '../../components/landing/ExtensionCta';
import FinalCta from '../../components/landing/FinalCta';
import Reveal from '../../components/ui/Reveal';

export default function Landing() {
  return (
    <>
      <Hero />
      <Reveal><HowItWorks /></Reveal>
      <Reveal><CredibilityFactors /></Reveal>
      <Reveal><SuspiciousDemo /></Reveal>
      <Reveal><SampleCredibility /></Reveal>
      <Reveal><WhyTruthLens /></Reveal>
      <Reveal><LandingFaq /></Reveal>
      <Reveal><ExtensionCta /></Reveal>
      <Reveal><FinalCta /></Reveal>
    </>
  );
}
