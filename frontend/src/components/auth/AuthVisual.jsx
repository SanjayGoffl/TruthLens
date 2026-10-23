import { motion } from 'framer-motion';
import { CheckCircle2, FileSearch, Fingerprint, Mail, ShieldCheck, KeyRound, Lock, Sparkles, UserPlus, ArrowRight } from 'lucide-react';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }
});

function StageCard({ children, delay = 0 }) {
  return (
    <motion.div
      {...fade(delay)}
      className="card p-3"
      style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 14 }}
    >
      {children}
    </motion.div>
  );
}

/* --- login: identity check ------------------------------------------------ */
function LoginStage() {
  return (
    <div className="d-flex flex-column gap-2" style={{ width: '100%', maxWidth: 420 }}>
      <StageCard>
        <div className="d-flex gap-2 align-items-center mb-2">
          <FileSearch size={16} color="#A5B4FC" />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>Verifying your identity</span>
        </div>
        <div className="d-flex flex-column gap-1" style={{ width: '80%' }}>
          <span style={{ height: 7, width: '100%', background: 'rgba(255,255,255,.2)', borderRadius: 4 }} />
          <span style={{ height: 7, width: '70%', background: 'rgba(255,255,255,.13)', borderRadius: 4 }} />
          <span style={{ height: 7, width: '86%', background: 'rgba(255,255,255,.2)', borderRadius: 4 }} />
        </div>
      </StageCard>
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

/* --- register: three-step onboarding ------------------------------------- */
const REGISTER_STEPS = [
  { title: 'Create your account', text: 'Name, email and a strong password' },
  { title: 'Verify your email', text: 'A single-use code confirms it is you' },
  { title: 'Start analyzing', text: 'Paste a link or text, get an explainable score' }
];

function RegisterStage() {
  return (
    <div className="d-flex flex-column gap-3" style={{ width: '100%', maxWidth: 430 }}>
      {REGISTER_STEPS.map((step, i) => (
        <motion.div
          key={step.title}
          {...fade(0.35 + i * 0.28)}
          className="d-flex align-items-start gap-3 position-relative"
        >
          <div
            className="d-inline-grid place-items-center rounded-circle flex-shrink-0"
            style={{
              width: 42, height: 42,
              background: i === 0 ? '#6366F1' : 'rgba(255,255,255,.08)',
              border: `1px solid ${i === 0 ? '#6366F1' : 'rgba(255,255,255,.22)'}`,
              color: i === 0 ? '#1E1B4B' : '#A5B4FC',
              fontWeight: 800, fontSize: 15
            }}
          >
            {i === 0 ? <UserPlus size={19} /> : i + 1}
          </div>
          <div className="pt-1">
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{step.title}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.66)' }}>{step.text}</div>
          </div>
          {i < REGISTER_STEPS.length - 1 ? (
            <motion.span
              aria-hidden="true"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.5 + i * 0.28, duration: 0.35 }}
              style={{ position: 'absolute', left: 20, top: 46, width: 2, height: 22, background: 'rgba(165,180,252,.35)', transformOrigin: 'top' }}
            />
          ) : null}
        </motion.div>
      ))}
      <motion.div {...fade(1.25)} className="d-inline-flex align-items-center gap-2 mt-1" style={{ fontSize: 12.5, color: 'rgba(255,255,255,.62)' }}>
        <Sparkles size={13} style={{ color: '#A5B4FC' }} />
        Free to start · no card required · private history by default
      </motion.div>
    </div>
  );
}

/* --- otp: six code cells -------------------------------------------------- */
function OtpStage() {
  return (
    <div style={{ width: '100%', maxWidth: 430 }}>
      <StageCard delay={0.3}>
        <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: 12, color: 'rgba(255,255,255,.72)' }}>
          <Fingerprint size={15} color="#A5B4FC" /> Code sent to your inbox
        </div>
        <div className="d-flex gap-2" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.11 }}
              style={{
                flex: 1, height: 52, borderRadius: 10,
                display: 'grid', placeItems: 'center',
                background: i < 3 ? 'rgba(99,102,241,.35)' : 'rgba(255,255,255,.05)',
                border: `1px solid ${i < 3 ? 'rgba(165,180,252,.7)' : 'rgba(255,255,255,.18)'}`,
                fontWeight: 800, fontSize: 20, color: '#fff', fontFamily: 'var(--font-mono)'
              }}
            >
              {i < 3 ? '•' : ''}
            </motion.span>
          ))}
        </div>
        <motion.div {...fade(1.2)} className="d-flex align-items-center justify-content-between mt-3" style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
          <span>Single use · expires in 10 minutes</span>
          <span style={{ color: '#A5B4FC', fontWeight: 700 }}>Resend available</span>
        </motion.div>
      </StageCard>
      <motion.div {...fade(1.45)} className="d-flex align-items-center gap-2 mt-4" style={{ fontSize: 12.5, color: 'rgba(255,255,255,.62)' }}>
        <ShieldCheck size={14} style={{ color: '#A5B4FC' }} />
        We never reveal whether a code was wrong for a different account
      </motion.div>
    </div>
  );
}

