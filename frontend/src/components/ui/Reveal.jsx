import { motion } from 'framer-motion';

/**
 * Scroll-reveal wrapper. Fades and lifts children into view once.
 * Motion is disabled automatically by <MotionConfig reducedMotion="user">.
 */
export default function Reveal({ children, delay = 0, y = 24, className, as = 'div' }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}
