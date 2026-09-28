const mongoose = require('mongoose');
const articleSchema = new mongoose.Schema({
  url: { type: String, default: null },
  title: { type: String, required: true, trim: true, maxlength: 600 },
  content: { type: String, required: true },
  contentExcerpt: { type: String, default: '' },
  author: { type: String, default: null },
  publisher: { type: String, default: null },
  publicationDate: { type: Date, default: null },
  publicationDateText: { type: String, default: null },
  domain: { type: String, default: null },
  extractedMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  source: { type: mongoose.Schema.Types.ObjectId, ref: 'Source', default: null }
}, { timestamps: true });
articleSchema.index({ url: 1 }, { sparse: true });
articleSchema.index({ domain: 1 });
module.exports = mongoose.model('Article', articleSchema);
