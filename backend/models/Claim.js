const mongoose = require('mongoose');
const ASSESSMENTS = ['Supported', 'Partially Supported', 'Needs Verification', 'Contradicted', 'Unsupported'];
const claimSchema = new mongoose.Schema({
  analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis', required: true },
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
  claimText: { type: String, required: true },
  importance: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  assessment: { type: String, enum: ASSESSMENTS, default: 'Needs Verification' },
  confidence: { type: Number, min: 0, max: 100, default: 50 },
  supportingEvidence: [String],
  contradictingEvidence: [String],
  explanation: { type: String, default: '' },
  externalSources: [{
    title: String,
    url: String,
    position: { type: String, enum: ['Supports', 'Partial', 'Contradicts', 'Neutral'], default: 'Neutral' },
    reliability: { type: String, default: '' }
  }]
}, { timestamps: true });
claimSchema.index({ analysis: 1 });
module.exports = mongoose.model('Claim', claimSchema);
