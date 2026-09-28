const User = require('../models/User');
const Analysis = require('../models/Analysis');
const Article = require('../models/Article');
const Source = require('../models/Source');
const Claim = require('../models/Claim');
const FlaggedArticle = require('../models/FlaggedArticle');
const Report = require('../models/Report');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { pagination } = require('../utils/validate');
const notificationService = require('../services/notificationService');
const sourceService = require('../services/sourceService');
const env = require('../config/env');
const VERDICT_LEVELS = ['Highly Credible', 'Mostly Credible', 'Uncertain', 'Potentially Misleading', 'Highly Suspicious'];
async function analysisDomainMap() {
  const rows = await Analysis.aggregate([
    { $lookup: { from: 'articles', localField: 'article', foreignField: '_id', as: 'a' } },
    { $unwind: '$a' },
    { $group: { _id: '$a.domain', n: { $sum: 1 } } }
  ]);
  return new Map(rows.map((r) => [String(r._id || '').toLowerCase(), r.n]));
}
exports.listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 12, 60);
  const search = String(req.query.search || '').trim();
  const role = String(req.query.role || '').trim();
  const status = String(req.query.status || '').trim();
  const filter = {};
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
  }
  if (role === 'USER' || role === 'ADMIN') filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  const [total, users] = await Promise.all([User.countDocuments(filter), User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()]);
  const counts = await Analysis.aggregate([{ $group: { _id: '$user', n: { $sum: 1 }, avg: { $avg: '$overallScore' } } }]);
  const countMap = new Map(counts.map((c) => [String(c._id), c]));
  const items = users.map((u) => {
    const stat = countMap.get(String(u._id)) || { n: 0, avg: 0 };
    return { ...u, passwordHash: undefined, analysisCount: stat.n, averageScore: Math.round(stat.avg || 0) };
  });
  return res.json({ success: true, total, page, limit, items });
});
exports.getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  const [stats, analyses] = await Promise.all([
    Analysis.aggregate([{ $match: { user: user._id } }, { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: '$overallScore' }, flagged: { $sum: 1 } } }]),
    Analysis.find({ user: user._id })
      .populate('article', 'title publisher domain url')
      .sort({ createdAt: -1 })
      .limit(12)
      .select('overallScore verdict createdAt article isSaved analysisMode')
      .lean()
  ]);
  return res.json({ success: true, user: { ...user, passwordHash: undefined }, stats: stats[0] || { total: 0, avg: 0 }, analyses });
});
exports.setUserStatus = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  const { isActive } = req.body || {};
  if (typeof isActive !== 'boolean') throw new AppError('A valid status value is required.', 400, 'VALIDATION_ERROR');
  if (String(target._id) === String(req.user._id)) throw new AppError('You cannot change the status of your own account.', 400, 'SELF_ACTION');
  if (target.role === 'ADMIN') {
    const adminCount = await User.countDocuments({ role: 'ADMIN', isActive: true });
    if (target.isActive && !isActive && adminCount <= 1) throw new AppError('You cannot deactivate the last active admin.', 400, 'LAST_ADMIN');
  }
  target.isActive = isActive;
  await target.save();
  const actor = req.user && req.user.name ? req.user.name : 'an administrator';
  await notificationService.pushUser(target._id, { code: 'account-status', type: 'security', title: isActive ? 'Account activated' : 'Account deactivated', message: isActive ? 'Your account was reactivated by an administrator.' : 'Your account has been deactivated by an administrator. Contact support for help.', level: isActive ? 'success' : 'error', link: null, persist: true });
  await notificationService.pushAdmins({ code: 'admin-user-status', type: 'user', title: 'Admin: User account status changed', message: `${actor} ${isActive ? 'activated' : 'deactivated'} ${target.name} (${target.email}).`, level: isActive ? 'success' : 'warning', link: '/admin/users', persist: true });
  return res.json({ success: true, message: isActive ? 'User activated.' : 'User deactivated.' });
});
exports.deleteUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  if (String(target._id) === String(req.user._id)) throw new AppError('You cannot delete your own account from the admin panel.', 400, 'SELF_ACTION');
  if (target.role === 'ADMIN' && (await User.countDocuments({ role: 'ADMIN', isActive: true })) <= 1) {
    throw new AppError('You cannot delete the last active admin account.', 400, 'LAST_ADMIN');
  }
  const analysisIds = await Analysis.find({ user: target._id }).select('_id article').lean();
  const analysisIdList = analysisIds.map((a) => a._id);
  const articleIds = analysisIds.map((a) => a.article).filter(Boolean);
  await Claim.deleteMany({ analysis: { $in: analysisIdList } });
  await Report.deleteMany({ user: target._id });
  await FlaggedArticle.deleteMany({ user: target._id });
  await Notification.deleteMany({ user: target._id });
  await Analysis.deleteMany({ user: target._id });
  if (articleIds.length) {
    const used = await Analysis.distinct('article');
    const usedSet = new Set(used.map(String));
    const orphans = articleIds.filter((a) => !usedSet.has(String(a)));
    if (orphans.length) await Article.deleteMany({ _id: { $in: orphans } });
  }
  await User.deleteOne({ _id: target._id });
  return res.json({ success: true, message: 'User and their data were deleted.' });
});
exports.listAdminSources = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 12, 100);
  const search = String(req.query.search || '').trim();
  const filter = {};
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { domain: { $regex: escaped, $options: 'i' } }, { notes: { $regex: escaped, $options: 'i' } }];
  }
  const [total, items] = await Promise.all([Source.countDocuments(filter), Source.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean()]);
  const countMap = await analysisDomainMap();
  return res.json({ success: true, total, page, limit, items: sourceService.statsForSources(items, countMap) });
});
exports.createSource = asyncHandler(async (req, res) => {
  const { name, domain, classification, reliabilityScore, notes, status, category, country } = req.body || {};
  if (!name || !domain) throw new AppError('Source name and domain are required.', 400, 'VALIDATION_ERROR');
  const normalized = String(domain).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  const existing = await Source.findOne({ domain: normalized });
  if (existing) throw new AppError('A source with this domain already exists.', 409, 'DUPLICATE');
  const score = typeof reliabilityScore === 'number' ? Math.max(0, Math.min(100, reliabilityScore)) : sourceService.scoreForClassification(classification || 'Limited Information');
  const created = await Source.create({
    name: String(name).trim().slice(0, 120),
    domain: normalized,
    reliabilityScore: score,
    classification: classification || sourceService.classificationForScore(score),
    notes: String(notes || '').slice(0, 2000),
    status: status === 'inactive' ? 'inactive' : 'active',
    category: String(category || 'News').slice(0, 60),
    country: String(country || '').slice(0, 80),
    addedBy: req.user._id
  });
  return res.status(201).json({ success: true, source: created, message: 'Source added.' });
});
exports.updateSource = asyncHandler(async (req, res) => {
  const source = await Source.findById(req.params.id);
  if (!source) throw new AppError('Source not found.', 404, 'SOURCE_NOT_FOUND');
  const { name, classification, reliabilityScore, notes, status, category, country } = req.body || {};
  if (name) source.name = String(name).trim().slice(0, 120);
  if (classification) {
    if (!['Trusted', 'Generally Reliable', 'Mixed', 'Limited Information', 'High Risk'].includes(classification)) {
      throw new AppError('Invalid classification.', 400, 'VALIDATION_ERROR');
    }
    source.classification = classification;
    if (typeof reliabilityScore !== 'number') source.reliabilityScore = sourceService.scoreForClassification(classification);
  }
  if (typeof reliabilityScore === 'number') source.reliabilityScore = Math.max(0, Math.min(100, Math.round(reliabilityScore)));
  if (classification && typeof reliabilityScore === 'number' && source.reliabilityScore >= 0) {
    source.classification = sourceService.classificationForScore(source.reliabilityScore);
  }
  if (notes !== undefined) source.notes = String(notes).slice(0, 2000);
  if (status === 'active' || status === 'inactive') source.status = status;
  if (category) source.category = String(category).slice(0, 60);
  if (country !== undefined) source.country = String(country).slice(0, 80);
  await source.save();
  return res.json({ success: true, source, message: 'Source updated.' });
});
exports.deleteSource = asyncHandler(async (req, res) => {
  const source = await Source.findById(req.params.id);
  if (!source) throw new AppError('Source not found.', 404, 'SOURCE_NOT_FOUND');
  await Source.deleteOne({ _id: source._id });
  await Article.updateMany({ source: source._id }, { $unset: { source: '' } });
  return res.json({ success: true, message: 'Source deleted.' });
});
exports.listAdminArticles = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 10, 50);
  const search = String(req.query.search || '').trim();
  const verdict = String(req.query.verdict || '').trim();
  const filter = {};
  if (verdict && VERDICT_LEVELS.includes(verdict)) filter.verdict = verdict;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = await Article.find({ $or: [{ title: { $regex: escaped, $options: 'i' } }, { publisher: { $regex: escaped, $options: 'i' } }, { domain: { $regex: escaped, $options: 'i' } }] }).select('_id').lean();
    filter.article = { $in: matches.length ? matches.map((m) => m._id) : [''] };
  }
  const [total, items] = await Promise.all([
    Analysis.countDocuments(filter),
    Analysis.find(filter)
      .populate('article', 'title publisher domain url author publicationDateText contentExcerpt')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('overallScore verdict createdAt isSaved analysisMode user article suspiciousStatements')
  ]);
  return res.json({ success: true, total, page, limit, items });
});
exports.getAdminArticle = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findById(req.params.id).populate('article').populate('user', 'name email').lean();
  if (!analysis) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
  const claims = await Claim.find({ analysis: analysis._id }).lean();
  const flagged = await FlaggedArticle.findOne({ analysis: analysis._id }).lean();
  return res.json({ success: true, analysis, claims, flagged });
});
exports.deleteAdminAnalysis = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findById(req.params.id);
  if (!analysis) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
  await Claim.deleteMany({ analysis: analysis._id });
  await Report.deleteMany({ analysis: analysis._id });
  await FlaggedArticle.deleteMany({ analysis: analysis._id });
  const articleId = analysis.article;
  await Analysis.deleteOne({ _id: analysis._id });
  const references = await Analysis.countDocuments({ article: articleId });
  if (references === 0) await Article.deleteOne({ _id: articleId });
  return res.json({ success: true, message: 'Analysis record deleted.' });
});
exports.listFlagged = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 10, 50);
  const status = String(req.query.status || '').trim();
  const search = String(req.query.search || '').trim();
  const filter = {};
  if (['pending', 'reviewed', 'verified', 'suspicious'].includes(status)) filter.status = status;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = await Article.find({ $or: [{ title: { $regex: escaped, $options: 'i' } }, { publisher: { $regex: escaped, $options: 'i' } }, { domain: { $regex: escaped, $options: 'i' } }] }).select('_id').lean();
    filter.article = { $in: matches.length ? matches.map((m) => m._id) : [''] };
  }
  const [total, items] = await Promise.all([
    FlaggedArticle.countDocuments(filter),
    FlaggedArticle.find(filter)
      .populate({ path: 'analysis', populate: { path: 'article', select: 'title publisher domain url author publicationDateText' } })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);
  return res.json({ success: true, total, page, limit, items });
});
exports.updateFlagged = asyncHandler(async (req, res) => {
  const flagged = await FlaggedArticle.findById(req.params.id);
  if (!flagged) throw new AppError('Flagged article not found.', 404, 'FLAGGED_NOT_FOUND');
  const { status, moderationNotes } = req.body || {};
  if (['pending', 'reviewed', 'verified', 'suspicious'].includes(status)) {
    flagged.status = status;
    flagged.reviewedBy = req.user._id;
    flagged.reviewedAt = new Date();
  }
  if (moderationNotes !== undefined) flagged.moderationNotes = String(moderationNotes).slice(0, 2000);
  await flagged.save();
  const analysis = await Analysis.findById(flagged.analysis).lean();
  if (analysis) {
    await notificationService.createForUser(flagged.user || analysis.user, {
      type: 'flagged',
      title: 'Moderation update on your analysis',
      message: `An administrator marked your analysis as "${status}". ${moderationNotes ? `Note: ${moderationNotes}` : ''}`,
      link: `/user/result/${flagged.analysis}`
    });
  }
  return res.json({ success: true, flagged, message: 'Flagged article updated.' });
});
exports.analytics = asyncHandler(async (req, res) => {
  const range = Math.min(90, Math.max(1, parseInt(req.query.range, 10) || 30));
  const from = new Date(Date.now() - range * 24 * 60 * 60 * 1000);
  const [totals, daily, monthly, bucket, verdicts, domains, users, flaggedTrend] = await Promise.all([
    Analysis.aggregate([{ $match: {} }, { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: '$overallScore' }, today: { $sum: { $cond: [{ $gte: ['$createdAt', new Date(new Date().setHours(0, 0, 0, 0))] }, 1, 0] } }, suspicious: { $sum: { $cond: [{ $in: ['$verdict', ['Potentially Misleading', 'Highly Suspicious']] }, 1, 0] } } } }]),
    Analysis.aggregate([{ $match: { createdAt: { $gte: from } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 }, avg: { $avg: '$overallScore' } } }, { $sort: { _id: 1 } }]),
    Analysis.aggregate([{ $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 }, avg: { $avg: '$overallScore' } } }, { $sort: { _id: 1 } }, { $limit: 12 }]),
    Analysis.aggregate([{ $group: { _id: { $switch: { branches: [{ case: { $gte: ['$overallScore', 80] }, then: '80-100' }, { case: { $gte: ['$overallScore', 65] }, then: '65-79' }, { case: { $gte: ['$overallScore', 45] }, then: '45-64' }, { case: { $gte: ['$overallScore', 25] }, then: '25-44' }], default: '0-24' } }, count: { $sum: 1 } } }]),
    Analysis.aggregate([{ $group: { _id: '$verdict', count: { $sum: 1 } } }]),
    Analysis.aggregate([{ $lookup: { from: 'articles', localField: 'article', foreignField: '_id', as: 'a' } }, { $unwind: '$a' }, { $group: { _id: '$a.domain', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    Analysis.aggregate([{ $group: { _id: '$user', count: { $sum: 1 }, avg: { $avg: '$overallScore' } } }, { $sort: { count: -1 } }, { $limit: 8 }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } }, { $unwind: '$u' }]),
    FlaggedArticle.aggregate([{ $match: { createdAt: { $gte: from } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
  ]);
  const totalUsers = await User.countDocuments({});
  const activeUsers = await User.countDocuments({ isActive: true });
  const t = totals[0] || { total: 0, avg: 0, today: 0, suspicious: 0 };
  const levels = {};
  for (const b of bucket) levels[b._id] = b.count;
  const verdictMap = {};
  for (const v of verdicts) verdictMap[v._id] = v.count;
  return res.json({
    success: true,
    range,
    summary: {
      totalAnalyses: t.total,
      averageScore: Math.round(t.avg || 0),
      analysesToday: t.today,
      suspiciousCount: t.suspicious,
      suspiciousPercentage: t.total ? Math.round((t.suspicious / t.total) * 100) : 0,
      totalUsers,
      activeUsers,
      flaggedPending: await FlaggedArticle.countDocuments({ status: 'pending' }),
      suspiciousSources: await Source.countDocuments({ classification: 'High Risk' })
    },
    series: { daily: daily.map((d) => ({ date: d._id, count: d.count, avg: Math.round(d.avg || 0) })), monthly: monthly.map((m) => ({ month: m._id, count: m.count, avg: Math.round(m.avg || 0) })) },
    distribution: { credibility: Object.keys(levels).map((k) => ({ level: k, count: levels[k] })), verdict: Object.keys(verdictMap).map((k) => ({ label: k, count: verdictMap[k] })) },
    topDomains: domains.map((d) => ({ domain: d._id || 'unknown', count: d.count })),
    topUsers: users.map((u) => ({ name: u.u ? u.u.name : 'Unknown', email: u.u ? u.u.email : '', count: u.count, avg: Math.round(u.avg || 0) })),
    flaggedTrend: flaggedTrend.map((f) => ({ date: f._id, count: f.count }))
  });
});
exports.systemConfig = asyncHandler(async (req, res) => {
  const [userCount, adminCount, sourceCount, flaggedPending, analysesToday] = await Promise.all([
    User.countDocuments({ role: 'USER' }),
    User.countDocuments({ role: 'ADMIN' }),
    Source.countDocuments({}),
    FlaggedArticle.countDocuments({ status: 'pending' }),
    Analysis.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
  ]);
  return res.json({
    success: true,
    config: {
      analysisEngine: env.geminiApiKey ? 'Gemini AI (Gemini 3.8 Flash)' : 'Offline heuristic engine — set GEMINI_API_KEY to enable AI mode',
      externalVerification: env.serperApiKey ? 'Serper web search enabled' : env.geminiApiKey ? 'Gemini grounded web search available' : 'Not configured — claims marked “Needs Verification”',
      googleSignIn: env.googleClientId ? 'Configured' : 'Not configured',
      emailDelivery: env.mailUsername ? `SMTP (${env.mailHost})` : 'Development preview mode (codes logged to server console)',
      otpTtlMinutes: env.otpTtlMinutes,
      otpMaxAttempts: env.otpMaxAttempts,
      jwtExpiry: env.jwtExpiresIn,
      sessionSecurity: 'JWT + role-based authorization enforced server-side',
      frontendUrl: env.frontendUrl,
      backendUrl: env.backendUrl,
      adminEmail: String(env.adminEmail).toLowerCase(),
      counts: { users: userCount, admins: adminCount, sources: sourceCount, flaggedPending, analysesToday }
    }
  });
});
exports.listAdminNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = pagination(req.query, 15, 50);
  const data = await notificationService.listForAdmin(req.user._id, { page, limit });
  return res.json({ success: true, ...data });
});
exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user._id, req.params.id, true);
  if (!notification) throw new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
  return res.json({ success: true, message: 'Notification marked as read.' });
});
exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id, true);
  return res.json({ success: true, message: 'All notifications marked as read.' });
});
