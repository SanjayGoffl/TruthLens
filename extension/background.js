importScripts('handoff.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'ng-page', title: 'Check this page with TruthLens AI', contexts: ['page'] });
  chrome.contextMenus.create({ id: 'ng-link', title: 'Check this link with TruthLens AI', contexts: ['link'] });
  chrome.contextMenus.create({ id: 'ng-selection', title: 'Check selected text with TruthLens AI', contexts: ['selection'] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ng-selection') self.NG.openAnalyzer({ text: info.selectionText });
  else if (info.menuItemId === 'ng-link') self.NG.openAnalyzer({ url: info.linkUrl });
  else self.NG.openAnalyzer({ url: tab && tab.url });
});
