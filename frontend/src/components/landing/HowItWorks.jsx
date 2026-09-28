import { motion } from 'framer-motion';
import { ClipboardPaste, Link2, ScanSearch, ShieldCheck, TrendingUp } from 'lucide-react';
const STEPS = [
  { icon: Link2, num: '01', title: 'Submit', text: 'Enter a news article URL or paste article content. No browser extensions, no hoops.' },
  { icon: ScanSearch, num: '02', title: 'Analyze', text: 'AI examines the article, its source, writing patterns, claims and publication details.' },
  { icon: ShieldCheck, num: '03', title: 'Verify', text: 'Important claims are compared against available supporting information and other sources.' },
  { icon: TrendingUp, num: '04', title: 'Understand', text: 'Receive a credibility score with a clear, factor-by-factor explanation you can read in minutes.' }
];
export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{ scrollMarginTop: 84, padding: 'clamp(3rem, 6vw, 5.5rem) 1rem' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} className="text-center mb-5">
          <span className="section-label">How it works</span>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)' }}>Four steps from article to answer</h2>
          <p className="text-muted-2" style={{ maxWidth: 620, margin: '0.4rem auto 0' }}>
            A structured pipeline — extraction, AI analysis, claim verification, transparent scoring — replaces guesswork with an explainable assessment.
          </p>
        </motion.div>
        <div className="row g-4 justify-content-center">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="col-md-6 col-lg-3"
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: 'easeOut' }}
            >
              <div className="card card-hover h-100 position-relative p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-inline-grid place-items-center rounded-3" style={{ width: 48, height: 48, background: 'var(--bg-2)', color: 'var(--primary)' }}>
                    <step.icon size={22} />
                  </div>
                  <span className="font-mono fw-bold" style={{ fontSize: 26, color: 'var(--border)', opacity: 0.9 }}>{step.num}</span>
                </div>
                <h5 style={{ fontSize: 16.5 }}>{step.title}</h5>
                <p className="text-muted-2 mb-0" style={{ fontSize: 13.5 }}>{step.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-5">
          <span className="chip chip-teal pill" style={{ fontSize: 12.5 }}>
            <ClipboardPaste size={13} /> Paste an article or drop a URL — both work
          </span>
        </motion.div>
      </div>
    </section>
  );
}
