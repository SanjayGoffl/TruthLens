import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, MousePointerClick } from 'lucide-react';
const FLAGS = [
  { type: 'supported', quote: 'The RBI raised its benchmark rate by 25 basis points, according to its official statement released Thursday.', label: 'Supported', explanation: 'Directly attributable to an official statement with a verifiable date — this claim is presented with its evidence.' },
  { type: 'warning', quote: 'Economists widely expect inflation to ease below 4% by next quarter.', label: 'Needs verification', explanation: 'An attribution like “economists widely expect” needs named experts or a survey to check. Until then it stays unverified.' },
  { type: 'suspicious', quote: 'This single policy move will destroy the savings of every middle-class family in the country!', label: 'Potentially suspicious', explanation: 'Absolute, catastrophic framing (“destroy… every family”) with no data attached is a classic sign of emotional manipulation.' }
];
export default function SuspiciousDemo() {
  const [active, setActive] = useState(1);
  const current = FLAGS[active];
  return (
    <section id="suspicious-demo" style={{ scrollMarginTop: 84, padding: 'clamp(3rem, 6vw, 5.5rem) 1rem' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} className="text-center mb-5">
          <span className="section-label"><MousePointerClick size={14} /> Statement-level spotting</span>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)' }}>Suspicious content, highlighted where it hides</h2>
          <p className="text-muted-2" style={{ maxWidth: 640, margin: '0.4rem auto 0' }}>
            Reports flag individual statements — not just whole articles — and explain each highlight. Click a highlighted passage:
          </p>
        </motion.div>
        <div className="d-flex flex-wrap justify-content-center gap-2 mb-4" role="group" aria-label="Choose a highlighted statement">
          {FLAGS.map((f, i) => (
            <button
              key={f.type}
              type="button"
              onClick={() => setActive(i)}
              className={`chip ${f.type === 'supported' ? 'chip-green' : f.type === 'warning' ? 'chip-amber' : 'chip-red'} pill cursor-pointer`}
              style={{ borderWidth: 2, opacity: active === i ? 1 : 0.55 }}
              aria-pressed={active === i}
            >
              {f.label}
            </button>
          ))}
        </div>
        <motion.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="card p-4 p-md-5" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="d-flex align-items-center gap-2 mb-3 text-muted-2 text-small">
            <span className="chip chip-gray pill">the-weekly-bulletin.example</span>
            <span>·</span>
            <span>Business · 3 min read</span>
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 2.05, color: 'var(--text-2)' }}>
            {FLAGS.map((f, i) => (
              <span
                key={f.type}
                role="button"
                tabIndex={0}
                onClick={() => setActive(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(i); } }}
                className={`reveal-mark clickable-statement ${f.type === 'supported' ? 'reveal-supported' : f.type === 'warning' ? 'reveal-warning' : 'reveal-suspicious'}`}
                aria-label={`${f.label} statement, activate to see explanation`}
                title={f.label}
              >
                {f.quote}
              </span>
            ))}
          </p>
          <motion.div key={`tip-${active}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="hl-tip-card p-3 d-flex gap-3 mt-3">
            <span className="d-inline-grid place-items-center rounded-3 flex-shrink-0 align-self-start" style={{ width: 34, height: 34, background: `${current.type === 'supported' ? '#16A34A' : current.type === 'warning' ? '#D97706' : '#DC2626'}18`, color: current.type === 'supported' ? '#16A34A' : current.type === 'warning' ? '#D97706' : '#DC2626' }}>
              <Info size={17} />
            </span>
            <div>
              <div className="fw-bold mb-1" style={{ fontSize: 13.5 }}>{current.label}</div>
              <div className="text-muted-2" style={{ fontSize: 13 }}>{current.explanation}</div>
            </div>
          </motion.div>
          <div className="d-flex gap-3 mt-3 pt-3 border-top flex-wrap" style={{ borderColor: 'var(--border) !important', fontSize: 12 }}>
            <span className="d-inline-flex align-items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 3, background: '#16A34A' }} /> Supported</span>
            <span className="d-inline-flex align-items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 3, background: '#D97706' }} /> Needs verification</span>
            <span className="d-inline-flex align-items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 3, background: '#DC2626' }} /> Potentially suspicious</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
