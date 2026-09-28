const mongoose = require('mongoose');
const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis', required: true },
  type: { type: String, enum: ['analysis', 'legal'], default: 'analysis' },
  format: { type: String, default: 'pdf' },
  generatedBy: { type: String, enum: ['user', 'system'], default: 'user' },
  downloadCount: { type: Number, default: 0 },
  lastDownloadedAt: { type: Date, default: null }
}, { timestamps: true });
reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ analysis: 1 });
module.exports = mongoose.model('Report', reportSchema);
