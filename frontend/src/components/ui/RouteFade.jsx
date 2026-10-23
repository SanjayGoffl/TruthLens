import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/** Fades routed content in on navigation. Keyed by pathname so each route animates once. */
export default function RouteFade({ children }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
