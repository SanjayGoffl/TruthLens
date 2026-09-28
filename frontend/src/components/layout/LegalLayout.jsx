import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
export default function LegalLayout({ title, updated, sections, fileName }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const downloadPdf = () => {
    setBusy(true);
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 56;
      const width = doc.internal.pageSize.getWidth();
      let y = 64;
      doc.setFillColor(4, 120, 87);
      doc.rect(0, 0, width, 96, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('TruthLens AI', margin, 44);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Analyze. Verify. Understand the Truth.', margin, 66);
      doc.setFontSize(13);
      doc.text(title, margin, 130);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Last updated: ${updated}`, margin, 148);
      let cursorY = 178;
      const bodyTextColor = [71, 85, 105];
      const headingColor = [17, 24, 39];
      const pageHeight = doc.internal.pageSize.getHeight();
      sections.forEach((section) => {
        if (cursorY > pageHeight - 120) {
          doc.addPage();
          cursorY = 64;
        }
        doc.setTextColor(headingColor[0], headingColor[1], headingColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        doc.text(section.title, margin, cursorY);
        cursorY += 18;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(bodyTextColor[0], bodyTextColor[1], bodyTextColor[2]);
        section.body.forEach((paragraph) => {
          const lines = doc.splitTextToSize(paragraph, width - margin * 2);
          lines.forEach((line) => {
            if (cursorY > pageHeight - 90) {
              doc.addPage();
              cursorY = 64;
            }
            doc.text(line, margin, cursorY);
            cursorY += 13.5;
          });
          cursorY += 6;
        });
        cursorY += 4;
      });
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`TruthLens AI — ${title} — Page ${i} of ${pageCount}`, margin, doc.internal.pageSize.getHeight() - 30, { align: 'left' });
        doc.text('AI-generated credibility assessments are informational and should not be treated as definitive proof of truth or falsehood.', margin, doc.internal.pageSize.getHeight() - 18, { align: 'left' });
      }
      doc.save(fileName);
      toast.success('PDF downloaded.');
    } catch (err) {
      toast.error('Could not generate the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-bg" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center px-3 px-md-4 py-3">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="d-flex flex-column align-items-center px-3 px-md-4 pb-5">
        <div className="w-100" style={{ maxWidth: 820 }}>
          <div className="card mt-2 overflow-hidden">
            <div className="p-4 p-md-5 text-center" style={{ background: 'linear-gradient(120deg, rgba(99,102,241,.14), transparent 60%)' }}>
              <span className="d-inline-grid place-items-center rounded-3 mx-auto mb-3" style={{ width: 56, height: 56, background: 'var(--primary)', color: '#fff' }}>
                <ShieldCheck size={28} />
              </span>
              <h1 className="mb-1" style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)' }}>{title}</h1>
              <p className="text-muted-2 mb-0" style={{ fontSize: 13 }}>Last updated: {updated} · TruthLens AI</p>
            </div>
            <div className="p-4 p-md-5 prose">
              {sections.map((s) => (
                <section key={s.title}>
                  <h4>{s.title}</h4>
                  {s.body.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
                </section>
              ))}
              <div className="alert mt-4 mb-0 d-flex gap-2" style={{ background: 'var(--bg-2)', border: '1px solid rgba(99,102,241,.3)' }}>
                <ShieldCheck size={18} className="flex-shrink-0 mt-1" style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: 13 }}>
                  Questions? Contact the support address published on the Service. This document is also available as a PDF using the download button below.
                </span>
              </div>
            </div>
          </div>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4">
            <Link to="/" className="btn btn-ghost"><ArrowLeft size={16} className="me-2" />Back to home</Link>
            <button type="button" className="btn btn-primary" onClick={downloadPdf} disabled={busy}>
              {busy ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" /> : <Download size={16} className="me-2" />}
              Download {title} as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
