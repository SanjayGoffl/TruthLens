import { motion } from 'framer-motion';
import { CheckCircle2, FileSearch, Fingerprint, ShieldCheck } from 'lucide-react';
function LoginStage() {
  return (
    <div className="d-flex flex-column gap-2" style={{ width: '100%', maxWidth: 420 }}>
      <div className="position-relative card p-3 scanline" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 14 }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="d-flex gap-2 align-items-center mb-2">
            <FileSearch size={16} color="#A5B4FC" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>Verifying your identity</span>
          </div>
          <div className="d-flex flex-column gap-1" style={{ width: '80%' }}>
            <span style={{ height: 7, width: '100%', background: 'rgba(255,255,255,.2)', borderRadius: 4 }} />
            <span style={{ height: 7, width: '70%', background: 'rgba(255,255,255,.13)', borderRadius: 4 }} />
            <span style={{ height: 7, width: '86%', background: 'rgba(255,255,255,.2)', borderRadius: 4 }} />
          </div>
        </motion.div>
      </div>
      <div className="d-flex align-items-center gap-3" style={{ paddingLeft: 18 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.75, type: 'spring', stiffness: 260, damping: 18 }}>
          <div className="d-inline-grid place-items-center rounded-3" style={{ width: 40, height: 40, background: 'rgba(99,102,241,.25)', border: '1px solid rgba(52,211,153,.5)' }}>
            <Fingerprint size={20} color="#A5B4FC" />
          </div>
        </motion.div>
        <div>
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.95 }} style={{ fontWeight: 700, fontSize: 14 }}>
            One-time code sent
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }} style={{ fontSize: 12.5, color: 'rgba(255,255,255,.66)' }}>
            Your email receives a single-use security code
          </motion.div>
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.45, type: 'spring', stiffness: 200, damping: 20 }} className="d-flex align-items-center gap-2">
        <div className="d-inline-grid place-items-center rounded-3" style={{ width: 46, height: 46, background: '#6366F1', color: '#1E1B4B', boxShadow: '0 8px 28px rgba(99,102,241,.45)' }}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Protected sign-in</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)' }}>Sessions are created only after your code is verified</div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="mt-2" style={{ color: 'rgba(255,255,255,.6)', fontSize: 12.5 }}>
        <CheckCircle2 size={13} className="me-1" style={{ color: '#A5B4FC' }} />
        OTP expires after a limited period · single use · resend supported
      </motion.div>
    </div>
  );
}
const heading = {
  login: { title: 'Secure sign in', text: 'Every manual sign-in is protected by an emailed one-time code. No code, no session.' },
  register: { title: 'Join TruthLens AI', text: 'Create your account to analyze articles and keep a private history of credibility reports.' },
  otp: { title: 'Verify the code', text: 'Enter the one-time code we sent. Codes are single-use and expire automatically.' },
  reset: { title: 'Restore access', text: 'Reset your password safely with an emailed one-time code.' }
};
export default function AuthVisual({ variant }) {
  const copy = heading[variant] || heading.login;
  return (
    <div className="w-100" style={{ maxWidth: 500 }}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="d-flex align-items-center gap-2 mb-3">
        <div className="d-inline-grid place-items-center rounded-3" style={{ width: 44, height: 44, background: '#6366F1', color: '#1E1B4B' }}>
          <ShieldCheck size={24} />
        </div>
        <span style={{ fontWeight: 800, fontSize: 22, fontFamily: "'Sora','Inter',sans-serif", color: '#fff' }}>TruthLens AI</span>
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.5rem, 2.2vw, 1.9rem)', lineHeight: 1.25 }}>
        {copy.title}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }} style={{ color: 'rgba(255,255,255,.72)', fontSize: 14.5, maxWidth: 400, marginBottom: '2.2rem' }}>
        {copy.text}
      </motion.p>
      {variant === 'login' ? (
        <LoginStage />
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 180, damping: 16 }} className="d-inline-grid place-items-center rounded-4" style={{ width: 96, height: 96, background: 'rgba(99,102,241,.18)', border: '1px solid rgba(52,211,153,.45)' }}>
          <ShieldCheck size={46} color="#A5B4FC" />
        </motion.div>
      )}
    </div>
  );
}
