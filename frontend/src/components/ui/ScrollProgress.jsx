import { motion, useScroll, useSpring } from 'framer-motion';

/** Thin gradient bar at the top that fills as the page is scrolled. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 150, damping: 28, restDelta: 0.001 });
  return <motion.div aria-hidden="true" className="scroll-progress" style={{ scaleX }} />;
}
