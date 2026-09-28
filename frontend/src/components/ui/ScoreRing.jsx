import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { colorForScore } from '../../utils/credibility';
export default function ScoreRing({ score, size = 168, stroke = 13, label = '/ 100', sublabel }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = colorForScore(score);
  useEffect(() => {
    if (!inView) return undefined;
    const duration = 1100;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, score]);
  return (
    <div ref={ref} className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: size, height: size }} role="img" aria-label={`Credibility score ${score} out of 100`}>
      <svg width={size} height={size} className="position-absolute" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - display / 100)}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="text-center position-relative">
        <div className="font-mono fw-bold" style={{ fontSize: size * 0.21, color: 'var(--text)', lineHeight: 1 }}>
          {display}
          <span style={{ fontSize: size * 0.09, color: 'var(--muted)' }}>{label}</span>
        </div>
        {sublabel ? (
          <div className="fw-bold mt-1" style={{ fontSize: size * 0.062, color }}>
            {sublabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}
