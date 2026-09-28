const mongoose = require('mongoose');
const VERDICTS = ['Highly Credible', 'Mostly Credible', 'Uncertain', 'Potentially Misleading', 'Highly Suspicious'];
const STATUS = ['completed', 'processing', 'failed', 'heuristic'];
const factorSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  score: { type: Number, min: 0, max: 100, default: null },
  weight: { type: Number, min: 0, max: 1, required: true },
  reason: { type: String, default: '' },
  excluded: { type: Boolean, default: false }
}, { _id: false });
const analysisSchema = new mongoose.Schema({
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  articleTitle: { type: String, default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  overallScore: { type: Number, min: 0, max: 100, default: 0 },
  verdict: { type: String, enum: VERDICTS, default: 'Uncertain' },
  sourceReliability: { type: Number, min: 0, max: 100, default: 0 },
  evidenceQuality: { type: Number, min: 0, max: 100, default: 0 },
  claimConsistency: { type: Number, min: 0, max: 100, default: 0 },
  publicationTransparency: { type: Number, min: 0, max: 100, default: 0 },
  writingQuality: { type: Number, min: 0, max: 100, default: 0 },
  sensationalism: { type: Number, min: 0, max: 100, default: 0 },
  factors: [factorSchema],
  weights: { type: mongoose.Schema.Types.Mixed, default: {} },
  summary: { type: String, default: '' },
  explanation: { type: String, default: '' },
  strengths: [String],
  weaknesses: [String],
  clickbaitScore: { type: Number, min: 0, max: 100, default: 0 },
  sensationalismScore: { type: Number, min: 0, max: 100, default: 0 },
  clickbaitFindings: [String],
  sensationalFindings: [String],
  sourceAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
  suspiciousStatements: [{
    quote: { type: String, required: true },
    category: { type: String, required: true },
    explanation: { type: String, default: '' }
  }],
  contradictions: [String],
  externalVerification: { type: mongoose.Schema.Types.Mixed, default: null },
  shareToken: { type: String, index: { unique: true, sparse: true } },
  feedback: { helpful: { type: Boolean, default: null }, note: { type: String, default: '', maxlength: 500 } },
  confidence: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  capsApplied: [String],
  inputKind: { type: String, enum: ['url', 'paste'], default: 'url' },
  analysisMode: { type: String, enum: ['ai', 'heuristic', 'hybrid'], default: 'ai' },
  analysisStatus: { type: String, enum: STATUS, default: 'completed' },
  isSaved: { type: Boolean, default: false },
  savedAt: { type: Date, default: null },
  pdfDownloadedAt: { type: Date, default: null },
  pdfDownloadCount: { type: Number, default: 0 }
}, { timestamps: true });
analysisSchema.index({ user: 1, createdAt: -1 });
analysisSchema.index({ verdict: 1 });
analysisSchema.index({ overallScore: 1 });
analysisSchema.index({ article: 1 });
module.exports = mongoose.model('Analysis', analysisSchema);
