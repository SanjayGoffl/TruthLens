import LegalLayout from '../../components/layout/LegalLayout';
import { PRIVACY_SECTIONS } from '../../utils/legalContent';
export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="September 7, 2026"
      sections={PRIVACY_SECTIONS}
      fileName="newsguard-ai-privacy-policy.pdf"
    />
  );
}
