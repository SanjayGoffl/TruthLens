import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, ClipboardPaste, FileText, Globe, Link2, Loader2, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import { onSocketEvent, offSocketEvent } from '../../services/socket';
import { ButtonSpinner } from '../../components/ui/Loaders';

const STEPS = [
  { label: 'Reading the article', hint: 'Extracting text, headline and publication details' },
  { label: 'Checking the source', hint: 'Comparing the publisher with the source registry' },
  { label: 'Verifying claims', hint: 'Extracting factual claims and looking for evidence' },
  { label: 'Calculating the score', hint: 'Applying the weighted credibility formula' },
  { label: 'Building your report', hint: 'Assembling findings, strengths and weaknesses' }
];
const MAX_CHARS = 20000;
const MIN_WORDS = 40;
const URL_RE = /^https?:\/\/([\w-]+\.)+[\w-]+/i;

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  // Android "Share to TruthLens" sends title/text/url; a shared link may arrive inside `text`.
  const sharedText = params.get('text') || '';
  const sharedUrl = params.get('url') || (/^https?:\/\/\S+$/i.test(sharedText.trim()) ? sharedText.trim() : '');
  const [mode, setMode] = useState(sharedText && !sharedUrl ? 'paste' : 'url');
  const [url, setUrl] = useState(sharedUrl);
  const [text, setText] = useState(sharedUrl ? '' : sharedText);
  const [meta, setMeta] = useState({ title: '', publisher: '', author: '', sourceUrl: '' });
  const [errors, setErrors] = useState({});
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0);
  const stageRef = useRef(0);
  const timer = useRef(null);
  const autoRan = useRef(false);

  const words = useMemo(() => countWords(text), [text]);

  useEffect(() => {
    const onProgress = (p) => {
      if (!p || typeof p.stage !== 'number') return;
      if (p.stage > stageRef.current) {
        stageRef.current = p.stage;
        setStage(p.stage);
      }
    };
    onSocketEvent('analysis:progress', onProgress);
    return () => {
      offSocketEvent('analysis:progress', onProgress);
      clearInterval(timer.current);
    };
  }, []);

  const start = () => {
    stageRef.current = 0;
    setStage(0);
    setRunning(true);
    // Fallback pacing if the realtime channel is unavailable: never runs ahead of the last steps.
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      if (stageRef.current < 2) {
        stageRef.current += 1;
        setStage(stageRef.current);
      }
    }, 3500);
  };

  const run = async (kind, payload) => {
    start();
    try {
      // Start a background job, then poll it: the request no longer stays open for the whole analysis.
      const started = await api.post('/analysis/jobs', kind === 'url' ? payload : payload);
      const jobId = started.data.jobId;
      const deadline = Date.now() + 5 * 60 * 1000;
      let job = null;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));
        const poll = await api.get(`/analysis/jobs/${jobId}`);
        job = poll.data.job;
        if (typeof job.stage === 'number' && job.stage > stageRef.current && job.stage < STEPS.length) {
          stageRef.current = job.stage;
          setStage(job.stage);
        }
        if (job.status === 'done' || job.status === 'failed') break;
      }
      clearInterval(timer.current);
      if (!job || job.status === 'failed') throw new Error((job && job.message) || 'Analysis failed.');
      if (job.status !== 'done') throw new Error('The analysis is taking longer than expected. Check your history in a minute.');
      setStage(STEPS.length);
      toast.success(`Report ready — ${job.score}/100 (${job.verdict}).`);
      setTimeout(() => navigate(`/user/result/${job.analysisId}`), 450);
    } catch (err) {
      clearInterval(timer.current);
      setRunning(false);
      const message = err && err.response ? errorMessage(err, 'Analysis failed.') : (err && err.message) || 'Analysis failed.';
      setErrors({ form: message });
      toast.error(message);
    }
  };

  const submitUrl = (e) => {
    if (e) e.preventDefault();
    const trimmed = url.trim();
    if (!URL_RE.test(trimmed)) {
      setErrors({ url: 'Enter a full article link starting with http:// or https://' });
      return;
    }
    setErrors({});
    run('url', { url: trimmed });
  };

  const submitPaste = (e) => {
    e.preventDefault();
    const next = {};
    if (words < MIN_WORDS) next.text = `Paste at least ${MIN_WORDS} words (you have ${words}).`;
    if (text.length > MAX_CHARS) next.text = `Please keep the text under ${MAX_CHARS.toLocaleString()} characters.`;
    if (meta.sourceUrl && !URL_RE.test(meta.sourceUrl.trim())) next.sourceUrl = 'Source link must start with http:// or https://';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setErrors({});
    run('content', { content: text, title: meta.title, publisher: meta.publisher, author: meta.author, sourceUrl: meta.sourceUrl.trim() });
  };

  // Browser-extension hand-off: /user/analyze?url=… starts immediately.
  useEffect(() => {
    if (autoRan.current) return;
    const incoming = params.get('url');
    // Only auto-run for in-app navigation; links from outside (e.g. the extension) prefill and wait for a click.
    if (incoming && URL_RE.test(incoming) && location.state && location.state.auto) {
      autoRan.current = true;
      submitUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = Math.min(100, Math.round(((stage + (running ? 0.5 : 0)) / STEPS.length) * 100));

  return (
    <div>
      <div className="mb-4">
        <h1 className="page-title">Analyze an article</h1>
        <p className="page-subtitle">Paste a link or the article text. You get a scored, explainable credibility report.</p>
      </div>

      <div className="row g-4">
        <div className="col-xl-8">
          <div className="analyze-hero">
            {running ? (
              <div role="status" aria-live="polite">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="d-grid place-items-center rounded-3" style={{ width: 46, height: 46, background: 'var(--bg-2)', color: 'var(--primary)' }}>
                    <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                  </span>
                  <div>
                    <div className="fw-bold" style={{ fontSize: 17 }}>{stage >= STEPS.length ? 'Report ready' : STEPS[stage].label}…</div>
                    <div className="text-muted-2 text-small">{stage >= STEPS.length ? 'Opening your report' : STEPS[stage].hint}</div>
                  </div>
                </div>
                <div className="proc-bar mb-3"><span style={{ width: `${stage >= STEPS.length ? 100 : pct}%` }} /></div>
                <ol className="step-list">
                  {STEPS.map((s, i) => {
                    const state = i < stage ? 'done' : i === stage ? 'active' : '';
                    return (
                      <li key={s.label} className={`step-item ${state}`}>
                        <span className="step-dot">{i < stage ? <Check size={14} /> : i === stage ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <span style={{ fontSize: 11 }}>{i + 1}</span>}</span>
                        {s.label}
                      </li>
                    );
                  })}
                </ol>
                <p className="text-muted-2 text-small mt-3 mb-0">Most reports take 20–60 seconds. If you leave this page, the report is still saved to your history.</p>
              </div>
            ) : (
              <>
                <div className="seg mb-4" role="tablist" aria-label="Input type">
                  <button type="button" role="tab" aria-selected={mode === 'url'} className={mode === 'url' ? 'on' : ''} onClick={() => { setMode('url'); setErrors({}); }}>
                    <Link2 size={16} /> Article link
                  </button>
                  <button type="button" role="tab" aria-selected={mode === 'paste'} className={mode === 'paste' ? 'on' : ''} onClick={() => { setMode('paste'); setErrors({}); }}>
                    <ClipboardPaste size={16} /> Paste text
                  </button>
                </div>

                {errors.form ? <div className="alert alert-danger py-2" role="alert">{errors.form}</div> : null}

                {mode === 'url' ? (
                  <form onSubmit={submitUrl} noValidate>
                    <label className="form-label" htmlFor="analyze-url">News article URL</label>
                    <input
                      id="analyze-url"
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      className={`form-control form-control-lg ${errors.url ? 'is-invalid' : ''}`}
                      placeholder="https://news-site.com/politics/article-title"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); if (errors.url) setErrors({}); }}
                    />
                    {errors.url ? <div className="invalid-feedback">{errors.url}</div> : null}
                    <div className="form-text mt-2">The page must be publicly reachable. If a site blocks readers, switch to “Paste text”.</div>
                    <button type="submit" className="btn btn-primary btn-lg mt-4 w-100 w-sm-auto">
                      <ScanSearch size={18} className="me-2" />Analyze article
                    </button>
                  </form>
                ) : (
                  <form onSubmit={submitPaste} noValidate>
                    <div className="d-flex justify-content-between align-items-end">
                      <label className="form-label" htmlFor="analyze-text">Article text</label>
                      <span className={`counter ${text.length > MAX_CHARS ? 'bad' : ''}`}>{words} words · {text.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}</span>
                    </div>
                    <textarea
                      id="analyze-text"
                      className={`form-control paste-area ${errors.text ? 'is-invalid' : ''}`}
                      placeholder="Paste the full article here — headline first works best. Paragraph breaks are preserved."
                      value={text}
                      onChange={(e) => { setText(e.target.value); if (errors.text) setErrors({}); }}
                    />
                    {errors.text ? <div className="invalid-feedback">{errors.text}</div> : null}

                    <details className="mt-3">
                      <summary className="text-small fw-semibold" style={{ cursor: 'pointer', color: 'var(--primary)' }}>Add source details (optional, shown in the report)</summary>
                      <div className="row g-3 mt-1">
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="m-title">Headline</label>
                          <input id="m-title" className="form-control" maxLength={160} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="m-pub">Publisher</label>
                          <input id="m-pub" className="form-control" maxLength={120} value={meta.publisher} onChange={(e) => setMeta({ ...meta, publisher: e.target.value })} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="m-author">Author</label>
                          <input id="m-author" className="form-control" maxLength={120} value={meta.author} onChange={(e) => setMeta({ ...meta, author: e.target.value })} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="m-url">Source link</label>
                          <input id="m-url" className={`form-control ${errors.sourceUrl ? 'is-invalid' : ''}`} placeholder="https://…" value={meta.sourceUrl} onChange={(e) => setMeta({ ...meta, sourceUrl: e.target.value })} />
                          {errors.sourceUrl ? <div className="invalid-feedback">{errors.sourceUrl}</div> : null}
                        </div>
                      </div>
                    </details>

                    <div className="hint-card mt-3 text-small text-muted-2">
                      <ShieldCheck size={14} className="me-1" style={{ color: 'var(--primary)' }} />
                      Pasted text has no verifiable origin, so source reliability and publication transparency are <strong>not scored</strong>, even if you add details, because they cannot be verified. For a full score, analyze the article link instead.
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg mt-4">
                      <Sparkles size={18} className="me-2" />Analyze text
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card p-4 h-100">
            <h2 style={{ fontSize: 16 }} className="mb-3">How the score is built</h2>
            <ul className="list-unstyled d-grid gap-3 mb-3" style={{ fontSize: 13.5 }}>
              {[
                [Globe, 'Source reliability', '22%'],
                [ShieldCheck, 'Evidence quality', '22%'],
                [FileText, 'Claim consistency', '22%'],
                [Link2, 'Publication transparency', '13%'],
                [Sparkles, 'Sensationalism', '13%'],
                [ScanSearch, 'Writing quality', '8%']
              ].map(([Icon, label, w]) => (
                <li key={label} className="d-flex align-items-center gap-2">
                  <span className="d-grid place-items-center rounded-2" style={{ width: 30, height: 30, background: 'var(--bg-2)', color: 'var(--primary)' }}><Icon size={15} /></span>
                  <span className="flex-grow-1 text-secondary-2">{label}</span>
                  <span className="font-mono fw-bold">{w}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-2 text-small mb-0">The AI reads and extracts evidence; TruthLens calculates the final number from measured signals, so the score is repeatable and every factor is explained.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
