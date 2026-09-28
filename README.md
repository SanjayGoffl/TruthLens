# TruthLens AI

**Analyze. Verify. Understand the Truth.**

TruthLens AI is a full-stack MERN application that analyzes a news article (by URL or pasted content) through a structured pipeline and returns a transparent credibility score with plain-language explanations. It never declares absolute truth — every report ends with a label such as "Highly Credible" or "Potentially Misleading", always accompanied by the numeric score, the factor breakdown behind it, and a disclaimer.

## Stack

- Frontend: React 18 + Vite, React Router, Bootstrap 5 + custom design tokens, Chart.js, Framer Motion landing animations, jsPDF (legal PDFs)
- Backend: Node.js + Express, MongoDB (Mongoose), JSON Web Tokens, bcrypt, Nodemailer, Socket.IO (live notifications)
- Analysis engine: Google Gemini 3.8 Flash (when `GEMINI_API_KEY` is set) with an honest offline heuristic fallback; optional cross-source verification via Gemini web-grounding or Serper (`SERPER_API_KEY`)

## Credibility model

The application owns the final score. The AI model extracts claims, evidence and language findings, but each AI sub-score may only move a *measured baseline* (from the deterministic text analyzer) by a bounded amount; the backend then applies the weights below.

| Factor | Weight |
| --- | --- |
| Source Reliability | 22% |
| Evidence Quality | 22% |
| Claim Consistency | 22% |
| Publication Transparency | 13% |
| Sensationalism | 13% |
| Writing Quality | 8% |

- **Excluded, not punished:** factors that cannot be measured (e.g. source reliability for pasted text with no origin) are excluded and the remaining weights are re-normalised. The report shows them as "Not scored".
- **Score caps:** a contradicted critical claim caps the score at 44, several contradictions at 50, a registry "High Risk" publisher at 48, mostly-unsupported claims at 55. Applied caps are listed in the report.
- **Confidence:** every report carries High / Medium / Low confidence based on the AI mode, how much of the weight was measured, and whether external verification ran.

| Label | Range |
| --- | --- |
| Highly Credible | 80–100 |
| Mostly Credible | 65–79 |
| Uncertain | 45–64 |
| Potentially Misleading | 25–44 |
| Highly Suspicious | 0–24 |

## Project structure

```
TruthLens-AI/
├── frontend/                 React app (Vite)
│   └── src/
│       ├── pages/            landing, auth, legal, user/*, admin/*
│       ├── components/       layout, ui, report, analysis, admin
│       ├── context/          AuthContext, ThemeContext
│       ├── services/         api client, socket client
│       └── utils/            credibility meta, helpers
└── backend/                  Express API
    ├── config/               env, db
    ├── controllers/          auth, user, analysis, source, admin
    ├── models/               User, Article, Analysis, Claim, Source,
    │                         Report, Notification, FlaggedArticle, Otp
    ├── services/             gemini, heuristic, article, source,
    │                         verification, claim, credibility, mail,
    │                         otp, report, notification
    ├── middleware/           auth (JWT + role), error handler, rate limits
```

## Run locally

Requirements: Node 18+, MongoDB running locally (or a remote URI).

1. Backend

```bash
cd backend
cp .env.example .env      # then fill real values (see below)
npm install
npm start                 # API on http://localhost:5000
```

2. Frontend (second terminal)

```bash
cd frontend
npm install
npm run dev               # app on http://localhost:5173
```

Open http://localhost:5173.

Tests: `cd backend && npm test` runs the unit tests (scoring engine, caps, paste cleaning, SSRF guard, sanitizer, cache fallback).

### Environment variables

`backend/.env.example` lists every variable. Key ones:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — long random string for signing sessions
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — **required, explicit, secure admin initialization.** On first boot the administrator account is seeded *only* from these values; the app has no default admin credentials and refuses to boot with known defaults or the example placeholders. On later boots the existing admin is kept.
- `GOOGLE_ADMIN_EMAIL` — optional; comma-separated emails that receive the ADMIN role when they sign in with Google. Set it to your `ADMIN_EMAIL` so the admin account can also sign in through Google.
- `GEMINI_API_KEY` — optional; without it the analyzer runs in transparent offline heuristic mode. When set, the analysis engine uses **Gemini 3.8 Flash** (`gemini-3.8-flash`), the only configured model, with 3.8-native generation config (thinking levels; no deprecated sampling parameters)
- `SERPER_API_KEY` — optional; cross-source search when Gemini grounding is unavailable
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — optional; enables "Sign in with Google"
- `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD` — SMTP for OTP/security email. When absent, the app runs in dev mode and logs the email (including the OTP) to the server console instead of sending.

