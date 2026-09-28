const PDFDocument = require('pdfkit');
const env = require('../config/env');
const EMERALD = '#047857';
const EMERALD_DARK = '#065F46';
const INK = '#111827';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const GREEN = '#16A34A';
const AMBER = '#D97706';
const RED = '#DC2626';
function wrapText(doc, text, x, y, width, opts = {}) {
  const font = opts.font || 'Helvetica';
  const size = opts.size || 9;
  const color = opts.color || MUTED;
  const lineGap = opts.lineGap || 2;
  const leading = size + lineGap;
  doc.font(font).fontSize(size).fillColor(color);
  const words = String(text).split(' ');
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (doc.widthOfString(test) > width && line) {
      doc.text(line, x, cursorY, { width, lineBreak: false });
      cursorY += leading;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    doc.text(line, x, cursorY, { width, lineBreak: false });
    cursorY += leading;
  }
  return cursorY;
}
function header(doc) {
  doc.rect(0, 0, 595.28, 92).fill(EMERALD);
  doc.font('Helvetica-Bold').fontSize(21).fillColor('#FFFFFF').text('TruthLens AI', 40, 22);
  doc.font('Helvetica').fontSize(10).fillColor('#ECFDF5').text('Credibility Analysis Report', 40, 50);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#A7F3D0').text('Analyze. Verify. Understand the Truth.', 40, 66);
  doc.font('Helvetica').fontSize(8).fillColor('#D1FAE5').text(`Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`, 400, 72, { width: 155, align: 'right' });
  doc.rect(0, 92, 595.28, 4).fill(EMERALD_DARK);
}
function sectionTitle(doc, title, y) {
  doc.rect(40, y, 6, 16).fill(EMERALD);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK).text(title, 54, y + 1);
  doc.moveTo(40, y + 26).lineTo(572, y + 26).lineWidth(0.7).strokeColor(LINE).stroke();
  return y + 34;
}
function colorForScore(score) {
  if (score >= 80) return GREEN;
  if (score >= 65) return '#059669';
  if (score >= 45) return AMBER;
  if (score >= 25) return '#EA580C';
  return RED;
}
function scoreBadge(doc, score, label, x, y) {
  const color = colorForScore(score);
  doc.circle(x + 34, y + 34, 34).lineWidth(7).strokeColor('#E2E8F0').stroke();
  doc.circle(x + 34, y + 34, 34).lineWidth(7).strokeColor(color).stroke();
  doc.font('Helvetica-Bold').fontSize(20).fillColor(INK).text(String(score), x + 10, y + 24, { width: 48, align: 'center' });
  doc.font('Helvetica').fontSize(8).fillColor(color).text('/ 100', x + 42, y + 48, { width: 28, align: 'left' });
  doc.font('Helvetica-Bold').fontSize(11).fillColor(color).text(label, x + 80, y + 26);
  return y;
}
function drawBar(doc, label, value, x, y, width, note) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text(label, x, y);
  doc.rect(x + 150, y + 2, width, 8).fill('#EDF2F7');
  const pct = Math.max(2, Math.min(100, value));
  doc.rect(x + 150, y + 2, (width * pct) / 100, 8).fill(colorForScore(value));
  doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text(`${value}/100`, x + 150 + width + 10, y);
  if (note) {
    const nextY = wrapText(doc, note, x, y + 14, 430, { size: 8, color: MUTED });
    return nextY + 4;
  }
  return y + 16;
}
function metaRow(doc, label, value, y) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text(label, 40, y);
  const nextY = wrapText(doc, value || '—', 160, y, 395, { size: 9, color: MUTED });
  return Math.max(y + 12, nextY + 2);
}
function footer(doc) {
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i += 1) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text('TruthLens AI credibility assessments are informational and should not be treated as definitive proof of truth or falsehood. Always verify important information using reliable primary and independent sources.', 40, 770, { width: 515, lineGap: 2 });
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(`TruthLens AI · ${env.backendUrl} · Page ${i + 1} of ${pages.count}`, 40, 806, { width: 515, align: 'center' });
  }
}
function buildAnalysisPdf(payload) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 108, bottom: 60, left: 40, right: 40 }, bufferPages: true });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    header(doc);
    const analysis = payload.analysis;
    const article = payload.article || {};
    const factors = analysis.factors || [];
    const claims = payload.claims || [];
    const suspicious = analysis.suspiciousStatements || [];
    let y = 110;
    doc.rect(40, y - 8, 515, 74).fill('#FFFFFF').lineWidth(1).strokeColor(LINE).stroke();
    y = metaRow(doc, 'Article title', article.title || 'Untitled', y);
    y = metaRow(doc, 'Source', article.publisher || article.domain || 'Unknown', y);
    y = metaRow(doc, 'Author', article.author || 'Not identified', y);
    y = metaRow(doc, 'Published', article.publicationDateText || analysis.createdAt ? new Date(article.publicationDate || analysis.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Not stated', y);
    y = metaRow(doc, 'URL', article.url || 'Pasted content (no URL)', y);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(`Analysis ID: ${String(analysis._id).slice(-8).toUpperCase()} · Mode: ${analysis.analysisMode === 'ai' ? 'Gemini AI' : 'Offline heuristics'} · Analyzed ${new Date(analysis.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`, 40, y + 2, { width: 515 });
    y += 26;
    y = sectionTitle(doc, 'Overall Credibility Score', y);
    scoreBadge(doc, analysis.overallScore, `${analysis.verdict} (${analysis.overallScore}/100)`, 40, y);
    const badgeY = y;
    if (analysis.summary) {
      const sy = wrapText(doc, analysis.summary, 40, y + 90, 515, { size: 9, color: INK });
      y = Math.max(sy, y + 110);
    } else {
      y += 100;
    }
    y += 8;
    y = sectionTitle(doc, 'Score Breakdown', y);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED).text('Six weighted factors — Source Reliability 22%, Evidence Quality 22%, Claim Consistency 22%, Publication Transparency 13%, Writing Quality 8%, Sensationalism 13%.', 40, y, { width: 515 });
    y += 16;
    for (const factor of factors) {
      if (factor.excluded) {
        y = wrapText(doc, `${factor.label} — Not assessed (weight ${Math.round(factor.weight * 100)}%): independent verification unavailable.`, 40, y + 14, 515, { size: 8, color: AMBER });
        y += 6;
      } else {
        y = drawBar(doc, factor.label, factor.score, 40, y, 300, factor.reason);
      }
      if (y > 720) {
        doc.addPage();
        y = 60;
      }
    }
    y = sectionTitle(doc, 'AI Explanation', y);
    y = wrapText(doc, analysis.explanation || 'No explanation available.', 40, y + 2, 530, { size: 9.5, color: INK });
    y += 12;
    const strengths = analysis.strengths || [];
    const weaknesses = analysis.weaknesses || [];
    if (strengths.length || weaknesses.length) {
      const colX = 40;
      const colW = 250;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#16A34A').text('Strengths', colX, y);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#DC2626').text('Weaknesses', colX + 280, y);
      const ys = wrapText(doc, (strengths.length ? strengths : ['None recorded.']).join('\n'), colX, y + 14, colW, { size: 8.5, color: INK });
      const yw = wrapText(doc, (weaknesses.length ? weaknesses : ['None recorded.']).join('\n'), colX + 280, y + 14, 250, { size: 8.5, color: INK });
      y = Math.max(ys, yw) + 12;
    }
    if (suspicious.length) {
      y = sectionTitle(doc, 'Suspicious or Attention-Needed Statements', y);
      let idx = 1;
      for (const s of suspicious.slice(0, 8)) {
        if (y > 700) {
          doc.addPage();
          y = 60;
        }
        const color = s.category === 'Contradiction' ? RED : s.category === 'Unsupported claim' || s.category === 'Missing evidence' ? '#EA580C' : AMBER;
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(color).text(`${idx}. [${s.category}]`, 40, y);
        y = wrapText(doc, `"${s.quote}" — ${s.explanation}`, 56, y + 10, 500, { size: 8.5, color: INK });
        y += 8;
        idx += 1;
      }
    }
    if (claims.length) {
      y = sectionTitle(doc, 'Claim Analysis', y);
      let idx = 1;
      for (const c of claims.slice(0, 10)) {
        if (y > 660) {
          doc.addPage();
          y = 60;
        }
        const aColor = c.assessment === 'Supported' ? GREEN : c.assessment === 'Partially Supported' ? '#059669' : c.assessment === 'Contradicted' ? RED : c.assessment === 'Unsupported' ? '#EA580C' : AMBER;
        doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text(`${idx}. ${c.claimText}`, 40, y, { width: 515 });
        y = doc.y + 4;
        doc.font('Helvetica-Bold').fontSize(8).fillColor(aColor).text(`${c.assessment} · ${c.importance} importance · confidence ${c.confidence}%`, 40, y);
        y += 11;
        if (c.explanation) y = wrapText(doc, c.explanation, 40, y, 530, { size: 8, color: MUTED });
        y += 7;
        idx += 1;
      }
    }
    if ((analysis.sourceAnalysis && analysis.sourceAnalysis.reasons || []).length) {
      y = sectionTitle(doc, 'Source Analysis', y);
      for (const reason of analysis.sourceAnalysis.reasons.slice(0, 6)) {
        if (y > 720) {
          doc.addPage();
          y = 60;
        }
        y = wrapText(doc, `• ${reason}`, 40, y + 2, 530, { size: 8.5, color: INK });
        y += 4;
      }
    }
    footer(doc);
    doc.end();
  });
}
module.exports = { buildAnalysisPdf };