/* --- forgot: mail in flight ---------------------------------------------- */
function ForgotStage() {
  return (
    <div className="d-flex flex-column gap-3" style={{ width: '100%', maxWidth: 420 }}>
      <div className="position-relative" style={{ height: 120 }}>
        <motion.div
          initial={{ opacity: 0, x: -60, y: 18, rotate: -12 }}
          animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 16, delay: 0.35 }}
          className="d-inline-grid place-items-center"
          style={{ width: 76, height: 76, borderRadius: 20, background: 'rgba(99,102,241,.22)', border: '1px solid rgba(165,180,252,.55)' }}
        >
          <Mail size={34} color="#A5B4FC" />
        </motion.div>
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.15, 1.6] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.9 }}
          style={{ position: 'absolute', left: 6, top: 6, width: 64, height: 64, borderRadius: 18, border: '1px solid rgba(165,180,252,.5)' }}
        />
      </div>
      <StageCard delay={0.6}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Reset link on its way</div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.66)', marginTop: 4 }}>
          Check the inbox for the address you registered with. The link is single-use and time-limited.
        </div>
      </StageCard>
      <motion.ul {...fade(0.9)} className="list-unstyled d-flex flex-column gap-2 mb-0" style={{ fontSize: 12.5, color: 'rgba(255,255,255,.68)' }}>
        {['No link? Check spam, then request another', 'Only the newest link works', 'Your current password stays valid until you reset'].map((t) => (
          <li key={t} className="d-flex align-items-start gap-2">
            <CheckCircle2 size={13} style={{ color: '#A5B4FC', marginTop: 2, flexShrink: 0 }} /> {t}
          </li>
        ))}
      </motion.ul>
    </div>
  );
}

/* --- reset: new password strength ---------------------------------------- */
const STRENGTH = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'];

function ResetStage() {
  return (
    <div className="d-flex flex-column gap-3" style={{ width: '100%', maxWidth: 420 }}>
      <StageCard delay={0.3}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <KeyRound size={16} color="#A5B4FC" />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>Choosing a new password</span>
        </div>
        <div className="d-flex gap-1 mb-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5 + i * 0.18, duration: 0.3 }}
              style={{
                flex: 1, height: 6, borderRadius: 3, transformOrigin: 'left',
                background: i < 3 ? '#34D399' : 'rgba(255,255,255,.16)'
              }}
            />
          ))}
        </div>
        <div className="d-flex align-items-center justify-content-between" style={{ fontSize: 12 }}>
          <span style={{ color: '#6EE7B7', fontWeight: 700 }}>{STRENGTH[3]}</span>
          <span style={{ color: 'rgba(255,255,255,.55)' }}>12+ characters, mixed case, symbol</span>
        </div>
      </StageCard>
      <motion.div {...fade(1)} className="d-flex align-items-center gap-3">
        <div className="d-inline-grid place-items-center rounded-3" style={{ width: 44, height: 44, background: 'rgba(52,211,153,.18)', border: '1px solid rgba(52,211,153,.45)' }}>
          <Lock size={20} color="#6EE7B7" />
        </div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.68)' }}>
          All other sessions are signed out once the reset completes.
        </div>
      </motion.div>
      <motion.div {...fade(1.25)} className="d-flex align-items-center gap-2" style={{ fontSize: 12.5, color: 'rgba(255,255,255,.58)' }}>
        <ArrowRight size={13} style={{ color: '#A5B4FC' }} />
        You will return to sign in with your new password.
      </motion.div>
    </div>
  );
}

const heading = {
  login: { title: 'Secure sign in', text: 'Every manual sign-in is protected by an emailed one-time code. No code, no session.' },
  register: { title: 'Join TruthLens AI', text: 'Create your account to analyze articles and keep a private history of credibility reports.' },
  otp: { title: 'Verify the code', text: 'Enter the one-time code we sent. Codes are single-use and expire automatically.' },
  forgot: { title: 'Find your way back in', text: 'Tell us the email on the account and we will send a single-use reset link.' },
  reset: { title: 'Set a new password', text: 'Choose a password you have not used before. Resetting signs out other devices.' }
};

const STAGE = { login: LoginStage, register: RegisterStage, otp: OtpStage, forgot: ForgotStage, reset: ResetStage };

export default function AuthVisual({ variant = 'login' }) {
  const copy = heading[variant] || heading.login;
  const Stage = STAGE[variant] || LoginStage;
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
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} style={{ color: 'rgba(255,255,255,.72)', fontSize: 14.5, maxWidth: 400, marginBottom: '2rem' }}>
        {copy.text}
      </motion.p>
      <Stage key={variant} />
    </div>
  );
}
