// Builds the TruthLens AI hand-off link. The web app pre-fills the form; the user reviews and clicks Analyze.
const DEFAULT_APP = 'http://localhost:5173';
const MAX_TEXT = 8000;

async function appUrl() {
  const { appUrl: saved } = await chrome.storage.sync.get('appUrl');
  return (saved || DEFAULT_APP).replace(/\/+$/, '');
}

async function openAnalyzer({ url, text }) {
  const base = await appUrl();
  const params = new URLSearchParams();
  if (text) params.set('text', text.slice(0, MAX_TEXT));
  else if (url && /^https?:\/\//i.test(url)) params.set('url', url);
  await chrome.tabs.create({ url: `${base}/user/analyze?${params.toString()}` });
}

self.NG = { openAnalyzer, appUrl, DEFAULT_APP };
