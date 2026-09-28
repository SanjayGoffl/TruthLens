# TruthLens AI — Project Facts (for humans and the next AI)

Single source of truth for how this repository is built, named and wired, what was done in past sessions, and what to watch out for. Written at the end of the session that rebranded the project, so anything marked *(unverified)* was written but not exercised.

---

## 1. What this is

- **Product:** TruthLens AI (formerly **NewsGuard AI**). A MERN app that scores the credibility of a news article, from a URL or pasted text, and explains the score.
- **Stack:** MongoDB + Mongoose 8, Express 4, React 18 + Vite 5 (plain JavaScript, not TypeScript), Node.js (developed on Node 24, CI uses 22).
- **Extras:** Socket.IO, optional Redis (with automatic in-memory fallback), optional Gemini + Serper + Google Fact Check APIs, PDFKit reports, Nodemailer, installable PWA, small Chrome-extension scaffold.
- **Context:** student project (Full Stack Development). "Review 0" deck: `News_Credibility_FSD_Sanjay.pptx`. "Review 1" template: `Combined Review.pptx`; a filled copy exists as `Combined Review - NewsGuard AI.pptx` (now **stale**, see section 12). Review 0 wrongly says "React + TypeScript"; the code is JavaScript.
- **Owner's local layout:** repo root `D:\FSD\NewsGuard-AI` (Windows 11, PowerShell/Git Bash). `D:\FSD` above it holds only `review.md` (empty) and the repo.

---

## 2. Naming: what was renamed and what deliberately was not

Rebrand NewsGuard AI -> **TruthLens AI** (indigo–violet palette) was done by a script over user-visible text and colours.

| Renamed (user-visible) | Kept as `newsguard` (internal, on purpose) |
|---|---|
| UI text, emails, PDF titles, README, extension, page title, download filenames (`truthlens-*.pdf`) | MongoDB database name `newsguard_ai` (default URI, docker-compose) |
| Component file `WhyTruthLens.jsx` | JWT `issuer: 'newsguard-ai'` (changing it logs everyone out) |
| Default `MAIL_FROM` | localStorage keys `newsguard_token`, `newsguard_theme`, `newsguard_booted` |
| | npm package names `newsguard-ai-backend` / `-frontend` |
| | Repo folder name `NewsGuard-AI`, CSS class `text-gradient-emerald` (now renders indigo) |

Do not "fix" these leftovers unless you also plan a data/session migration.

**Palette (brand):** primary `#4F46E5`, hover `#4338CA`, accent `#6366F1`, violet `#7C3AED`. Dark backgrounds are navy (`#080A18`–`#181D38`). **Verdict colours are semantic and intentionally unchanged** (green credible, amber uncertain, orange misleading, red suspicious) and live in `frontend/src/utils/credibility.js` (excluded from the recolour script). PWA `theme_color` is `#4F46E5`.

---

## 3. Repository map

```
NewsGuard-AI/
├─ README.md                 user-facing docs (kept in sync)
├─ FACTS.md                  this file
├─ docker-compose.yml        mongo + redis + backend + frontend(nginx) *(unverified)*
├─ start-mobile.ps1          build + start API + cloudflared tunnel *(script unverified)*
├─ .github/workflows/ci.yml  backend tests + frontend build *(unverified, never ran on GitHub)*
├─ extension/                MV3 Chrome extension scaffold (hand-off only)
├─ backend/
│  ├─ app.js                 middleware order, route mounting, serves frontend/dist if present
│  ├─ server.js              boot: cache init -> Mongo -> seed admin -> HTTP + Socket.IO
│  ├─ config/                env.js (all env vars + prod secret guard), db.js
│  ├─ controllers/           auth, user, analysis, source, admin
│  ├─ middleware/            auth (JWT+roles), rateLimit, sanitize, errorHandler, upload
│  ├─ models/                User Article Analysis Claim Source Report FlaggedArticle Notification Otp
│  ├─ routes/                auth user analysis sources admin
│  ├─ services/              see section 5
│  ├─ utils/                 AppError, asyncHandler, validate, token, otpCode, socket, safeFetch
│  └─ tests/                 core.test.js, api.test.js, factcheck.test.js (node:test)
└─ frontend/
   ├─ index.html, vite.config.js (dev proxy /api and /socket.io -> 127.0.0.1:5000)
   ├─ public/                manifest.webmanifest, sw.js, offline.html, theme-init.js, icons/
   └─ src/
      ├─ App.jsx, main.jsx, index.css, premium.css (design layer loaded after index.css)
      ├─ pages/  landing, auth, legal, user, admin, SharedReportPage.jsx
      ├─ components/ layout, ui, report, analysis, landing, admin, auth
      ├─ context/ AuthContext, ThemeContext   services/ api.js, socket.js   utils/ credibility.js etc.
```

