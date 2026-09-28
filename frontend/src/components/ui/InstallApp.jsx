import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// "Install app" prompt: uses Chrome's install event; on iOS it explains Add to Home Screen.
export default function InstallApp({ variant = 'banner' }) {
  const [evt, setEvt] = useState(null);
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem('truthlens_install_dismissed') === '1'; } catch (e) { return false; }
  });
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setEvt(e); };
    const onInstalled = () => setEvt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (isStandalone()) return null;
  const canInstall = Boolean(evt);
  const ios = isIos();
  if (!canInstall && !ios) return null;
  if (variant === 'banner' && hidden) return null;

  const install = async () => {
    if (evt) { evt.prompt(); await evt.userChoice; setEvt(null); } else { setIosHelp((v) => !v); }
  };
  const dismiss = () => { setHidden(true); try { localStorage.setItem('truthlens_install_dismissed', '1'); } catch (e) { /* ignore */ } };

  if (variant === 'button') {
    return <button type="button" className="btn btn-ghost d-inline-flex align-items-center gap-2" onClick={install}><Download size={16} /> Install app</button>;
  }
  return (
    <div className="install-banner" role="region" aria-label="Install the app">
      <span className="install-icon"><Download size={18} /></span>
      <div className="flex-grow-1 min-w-0">
        <div className="fw-bold" style={{ fontSize: 14 }}>Install TruthLens on your phone</div>
        <div className="text-muted-2 text-small">
          {iosHelp || (ios && !canInstall) ? <>Tap <Share size={12} /> then “Add to Home Screen”.</> : 'Opens full-screen, works like a native app.'}
        </div>
      </div>
      {canInstall ? <button type="button" className="btn btn-primary btn-sm" onClick={install}>Install</button> : null}
      <button type="button" className="btn btn-ghost btn-sm p-1" onClick={dismiss} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}
