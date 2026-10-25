import { motion } from 'framer-motion';
import { Building2, CheckCircle2, FileCheck2, Newspaper, Scale, TriangleAlert } from 'lucide-react';
import Icon from '../ui/Icon';
const FACTORS = [
  { icon: Building2, title: 'Source Reliability', text: 'We check who publishes the article, the domain’s history and how openly the publisher identifies itself.' },
  { icon: Scale, title: 'Evidence Quality', text: 'We look for cited sources, named experts, data and verifiable material behind each claim.' },
  { icon: CheckCircle2, title: 'Claim Consistency', text: 'We test whether key claims hold together, stay supported in the text and avoid contradictions.' },
  { icon: Newspaper, title: 'Publication Transparency', text: 'We review the author, publication date and publisher details — the basics of accountable journalism.' },
  { icon: FileCheck2, title: 'Writing Quality', text: 'We assess structure, clarity, attribution and whether the article keeps a measured editorial tone.' },
  { icon: TriangleAlert, title: 'Sensationalism Detection', text: 'We flag clickbait, emotional manipulation, fear-based framing and exaggerated language.' }
];
export default function CredibilityFactors() {
  return (
    <section id="features" className="landing-bg-soft" style={{ scrollMarginTop: 84, padding: 'clamp(3rem, 6vw, 5.5rem) 1rem' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} className="text-center mb-5">
          <span className="section-label"><FileCheck2 size={14} /> Six Lenses on Every Article</span>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)' }}>Six Credibility Factors That Actually Matter</h2>
          <p className="text-muted-2" style={{ maxWidth: 640, margin: '0.4rem auto 0' }}>
            TruthLens AI never stamps a verdict from a hunch. Each factor earns its own sub-score, and you see the evidence behind it.
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
                <div className="feature-icon d-inline-grid place-items-center rounded-3 mb-3" style={{ width: 46, height: 46, background: 'var(--bg-2)', color: 'var(--primary)' }}>
                  <Icon icon={f.icon} size={21} />
                </div>
                <h3 style={{ fontSize: 16 }}>{f.title}</h3>
                <p className="text-muted-2 mb-0" style={{ fontSize: 13.5 }}>{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
