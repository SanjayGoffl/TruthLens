const cheerio = require('cheerio');
const AppError = require('../utils/AppError');
const { normalizeDomain } = require('../utils/validate');
const { safeGet } = require('../utils/safeFetch');
const cache = require('./cacheService');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TruthLensAI/1.0';
const MAX_BYTES = 3000000;
const MIN_CONTENT_LENGTH = 250;
function metaContent($, selectors) {
  for (const sel of selectors) {
    const found = $(sel).first().attr('content');
    if (found && found.trim()) return found.trim();
  }
  return null;
}
function jsonLdLookup($, key) {
  const out = [];
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text() || '{}');
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (item && item[key]) out.push(item[key]);
      }
    } catch (err) {
      return;
    }
  });
  return out.length ? out.join(' ') : null;
}
function extractMainText($) {
  const candidates = [];
  const fallbackSelectors = ['article', '[role="main"]', 'main', '.article-body', '.story-body', '.post-content', '.entry-content', '.article-content', '.content'];
  for (const sel of fallbackSelectors) {
    const node = $(sel).first();
    if (node.length) {
      const text = node.find('p, h2, h3, li, blockquote').map((i, el) => $(el).text().trim()).get().filter(Boolean);
      candidates.push({ source: sel, text });
    }
  }
  if (candidates.length && candidates[0].text.join(' ').length > 200) {
    const best = candidates.sort((a, b) => b.text.join(' ').length - a.text.join(' ').length)[0];
    return { text: best.text.join('\n\n'), via: best.source };
  }
  const paragraphs = $('p').map((i, el) => $(el).text().trim()).get().filter((t) => t.length > 25);
  if (paragraphs.length) return { text: paragraphs.join('\n\n'), via: 'p' };
  const anyText = $('body').text().replace(/\s+/g, ' ').trim();
  return { text: anyText, via: 'body' };
}
async function fetchPage(url) {
  const { response, finalUrl } = await safeGet(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    timeout: 20000,
    responseType: 'arraybuffer'
  });
  if (response.data && response.data.length > MAX_BYTES) {
    throw new AppError('The page is too large to analyze. Please paste the article content instead.', 422, 'PAGE_TOO_LARGE');
  }
  const contentType = String(response.headers['content-type'] || '');
  const buf = Buffer.from(response.data);
  let html = buf.toString('utf-8');
  if (/text\/html|application\/xhtml|xml/.test(contentType) === false && !/<!doctype|<html/i.test(html)) {
    throw new AppError('The URL does not point to an HTML news page. Please paste the article content instead.', 422, 'NOT_HTML');
  }
  if (contentType && /pdf|octet-stream|json/i.test(contentType)) {
    throw new AppError('The URL points to a non-HTML document. Please paste the article content instead.', 422, 'NOT_HTML');
  }
  return { html, finalUrl };
}
function detectPaywallOrChallenge(text) {
  const lower = text.toLowerCase();
  if (/access denied|request blocked|checking your browser|attention required|cf-|just a moment|enable javascript and cookies|robot check/i.test(lower)) return true;
  return /(?:\b403\b|forbidden|not allowed|unusual traffic)/i.test(lower.slice(0, 4000));
}
function cleanHtmlText(raw) {
  return raw
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&nbsp;/g, ' ')
    .trim();
}
async function extractFromUrlUncached(url) {
  const { html, finalUrl } = await fetchPage(url);
  const $ = cheerio.load(html, null, false);
  const bodyText = $('body').text();
  if (detectPaywallOrChallenge(bodyText)) {
    throw new AppError('The website blocked automated access. Please open the article and paste its content instead.', 422, 'ACCESS_BLOCKED');
  }
  const title =
    metaContent($, ['meta[property="og:title"]', 'meta[name="twitter:title"]', 'meta[name="title"]']) ||
    $('h1').first().text().trim() ||
    $('title').first().text().trim() ||
    jsonLdLookup($, 'headline') ||
    '';
  const description = metaContent($, ['meta[property="og:description"]', 'meta[name="twitter:description"]', 'meta[name="description"]']);
  const author =
    metaContent($, ['meta[name="author"]', 'meta[property="article:author"]', 'meta[name="parsely-author"]', 'meta[name="byl"]']) ||
    jsonLdLookup($, 'author');
  const publisher =
    metaContent($, ['meta[property="og:site_name"]', 'meta[name="application-name"]', 'meta[name="publisher"]']) ||
    jsonLdLookup($, 'publisher');
  const dateText = metaContent($, ['meta[property="article:published_time"]', 'meta[name="date"]', 'meta[name="publish-date"]', 'meta[name="parsely-pub-date"]', 'meta[name="dc.date"]']) || null;
  const { text, via } = extractMainText($);
  let content = cleanHtmlText(text);
  if ((content || '').length < MIN_CONTENT_LENGTH && description) {
    content = `${description}\n\n${content || ''}`;
  }
  if (!content || content.length < MIN_CONTENT_LENGTH) {
    throw new AppError('Could not extract enough article content from this page. Some websites block automated readers — please paste the article content instead.', 422, 'EXTRACT_TOO_SHORT');
  }
  const domain = normalizeDomain(new URL(url).hostname);
  const finalDomain = normalizeDomain(new URL(finalUrl).hostname);
  const authorClean = typeof author === 'string' ? author.replace(/\s+/g, ' ').trim() : author ? String(author).replace(/\s+/g, ' ').trim() : null;
  let publisherClean = null;
  if (typeof publisher === 'string') publisherClean = publisher.replace(/\s+/g, ' ').trim();
  const articleLinks = $('article a, .article-body a, .story-body a, main a').map((i, el) => $(el).attr('href')).get().filter(Boolean).slice(0, 20);
  let parsedDate = null;
  if (dateText) {
    const d = new Date(dateText);
    if (!Number.isNaN(d.getTime())) parsedDate = d;
  }
  return {
    url,
    finalUrl,
    title: String(title || '').slice(0, 600),
    content: String(content).slice(0, 16000),
    contentExcerpt: String(content).slice(0, 300),
    author: authorClean ? String(authorClean).slice(0, 200) : null,
    publisher: publisherClean ? String(publisherClean).slice(0, 200) : null,
    publicationDate: parsedDate,
    publicationDateText: dateText ? String(dateText).slice(0, 60) : null,
    domain: finalDomain || domain,
    extractedMetadata: {
      description: description ? String(description).slice(0, 600) : null,
      linkCount: articleLinks.length,
      extractionVia: via,
      redirected: finalUrl !== url
    }
  };
}
async function extractFromUrl(url) {
  const { value } = await cache.remember(`article:${cache.hash(url)}`, 3600, async () => {
    const doc = await extractFromUrlUncached(url);
    return { ...doc, publicationDate: doc.publicationDate ? doc.publicationDate.toISOString() : null };
  });
  return { ...value, publicationDate: value.publicationDate ? new Date(value.publicationDate) : null };
}
module.exports = { extractFromUrl };