On a fresh database only the administrator account is seeded (explicitly from `ADMIN_EMAIL` / `ADMIN_PASSWORD`); every other account is created by real sign-ups. There are no demo accounts.

## Background analysis jobs

`POST /api/analysis/jobs` validates the input, answers `202` with a job id and runs the pipeline in the background; `GET /api/analysis/jobs/:id` returns stage, status and the finished report id (owner only). Job state is kept in the cache layer (Redis when configured, memory otherwise), so a page refresh no longer loses progress. The worker runs in the API process; a separate BullMQ worker is not implemented.

## Publisher trend, comparison and fact-checks

- Reports show a publisher trend chart (`GET /api/sources/:id/trend`) once a publisher has two or more analyses.
- `/user/compare` shows two reports side by side, factor by factor.
- With `FACTCHECK_API_KEY` set, the top claims show published fact-checks from the Google Fact Check Tools API. These are informational and never change the score. This path is covered by unit tests with a stubbed client, not a live key.

## Mobile app (installable PWA)

TruthLens installs on a phone from Chrome and runs full-screen, with its own icon, an offline page, app shortcuts (Analyze, History) and **Share to TruthLens**: on Android, share any article link from another app and the analyzer opens pre-filled. The report page uses the phone's native share sheet.

1. Build the web app: `cd frontend && npm run build` (the API then serves it from `frontend/dist`).
2. Start the API: `cd backend && npm start`.
3. Phones need HTTPS to install a PWA. Run `cloudflared tunnel --url http://localhost:5000` and open the printed `https://...trycloudflare.com` link in Chrome on the phone. Or run `./start-mobile.ps1`, which does all three steps.
4. Chrome menu, **Install app** (or use the in-app "Install TruthLens" banner). On iPhone use Safari, Share, **Add to Home Screen**.

For a permanent install, deploy behind any HTTPS host. The tunnel address changes each run.

## Docker and CI

`docker compose up --build` starts MongoDB, Redis, the API and the web app (http://localhost:8080); copy `backend/.env.example` to `backend/.env` first. GitHub Actions (`.github/workflows/ci.yml`) runs the backend tests and the frontend build on every push. The compose files have not been run on this machine.

## Sharing and feedback

A report owner can create a read-only public link (`/report/<token>`, revocable) that hides the user and feedback. Users can rate whether a result was helpful.

## Pasted text

Paste mode preserves paragraph structure, strips HTML/control characters, enforces a 40-word minimum and a 20,000-character maximum, and accepts optional headline / publisher / author / source link fields. Typed-in details are shown in the report but never scored, because they cannot be verified; source reliability and publication transparency are excluded for pasted text.

## Caching (Redis, optional)

Set `REDIS_URL` to cache fetched pages (1 h) and AI analyses (24 h, keyed by content hash). If Redis is missing or drops, an in-memory cache takes over automatically; `GET /api/health` reports the active backend.

## Browser extension (scaffold)

`extension/` is a Manifest V3 hand-off: right-click a page, link or selection and the web app opens with the analyzer pre-filled. See `extension/README.md`.

## Security notes

- URL analysis is SSRF-guarded: private, loopback and link-local addresses are refused, DNS results are validated, and every redirect hop is re-checked.
- Request bodies are scrubbed of MongoDB operator keys, JSON bodies are capped at 256 KB, and analysis has a per-user rate limit (8/min) on top of the global limits.
- `JWT_SECRET` is validated at boot in production (32+ characters, non-default). Helmet CSP is on; CORS is restricted to `FRONTEND_URL` in production.

- Every manual sign-in requires a single-use, time-limited email OTP (with resend cooldown and attempt limits). OTPs are stored hashed.
- Password reset uses the same OTP flow; tokens are purpose-bound.
- JWT + role middleware protects every API route; role area boundaries are also enforced client-side — an authenticated user who manually jumps into the other dashboard's area (e.g., a regular user opening `/admin/...`) is signed out and returned to `/`.
- `.env` is git-ignored; no secrets appear in the frontend.

## PDF documents

- Every credibility report can be downloaded as a generated PDF (pdfkit) that reproduces the full analysis: score, verdict, factor bars, claims, flagged statements and disclaimer.
- Terms & Conditions and Privacy Policy pages include "Download PDF" buttons that render the same legal text into a PDF (jsPDF).