Code style: compact, few comments, semicolons, single quotes, 2-space indent. Many files were originally CRLF; edited files were normalised to LF (git autocrlf prints warnings; harmless).

---

## 4. Request flow and the analysis pipeline

1. Browser -> Express (`/api/*`) with `Authorization: Bearer <JWT>` (Axios interceptor in `services/api.js`).
2. **Preferred path:** `POST /api/analysis/jobs` -> validates, replies `202 {jobId}`, runs the pipeline via `setImmediate` in the API process. Job state (`queued/running/done/failed`, `stage` 0-5, `analysisId`) is stored in the cache (`services/jobService.js` -> `cacheService`, TTL 1 h). Client polls `GET /api/analysis/jobs/:jobId` every 1.5 s. Only the owner can read a job.
3. **Legacy synchronous path** still exists: `POST /api/analysis/url` and `/content` (used by tests and old clients).
4. Pipeline (`services/analysisService.js` `runFullAnalysis`):
   - Extract article (`articleService.extractFromUrl`, Cheerio; page cache 1 h) or clean pasted text (`utils/validate.cleanArticleText`).
   - **Always** run the deterministic heuristic analyzer (`heuristicService`) = the *baseline*.
   - If `GEMINI_API_KEY` is set, ask Gemini for structured analysis (cached 24 h by content hash); on any failure fall back to the heuristic result. Mode is `ai` or `heuristic`.
   - AI sub-scores may only move the baseline by a bounded amount (`credibilityService.blendWithBaseline`, +/-15, +/-18 for clickbait/sensationalism).
   - Source profile from the registry (`sourceService`), claim mapping (`claimService`), optional external verification (`verificationService`: Gemini grounding, else Serper + Gemini), optional published fact-checks (`factCheckService`, informational only).
   - Score = weighted average by `credibilityService.calculateCredibility`, then **caps**, **confidence**, verdict.
   - Persist Article, Analysis, Claims, auto-flag suspicious results (`FlaggedArticle`), notify user/admins, email PDF (dev mode logs email instead of sending).
5. Live progress: `pipeEvent` maps events (`analysis-started`, `source-verified`, `claim-verified`, `score-generated`, `report-generated`) to stages 0-4 and emits `analysis:progress` over Socket.IO **and** updates the job.

---

## 5. Services (backend/services)

| File | Role |
|---|---|
| `analysisService` | orchestrates the pipeline (above) |
| `credibilityService` | weights, `blendWithBaseline`, caps, confidence, verdict thresholds |
| `heuristicService` | offline text signals (clickbait phrases, sensational words, citations, stats, caps ratio) and claim candidates |
| `geminiService` | Gemini calls; model from `GEMINI_MODEL` (default `gemini-3.8-flash`); exports `MODEL` |
| `verificationService` | cross-source claim checks |
| `factCheckService` | Google Fact Check Tools; shape + 24 h cache; needs `FACTCHECK_API_KEY` |
| `claimService` | maps AI/heuristic claims to assessments, consistency score |
| `sourceService` | registry lookup/auto-registration, reliability computation |
| `articleService` | fetch + parse, uses `utils/safeFetch` (SSRF guard), caches pages |
| `cacheService` | Redis (`ioredis`) with in-memory Map fallback; `remember/get/set/hash/status` |
| `jobService` | async job state in cache |
| `notificationService`, `mailService`, `otpService`, `reportService`, `googleService`, `adminInitService` | alerts + sockets, SMTP/dev-preview email, OTP, PDF, Google OAuth, admin seeding |

