const Source = require('../models/Source');
const Analysis = require('../models/Analysis');
const Article = require('../models/Article');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { pagination } = require('../utils/validate');
const sourceService = require('../services/sourceService');
async function domainCountMap() {
  const rows = await Analysis.aggregate([
    { $lookup: { from: 'articles', localField: 'article', foreignField: '_id', as: 'a' } },
    { $unwind: '$a' },
    { $group: { _id: '$a.domain', n: { $sum: 1 } } }
  ]);
  return new Map(rows.map((c) => [String(c._id || '').toLowerCase(), c.n]));
}
exports.listSources = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 12, 60);
  const search = String(req.query.search || '').trim();
  const filter = {};
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { domain: { $regex: escaped, $options: 'i' } },
      { classification: { $regex: escaped, $options: 'i' } }
    ];
  }
  const [total, items] = await Promise.all([Source.countDocuments(filter), Source.find(filter).sort({ reliabilityScore: -1 }).skip(skip).limit(limit).lean()]);
  const countMap = await domainCountMap();
  return res.json({
    success: true,
    total,
    page,
    limit,
    items: sourceService.statsForSources(items, countMap)
  });
});
exports.getSource = asyncHandler(async (req, res) => {
  const source = await Source.findById(req.params.id).lean();
  if (!source) throw new AppError('Source not found.', 404, 'SOURCE_NOT_FOUND');
  const countMap = await domainCountMap();
  const articles = await Article.find({ domain: source.domain }).select('_id').lean();
  const recent = await Analysis.find({ article: { $in: articles.map((a) => a._id) } })
    .populate('article', 'title domain publisher url')
    .sort({ createdAt: -1 })
    .limit(8)
    .select('overallScore verdict createdAt article')
    .lean();
  return res.json({
    success: true,
    source: sourceService.statsForSources([source], countMap)[0],
    analyzedArticles: countMap.get(String(source.domain).toLowerCase()) || 0,
    recent
  });
});

// Average credibility score per day for one publisher, from every analysis of its articles.
exports.getTrend = asyncHandler(async (req, res) => {
  const source = await Source.findById(req.params.id).select('name domain').lean();
  if (!source) throw new AppError('Source not found.', 404, 'SOURCE_NOT_FOUND');
  const articleIds = await Article.find({ source: source._id }).distinct('_id');
  const rows = articleIds.length
    ? await Analysis.aggregate([
        { $match: { article: { $in: articleIds }, analysisStatus: { $in: ['completed', 'heuristic'] } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, avg: { $avg: '$overallScore' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 60 }
      ])
    : [];
  const total = rows.reduce((s, r) => s + r.count, 0);
  const average = total ? Math.round(rows.reduce((s, r) => s + r.avg * r.count, 0) / total) : null;
  return res.json({ success: true, source, average, total, points: rows.map((r) => ({ date: r._id, avg: Math.round(r.avg), count: r.count })) });
});
