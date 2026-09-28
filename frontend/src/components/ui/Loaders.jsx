export function SkeletonRows({ rows = 5, cols = 4, height = 18 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="d-flex gap-3 mb-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton flex-grow-1" style={{ height }} />
          ))}
        </div>
      ))}
    </div>
  );
}
export function SkeletonCards({ count = 3, height = 120 }) {
  return (
    <div className="row g-3 g-lg-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-md-4">
          <div className="skeleton" style={{ height, borderRadius: 14 }} />
        </div>
      ))}
    </div>
  );
}
export function PageLoader() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2" role="status" aria-label="Loading">
      <div className="spinner-border text-success" role="status" />
      <div className="text-muted-2 text-small">Loading…</div>
    </div>
  );
}
export function ButtonSpinner() {
  return <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />;
}
