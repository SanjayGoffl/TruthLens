const test = require('node:test');
const assert = require('node:assert/strict');
process.env.FACTCHECK_API_KEY = 'test-key';
const factCheck = require('../services/factCheckService');

test('fact-check results are shaped and limited', async () => {
  const http = { get: async () => ({ data: { claims: [{ text: 'x', claimReview: [{ url: 'https://a.example/1', title: 'T', textualRating: 'False', publisher: { name: 'Checker' } }, { title: 'no url' }] }] } }) };
  const out = await factCheck.search('some unique claim text', http);
  assert.deepEqual(out, [{ publisher: 'Checker', title: 'T', url: 'https://a.example/1', rating: 'False' }]);
});

test('API failure degrades to no results', async () => {
  const http = { get: async () => { throw new Error('down'); } };
  assert.deepEqual(await factCheck.search('another unique claim', http), []);
});
