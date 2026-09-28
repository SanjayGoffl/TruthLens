const $ = (id) => document.getElementById(id);

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab && tab.url;
  const usable = url && /^https?:\/\//i.test(url);
  $('page').textContent = usable ? url : 'Open a news article to analyze it.';
  $('page-btn').disabled = !usable;
  $('app').value = await self.NG.appUrl();

  $('page-btn').addEventListener('click', () => self.NG.openAnalyzer({ url }).then(() => window.close()));
  $('sel-btn').addEventListener('click', async () => {
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => String(window.getSelection() || '') });
    if (!result || result.trim().length < 20) {
      $('page').textContent = 'Select some article text on the page first.';
      return;
    }
    await self.NG.openAnalyzer({ text: result });
    window.close();
  });
  $('app').addEventListener('change', () => chrome.storage.sync.set({ appUrl: $('app').value.trim() }));
}
init();
