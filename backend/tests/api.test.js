const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'test-secret-'.repeat(4);
process.env.GEMINI_API_KEY = '';
process.env.SERPER_API_KEY = '';

const TEXT = 'Council approves budget\n\nThe city council approved the annual budget on Tuesday, according to a statement from the mayor. Officials confirmed that 1200 crore will go to road repairs, and a survey of residents showed broad support across three districts.\n\nExperts at the local university told reporters the plan follows earlier data from the finance department.';
let mongod, server, base, headers, mongoose, user;

test.before(async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('ng_api_test');
  mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../models/User');
  user = await User.create({ name: 'Tester', email: 't@example.com', password: 'Str0ng!Passw0rd#1', role: 'USER', isActive: true });
  const app = require('../app');
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${require('../utils/token').signAccessToken(user)}` };
});

test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

const call = async (path, opts = {}) => {
  const res = await fetch(base + path, opts);
  return { status: res.status, body: await res.json().catch(() => ({})) };
};
const post = (path, body, h = headers) => call(path, { method: 'POST', headers: h, body: JSON.stringify(body) });

test('health reports the cache backend', async () => {
  const r = await call('/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.cache, 'memory');
});

test('analysis routes require authentication', async () => {
  assert.equal((await call('/analysis/history')).status, 401);
});

test('mongo operator injection on login is rejected', async () => {
  const r = await post('/auth/login', { email: { $ne: null }, password: { $ne: null } }, { 'Content-Type': 'application/json' });
  assert.equal(r.status, 400);
});

test('SSRF targets are refused', async () => {
  const r = await post('/analysis/url', { url: 'http://169.254.169.254/latest/meta-data/' });
  assert.equal(r.status, 400);
  assert.equal(r.body.code, 'URL_NOT_ALLOWED');
});

test('short pasted text is rejected', async () => {
  const r = await post('/analysis/content', { content: 'too short' });
  assert.equal(r.status, 400);
  assert.equal(r.body.code, 'CONTENT_TOO_SHORT');
});

test('paste analysis, history, share link and feedback', async () => {
  const a = await post('/analysis/content', { content: TEXT });
  assert.equal(a.status, 201);
  const id = a.body.analysisId;
  assert.equal(a.body.analysis.inputKind, 'paste');
  const excluded = a.body.analysis.factors.filter((f) => f.excluded).map((f) => f.key);
  assert.deepEqual(excluded.sort(), ['publicationTransparency', 'sourceReliability']);

  const hist = await call('/analysis/history', { headers });
  assert.equal(hist.body.total, 1);

  const fb = await post(`/analysis/${id}/feedback`, { helpful: true, note: 'clear' });
  assert.equal(fb.status, 200);
  assert.equal((await post(`/analysis/${id}/feedback`, { helpful: 'yes' })).status, 400);

  const share = await post(`/analysis/${id}/share`, {});
  assert.equal(share.status, 200);
  const pub = await call(`/public/report/${share.body.token}`);
  assert.equal(pub.status, 200);
  assert.equal(pub.body.analysis.user, undefined);
  assert.equal(pub.body.analysis.feedback, undefined);

  await call(`/analysis/${id}/share`, { method: 'DELETE', headers });
  assert.equal((await call(`/public/report/${share.body.token}`)).status, 404);
});

test("another user cannot read someone else's analysis", async () => {
  const User = require('../models/User');
  const other = await User.create({ name: 'Other', email: 'o@example.com', password: 'Str0ng!Passw0rd#1', role: 'USER', isActive: true });
  const h2 = { ...headers, Authorization: `Bearer ${require('../utils/token').signAccessToken(other)}` };
  const hist = await call('/analysis/history', { headers });
  const id = hist.body.items[0]._id;
  assert.equal((await call(`/analysis/${id}`, { headers: h2 })).status, 404);
  assert.equal((await call('/admin/users', { headers: h2 })).status, 403);
});

test('background job: 202 with job id, pollable to completion, owner-only', async () => {
  const start = await post('/analysis/jobs', { content: TEXT });
  assert.equal(start.status, 202);
  const id = start.body.jobId;
  let job;
  for (let i = 0; i < 40; i += 1) {
    job = (await call(`/analysis/jobs/${id}`, { headers })).body.job;
    if (job.status === 'done' || job.status === 'failed') break;
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.equal(job.status, 'done', job.message);
  assert.ok(job.analysisId);
  assert.equal((await call(`/analysis/${job.analysisId}`, { headers })).status, 200);
  const User = require('../models/User');
  const stranger = await User.create({ name: 'S', email: 's@example.com', password: 'Str0ng!Passw0rd#1', role: 'USER', isActive: true });
  const h2 = { ...headers, Authorization: `Bearer ${require('../utils/token').signAccessToken(stranger)}` };
  assert.equal((await call(`/analysis/jobs/${id}`, { headers: h2 })).status, 404);
});

test('job validation errors are returned before a job starts', async () => {
  assert.equal((await post('/analysis/jobs', { url: 'not a url' })).status, 400);
  assert.equal((await post('/analysis/jobs', { content: 'short' })).status, 400);
});
