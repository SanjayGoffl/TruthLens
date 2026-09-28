import { motion } from 'framer-motion';
import { classNames } from '../../utils/credibility';
export default function StatCard({ icon: Icon, iconBg, value, label, sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="card card-hover h-100"
    >
      <div className="card-body d-flex align-items-start gap-3 p-3 p-lg-4">
        <div className="stat-icon" style={{ background: `${iconBg || '#6366F1'}18`, color: iconBg || 'var(--primary)' }}>
          <Icon size={22} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <div className="stat-value">{value}</div>
          <div className="stat-label mt-1">{label}</div>
          {sub ? <div className="text-muted-2 text-xs mt-1">{sub}</div> : null}
        </div>
      </div>
    </motion.div>
  );
}
