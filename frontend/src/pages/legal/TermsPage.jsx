import LegalLayout from '../../components/layout/LegalLayout';
import { TERMS_SECTIONS } from '../../utils/legalContent';
export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      updated="September 7, 2026"
      sections={TERMS_SECTIONS}
      fileName="newsguard-ai-terms-and-conditions.pdf"
    />
  );
}
