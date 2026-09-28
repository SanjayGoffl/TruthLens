import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, FileSearch, Globe, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import PaginationBar from '../../components/ui/PaginationBar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ButtonSpinner, SkeletonRows } from '../../components/ui/Loaders';
import { classNames, colorForScore, sourceClassMeta } from '../../utils/credibility';
import { useDebounce } from '../../hooks/useDebounce';
const CLASSIFICATIONS = ['Trusted', 'Generally Reliable', 'Mixed', 'Limited Information', 'High Risk'];
const CLASS_SCORES = { Trusted: 85, 'Generally Reliable': 70, Mixed: 55, 'Limited Information': 40, 'High Risk': 22 };
const EMPTY_FORM = { name: '', domain: '', classification: 'Limited Information', reliabilityScore: 40, status: 'active', category: 'News', country: '', notes: '' };
export default function SourcesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const debounced = useDebounce(search);
  const perPage = 10;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
      if (debounced.trim()) params.set('search', debounced.trim());
      const res = await api.get(`/admin/sources?${params.toString()}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Sources could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [page, debounced]);
  useEffect(() => {
    load();
  }, [load]);
  const openNew = () => setEditor({ ...EMPTY_FORM });
  const openEdit = (s) =>
    setEditor({
      id: s._id,
      name: s.name,
      domain: s.domain,
      classification: s.classification,
      reliabilityScore: s.reliabilityScore,
      status: s.status,
      category: s.category || 'News',
      country: s.country || '',
      notes: s.notes || ''
    });
  const set = (key, value) => {
    setEditor((e) => {
      const next = { ...e, [key]: value };
      if (key === 'classification' && typeof value === 'string') next.reliabilityScore = CLASS_SCORES[value] || 40;
      if (key === 'reliabilityScore') {
        const score = Number(value);
        if (score >= 80) next.classification = 'Trusted';
        else if (score >= 65) next.classification = 'Generally Reliable';
        else if (score >= 45) next.classification = 'Mixed';
        else if (score >= 25) next.classification = 'Limited Information';
        else next.classification = 'High Risk';
      }
      return next;
    });
  };
  const save = async (e) => {
    e.preventDefault();
    if (!editor.name.trim() || !editor.domain.trim()) {
      toast.error('Source name and domain are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editor.name.trim(),
        domain: editor.domain.trim(),
        classification: editor.classification,
        reliabilityScore: Number(editor.reliabilityScore) || 40,
        status: editor.status,
        category: editor.category.trim() || 'News',
        country: editor.country.trim(),
        notes: editor.notes.trim()
      };
      const res = editor.id ? await api.put(`/admin/sources/${editor.id}`, payload) : await api.post('/admin/sources', payload);
      toast.success(res.data.message);
      setEditor(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save the source.'));
    } finally {
      setSaving(false);
    }
  };
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/sources/${deleteTarget._id}`);
      toast.success(res.data.message);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the source.'));
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <h1 className="page-title">Source management</h1>
          <p className="page-subtitle">Maintain the publisher registry that feeds Source Reliability scoring</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}><Plus size={16} className="me-2" />Add source</button>
      </div>
      <div className="card overflow-hidden">
        <div className="p-3 d-flex flex-wrap gap-2 align-items-center border-bottom" style={{ borderColor: 'var(--border)' }}>
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text"><Search size={15} /></span>
            <input className="form-control" placeholder="Search name, domain or notes…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search sources" />
          </div>
          <span className="chip chip-gray ms-auto">{total} source{total === 1 ? '' : 's'}</span>
        </div>
        {loading ? (
          <div className="p-4"><SkeletonRows rows={6} cols={6} /></div>
        ) : error ? (
          <div className="p-5 text-center">
            <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><FileSearch size={24} /></span>
            <h5>Could not load sources</h5>
            <p className="text-muted-2">{error}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Globe} title={search ? 'No matching sources' : 'No sources yet'} text={search ? 'Try a different search.' : 'Add your first publisher, or sources are auto-registered when articles from their domain are analyzed.'} />
        ) : (
          <div className="table-wrap">
            <table className="table align-middle">
              <thead>
                <tr><th>Source</th><th>Classification</th><th>Reliability</th><th>Status</th><th>Analyzed</th><th>Updated</th><th className="text-end">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((s) => {
                  const meta = sourceClassMeta(s.classification);
                  return (
                    <tr key={s._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="d-inline-grid place-items-center rounded-3 flex-shrink-0" style={{ width: 34, height: 34, background: 'var(--bg-2)', color: 'var(--primary)' }}><Building2 size={15} /></span>
                          <div>
                            <div className="fw-semibold text-main" style={{ fontSize: 13.5 }}>{s.name}</div>
                            <div className="text-muted-2 text-xs">{s.domain}{s.country ? ` · ${s.country}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={classNames('chip text-xs', meta.chip)}>{s.classification}</span></td>
                      <td><span className="font-mono fw-bold" style={{ color: colorForScore(s.reliabilityScore) }}>{s.reliabilityScore}</span></td>
                      <td>{s.status === 'active' ? <span className="chip chip-green text-xs">Active</span> : <span className="chip chip-gray text-xs">Inactive</span>}</td>
                      <td className="text-muted-2">{s.analyzedArticles || 0}</td>
                      <td className="text-muted-2" style={{ fontSize: 12.5 }}>{s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end">
                          <button type="button" className="btn btn-ghost btn-sm" title="Edit source" aria-label={`Edit ${s.name}`} onClick={() => openEdit(s)}><Pencil size={15} /></button>
                          <button type="button" className="btn btn-ghost btn-sm text-danger" title="Delete source" aria-label={`Delete ${s.name}`} onClick={() => setDeleteTarget(s)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && items.length ? <div className="px-3 pb-3"><PaginationBar page={page} total={total} perPage={perPage} onChange={setPage} /></div> : null}
      </div>
      {editor ? (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(2,6,23,.6)', zIndex: 1000 }} role="dialog" aria-modal="true" aria-label={editor.id ? 'Edit source' : 'Add source'}>
          <form className="card w-100" style={{ maxWidth: 640, maxHeight: '92vh', overflowY: 'auto' }} onSubmit={save}>
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom position-sticky top-0" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <h2 className="mb-0" style={{ fontSize: 16 }}>{editor.id ? 'Edit source' : 'Add a new source'}</h2>
              <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" onClick={() => setEditor(null)}><X size={17} /></button>
            </div>
            <div className="p-4">
              <div className="row g-3">
                <div className="col-md-7">
                  <label className="form-label" htmlFor="src-name">Source name</label>
                  <input id="src-name" className="form-control" value={editor.name} onChange={(e) => set('name', e.target.value)} placeholder="The Associated Press" />
                </div>
                <div className="col-md-5">
                  <label className="form-label" htmlFor="src-domain">Domain</label>
                  <input id="src-domain" className="form-control" value={editor.domain} onChange={(e) => set('domain', e.target.value)} placeholder="apnews.com" disabled={Boolean(editor.id)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="src-class">Classification</label>
                  <select id="src-class" className="form-select" value={editor.classification} onChange={(e) => set('classification', e.target.value)}>
                    {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="src-score">Reliability score</label>
                  <input id="src-score" type="number" min={0} max={100} className="form-control" value={editor.reliabilityScore} onChange={(e) => set('reliabilityScore', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="src-status">Status</label>
                  <select id="src-status" className="form-select" value={editor.status} onChange={(e) => set('status', e.target.value)}>
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="src-category">Category</label>
                  <input id="src-category" className="form-control" value={editor.category} onChange={(e) => set('category', e.target.value)} placeholder="News, Wire, Tech…" />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="src-country">Country</label>
                  <input id="src-country" className="form-control" value={editor.country} onChange={(e) => set('country', e.target.value)} placeholder="India, USA…" />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="src-notes">Notes</label>
                  <textarea id="src-notes" className="form-control" rows={3} value={editor.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Ownership, editorial standards, corrections policy, caveats…" />
                </div>
                <div className="col-12 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditor(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <ButtonSpinner /> : null}{editor.id ? 'Save changes' : 'Add source'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this source?"
        text={deleteTarget ? `"${deleteTarget.name}" (${deleteTarget.domain}) will be removed from the registry. Past analyses keep their stored results but will no longer reference this record.` : ''}
        confirmLabel="Delete source"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
