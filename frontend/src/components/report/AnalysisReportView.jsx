import { useEffect, useState } from 'react';
import { ChartLine } from '../ui/Charts';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowUpRight, Bookmark, CheckCircle2, ChevronDown, Download,
  ExternalLink, FileText, Link2, MessageSquareText, Printer, Scale,
  Share2, ShieldCheck, ThumbsDown, ThumbsUp, XCircle
} from 'lucide-react';
import ScoreRing from '../ui/ScoreRing';
import VerdictBadge from '../ui/VerdictBadge';
import FactorMeter from '../ui/FactorMeter';
import { ButtonSpinner } from '../ui/Loaders';
import api, { errorMessage } from '../../services/api';
import toast from 'react-hot-toast';
import {
  claimMeta, classNames, colorForScore, domainOf, downloadBlob, fmtDate,
  sourceClassMeta, categoryMeta
} from '../../utils/credibility';
function Section({ title, icon: Icon, children, id }) {
  return (
    <section id={id} className="card mb-4 overflow-hidden">
      <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom" style={{ borderColor: 'var(--border)' }}>
        <Icon size={17} style={{ color: 'var(--primary)' }} />
        <h2 style={{ fontSize: 15.5, margin: 0 }}>{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
export default function AnalysisReportView({ analysis, claims, onSavedChange, showSave = true, readOnly = false }) {
  const [vote, setVote] = useState(analysis.feedback && typeof analysis.feedback.helpful === 'boolean' ? analysis.feedback.helpful : null);
  const [shareBusy, setShareBusy] = useState(false);
  const [trend, setTrend] = useState(null);
  const sourceId = analysis.article && analysis.article.source;
  useEffect(() => {
    if (readOnly || !sourceId || typeof sourceId !== 'string') return;
    api.get(`/sources/${sourceId}/trend`).then((r) => setTrend(r.data)).catch(() => {});
  }, [sourceId, readOnly]);
  const share = async () => {
    setShareBusy(true);
    try {
      const res = await api.post(`/analysis/${analysis._id}/share`);
      const link = `${window.location.origin}${res.data.path}`;
      if (navigator.share) {
        try { await navigator.share({ title: 'TruthLens credibility report', text: `${analysis.verdict} (${analysis.overallScore}/100)`, url: link }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
      }
      try { await navigator.clipboard.writeText(link); toast.success('Share link copied.'); } catch (e) { toast.success(link); }
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create a share link.'));
    } finally {
      setShareBusy(false);
    }
  };
  const sendVote = async (helpful) => {
    setVote(helpful);
    try { await api.post(`/analysis/${analysis._id}/feedback`, { helpful }); toast.success('Thanks for the feedback.'); } catch (err) { setVote(null); toast.error(errorMessage(err, 'Could not save feedback.')); }
  };
  const [busyPdf, setBusyPdf] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const article = analysis.article || {};
  const factors = analysis.factors || [];
  const downloadPdf = async () => {
    setBusyPdf(true);
    try {
      const res = await api.get(`/analysis/${analysis._id}/report`, { responseType: 'blob' });
      const slug = String(article.title || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'report';
      downloadBlob(res.data, `truthlens-${slug}.pdf`);
      toast.success('Report downloaded.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not generate the PDF report.'));
    } finally {
      setBusyPdf(false);
    }
  };
  const toggleSave = async () => {
    setBusySave(true);
    try {
      const res = await api.post(`/analysis/${analysis._id}/save`);
      toast.success(res.data.message);
      if (onSavedChange) onSavedChange(res.data.isSaved);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update saved status.'));
    } finally {
      setBusySave(false);
    }
  };
  const scoreColor = colorForScore(analysis.overallScore);
  return (
    <div className="d-flex flex-column gap-4">
      <div className="card overflow-hidden report-hero">
        <div className="row g-0 position-relative">
          <div className="col-lg-7 p-4 p-lg-5">
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
              <span className="chip chip-green pill">{analysis.analysisMode === 'ai' ? 'AI-assisted analysis' : 'Offline heuristic analysis'}</span>
              {analysis.inputKind === 'paste' ? <span className="chip chip-blue pill"><FileText size={12} /> Pasted text</span> : null}
              <span className="chip chip-gray pill"><ShieldCheck size={12} /> ID #{String(analysis._id).slice(-6).toUpperCase()}</span>
              {analysis.isSaved ? <span className="chip chip-teal pill"><Bookmark size={12} /> Saved</span> : null}
            </div>
            <h1 style={{ fontSize: 'clamp(1.25rem, 2.4vw, 1.7rem)', lineHeight: 1.3 }}>{article.title || 'Untitled article'}</h1>
            <div className="d-flex flex-wrap gap-3 align-items-center mt-3" style={{ fontSize: 13 }}>
              {article.publisher || article.domain ? (
                <span className="d-inline-flex align-items-center gap-1 text-muted-2">
                  <Link2 size={13} /> {article.publisher || article.domain}
                </span>
              ) : null}
              {article.domain ? <span className="chip chip-gray pill text-xs">{article.domain}</span> : null}
              {article.author ? <span className="text-muted-2">By {article.author}</span> : <span className="text-muted-2">Author not identified</span>}
              <span className="text-muted-2">· {fmtDate(article.publicationDate || analysis.createdAt, true)}</span>
            </div>
            {article.url ? (
              <a href={article.url} target="_blank" rel="noreferrer" className="text-small d-inline-flex align-items-center gap-1 mt-2" style={{ maxWidth: 560 }}>
                {article.url} <ExternalLink size={12} />
              </a>
            ) : (
              <div className="text-muted-2 text-small mt-2 d-inline-flex align-items-center gap-1"><FileText size={13} /> Analyzed from pasted content</div>
            )}
            {!readOnly ? <div className="mt-4 d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={downloadPdf} disabled={busyPdf}>
                {busyPdf ? <ButtonSpinner /> : <Download size={15} className="me-1" />}Download PDF report
              </button>
              {showSave ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={toggleSave} disabled={busySave}>
                  {busySave ? <ButtonSpinner /> : <Bookmark size={15} className="me-1" />}
                  {analysis.isSaved ? 'Remove from saved' : 'Save report'}
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost btn-sm" onClick={share} disabled={shareBusy}>
                {shareBusy ? <ButtonSpinner /> : <Share2 size={15} className="me-1" />}Copy share link
              </button>
            </div> : null}
            {!readOnly ? (
              <div className="d-flex align-items-center gap-2 mt-3 text-small text-muted-2">
                Was this result helpful?
                <button type="button" className={`btn btn-sm ${vote === true ? 'btn-success-soft' : 'btn-ghost'}`} onClick={() => sendVote(true)} aria-label="Helpful"><ThumbsUp size={14} /></button>
                <button type="button" className={`btn btn-sm ${vote === false ? 'btn-danger-soft' : 'btn-ghost'}`} onClick={() => sendVote(false)} aria-label="Not helpful"><ThumbsDown size={14} /></button>
              </div>
            ) : null}
          </div>
          <div className="col-lg-5 report-score-panel d-flex flex-column align-items-center justify-content-center p-4">
            <ScoreRing score={analysis.overallScore} size={188} sublabel={analysis.verdict} />
            <div className="fw-bold mt-3" style={{ color: scoreColor, fontSize: 17 }}>{analysis.verdict}</div>
            {analysis.confidence ? (
              <span className="confidence-pill mt-2" title="How much independent evidence supports this score">
                <ShieldCheck size={13} style={{ color: analysis.confidence === 'High' ? 'var(--success)' : analysis.confidence === 'Medium' ? 'var(--warning)' : 'var(--danger)' }} />
                {analysis.confidence} confidence
              </span>
            ) : null}
            <div className="text-muted-2 text-small text-center" style={{ maxWidth: 300 }}>
              {analysis.summary}
            </div>
          </div>
        </div>
      </div>
      <Section title="Score breakdown" icon={Scale}>
        {(analysis.capsApplied || []).length ? (
          <div className="d-grid gap-2 mb-4">
            {analysis.capsApplied.map((c) => <div key={c} className="cap-note">{c}</div>)}
          </div>
        ) : null}
        <div className="row g-4">
          {factors.map((factor) => (
            <div className="col-md-6" key={factor.key}>
              <FactorMeter factor={factor} />
            </div>
          ))}
        </div>
      </Section>
      <Section title="AI explanation" icon={MessageSquareText}>
        <p className="text-secondary-2 mb-3" style={{ fontSize: 14.5, lineHeight: 1.9 }}>{analysis.explanation}</p>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="d-flex align-items-center gap-2 mb-2 fw-bold" style={{ color: 'var(--success)', fontSize: 13.5 }}>
              <CheckCircle2 size={15} /> Strengths
            </div>
            <ul className="list-unstyled d-grid gap-2 mb-0">
              {(analysis.strengths || []).length ? analysis.strengths.map((s) => <li key={s} className="d-flex gap-2 align-items-start text-secondary-2" style={{ fontSize: 13 }}><ArrowUpRight size={14} className="flex-shrink-0 mt-1 text-success" />{s}</li>) : <li className="text-muted-2" style={{ fontSize: 13 }}>None recorded.</li>}
            </ul>
          </div>
          <div className="col-md-6">
            <div className="d-flex align-items-center gap-2 mb-2 fw-bold" style={{ color: 'var(--danger)', fontSize: 13.5 }}>
              <AlertTriangle size={15} /> Weaknesses
            </div>
            <ul className="list-unstyled d-grid gap-2 mb-0">
              {(analysis.weaknesses || []).length ? analysis.weaknesses.map((w) => <li key={w} className="d-flex gap-2 align-items-start text-secondary-2" style={{ fontSize: 13 }}><XCircle size={14} className="flex-shrink-0 mt-1 text-danger" />{w}</li>) : <li className="text-muted-2" style={{ fontSize: 13 }}>None recorded.</li>}
            </ul>
          </div>
        </div>
      </Section>
      {analysis.sourceAnalysis ? (
        <Section title="Source analysis" icon={ShieldCheck}>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="d-flex flex-column gap-2 mb-3">
                <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: 'var(--bg-2)' }}>
                  <span className="fw-semibold" style={{ fontSize: 13.5 }}>Classification</span>
                  <span className={classNames('chip', sourceClassMeta(analysis.sourceAnalysis.classification).chip)}>{analysis.sourceAnalysis.classification || 'Not assessed'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: 'var(--bg-2)' }}>
                  <span className="fw-semibold" style={{ fontSize: 13.5 }}>Reliability score</span>
                  {typeof analysis.sourceAnalysis.score === 'number' ? (
                    <span className="font-mono fw-bold" style={{ color: colorForScore(analysis.sourceAnalysis.score) }}>{analysis.sourceAnalysis.score}/100</span>
                  ) : (
                    <span className="chip chip-gray">Not scored</span>
                  )}
                </div>
              </div>
              <div className="d-flex flex-column gap-2" style={{ fontSize: 13 }}>
                <div><span className="text-muted-2">Publisher identity:</span> <span className="fw-semibold text-main">{analysis.sourceAnalysis.identity || 'Not stated'}</span></div>
                <div><span className="text-muted-2">Author:</span> <span className="fw-semibold text-main">{analysis.sourceAnalysis.authorName || article.author || 'Not identified'}</span></div>
                <div><span className="text-muted-2">Registry record:</span> {analysis.sourceAnalysis.known ? <span className="chip chip-teal text-xs">Known source</span> : <span className="chip chip-gray text-xs">Limited information</span>}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="fw-bold mb-2" style={{ fontSize: 13.5 }}>Why this classification</div>
              <ul className="list-unstyled d-grid gap-2">
                {(analysis.sourceAnalysis.reasons || []).map((r) => (
                  <li key={r} className="d-flex gap-2 text-secondary-2" style={{ fontSize: 12.8 }}><span style={{ color: 'var(--primary)' }}>•</span>{r}</li>
                ))}
              </ul>
              <div className="text-muted-2 mt-2 text-small">
                Source classifications reflect registry records and transparency signals — never an objective claim of trustworthiness.
              </div>
            </div>
          </div>
        </Section>
      ) : null}
      <Section title={`Claim analysis${claims && claims.length ? ` (${claims.length})` : ''}`} icon={FileText}>
        {claims && claims.length ? (
          <div className="d-flex flex-column">
            {claims.map((claim, idx) => {
              const meta = claimMeta(claim.assessment);
              return (
                <motion.div
                  key={claim._id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.04 }}
                  className="py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="d-flex gap-3 align-items-start">
                    <span className="font-mono text-muted-2 mt-1" style={{ fontSize: 12 }}>#{idx + 1}</span>
                    <div className="flex-grow-1 min-w-0">
                      <p className="mb-2 text-main" style={{ fontSize: 14.2, lineHeight: 1.65 }}>“{claim.claimText}”</p>
                      <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                        <span className={classNames('chip', meta.chip, 'fw-bold')}>{claim.assessment}</span>
                        <span className="chip chip-gray text-xs">{claim.importance} importance</span>
                        <span className="chip chip-blue text-xs">Confidence {claim.confidence}%</span>
                      </div>
                      {claim.explanation ? <p className="text-muted-2 mb-2" style={{ fontSize: 13 }}>{claim.explanation}</p> : null}
                      {claim.supportingEvidence && claim.supportingEvidence.length ? (
                        <div className="mb-1 d-grid gap-1">
                          <span className="text-success fw-bold text-small d-inline-flex align-items-center gap-1"><CheckCircle2 size={12} /> Supporting evidence</span>
                          {claim.supportingEvidence.slice(0, 3).map((ev) => <span key={ev} className="text-muted-2 text-small">{ev}</span>)}
                        </div>
                      ) : null}
                      {claim.contradictingEvidence && claim.contradictingEvidence.length ? (
                        <div className="d-grid gap-1">
                          <span className="text-danger fw-bold text-small d-inline-flex align-items-center gap-1"><XCircle size={12} /> Contradicting evidence</span>
                          {claim.contradictingEvidence.slice(0, 3).map((ev) => <span key={ev} className="text-muted-2 text-small">{ev}</span>)}
                        </div>
                      ) : null}
                      {claim.externalSources && claim.externalSources.length ? (
                        <div className="mt-2 d-grid gap-1">
                          {claim.externalSources.slice(0, 3).map((src) => (
                            <a key={`${src.url}-${src.title}`} href={src.url} target="_blank" rel="noreferrer" className="text-small text-truncate d-inline-flex align-items-center gap-1" style={{ maxWidth: '100%' }}>
                              <ExternalLink size={11} /> {src.title}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-2 mb-0" style={{ fontSize: 13.5 }}>No discrete factual claims were extracted from this article.</p>
        )}
      </Section>
      {trend && trend.total >= 2 ? (
        <Section title={`Publisher trend — ${trend.source.name}`} icon={Scale}>
          <p className="text-muted-2 text-small">Average score {trend.average}/100 across {trend.total} analyses of this publisher.</p>
          <ChartLine labels={trend.points.map((p) => p.date.slice(5))} series={[{ label: 'Average score', data: trend.points.map((p) => p.avg), color: '#6366F1', fill: true }]} height={200} />
        </Section>
      ) : null}
      {analysis.suspiciousStatements && analysis.suspiciousStatements.length ? (
        <Section title={`Suspicious or attention-needed statements (${analysis.suspiciousStatements.length})`} icon={AlertTriangle}>
          <div className="d-flex flex-column gap-2">
            {analysis.suspiciousStatements.map((s, i) => {
              const meta = categoryMeta(s.category);
              return (
                <div key={i} className="p-3 rounded-3" style={{ background: 'var(--bg-2)' }}>
                  <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
                    <span className={classNames('chip', meta.chip, 'text-xs fw-bold')}>{s.category}</span>
                  </div>
                  <p className="mb-1 text-main" style={{ fontSize: 13.8, fontStyle: 'italic' }}>“{s.quote}”</p>
                  <p className="text-muted-2 mb-0" style={{ fontSize: 12.8 }}>{s.explanation}</p>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}
      {article.content ? (
        <Section title="Analyzed text" icon={Printer}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted-2 text-small">Original content submitted for analysis ({Math.round(String(article.content).split(/\s+/).length)} words)</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setContentOpen((v) => !v)} aria-expanded={contentOpen}>
              {contentOpen ? 'Hide' : 'Show'} <ChevronDown size={14} className={classNames('ms-1 chev', contentOpen ? 'rotated' : '')} />
            </button>
          </div>
          {contentOpen ? (
            <div className="p-3 rounded-3 text-secondary-2" style={{ background: 'var(--bg-2)', fontSize: 13.5, lineHeight: 1.85, maxHeight: 480, overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif' }}>
              {article.content}
            </div>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
