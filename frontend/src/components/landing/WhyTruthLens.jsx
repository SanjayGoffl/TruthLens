import { motion } from 'framer-motion';
import { Bot, Bookmark, Download, FileCheck2, History, ListChecks, SearchCheck, ShieldAlert } from 'lucide-react';
const REASONS = [
  { icon: Bot, title: 'AI-assisted analysis', text: 'Gemini-powered reading of the source, structure, language and claims — with a deterministic scoring engine on top.' },
  { icon: ListChecks, title: 'Transparent scoring', text: 'Weights are public across six factors: Source 22%, Evidence 22%, Claims 22%, Transparency 13%, Writing 8% and Sensationalism 13%.' },
  { icon: FileCheck2, title: 'Claim-level assessment', text: 'Supported, partially supported, needs verification, contradicted or unsupported — each big claim gets its own verdict.' },
  { icon: SearchCheck, title: 'Source analysis', text: 'Publisher identity, domain, author, date and internal registry history are weighed before reliability is inferred.' },
  { icon: ShieldAlert, title: 'Suspicious content detection', text: 'Clickbait, fear language, unsupported superlatives and contradictions are surfaced statement by statement.' },
  { icon: History, title: 'Analysis history', text: 'Every analysis is stored privately on your account, searchable and filterable, with trends on your dashboard.' },
  { icon: Download, title: 'Downloadable reports', text: 'One-click branded PDF reports with the score breakdown, claims, sources and the AI explanation.' },
  { icon: Bookmark, title: 'Saved reports', text: 'Pin the analyses that matter and revisit them any time from your saved reports page.' }
];
export default function WhyTruthLens() {
  return (
    <section id="about" className="landing-bg-soft" style={{ scrollMarginTop: 84, padding: 'clamp(3rem, 6vw, 5.5rem) 1rem' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div className="row g-4 align-items-center mb-5">
          <div className="col-lg-6">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }}>
              <span className="section-label">About TruthLens AI</span>
              <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)' }}>Built like an investigations desk, not a chatbot</h2>
              <p className="text-secondary-2" style={{ fontSize: 15 }}>
                Misinformation rarely announces itself. It hides in anonymous posts, vague attributions, emotionally loaded verbs and claims nobody else reports.
              </p>
              <p className="text-secondary-2" style={{ fontSize: 15 }}>
                TruthLens AI treats an article the way a careful editor would: Where was this published and by whom? What exactly is being claimed? What evidence supports it? Do independent sources agree? Is the writing trying to inform you — or move you?
              </p>
              <p className="text-muted-2 mb-0" style={{ fontSize: 14 }}>
                The result is a weighted credibility score with a plain-language explanation, never an absolute declaration of truth or falsehood.
              </p>
            </motion.div>
          </div>
          <div className="col-lg-6">
            <div className="row g-3">
              {REASONS.map((r, i) => (
                <motion.div
                  key={r.title}
                  className={i % 2 === 0 ? 'col-md-6' : 'col-md-6'}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: (i % 4) * 0.08 }}
                >
                  <div className="card card-hover h-100 p-3 d-flex gap-3 align-items-start">
                    <span className="d-inline-grid place-items-center rounded-3 flex-shrink-0" style={{ width: 38, height: 38, background: 'var(--bg-2)', color: 'var(--primary)' }}>
                      <r.icon size={18} />
                    </span>
                    <div>
                      <div className="fw-bold" style={{ fontSize: 13.5 }}>{r.title}</div>
                      <div className="text-muted-2 text-small">{r.text}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
