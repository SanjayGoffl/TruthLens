# Graph Report - NewsGuard-AI  (2026-10-15)

## Corpus Check
- 162 files · ~98,557 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 5, .pptx 3, .css 2)

## Summary
- 878 nodes · 2244 edges · 53 communities (47 shown, 6 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 93 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin Analysis UI
- App Routes & Pages
- Cache & Job Services
- Analysis Controller
- User Controller & Notifications
- Landing Page UI
- Auth & OTP
- Admin Controller
- Analysis Service Pipeline
- Backend Dependencies
- Notification Service
- Source Service
- Express App & Error Handling
- Backend Runtime Deps
- Server Bootstrap & Database
- Mongoose Models
- Article Extraction
- Sanitization & Core Tests
- Claim Verification
- Frontend Dependencies
- Source Controller
- User Model & Admin Init
- Gemini AI Service
- Heuristic Analysis
- PDF Report Service
- Backend API Tests
- Routes & Rate Limiting
- Socket Utilities & Tokens
- Extension Manifest
- Frontend Build Config
- Auth & Socket Providers
- File Upload (Multer)
- Google OAuth Service
- SSRF-Safe Fetch
- Config & Graphify Plugin
- Claim Verification Service
- Theme Context & Bootstrap
- Admin Listing Helpers
- Auth Middleware
- Credibility Scoring
- Fact Check Service
- Browser Notifications
- Analysis Model
- Flagged Article Model
- Notification Model
- Frontend Scripts
- Extension Handoff
- Vite Plugin Config
- Service Worker Shell

## God Nodes (most connected - your core abstractions)
1. `errorMessage()` - 53 edges
2. `lucide-react` - 50 edges
3. `react` - 45 edges
4. `useAuth()` - 40 edges
5. `ButtonSpinner()` - 30 edges
6. `classNames()` - 29 edges
7. `react-router-dom` - 28 edges
8. `EmptyState()` - 28 edges
9. `SkeletonRows()` - 27 edges
10. `api` - 27 edges

## Surprising Connections (you probably didn't know these)
- `listUsers()` --calls--> `pagination()`  [EXTRACTED]
  backend/controllers/adminController.js → backend/utils/validate.js
- `listAdminArticles()` --calls--> `pagination()`  [EXTRACTED]
  backend/controllers/adminController.js → backend/utils/validate.js
- `listFlagged()` --calls--> `pagination()`  [EXTRACTED]
  backend/controllers/adminController.js → backend/utils/validate.js
- `listAdminNotifications()` --calls--> `pagination()`  [EXTRACTED]
  backend/controllers/adminController.js → backend/utils/validate.js
- `getHistory()` --calls--> `pagination()`  [EXTRACTED]
  backend/controllers/analysisController.js → backend/utils/validate.js

## Import Cycles
- None detected.

## Communities (53 total, 6 thin omitted)

### Community 0 - "Admin Analysis UI"
Cohesion: 0.09
Nodes (84): AdminViewAnalysisModal(), AnalysisListTable(), SORTS, AnalysisReportView(), Section(), BrandChart(), ChartBar(), ChartDoughnut() (+76 more)

### Community 1 - "App Routes & Pages"
Cohesion: 0.06
Nodes (62): AdminAnalytics, AdminArea(), AdminArticles, AdminDashboard, AdminFlagged, AdminNotifications, AdminSettings, AdminSources (+54 more)

### Community 2 - "Cache & Job Services"
Cohesion: 0.06
Nodes (43): crypto, del(), env, get(), initRedis(), memGet(), memory, memSet() (+35 more)

### Community 3 - "Analysis Controller"
Cohesion: 0.10
Nodes (39): activeJobs, Analysis, analysisService, analyzeFromContent(), analyzeFromUrl(), AppError, Article, asyncHandler (+31 more)

### Community 4 - "User Controller & Notifications"
Cohesion: 0.07
Nodes (27): Analysis, AppError, asyncHandler, axios, bcrypt, changePassword(), checkExternalServices(), env (+19 more)

### Community 5 - "Landing Page UI"
Cohesion: 0.12
Nodes (23): CredibilityFactors(), FACTORS, ExtensionCta(), FinalCta(), ArticleCard(), Hero(), ResultPanel(), StageRail() (+15 more)

### Community 6 - "Auth & OTP"
Cohesion: 0.13
Nodes (27): AppError, asyncHandler, bcrypt, env, forgotPassword(), googleCallback(), googleExchange(), googleService (+19 more)

### Community 7 - "Admin Controller"
Cohesion: 0.10
Nodes (24): Analysis, AppError, Article, asyncHandler, Claim, createSource(), deleteAdminAnalysis(), deleteSource() (+16 more)

### Community 8 - "Analysis Service Pipeline"
Cohesion: 0.11
Nodes (22): Analysis, Article, articleService, assembleExplanation(), buildArticleMeta(), cache, claimService, createFlaggedIfNeeded() (+14 more)

### Community 9 - "Backend Dependencies"
Cohesion: 0.10
Nodes (19): description, devDependencies, mongodb-memory-server, axios, main, name, scripts, dev (+11 more)

### Community 10 - "Notification Service"
Cohesion: 0.15
Nodes (13): ALWAYS_ON_ADMIN, ALWAYS_ON_USER, categoryFor(), createForUser(), DEFAULT_PREFS, EVENT_CATEGORY, Notification, payloadOf() (+5 more)

### Community 11 - "Source Service"
Cohesion: 0.18
Nodes (13): AppError, runFromContent(), CLASSIFICATION_LEVELS, classificationForScore(), computeReliability(), findInDb(), { normalizeDomain }, normalizeName() (+5 more)

### Community 12 - "Express App & Error Handling"
Cohesion: 0.15
Nodes (14): { apiLimiter, authLimiter }, app, { authenticateToken }, cors, distDir, env, express, helmet (+6 more)

### Community 13 - "Backend Runtime Deps"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcryptjs, cheerio, cors, dotenv, express, express-rate-limit (+8 more)

### Community 14 - "Server Bootstrap & Database"
Cohesion: 0.17
Nodes (12): connectDB(), env, mongoose, app, { connectDB }, { ensureAdmin }, env, http (+4 more)

### Community 15 - "Mongoose Models"
Cohesion: 0.13
Nodes (11): articleSchema, mongoose, mongoose, OTP_PURPOSES, otpSchema, mongoose, reportSchema, mongoose (+3 more)

### Community 16 - "Article Extraction"
Cohesion: 0.24
Nodes (13): AppError, cache, cheerio, cleanHtmlText(), detectPaywallOrChallenge(), extractFromUrl(), extractFromUrlUncached(), extractMainText() (+5 more)

### Community 17 - "Sanitization & Core Tests"
Cohesion: 0.18
Nodes (11): sanitizeInput(), scrub(), assert, { assertPublicHost }, balanced, cache, { cleanArticleText }, credibility (+3 more)

### Community 18 - "Claim Verification"
Cohesion: 0.19
Nodes (9): ASSESSMENTS, claimSchema, mongoose, Claim, confidenceFor(), contradictsInternal(), mapAll(), mapAssessment() (+1 more)

### Community 19 - "Frontend Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, axios, bootstrap, chart.js, framer-motion, jspdf, lucide-react, react (+5 more)

### Community 20 - "Source Controller"
Cohesion: 0.23
Nodes (11): Analysis, AppError, Article, asyncHandler, domainCountMap(), getSource(), getTrend(), listSources() (+3 more)

### Community 21 - "User Model & Admin Init"
Cohesion: 0.18
Nodes (10): bcrypt, mongoose, USER_ROLES, userSchema, bcrypt, BLOCKED_PASSWORDS, env, { isEmail } (+2 more)

### Community 22 - "Gemini AI Service"
Cohesion: 0.38
Nodes (11): analyzeArticle(), axios, buildGenerationConfig(), classifySnippets(), env, firstJsonBlock(), generateOnce(), generateStructured() (+3 more)

### Community 23 - "Heuristic Analysis"
Cohesion: 0.23
Nodes (9): analyzeHeuristically(), AUTHORITY_HINTS, CITATION_HINTS, CLICKBAIT_PHRASES, countMatches(), EXTREME_PATTERNS, pickSentence(), SENSATIONAL_WORDS (+1 more)

### Community 24 - "PDF Report Service"
Cohesion: 0.35
Nodes (11): buildAnalysisPdf(), colorForScore(), drawBar(), env, footer(), header(), metaRow(), PDFDocument (+3 more)

### Community 25 - "Backend API Tests"
Cohesion: 0.20
Nodes (8): assert, call(), post(), test, assert, factCheck, test, mongodb-memory-server

### Community 26 - "Routes & Rate Limiting"
Cohesion: 0.20
Nodes (9): analysisLimiter, apiLimiter, authLimiter, rateLimit, analysisController, { analysisLimiter }, asyncHandler, router (+1 more)

### Community 27 - "Socket Utilities & Tokens"
Cohesion: 0.18
Nodes (6): env, jwt, User, env, jwt, jsonwebtoken

### Community 28 - "Extension Manifest"
Cohesion: 0.18
Nodes (10): action, default_popup, default_title, background, service_worker, description, manifest_version, name (+2 more)

### Community 29 - "Frontend Build Config"
Cohesion: 0.20
Nodes (9): description, axios, name, private, type, version, jspdf, vite (+1 more)

### Community 30 - "Auth & Socket Providers"
Cohesion: 0.29
Nodes (10): AuthProvider(), bootstrap(), clearToken(), getToken(), setUnauthorizedHandler(), attachAll(), connectSocket(), disconnectSocket() (+2 more)

### Community 31 - "File Upload (Multer)"
Cohesion: 0.20
Nodes (7): ALLOWED_MIME, AppError, multer, storage, upload, AppError, multer

### Community 32 - "Google OAuth Service"
Cohesion: 0.22
Nodes (5): axios, createState(), env, getAuthUrl(), stateStore

### Community 33 - "SSRF-Safe Fetch"
Cohesion: 0.31
Nodes (7): AppError, assertPublicHost(), axios, isPrivateAddress(), isPrivateIPv4(), net, safeGet()

### Community 34 - "Config & Graphify Plugin"
Cohesion: 0.22
Nodes (3): env, path, WEAK_SECRETS

### Community 35 - "Claim Verification Service"
Cohesion: 0.31
Nodes (8): axios, buildQuery(), env, gemini, searchSerper(), sourceService, stanceScore(), verifyClaimsForArticle()

### Community 36 - "Theme Context & Bootstrap"
Cohesion: 0.28
Nodes (5): initialTheme(), ThemeContext, ThemeProvider(), bootstrap, react-dom

### Community 37 - "Admin Listing Helpers"
Cohesion: 0.25
Nodes (8): analysisDomainMap(), listAdminArticles(), listAdminNotifications(), listAdminSources(), listFlagged(), listUsers(), getHistory(), pagination()

### Community 38 - "Auth Middleware"
Cohesion: 0.32
Nodes (7): AppError, authenticateToken(), env, jwt, requireAdmin, requireRole(), User

### Community 39 - "Credibility Scoring"
Cohesion: 0.39
Nodes (7): computePublicationTransparency(), blendWithBaseline(), calculateCredibility(), clamp(), FACTOR_WEIGHTS, reasonForFactor(), verdictFor()

### Community 40 - "Fact Check Service"
Cohesion: 0.32
Nodes (6): axios, cache, env, isConfigured(), search(), shape()

### Community 41 - "Browser Notifications"
Cohesion: 0.57
Nodes (6): NotificationEnable(), enableBrowserNotifications(), notificationsSupported(), permissionState(), recent, showBrowserNotification()

### Community 42 - "Analysis Model"
Cohesion: 0.33
Nodes (5): analysisSchema, factorSchema, mongoose, STATUS, VERDICTS

### Community 43 - "Flagged Article Model"
Cohesion: 0.40
Nodes (4): FLAG_REASONS, FLAG_STATUS, flaggedSchema, mongoose

### Community 44 - "Notification Model"
Cohesion: 0.40
Nodes (4): AUDIENCES, mongoose, NOTIFICATION_TYPES, notificationSchema

### Community 45 - "Frontend Scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

### Community 47 - "Vite Plugin Config"
Cohesion: 0.67
Nodes (3): devDependencies, vite, @vitejs/plugin-react

## Knowledge Gaps
- **317 isolated node(s):** `express`, `helmet`, `cors`, `env`, `{ authenticateToken }` (+312 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 364 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `Admin Analysis UI` to `App Routes & Pages`, `Landing Page UI`, `Frontend Build Config`, `Browser Notifications`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `react` connect `Admin Analysis UI` to `App Routes & Pages`, `Theme Context & Bootstrap`, `Landing Page UI`, `Browser Notifications`, `Frontend Build Config`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `bcryptjs` connect `User Model & Admin Init` to `Backend Dependencies`, `User Controller & Notifications`, `Auth & OTP`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `express`, `helmet`, `cors` to the rest of the system?**
  _317 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Analysis UI` be split into smaller, more focused modules?**
  _Cohesion score 0.0927091528979806 - nodes in this community are weakly interconnected._
- **Should `App Routes & Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.06110154905335628 - nodes in this community are weakly interconnected._
- **Should `Cache & Job Services` be split into smaller, more focused modules?**
  _Cohesion score 0.06196078431372549 - nodes in this community are weakly interconnected._