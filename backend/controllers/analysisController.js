const Article = require('../models/Article');
const Analysis = require('../models/Analysis');
const Claim = require('../models/Claim');
const Report = require('../models/Report');
const FlaggedArticle = require('../models/FlaggedArticle');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { isHttpUrl, pagination, cleanArticleText } = require('../utils/validate');
const analysisService = require('../services/analysisService');
const notificationService = require('../services/notificationService');
const reportService = require('../services/reportService');
const mailService = require('../services/mailService');
const socket = require('../utils/socket');
const jobs = require('../services/jobService');
const activeJobs = new Map();
const DUP_WINDOW_MS = 90000;
function registerJob(userId) {
  const key = String(userId);
  const existing = activeJobs.get(key);
  if (existing && Date.now() - existing < DUP_WINDOW_MS) {
    throw new AppError('An analysis is already running for your account. Please wait for it to finish.', 429, 'ANALYSIS_IN_PROGRESS');
  }
  activeJobs.set(key, Date.now());
  setTimeout(() => {
    if (activeJobs.get(key) && Date.now() - activeJobs.get(key) >= DUP_WINDOW_MS) activeJobs.delete(key);
  }, DUP_WINDOW_MS + 1000).unref();
}
function releaseJob(userId) {
  activeJobs.delete(String(userId));
}
const userAnalysisNotificationCodes = new Set(['analysis-started']);
const PROGRESS_STAGE = { 'analysis-started': 0, 'source-verified': 1, 'claim-verified': 2, 'score-generated': 3, 'report-generated': 4 };
async function pipeEvent(userId, event) {
  if (event && PROGRESS_STAGE[event.code] !== undefined) socket.emitToUser(String(userId), 'analysis:progress', { stage: PROGRESS_STAGE[event.code], code: event.code, message: event.message });
  if (!event || !userAnalysisNotificationCodes.has(event.code)) return;
  await notificationService.pushUser(userId, { ...event, persist: false });
}
async function notifyComplete(userId, result) {
  const title = (result.analysis && (result.analysis.articleTitle || result.analysis.title)) || 'Untitled article';
  const link = `/user/result/${result.analysisId}`;
  await notificationService.pushUser(userId, {
    code: 'analysis-completed',
    type: 'analysis',
    title: 'Article analysis completed',
    message: `"${String(title).slice(0, 90)}" scored ${result.analysis.overallScore}/100 (${result.analysis.verdict}).`,
    level: result.analysis.overallScore >= 65 ? 'success' : result.analysis.overallScore >= 45 ? 'info' : 'warning',
    link,
    persist: true
  });
  try {
    const article = await Article.findById(result.analysis.article).lean();
    const pdf = await reportService.buildAnalysisPdf({ analysis: result.analysis, article, claims: result.claims || [] });
    await mailService.sendAnalysisCompleteEmail(result.userEmail, {
      title: article && article.title ? article.title : title,
      score: result.analysis.overallScore,
      verdict: result.analysis.verdict,
      pdf
    });
  } catch (err) {
    console.warn('Analysis completion email failed:', err.message);
  }
  await notificationService.pushAdmins({
    code: 'admin-analysis-new',
    type: 'analysis',
    title: 'Admin: New article analyzed',
    message: `"${String(title).slice(0, 80)}" analyzed by ${result.userName || 'a user'} — ${result.analysis.verdict} (${result.analysis.overallScore}/100).`,
    level: 'info',
    link: '/admin/articles',
    persist: true
  });
  if (result.sourceProfile && result.sourceProfile.known && result.sourceProfile.classification === 'High Risk') {
    await notificationService.pushAdmins({
      code: 'admin-high-risk-source',
      type: 'flagged',
      title: 'Admin: High-risk source detected',
      message: `Source "${result.sourceProfile.name || 'Unknown'}" was classified High Risk in a new analysis.`,
      level: 'warning',
      link: '/admin/sources',
      persist: true
    });
  }
  if (result.flaggedId) {
    await notificationService.pushAdmins({
      code: 'admin-suspicious-flagged',
      type: 'flagged',
      title: 'Admin: Suspicious article flagged',
      message: `Auto-flagged for review: "${String(title).slice(0, 80)}" (${result.analysis.verdict}, ${result.analysis.overallScore}/100).`,
      level: 'warning',
      link: '/admin/flagged',
      persist: true
    });
  }
}
function respondWithAnalysis(res, result) {
  return res.status(201).json({ success: true, message: 'Analysis completed.', ...result });
}
exports.analyzeFromUrl = asyncHandler(async (req, res) => {
  const url = String(req.body.url || '').trim();
  if (!isHttpUrl(url)) throw new AppError('Please enter a valid article URL starting with http:// or https://.', 400, 'INVALID_URL');
  registerJob(req.user._id);
  try {
    const result = await analysisService.runFromUrl(req.user, url, (event) => pipeEvent(req.user._id, event));
    await notifyComplete(req.user._id, { ...result, userName: req.user.name, userEmail: req.user.email });
    return respondWithAnalysis(res, result);
  } catch (err) {
    await notificationService.pushUser(req.user._id, { code: 'analysis-failed', type: 'alert', title: 'Article analysis failed', message: err && err.message ? err.message : 'The analysis could not be completed.', level: 'error', link: '/user/analyze', persist: true });
    await notificationService.pushAdmins({ code: 'admin-system-error', type: 'alert', title: 'Admin: System/AI analysis error', message: `An analysis failed${req.user ? ` for ${req.user.name}` : ''}: ${err && err.message ? String(err.message).slice(0, 120) : 'unknown error'}.`, level: 'error', link: '/admin/analytics', persist: false });
    throw err;
  } finally {
    releaseJob(req.user._id);
  }
});
exports.analyzeFromContent = asyncHandler(async (req, res) => {
  if (typeof req.body.content !== 'string') throw new AppError('Please paste the article content you want to analyze.', 400, 'EMPTY_CONTENT');
  const content = cleanArticleText(req.body.content, 60000);
  if (!content) throw new AppError('Please paste the article content you want to analyze.', 400, 'EMPTY_CONTENT');
  if (content.length > 20000) throw new AppError('Article content is too long. Please keep it under 20,000 characters.', 400, 'CONTENT_TOO_LONG');
  const sourceUrl = String(req.body.sourceUrl || '').trim();
  if (sourceUrl && !isHttpUrl(sourceUrl)) throw new AppError('The optional source link must start with http:// or https://.', 400, 'INVALID_URL');
  const pasteMeta = { title: req.body.title, publisher: req.body.publisher, author: req.body.author, sourceUrl };
  registerJob(req.user._id);
  try {
    const result = await analysisService.runFromContent(req.user, content, pasteMeta, (event) => pipeEvent(req.user._id, event));
    await notifyComplete(req.user._id, { ...result, userName: req.user.name, userEmail: req.user.email });
    return respondWithAnalysis(res, result);
  } catch (err) {
    await notificationService.pushUser(req.user._id, { code: 'analysis-failed', type: 'alert', title: 'Article analysis failed', message: err && err.message ? err.message : 'The analysis could not be completed.', level: 'error', link: '/user/analyze', persist: true });
    await notificationService.pushAdmins({ code: 'admin-system-error', type: 'alert', title: 'Admin: System/AI analysis error', message: `An analysis failed${req.user ? ` for ${req.user.name}` : ''}: ${err && err.message ? String(err.message).slice(0, 120) : 'unknown error'}.`, level: 'error', link: '/admin/analytics', persist: false });
    throw err;
  } finally {
    releaseJob(req.user._id);
  }
});
function parsePasteBody(body) {
  if (typeof body.content !== 'string') throw new AppError('Please paste the article content you want to analyze.', 400, 'EMPTY_CONTENT');
  const content = cleanArticleText(body.content, 60000);
  if (!content) throw new AppError('Please paste the article content you want to analyze.', 400, 'EMPTY_CONTENT');
  if (content.length > 20000) throw new AppError('Article content is too long. Please keep it under 20,000 characters.', 400, 'CONTENT_TOO_LONG');
  if (content.split(/\s+/).filter(Boolean).length < 40) throw new AppError('Article content is too short to analyze. Please paste at least a few full paragraphs (about 40 words).', 400, 'CONTENT_TOO_SHORT');
  const sourceUrl = String(body.sourceUrl || '').trim();
  if (sourceUrl && !isHttpUrl(sourceUrl)) throw new AppError('The optional source link must start with http:// or https://.', 400, 'INVALID_URL');
  return { content, meta: { title: body.title, publisher: body.publisher, author: body.author, sourceUrl } };
}
// Asynchronous analysis: validate, answer 202 with a job id, run the pipeline in the background.
exports.startJob = asyncHandler(async (req, res) => {
  const isUrl = typeof req.body.url === 'string' && req.body.url.trim() !== '';
  let run;
  if (isUrl) {
    const url = req.body.url.trim();
    if (!isHttpUrl(url)) throw new AppError('Please enter a valid article URL starting with http:// or https://.', 400, 'INVALID_URL');
    run = (onEvent) => analysisService.runFromUrl(req.user, url, onEvent);
  } else {
    const { content, meta } = parsePasteBody(req.body);
    run = (onEvent) => analysisService.runFromContent(req.user, content, meta, onEvent);
  }
  registerJob(req.user._id);
  const user = req.user;
  const job = await jobs.create(user._id, isUrl ? 'url' : 'paste');
  res.status(202).json({ success: true, jobId: job.id });
  setImmediate(async () => {
    try {
      await jobs.update(job.id, { status: 'running', message: 'Reading the article' });
      const result = await run(async (event) => {
        if (event && PROGRESS_STAGE[event.code] !== undefined) await jobs.update(job.id, { stage: PROGRESS_STAGE[event.code], message: event.message });
        await pipeEvent(user._id, event);
      });
      await notifyComplete(user._id, { ...result, userName: user.name, userEmail: user.email });
      await jobs.update(job.id, { status: 'done', stage: 5, analysisId: String(result.analysisId), score: result.analysis.overallScore, verdict: result.analysis.verdict });
    } catch (err) {
      await jobs.update(job.id, { status: 'failed', message: err && err.message ? err.message : 'The analysis could not be completed.' });
      await notificationService.pushUser(user._id, { code: 'analysis-failed', type: 'alert', title: 'Article analysis failed', message: err && err.message ? err.message : 'The analysis could not be completed.', level: 'error', link: '/user/analyze', persist: true }).catch(() => {});
    } finally {
      releaseJob(user._id);
    }
  });
});
exports.getJob = asyncHandler(async (req, res) => {
  const job = await jobs.get(req.params.jobId);
  if (!job || job.userId !== String(req.user._id)) throw new AppError('Job not found or expired.', 404, 'JOB_NOT_FOUND');
  const { userId, ...safe } = job;
  return res.json({ success: true, job: safe });
});
exports.getHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 10, 50);
  const filter = { user: req.user._id };
  const search = String(req.query.search || '').trim();
  const verdict = String(req.query.verdict || '').trim();
  const savedOnly = String(req.query.saved || '') === 'true';
  const sortKey = String(req.query.sort || 'newest');
  if (savedOnly) filter.isSaved = true;
  if (verdict) filter.verdict = verdict;
  const sort = sortKey === 'score-asc' ? { overallScore: 1 } : sortKey === 'score-desc' ? { overallScore: -1 } : { createdAt: -1 };
  const articleMatch = search
    ? await Article.find({ $or: [{ title: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { publisher: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { domain: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }] })
        .select('_id')
        .lean()
    : [];
  if (articleMatch.length) filter.article = { $in: articleMatch.map((a) => a._id) };
  else if (search) filter.article = { $in: [] };
  const [total, items] = await Promise.all([
    Analysis.countDocuments(filter),
    Analysis.find(filter)
      .populate('article', 'title publisher domain url publicationDateText author')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-externalVerification -suspiciousStatements -factors -clickbaitFindings -sensationalFindings')
  ]);
  return res.json({ success: true, total, page, limit, items });
});
exports.getSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);
  const [totals, verdicts, daily, recent] = await Promise.all([
    Analysis.aggregate([
      { $match: { user: userId, analysisStatus: { $in: ['completed', 'heuristic'] } } },
      { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: '$overallScore' }, saved: { $sum: { $cond: ['$isSaved', 1, 0] } } } }
    ]),
    Analysis.aggregate([{ $match: { user: userId, analysisStatus: { $in: ['completed', 'heuristic'] } } }, { $group: { _id: '$verdict', count: { $sum: 1 } } }]),
    Analysis.aggregate([
      { $match: { user: userId, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } }
    ]),
    Analysis.find({ user: userId, analysisStatus: { $in: ['completed', 'heuristic'] } })
      .populate('article', 'title publisher domain url publicationDateText author')
      .sort({ createdAt: -1 })
      .limit(6)
      .select('overallScore verdict createdAt isSaved analysisMode article')
  ]);
  const totalsRow = totals[0] || { total: 0, avg: 0, saved: 0 };
  const verdictCounts = { 'Highly Credible': 0, 'Mostly Credible': 0, Uncertain: 0, 'Potentially Misleading': 0, 'Highly Suspicious': 0 };
  verdicts.forEach((v) => {
    if (verdictCounts[v._id] !== undefined) verdictCounts[v._id] = v.count;
  });
  const dailyMap = new Map(daily.map((d) => [d._id, d.count]));
  const trend = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    trend.push({ date: key, count: dailyMap.get(key) || 0 });
  }
  const levelBands = [['80-100', verdictCounts['Highly Credible']], ['65-79', verdictCounts['Mostly Credible']], ['45-64', verdictCounts.Uncertain], ['25-44', verdictCounts['Potentially Misleading']], ['0-24', verdictCounts['Highly Suspicious']]];
  return res.json({
    success: true,
    stats: {
      totalAnalyses: totalsRow.total,
      averageScore: Math.round(totalsRow.avg || 0),
      savedReports: totalsRow.saved,
      highlyCredible: verdictCounts['Highly Credible'],
      potentiallyMisleading: verdictCounts['Potentially Misleading'],
      highlySuspicious: verdictCounts['Highly Suspicious']
    },
    verdictCounts,
    distribution: levelBands.map(([label, count]) => ({ label, count })),
    trend,
    recent
  });
});
exports.getById = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id })
    .populate('article')
    .lean();
  if (!analysis) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
  const claims = await Claim.find({ analysis: analysis._id }).lean();
  return res.json({ success: true, analysis, claims });
});
exports.reanalyze = asyncHandler(async (req, res) => {
  const previous = await Analysis.findOne({ _id: req.params.id, user: req.user._id }).populate('article');
  if (!previous || !previous.article) throw new AppError('Analysis or source article not found.', 404, 'ANALYSIS_NOT_FOUND');
  registerJob(req.user._id);
  await notificationService.pushUser(req.user._id, { code: 'analysis-started', type: 'analysis', title: 'Article reanalysis started', message: 'Running the credibility pipeline again for this article.', level: 'info', link: null, persist: false });
  try {
    const article = previous.article;
    const result = await analysisService.runFullAnalysis({
      user: req.user,
      articleDoc: article,
      metaMode: article.url && !(article.extractedMetadata && article.extractedMetadata.extractionVia === 'paste') ? 'url' : 'content',
      articleEntity: article,
      onEvent: (event) => pipeEvent(req.user._id, event)
    });
    await notifyComplete(req.user._id, { ...result, userName: req.user.name, userEmail: req.user.email });
    return res.status(201).json({ success: true, message: 'Article reanalyzed.', ...result });
  } catch (err) {
    await notificationService.pushUser(req.user._id, { code: 'analysis-failed', type: 'alert', title: 'Article reanalysis failed', message: err && err.message ? err.message : 'The reanalysis could not be completed.', level: 'error', link: '/user/history', persist: true });
    throw err;
  } finally {
    releaseJob(req.user._id);
  }
});
exports.enableShare = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
  if (!analysis) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
  if (!analysis.shareToken) analysis.shareToken = require('crypto').randomBytes(18).toString('base64url');
  await analysis.save();
  return res.json({ success: true, token: analysis.shareToken, path: `/report/${analysis.shareToken}` });
});
exports.disableShare = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
  if (!analysis) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
  analysis.shareToken = undefined;
  await analysis.save();
  return res.json({ success: true, message: 'Sharing turned off.' });
});
exports.submitFeedback = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
  if (!analysis) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
  if (typeof req.body.helpful !== 'boolean') throw new AppError('Feedback must say whether the result was helpful.', 400, 'VALIDATION_ERROR');
  analysis.feedback = { helpful: req.body.helpful, note: String(req.body.note || '').slice(0, 500) };
  await analysis.save();
  return res.json({ success: true, message: 'Thanks for the feedback.' });
});
exports.getShared = asyncHandler(async (req, res) => {
  const token = String(req.params.token || '');
  if (token.length < 10) throw new AppError('Report not found.', 404, 'NOT_FOUND');
  const analysis = await Analysis.findOne({ shareToken: token }).populate('article', 'title publisher domain url author publicationDateText').select('-user -feedback -shareToken -externalVerification').lean();
  if (!analysis) throw new AppError('This shared report does not exist or sharing was turned off.', 404, 'NOT_FOUND');
  const claims = await Claim.find({ analysis: analysis._id }).select('-analysis -article').lean();
  return res.json({ success: true, analysis, claims });
});
exports.deleteById = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
  if (!analysis) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
  const articleId = analysis.article;
  await Claim.deleteMany({ analysis: analysis._id });
  await Report.deleteMany({ analysis: analysis._id });
  await FlaggedArticle.deleteMany({ analysis: analysis._id });
  await Notification.deleteMany({ link: `/user/result/${analysis._id}` });
  await Analysis.deleteOne({ _id: analysis._id });
  const references = await Analysis.countDocuments({ article: articleId });
  if (references === 0) await Article.deleteOne({ _id: articleId });
  await notificationService.pushUser(req.user._id, { code: 'analysis-deleted', type: 'report', title: 'Analysis deleted', message: 'The analysis and its linked report were permanently deleted.', level: 'info', link: '/user/history', persist: true });
  return res.json({ success: true, message: 'Analysis deleted.' });
});
exports.toggleSave = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
  if (!analysis) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
  analysis.isSaved = !analysis.isSaved;
  analysis.savedAt = analysis.isSaved ? new Date() : null;
  await analysis.save();
  await notificationService.pushUser(req.user._id, {
    code: analysis.isSaved ? 'analysis-saved' : 'analysis-unsaved',
    type: 'report',
    title: analysis.isSaved ? 'Analysis saved' : 'Analysis removed from saved',
    message: analysis.isSaved ? 'This analysis was added to your saved reports.' : 'This analysis was removed from your saved reports.',
    level: 'success',
    link: `/user/result/${analysis._id}`,
    persist: true
  });
  return res.json({ success: true, isSaved: analysis.isSaved, message: analysis.isSaved ? 'Report saved.' : 'Report removed from saved.' });
});
exports.downloadReport = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id }).populate('article').lean();
  if (!analysis) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
  const claims = await Claim.find({ analysis: analysis._id }).lean();
  const buffer = await reportService.buildAnalysisPdf({ analysis, article: analysis.article, claims });
  await notificationService.pushUser(req.user._id, { code: 'pdf-generated', type: 'report', title: 'PDF report generated', message: `The PDF report for "${String((analysis.article && analysis.article.title) || analysis._id).slice(0, 70)}" was generated (${Math.round(buffer.length / 1024)} KB).`, level: 'success', link: `/user/result/${analysis._id}`, persist: false });
  let reportDoc = await Report.findOne({ analysis: analysis._id, user: req.user._id, type: 'analysis' });
  if (!reportDoc) {
    reportDoc = await Report.create({ user: req.user._id, analysis: analysis._id, type: 'analysis', format: 'pdf', generatedBy: 'user' });
  }
  reportDoc.downloadCount += 1;
  reportDoc.lastDownloadedAt = new Date();
  await reportDoc.save();
  await Analysis.updateOne({ _id: analysis._id }, { pdfDownloadedAt: new Date(), pdfDownloadCount: (analysis.pdfDownloadCount || 0) + 1 });
  res.on('finish', () => {
    notificationService.pushUser(req.user._id, { code: 'report-download-ready', type: 'report', title: 'Report download ready', message: 'Your credibility report PDF is ready for download.', level: 'info', link: `/user/result/${analysis._id}`, persist: false });
  });
  const slug = String(analysis.article.title || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="truthlens-${slug}.pdf"`);
  return res.send(buffer);
});
