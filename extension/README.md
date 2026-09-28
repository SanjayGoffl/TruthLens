# TruthLens AI browser extension (scaffold)

A minimal Manifest V3 hand-off: it sends the current page URL, a link, or selected text to the
TruthLens AI web app, which pre-fills the analyzer (`/user/analyze?url=…` or `?text=…`).
The extension never sees your login token and does not call the API itself — you review the
pre-filled form and press **Analyze** in the app.

## Try it
1. Chrome → `chrome://extensions` → enable *Developer mode* → *Load unpacked* → select this folder.
2. Open a news article, click the extension icon, choose **Analyze this page**.
3. Set the web app address in the popup if you are not running on `http://localhost:5173`.

Not included yet: icons, a Chrome Web Store build, inline page badges.
