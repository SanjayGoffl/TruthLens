# TruthLens AI — Accuracy & Verification Test Plan

This document outlines the systematic test plan for validating TruthLens AI's credibility scoring engine, heuristic checks, Gemini AI verification, and fake news detection across both real credible journalism and known fabricated or sensationalized claims.

---

## 1. Test Objectives
1. **Credibility Accuracy (Real News):** Verify that factual articles from trusted registries (Reuters, AP News, BBC, etc.) achieve **80–100 (Highly Credible)** or **65–79 (Mostly Credible)** scores with strong source reliability and corroboration.
2. **Detection Capability (Fake / Misleading News):** Verify that fabricated articles, sensationalized clickbait, or unsubstantiated claims score below **45 (Uncertain / Potentially Misleading / Highly Suspicious)** and trigger appropriate warning flags.
3. **Source Registry & Heuristics:** Ensure the admin-managed source database correctly biases scoring based on known publisher reliability.

---

## 2. Test Cases

### Test Case A: Credible Real News (Target Score: 80–100)
* **Sample Input Title:** "Central bank signals rate pause as inflation cools toward 2% target"
* **Sample Publisher / URL:** `reuters.com` or `apnews.com`
* **Expected Result:**
  - **Credibility Score:** 80–92 (Highly Credible / Mostly Credible)
  - **Source Reliability:** High (90+) due to registry match in admin sources.
  - **Evidence Quality:** High (claims are attributed to official statements and corroborated by independent reporting).
  - **Flags:** None.

### Test Case B: Sensationalized / Suspicious Claim (Target Score: 0–44)
* **Sample Input Title:** "SHOCKING SECRET: Miracle cure discovered that doctors are hiding from you!"
* **Sample Text:** "Anonymous whistleblowers reveal a secret underground remedy that cures all diseases instantly without pills or doctors. Big Pharma is trying to delete this article immediately!"
* **Expected Result:**
  - **Credibility Score:** 15–38 (Potentially Misleading / Highly Suspicious)
  - **Source Reliability:** Unknown / Low.
  - **Heuristic Flags:** Sensationalist language detected, lack of named sources, conspiracy framing, absence of verifiable data.
  - **AI Verification:** Contradicted or unsupported.

---

## 3. Step-by-Step Execution Guide

1. **Log into Dashboard:**
   - Go to [https://newsguard-web-sanjays-projects-3e4e4ed2.vercel.app](https://newsguard-web-sanjays-projects-3e4e4ed2.vercel.app) and sign in.
2. **Navigate to Analyze:**
   - Click **New Analysis** or go to the Analyze page.
3. **Run Real News Test:**
   - Paste a credible article (e.g., from Reuters or AP News).
   - Click **Run Credibility Analysis**.
   - Verify that the report yields a score $\ge 75$ with green indicators ("Highly Credible" or "Mostly Credible").
4. **Run Fake / Suspicious News Test:**
   - Paste the sensationalized sample text (Test Case B).
   - Click **Run Credibility Analysis**.
   - Verify that the report yields a score $< 45$ with red/orange warning badges and highlighted suspicious statements.
5. **Check Admin Source Management:**
   - Navigate to `/admin/sources` to review and tune publisher reliability ratings (Reuters: 90, AP News: 88, BBC: 86, etc.).
