import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function PaginationBar({ page, total, perPage = 10, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;
  const pages = [];
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <nav aria-label="Pagination" className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
      <div className="text-muted-2 text-small">Showing page {page} of {totalPages} ({total} records)</div>
      <ul className="pagination mb-0">
        <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
          <button className="page-link" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}>
            <ChevronLeft size={15} />
          </button>
        </li>
        {pages.map((p, i) =>
          p === '…' ? (
            <li key={`gap-${i}`} className="page-item disabled"><span className="page-link">…</span></li>
          ) : (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onChange(p)}>{p}</button>
            </li>
          )
        )}
        <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
          <button className="page-link" aria-label="Next page" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
            <ChevronRight size={15} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