---

## 6. Scoring rules (exact numbers)

- **Weights:** Source Reliability 22%, Evidence Quality 22%, Claim Consistency 22%, Publication Transparency 13%, Sensationalism 13%, Writing Quality 8% (sum 1.0; asserted by a test).
- **Verdicts:** >=80 Highly Credible, >=65 Mostly Credible, >=45 Uncertain, >=25 Potentially Misleading, else Highly Suspicious.
- **Excluded factors:** a factor whose value is `null` is dropped and remaining weights renormalised. Stored on each factor as `excluded: true` with a reason (schema field `excluded` was once missing and caused `null/100` in the UI; fixed).
- **Pasted text (`inputKind: 'paste'`):** Source Reliability and Publication Transparency are **always excluded**. User-typed publisher/author/source link are stored and displayed but never scored, and pasted text never auto-registers a source (otherwise a fake `reuters.com` link would inherit trust). Claim Consistency is excluded when no claims are extracted.
- **Caps** (applied after averaging): critical contradicted claim -> 44; >=2 contradictions -> 50; 1 contradiction -> 64; registry "High Risk" publisher -> 48; >=60% of >=3 claims unsupported/unverified -> 55; Sensationalism factor <30 -> 44, <45 -> 58. Applied caps are stored in `capsApplied[]` and shown in the report.
- **Confidence:** High/Medium/Low from mode (`ai` vs `heuristic`), share of weight actually measured (<70 -> Medium, <50 -> Low) and whether external verification ran.
- The heuristic is generous on evidence (citation words like "according to"), which is why heuristic-only results usually carry Low confidence.

---

## 7. Data model (9 collections, 16 declared indexes)

`User` (role USER/ADMIN, lockout `loginAttempts`>=6 -> 15 min, `twoFactorEnabled` = email OTP on login, notification preferences), `Article`, `Analysis` (scores, `factors[]` embedded, `capsApplied`, `confidence`, `inputKind`, `shareToken` unique+sparse, `feedback`), `Claim`, `Source` (registry, text index), `Report` (PDF download log), `FlaggedArticle` (unique per analysis), `Notification`, `Otp` (TTL on `expiresAt`).
Relations by reference: Analysis->User/Article, Claim->Analysis/Article, Article->Source/User, Report->User/Analysis, FlaggedArticle->Analysis. Embedded: `Analysis.factors`, `suspiciousStatements`, `Claim.externalSources`.
**Gotcha:** never store `null` in a unique+sparse field (sparse skips only *missing* fields). `shareToken` is unset with `undefined`, not `null`.

---

## 8. API surface (50 endpoints incl. `/api/health`)

- **auth (11):** register, login, verify-otp, resend-otp, google (GET+POST), google/callback, forgot-password, verify-reset-otp, reset-password, logout.
- **user (8):** profile (GET/PUT), service-status, password, preferences, notifications (+read-all, :id/read).
- **analysis (16 routes):** `POST /jobs`, `GET /jobs/:jobId`, `POST /url`, `POST /content`, `GET /history`, `GET /summary`, `GET /:id`, `GET /:id/report` (PDF), `POST /:id/reanalyze`, `POST|DELETE /:id/save`, `POST /:id/share`, `DELETE /:id/share`, `POST /:id/feedback`, `DELETE /:id`.
- **public (no auth):** `GET /api/public/report/:token` (hides user, feedback, token, external verification).
- **sources (3):** list, `/:id`, `/:id/trend` (per-day average score for a publisher).
- **admin (18):** users, sources CRUD, articles, flagged, analytics, system, notifications.
- Rate limits: global 120/min, auth 60/15 min, **analysis 8/min per user** (keyed by user id). Route order matters: `/jobs` and `/:id/...` are declared before `/:id`.

---

## 9. Security measures (all implemented)

