import { classNames, colorForScore, colorForVerdict, inkForScore, inkForVerdict, verdictFor } from '../../utils/credibility';
export default function VerdictBadge({ score, verdict, size }) {
  const label = verdict || verdictFor(score);
  const color = verdict ? colorForVerdict(verdict) : colorForScore(score);
  const ink = verdict ? inkForVerdict(verdict) : inkForScore(score);
  return (
    <span className={classNames('chip pill fw-bold', size === 'sm' ? 'text-xs' : '')} style={{ background: `${color}1c`, color: ink, borderColor: `${color}55` }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}
