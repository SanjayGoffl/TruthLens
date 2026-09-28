import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GitCompare } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import VerdictBadge from '../../components/ui/VerdictBadge';
import { colorForScore } from '../../utils/credibility';
import { PageLoader } from '../../components/ui/Loaders';
import EmptyState from '../../components/ui/EmptyState';

const FACTORS = [
  ['sourceReliability', 'Source reliability'], ['evidenceQuality', 'Evidence quality'], ['claimConsistency', 'Claim consistency'],
  ['publicationTransparency', 'Publication transparency'], ['sensationalism', 'Sensationalism'], ['writingQuality', 'Writing quality']
];

function cell(analysis, key) {
  const f = (analysis.factors || []).find((x) => x.key === key);
  return f && !f.excluded && typeof f.score === 'number' ? f.score : null;
}

export default function ComparePage() {
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [pair, setPair] = useState([null, null]);
  const [error, setError] = useState('');
  const a = params.get('a') || '';
  const b = params.get('b') || '';

  useEffect(() => {
    api.get('/analysis/history', { params: { limit: 50 } }).then((r) => setList(r.data.items)).catch((e) => setError(errorMessage(e)));
  }, []);

  useEffect(() => {
    if (!a || !b) { setPair([null, null]); return; }
    Promise.all([api.get(`/analysis/${a}`), api.get(`/analysis/${b}`)])
      .then(([x, y]) => setPair([x.data.analysis, y.data.analysis]))
      .catch((e) => setError(errorMessage(e)));
  }, [a, b]);

  const set = (k, v) => { const next = new URLSearchParams(params); next.set(k, v); setParams(next); };
  const label = (i) => `${(i.article && i.article.title) || 'Untitled'} — ${i.overallScore}/100`;

  if (!list) return error ? <div className="alert alert-danger">{error}</div> : <PageLoader />;
  return (
    <div>
      <h1 className="page-title">Compare reports</h1>
      <p className="page-subtitle mb-4">Pick two of your analyses to see how they differ, factor by factor.</p>
      {list.length < 2 ? (
        <div className="card"><EmptyState icon={GitCompare} title="Analyze at least two articles" text="Comparison needs two saved reports." /></div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {[['a', a], ['b', b]].map(([k, v]) => (
              <div className="col-md-6" key={k}>
                <select className="form-select" aria-label={`Report ${k.toUpperCase()}`} value={v} onChange={(e) => set(k, e.target.value)}>
                  <option value="">Choose report {k.toUpperCase()}…</option>
                  {list.map((i) => <option key={i._id} value={i._id}>{label(i)}</option>)}
                </select>
              </div>
            ))}
          </div>
          {pair[0] && pair[1] ? (
            <div className="card overflow-hidden">
              <div className="table-wrap">
                <table className="table align-middle mb-0">
                  <thead><tr><th>Measure</th><th>Report A</th><th>Report B</th><th>Difference</th></tr></thead>
                  <tbody>
                    <tr>
                      <td className="fw-semibold">Overall score</td>
                      {pair.map((p, i) => <td key={i}><span className="font-mono fw-bold" style={{ color: colorForScore(p.overallScore) }}>{p.overallScore}</span> <VerdictBadge verdict={p.verdict} size="sm" /></td>)}
                      <td className="font-mono fw-bold">{pair[1].overallScore - pair[0].overallScore > 0 ? '+' : ''}{pair[1].overallScore - pair[0].overallScore}</td>
                    </tr>
                    {FACTORS.map(([key, name]) => {
                      const x = cell(pair[0], key); const y = cell(pair[1], key);
                      return (
                        <tr key={key}>
                          <td>{name}</td>
                          <td className="font-mono">{x === null ? <span className="text-muted-2">Not scored</span> : x}</td>
                          <td className="font-mono">{y === null ? <span className="text-muted-2">Not scored</span> : y}</td>
                          <td className="font-mono">{x === null || y === null ? '—' : `${y - x > 0 ? '+' : ''}${y - x}`}</td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td>Confidence</td><td>{pair[0].confidence || '—'}</td><td>{pair[1].confidence || '—'}</td><td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : <p className="text-muted-2">Choose two reports above.</p>}
        </>
      )}
    </div>
  );
}