SSRF guard (`utils/safeFetch`: DNS + literal-IP checks, blocks private/loopback/link-local/metadata, manual redirects re-validated per hop, max 5); Mongo-operator scrubbing (`middleware/sanitize`, strips `$` and dotted keys from body and query); JSON body cap 256 KB; Helmet with CSP (img-src allows https/data/blob); CORS allow-list (`FRONTEND_URL`, plus localhost dev origins outside production); JWT boot check (production needs a non-default secret >=32 chars); bcrypt passwords, SHA-256 hashed OTPs with attempt limits; role guard for `/api/admin`; per-user resource ownership checks (another user's analysis/job returns 404); share links are unguessable 18-byte tokens and revocable.

---

## 10. Frontend facts

- 25 routes (public 3, auth 6, user 8 incl. `result/:id` and `compare`, admin 8) plus `/report/:token` (public shared report, lazy) and 404. 64+ `.jsx` files. Admin pages, Result, Compare and Shared report are lazy-loaded.
- `AnalyzePage`: Link/Paste tabs; paste needs >=40 words, <=20,000 chars; optional headline/publisher/author/source link. Starts a **job** and polls it; also listens for `analysis:progress` sockets. Prefill via `?url=` or `?text=` (Android share target sends `title/text/url`; a URL inside `text` is treated as a link). Auto-run only when navigated from the in-app dashboard quick form (`location.state.auto`), never from external links (prevents link-triggered analyses).
- `AnalysisReportView`: score ring, confidence chip, caps notes, factor bars ("Not assessed" for excluded), source analysis, claims, suspicious statements, publisher trend chart (>=2 analyses), share (native `navigator.share`, else copy link), thumbs feedback, PDF, save. `readOnly` mode for the public page.
- `ComparePage` (`/user/compare?a=&b=`), `InstallApp` (install banner/button), mobile **bottom nav** below 992 px (`.bottom-nav`), `table-stack` CSS turns tables into cards on phones.
- Gotchas: Bootstrap's `textarea.form-control` outranks `.paste-area`, so the rule is `textarea.paste-area`; `place-items-center` is a custom class (not Bootstrap). Framer Motion fade-ins make screenshots look washed out if taken too early.

---

## 11. Mobile: PWA and extension

- **PWA:** `manifest.webmanifest` (standalone, start `/user/dashboard`, 3 icons incl. maskable, shortcuts Analyze/History, `share_target` GET `/user/analyze`), `sw.js` (app-shell cache `truthlens-v1`, network-first navigation with `offline.html`, never caches `/api` or `/socket.io`), registered only in production builds. Verified in desktop Chrome: manifest, active service worker, icons. **Not installed on a real phone.**
- **Install on a phone:** needs HTTPS. `backend/app.js` serves `frontend/dist` when it exists, so one server = one URL. Run `start-mobile.ps1` or `cloudflared tunnel --url http://localhost:5000` (cloudflared is at `C:\Program Files (x86)\cloudflared\`; a quick tunnel worked). Tunnel URLs change every run.
- **Extension (`extension/`):** MV3, context menu + popup; opens `<app>/user/analyze?url=` or `?text=` (max 8,000 chars). It never sees tokens. No icons, not on the Web Store, not loaded in Chrome (only syntax-checked).

---

## 12. Tests, CI and how to verify

- `cd backend && npm test` -> 20 tests (node:test): scoring/caps/blend, paste cleaning, sanitizer, SSRF guard, cache fallback, fact-check shaping, and API integration (auth required, injection rejected, SSRF refused, paste flow, share/feedback, ownership, jobs) using `mongodb-memory-server` (downloads a mongod binary on first run).
- `cd frontend && npm run build` must pass. No frontend unit tests, no Playwright.
- Not verified anywhere: live Gemini/Serper/Fact Check, a real Redis server, SMTP sending, Google OAuth, Docker, GitHub Actions, extension in Chrome, real-phone PWA install.

---

## 13. Environment variables (names only; see `backend/.env.example`)

`NODE_ENV PORT MONGO_URI JWT_SECRET JWT_EXPIRES_IN GEMINI_API_KEY GEMINI_MODEL FACTCHECK_API_KEY REDIS_URL SERPER_API_KEY GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_CALLBACK_URL GOOGLE_ADMIN_EMAIL MAIL_HOST MAIL_PORT MAIL_USERNAME MAIL_PASSWORD MAIL_FROM FRONTEND_URL BACKEND_URL OTP_TTL_MINUTES OTP_MAX_ATTEMPTS ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD`.
`backend/.env` exists locally, is git-ignored and holds real values. **Do not read or print it.** A Gemini key is present but was rejected as invalid, so the app runs on the heuristic fallback; that fallback path is confirmed working. With no `MAIL_*`, emails are logged to the console ("MAIL DEV PREVIEW") including OTPs.

---

## 14. Session history (chronological summary)

1. **Review + pass 1:** inspected the existing repo (already solid MERN with a weighted scorer). Added SSRF guard, sanitizer, CSP, per-user analysis rate limit, JWT boot guard, Redis/in-memory cache, bounded-AI scoring with caps/confidence, paste-text fixes and a real paste UI, premium CSS layer, mobile bottom nav, new Analyze page with real progress, extension scaffold, lazy routes, README rewrite.
2. **Final pass + 1st Review deck:** verified with an in-memory Mongo; found and fixed an infinite-recursion bug (duplicate function from running a patch twice), the missing `excluded` schema field, and a tiny paste textarea. Added 9 unit tests. Captured real screenshots, generated use-case/ER diagrams with Times New Roman, and filled every slide of `Combined Review.pptx` (17 slides, TNR 28/20/18, no slides added/removed). Status bars computed from checklists (94% overall).
3. **Quick feature pass:** share links, feedback, integration tests, CI, Docker. Tests exposed the unique-sparse-`null` bug (fixed).
4. **Rebrand + improvements:** renamed to TruthLens AI, indigo palette, async jobs, publisher trend, compare page, fact-check lookup.
5. **Mobile:** PWA (manifest, service worker, offline page, install UI, share target, native share), backend serves the built app, cloudflared tunnel script.
6. This file.

---

## 15. Pitfalls and process notes for the next AI

- **Port 5000 is the user's own `node server.js`** (their real DB, old code). Never kill it. For test servers use another port (I used 5001 with a temporary Vite config pointing its proxy there) and a throwaway `mongodb-memory-server`. Ask the user to restart their backend to pick up new code.
- **Secret guard hook:** commands containing `.env` patterns are blocked. Avoid `--exclude=.env`, greps over `.env`, etc.; use scripts that skip files starting with `.env`.
- **Shell quoting:** multi-line `node -e` / heredocs with backslashes repeatedly corrupted regexes (`\s`, `\/` were lost, producing silent bugs such as `/^https?://S+$/`). Prefer the Write/Edit tools for code containing regexes, then re-read the result.
- **Patch scripts are not idempotent:** running one twice duplicated a function. Check `git diff` after scripted edits.
- **CRLF/LF mix** breaks multi-line string replacement; normalise (`sed -i 's/\r$//'`) before scripted edits.
- Vite dev may pick 5174 if 5173 is taken (the user's own dev server may hold 5173).
- Chrome MCP: window resize does not change the viewport; for mobile previews use same-origin `<iframe width=390>` frames.
- PowerPoint is installed, so slide renders can be exported exactly via COM (`Presentation.Export`); LibreOffice/pdftoppm are not available. Deck build scripts (`fill.py`, `diagrams*.py`, screenshots) live in the session scratchpad, **not in the repo**.

---

## 16. Known gaps and suggested next steps

1. **Refresh the review deck:** it still says NewsGuard AI, shows green screenshots, lacks jobs/compare/PWA/share features and cites 9 tests (now 20). Regenerate screenshots first.
2. Real BullMQ worker (current jobs run in the API process; state survives refresh, not a restart).
3. Verify live: Gemini/Serper/Fact Check with valid keys, Redis, SMTP, Google sign-in, Docker, CI, phone install.
4. Extension: icons, inline badge, Web Store build.
5. Ideas not built: export report as image card, bulk/RSS analysis, multilingual input, admin use of feedback to tune source scores, Playwright E2E, structured logging (pino), OpenAPI docs.
6. Accessibility and cross-browser audit; only core screens were viewed by eye (login, dashboard, analyze, report, compare, admin dashboard, landing hero, mobile frames).
