import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, FileSearch, FileText, Link2, Radar, RotateCcw, Scale, ScanSearch, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
const STAGES = [
  { label: 'Extracting the article', seconds: 1.2 },
  { label: 'Scanning source and writing', seconds: 1.2 },
  { label: 'Cross-checking claims', seconds: 1.2 },
  { label: 'Scoring the evidence', seconds: 1.1 }
];
function ArticleCard({ visible, score }) {
  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={visible ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 170, damping: 20 }}
        className="card p-3"
        style={{ boxShadow: '0 24px 60px rgba(2,44,34,.25)' }}
      >
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="chip chip-green pill text-xs">example.com</span>
          <span className="chip chip-gray pill text-xs">Business</span>
        </div>
        <div className="fw-bold mb-2" style={{ fontSize: 15, color: 'var(--text)' }}>
          “Central bank signals rate pause as inflation cools”
        </div>
        <div className="d-flex flex-column gap-1 mb-2" style={{ width: '92%' }}>
          <span className="skeleton" style={{ height: 6 }} />
          <span className="skeleton" style={{ height: 6, width: '80%' }} />
          <span className="skeleton" style={{ height: 6, width: '65%' }} />
        </div>
        <div className="d-flex gap-2 align-items-center text-muted-2 text-xs">
          <span>Byline: R. Mehta</span>
          <span>·</span>
          <span>Sep 4, 2026</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="position-absolute"
        style={{ top: -12, right: -12, background: 'var(--card)', border: '2px solid var(--primary)', color: 'var(--brand-ink)', borderRadius: 100, padding: '0.35rem 0.75rem', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <ScanSearch size={13} /> AI scan
      </motion.div>
    </div>
  );
}
function ResultPanel({ done, score }) {
  const color = '#16A34A';
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.92 }}
      animate={done ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 180, damping: 19 }}
      className="card p-3 d-flex align-items-center gap-3"
      style={{ boxShadow: '0 24px 60px rgba(2,44,34,.25)' }}
    >
      <div className="position-relative">
        <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label="Credibility score 87 of 100">
          <circle cx="42" cy="42" r="34" fill="none" stroke="var(--border)" strokeWidth="8" />
          <motion.circle
            cx="42" cy="42" r="34" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 34}
            initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
            animate={done ? { strokeDashoffset: 2 * Math.PI * 34 * (1 - score / 100) } : {}}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            transform="rotate(-90 42 42)"
          />
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <div style={{ fontSize: 21, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{done ? score : 0}</div>
          <div style={{ fontSize: 8.5, color: 'var(--muted)' }}>/100</div>
        </div>
      </div>
      <div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <ShieldCheck size={17} style={{ color }} />
          <span className="fw-bold" style={{ fontSize: 15, color }}>Highly Credible</span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0 }}>
          Source &amp; claims largely supported · low sensationalism · transparent publication details.
        </p>
        <div className="d-flex gap-2 mt-2">
          <span className="chip chip-green text-xs">Source Reliability 91</span>
          <span className="chip chip-teal text-xs">Evidence 84</span>
          <span className="chip chip-amber text-xs">Sensationalism Low</span>
        </div>
      </div>
    </motion.div>
  );
}
function StageRail({ stage }) {
  return (
    <div className="d-flex align-items-center gap-2" style={{ fontSize: 12, color: 'var(--text-2)' }}>
      <div className="d-flex gap-1" aria-hidden="true">
        {STAGES.map((s, i) => (
          <span
            key={s.label}
            style={{
              width: 26, height: 5, borderRadius: 3,
              background: i === stage ? 'var(--primary)' : i < stage ? '#6366F1' : 'var(--border)',
              transition: 'background .3s'
            }}
          />
        ))}
      </div>
      <span className="fw-semibold">{stage >= STAGES.length ? 'Analysis ready' : STAGES[stage].label}</span>
    </div>
  );
}
function TruthLensStage() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { isAuthenticated } = useAuth();
  const replay = () => {
    setPlaying(false);
    setStage(0);
    setTimeout(() => setPlaying(true), 80);
  };
  useEffect(() => {
    if (!playing) return undefined;
    const timers = [];
    STAGES.forEach((s, i) => {
      timers.push(setTimeout(() => setStage(i + 1), s.seconds * 1000 * (i + 1)));
    });
    timers.push(setTimeout(() => setPlaying(false), 5200));
    return () => timers.forEach(clearTimeout);
  }, [playing]);
  useEffect(() => {
    const t = setTimeout(() => setPlaying(true), 350);
    return () => clearTimeout(t);
  }, []);
  const scanning = playing && stage < STAGES.length;
  const showCard = playing;
  return (
    <div className="position-relative d-flex flex-column align-items-center" style={{ perspective: 1200 }}>
      <motion.div
        animate={{ opacity: playing ? 0 : 1, y: playing ? -6 : 0 }}
        className="mb-3 d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', fontSize: 12.5, color: 'var(--text-2)' }}
      >
        <Radar size={15} style={{ color: 'var(--primary)' }} />
        See a credibility check in action
      </motion.div>
      <div className="position-relative" style={{ width: '100%', maxWidth: 360 }}>
        <ArticleCard visible={showCard} />
        {scanning ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="position-absolute inset-0 d-flex align-items-center justify-content-center"
            style={{ top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14, background: 'rgba(4,120,87,.08)', pointerEvents: 'none' }}
          >
            <div className="scanline position-absolute" style={{ inset: 0, borderRadius: 14, border: '1.5px solid rgba(52,211,153,.7)' }} />
            <span className="chip pill" style={{ background: 'rgba(255,255,255,.92)', color: '#4338CA', fontWeight: 800, fontSize: 11.5 }}>
              <ScanSearch size={12} /> analyzing…
            </span>
          </motion.div>
        ) : null}
        {stage >= 2 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="position-absolute"
            style={{ top: '26%', right: -34 }}
          >
            <div className="d-flex flex-column gap-1 p-2" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-md)' }}>
              {['Source', 'Claims', 'Evidence'].map((n, i) => {
                const tone = ['var(--success-ink)', 'var(--brand-ink)', 'var(--brand-ink)'][i];
                return (
                <motion.span
                  key={n}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 * i }}
                  className="chip text-xs fw-bold"
                  style={{ background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone, border: `1px solid color-mix(in srgb, ${tone} 34%, transparent)` }}
                >
                  {['✓ Source ok', '✓ Claim cross-checked', '✓ Evidence found'][i]}
                </motion.span>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </div>
      <div className="mt-4 d-flex flex-column align-items-center gap-3" style={{ width: '100%', maxWidth: 360 }}>
        <StageRail stage={stage} />
        <ResultPanel done={!playing && stage >= STAGES.length} score={87} />
        <div className="d-flex flex-wrap gap-2 justify-content-center" style={{ fontSize: 12, color: 'var(--text-2)' }}>
          <span className="d-inline-flex align-items-center gap-1"><ShieldCheck size={13} style={{ color: 'var(--primary)' }} /> 7 weighted factors</span>
          <span className="d-inline-flex align-items-center gap-1"><Link2 size={13} style={{ color: 'var(--primary)' }} /> claim-level checks</span>
          <span className="d-inline-flex align-items-center gap-1"><Sparkles size={13} style={{ color: 'var(--primary)' }} /> explainable score</span>
          <span className="d-inline-flex align-items-center gap-1"><FileText size={13} style={{ color: 'var(--primary)' }} /> PDF reports</span>
        </div>
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <button type="button" className="btn btn-ghost btn-sm px-3" onClick={replay}>
            <RotateCcw size={14} className="me-1" /> Replay Animation
          </button>
        </div>
      </div>
    </div>
  );
}
export default function Hero() {
  const { isAuthenticated } = useAuth();
  const analyzeTo = isAuthenticated ? '/user/analyze' : '/register?next=/user/analyze';
  return (
    <section id="home" className="position-relative overflow-hidden">
      <div className="grid-dots position-absolute" style={{ inset: 0, opacity: 0.5, maskImage: 'radial-gradient(70% 60% at 50% 30%, black, transparent)' }} aria-hidden="true" />
      <div className="position-relative" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(2.5rem,6vw,5.5rem) 1rem 3rem' }}>
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
              <span className="section-label"><ShieldCheck size={14} /> AI-Powered News Credibility Analysis</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              className="fw-800 mb-3"
              style={{ fontSize: 'clamp(2.15rem, 4.6vw, 3.55rem)', lineHeight: 1.12, letterSpacing: '-0.02em' }}
            >
              Can you trust what <span className="text-gradient-emerald">you’re reading?</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: 'easeOut' }}
              className="text-secondary-2 mb-4"
              style={{ fontSize: 'clamp(1rem, 1.4vw, 1.12rem)', maxWidth: 560 }}
            >
              Paste an article and get a transparent credibility score — with a plain-English explanation of the source, claims, evidence and language behind it.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.36, ease: 'easeOut' }}
              className="d-flex flex-wrap gap-3 mb-4"
            >
              <Link to={analyzeTo} className="btn btn-primary btn-lg px-4">
                Analyze an Article <ArrowRight size={17} className="ms-1" />
              </Link>
              <a href="#how-it-works" className="btn btn-ghost btn-lg px-4">
                See How It Works
              </a>
            </motion.div>
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="list-unstyled d-flex flex-wrap gap-2 mb-0" style={{ fontSize: 12.5 }}>
              <li className="chip chip-green pill"><Building2 size={12} /> Source Reliability</li>
              <li className="chip chip-green pill"><FileSearch size={12} /> Claim Verification</li>
              <li className="chip chip-green pill"><TriangleAlert size={12} /> Sensationalism Detection</li>
              <li className="chip chip-green pill"><Scale size={12} /> Transparent Scoring</li>
            </motion.ul>
          </div>
          <div className="col-lg-6 d-none d-lg-block">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}>
              <TruthLensStage />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
