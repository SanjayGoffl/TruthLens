const mongoose = require('mongoose');
const SOURCE_CLASSIFICATIONS = ['Trusted', 'Generally Reliable', 'Mixed', 'Limited Information', 'High Risk'];
const sourceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
  reliabilityScore: { type: Number, min: 0, max: 100, default: 50 },
  classification: { type: String, enum: SOURCE_CLASSIFICATIONS, default: 'Limited Information' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  category: { type: String, default: 'News' },
  country: { type: String, default: '' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });
sourceSchema.index({ name: 'text', domain: 'text', notes: 'text' });
module.exports = mongoose.model('Source', sourceSchema);
