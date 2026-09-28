import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
export default function FinalCta() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  return (
    <section style={{ padding: 'clamp(2.5rem, 5vw, 4.5rem) 1rem 4.5rem' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 18 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="position-relative overflow-hidden rounded-4 text-center p-5"
          style={{
            background: 'radial-gradient(900px 320px at 50% -40%, rgba(99,102,241,.35), transparent), linear-gradient(135deg, #312E81, #1E1B4B)',
            color: '#fff'
          }}
        >
          <div className="position-absolute top-0 start-0 end-0 mx-auto d-flex justify-content-center" aria-hidden="true">
            <ShieldCheck size={60} style={{ color: 'rgba(110,231,183,.25)', marginTop: 26 }} />
          </div>
          <h2 className="mt-4 mb-2" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)' }}>
            Analyze. Verify. <span style={{ color: '#A5B4FC' }}>Understand the Truth.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,.78)', maxWidth: 560, margin: '0 auto 1.8rem', fontSize: 15 }}>
            Your next news break doesn't have to be a leap of faith. Run it through a structured credibility analysis and see exactly why it should — or shouldn't — earn your trust.
          </p>
          <button type="button" className="btn btn-light btn-lg px-4" style={{ color: '#4338CA', fontWeight: 700 }} onClick={() => (isAuthenticated ? navigate('/user/analyze') : navigate('/register?next=/user/analyze'))}>
            Start your first analysis <ArrowRight size={17} className="ms-1" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
