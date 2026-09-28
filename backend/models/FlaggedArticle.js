const mongoose = require('mongoose');
const FLAG_REASONS = ['Low credibility', 'Unsupported claims', 'Contradictions', 'Suspicious language', 'Suspicious source', 'Missing evidence'];
const FLAG_STATUS = ['pending', 'reviewed', 'verified', 'suspicious'];
const flaggedSchema = new mongoose.Schema({
  analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis', required: true },
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reasons: [{ type: String, enum: FLAG_REASONS }],
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: FLAG_STATUS, default: 'pending' },
  moderationNotes: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });
flaggedSchema.index({ status: 1, createdAt: -1 });
flaggedSchema.index({ analysis: 1 }, { unique: true });
module.exports = mongoose.model('FlaggedArticle', flaggedSchema);
