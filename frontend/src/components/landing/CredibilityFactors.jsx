import { motion } from 'framer-motion';
import { Building2, CheckCircle2, FileCheck2, Newspaper, Scale, TriangleAlert } from 'lucide-react';
const FACTORS = [
  { icon: Building2, title: 'Source Reliability', text: 'Analyzes publisher identity, domain history and the transparency of who stands behind the article.' },
  { icon: Scale, title: 'Evidence Quality', text: 'Evaluates whether claims cite sources, name experts, use data and offer verifiable supporting material.' },
  { icon: CheckCircle2, title: 'Claim Consistency', text: 'Checks whether important claims are internally consistent, supported in the text and not contradicted elsewhere.' },
  { icon: Newspaper, title: 'Publication Transparency', text: 'Examines author, publication date and publisher details — the basics of accountable journalism.' },
  { icon: FileCheck2, title: 'Writing Quality', text: 'Assesses structure, clarity, attribution and whether the article maintains a measured editorial tone.' },
  { icon: TriangleAlert, title: 'Sensationalism Detection', text: 'Identifies clickbait, emotional manipulation, fear-based framing and exaggerated language.' }
];
export default function CredibilityFactors() {
  return (
    <section id="features" className="landing-bg-soft" style={{ scrollMarginTop: 84, padding: 'clamp(3rem, 6vw, 5.5rem) 1rem' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} className="text-center mb-5">
          <span className="section-label"><FileCheck2 size={14} /> Six lenses on every article</span>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)' }}>Credibility factors that actually matter</h2>
          <p className="text-muted-2" style={{ maxWidth: 640, margin: '0.4rem auto 0' }}>
            TruthLens AI never stamps a one-word verdict from a hunch. Each factor contributes a measured, explained sub-score.
          </p>
        </motion.div>
        <div className="row g-4">
          {FACTORS.map((f, i) => (
            <motion.div
              key={f.title}
              className="col-md-6 col-lg-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1, ease: 'easeOut' }}
            >
              <div className="card card-hover h-100 p-4">
                <div className="d-inline-grid place-items-center rounded-3 mb-3" style={{ width: 46, height: 46, background: 'var(--bg-2)', color: 'var(--primary)' }}>
                  <f.icon size={21} />
                </div>
                <h5 style={{ fontSize: 16 }}>{f.title}</h5>
                <p className="text-muted-2 mb-0" style={{ fontSize: 13.5 }}>{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
