import { motion } from 'framer-motion';
import { colorForScore, weightPct } from '../../utils/credibility';
export default function FactorMeter({ factor, compact }) {
  const { label, score, weight, reason, excluded } = factor;
  const color = excluded ? 'var(--muted)' : colorForScore(score);
  if (compact) {
    return (
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="fw-semibold text-small">{label}</span>
          {excluded ? (
            <span className="chip chip-gray">Not assessed</span>
          ) : (
            <span className="font-mono fw-bold text-small" style={{ color }}>{score}/100</span>
          )}
        </div>
        {!excluded && (
          <div className="progress" style={{ height: 6 }}>
            <motion.div
              className="progress-bar"
              style={{ background: color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${score}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <div>
          <span className="fw-semibold" style={{ fontSize: 13.5 }}>{label}</span>
          <span className="chip chip-gray ms-2" style={{ fontSize: 10.5 }}>{weightPct(weight)}% weight</span>
        </div>
        {excluded ? (
          <span className="chip chip-amber">Not assessed</span>
        ) : (
          <span className="font-mono fw-bold" style={{ fontSize: 14, color }}>{score}<span className="text-muted-2" style={{ fontSize: 11 }}>/100</span></span>
        )}
      </div>
      {!excluded && (
        <div className="progress" style={{ height: 8 }}>
          <motion.div
            className="progress-bar"
            style={{ background: color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${score}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </div>
      )}
      <div className="text-muted-2 text-small mt-1">{reason}</div>
    </div>
  );
}
