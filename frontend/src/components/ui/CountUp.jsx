import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';

/** Counts from 0 to `value` the first time it scrolls into view. */
export default function CountUp({ value, duration = 1.1, className, style, decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  useEffect(() => {
    if (!inView || !ref.current) return undefined;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = v.toFixed(decimals);
      }
    });
    return () => controls.stop();
  }, [inView, value, duration, decimals]);
  return (
    <span ref={ref} className={className} style={style}>
      {Number(0).toFixed(decimals)}
    </span>
  );
}
