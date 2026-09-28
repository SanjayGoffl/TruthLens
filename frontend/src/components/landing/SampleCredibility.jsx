import { motion } from 'framer-motion';
import { ChevronDown, Info } from 'lucide-react';
const SCALE = [
  { range: '80–100', label: 'Highly Credible', color: '#16A34A', note: 'Strong source signals, evidence and consistent claims.' },
  { range: '65–79', label: 'Mostly Credible', color: '#4F46E5', note: 'Generally sound with minor gaps or caveats.' },
  { range: '45–64', label: 'Uncertain', color: '#D97706', note: 'Mixed signals — verify before relying on it.' },
  { range: '25–44', label: 'Potentially Misleading', color: '#EA580C', note: 'Weak evidence, loaded language or unreliable sourcing.' },
  { range: '0–24', label: 'Highly Suspicious', color: '#DC2626', note: 'Multiple strong risk signals present.' }
];
const SAMPLE_FACTORS = [
  { label: 'Source Reliability', score: 91 },
  { label: 'Evidence Quality', score: 84 },
  { label: 'Claim Consistency', score: 88 },
  { label: 'Publication Transparency', score: 95 },
  { label: 'Writing Quality', score: 78 },
  { label: 'Sensationalism', score: 96 }
];
export default function SampleCredibility() {
  return (
    <section id="credibility" style={{ scrollMarginTop: 84, padding: 'clamp(3rem, 6vw, 5.5rem) 1rem' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} className="text-center mb-5">
          <span className="section-label">The credibility scale</span>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)' }}>Scores with a standard, never a mystery</h2>
          <p className="text-muted-2" style={{ maxWidth: 640, margin: '0.4rem auto 0' }}>
            Every report lands on the same five-level scale and must explain how it got there.
          </p>
        </motion.div>
        <div className="row g-4 align-items-start">
          <div className="col-lg-5">
            <div className="d-flex flex-column gap-2">
              {SCALE.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="d-flex align-items-center gap-3 p-2 px-3 card"
                  style={{ borderLeft: `5px solid ${s.color}` }}
                >
                  <span className="font-mono fw-bold flex-shrink-0" style={{ fontSize: 13, color: s.color, minWidth: 62 }}>{s.range}</span>
                  <div className="min-w-0">
                    <div className="fw-bold" style={{ fontSize: 13.5 }}>{s.label}</div>
                    <div className="text-muted-2 text-xs">{s.note}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="d-flex gap-2 mt-3 align-items-start text-muted-2" style={{ fontSize: 12.5 }}>
              <Info size={14} className="flex-shrink-0 mt-1" />
              <span>Labels always accompany scores — color is never the only signal. Analysis below is a static sample for illustration, not live data.</span>
            </motion.div>
          </div>
          <div className="col-lg-7">
            <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.55 }} className="card overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <div className="p-4 d-flex flex-wrap align-items-center gap-3" style={{ background: 'linear-gradient(120deg, rgba(99,102,241,.14), transparent 55%)' }}>
                <div className="position-relative">
                  <svg width="118" height="118" viewBox="0 0 118 118" role="img" aria-label="Sample credibility score 87 of 100, Highly Credible">
                    <circle cx="59" cy="59" r="49" fill="none" stroke="var(--border)" strokeWidth="10" />
                    <motion.circle
                      cx="59" cy="59" r="49" fill="none" stroke="#16A34A" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 49}
                      initial={{ strokeDashoffset: 2 * Math.PI * 49 }}
                      whileInView={{ strokeDashoffset: 2 * Math.PI * 49 * 0.13 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.3, ease: 'easeOut', delay: 0.3 }}
                      transform="rotate(-90 59 59)"
                    />
                  </svg>
                  <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>87</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>/ 100</div>
                  </div>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-bold mb-2" style={{ fontSize: 18 }}>“Central bank signals rate pause as inflation cools”</div>
                  <div className="d-flex flex-wrap gap-2 align-items-center mb-2" style={{ fontSize: 12.5 }}>
                    <span className="chip chip-green pill">Highly Credible</span>
                    <span className="chip chip-gray pill">Source: Reuters example</span>
                    <span className="chip chip-gray pill">Sep 4, 2026</span>
                  </div>
                  <div className="text-muted-2 text-small">
                    Why? Source registry rating is strong, the byline and date are present, figures are attributed to an official statement, and independent coverage agrees.
                  </div>
                </div>
              </div>
              <div className="p-4 pt-2">
                <div className="row g-3">
                  {SAMPLE_FACTORS.map((f, i) => (
                    <div className="col-md-6" key={f.label}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-small fw-semibold">{f.label}</span>
                        <span className="font-mono text-small fw-bold" style={{ color: f.score >= 80 ? '#16A34A' : f.score >= 65 ? '#4F46E5' : '#D97706' }}>{f.score}/100</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <motion.div
                          className="progress-bar"
                          style={{ background: f.score >= 80 ? '#16A34A' : f.score >= 65 ? '#4F46E5' : '#D97706' }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${f.score}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="d-flex align-items-center gap-2 text-muted-2 mt-3" style={{ fontSize: 12 }}>
                  <ChevronDown size={14} />
                  Sample visualization only — run a real analysis on your dashboard for live reports.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
