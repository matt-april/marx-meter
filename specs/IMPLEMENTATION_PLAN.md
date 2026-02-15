# Marx Meter — Technical Implementation Plan

**Version:** 1.0
**Date:** February 13, 2026
**Approach:** Vertical slices. Each milestone ships a complete, usable feature. No horizontal layers.

---

## Tooling Decisions

| Layer                   | Choice                      | Rationale                                                                                                                                                                                   |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package Manager**     | pnpm                        | Fast installs, disk-efficient hard links, first-class WXT support. Bun is faster raw but adds compatibility risk for zero meaningful gain in an extension project.                          |
| **Extension Framework** | WXT (Web Extension Toolkit) | Purpose-built for cross-browser extensions. Vite under the hood for HMR. Auto-manifest generation, cross-browser builds. Consensus best choice for extensions in 2026.                      |
| **Build Tool**          | Vite (via WXT)              | Sub-100ms HMR, native ESM dev server. Rspack/Turbopack are faster for large apps but have no extension framework built on them.                                                             |
| **UI Framework**        | Preact + Tailwind CSS v4    | Lightweight React alternative (~3KB), ideal for extension bundle size. Tailwind v4 for utility-first styling.                                                                               |
| **Component Dev**       | Storybook (from M2 onward)  | Official Preact + Vite support. Develop side panel components in isolation without needing to load the extension context. Critical for M2+ where UI complexity grows. Not needed for M0-M1. |
| **State Management**    | Zustand                     | Minimal, Preact-compatible, no boilerplate.                                                                                                                                                 |
| **Testing**             | Vitest + Playwright         | Vitest for unit/integration (shares Vite config). Playwright for E2E extension testing.                                                                                                     |
| **CI/CD**               | GitHub Actions              | Lint, type check, test, build on push/PR. Chrome Web Store + Firefox AMO publishing in M5.                                                                                                  |

### Why These Choices

**pnpm over Bun:** WXT's docs and ecosystem assume pnpm/npm. The install speed difference (2s vs 12s) doesn't justify debugging edge cases in a browser extension build pipeline where the bundler is Vite regardless.

**Vite over Rspack/Turbopack:** Neither Rspack nor Turbopack has a browser extension framework. WXT is built on Vite and provides extension-specific features (manifest generation, HMR in content scripts, cross-browser output) that you'd have to build yourself on other bundlers.

**Storybook introduced at M2, not M0:** M0-M1 have ~3 components total. Adding Storybook setup overhead for that is waste. M2 introduces analysis cards, ownership display, reference expanders, axis visualizations, highlight tooltips — all self-contained visual components that benefit from isolated development outside the painful extension reload cycle.

---

## Milestone 0: Project Scaffolding

**Goal:** A Chrome extension that loads, opens a side panel, and says "Hello World."

**Deliverable:** Developer can `npm run dev`, load the extension in Chrome, click the icon, and see a side panel. CI runs lint + type check on every push.

### Parallel Work Streams

| Stream                 | Task                                                                                                                                                                              | Effort | Depends On |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| **A: Extension Shell** | Init WXT project with Preact + Tailwind CSS. Configure `wxt.config.ts` for Chrome MV3. Create minimal background service worker, content script stub, and side panel entry point. | 3h     | —          |
| **A: Extension Shell** | Side panel renders a Preact component with Tailwind styling. Toolbar icon click opens it.                                                                                         | 2h     | WXT init   |
| **B: Build & CI**      | Vite build produces a loadable `.zip`. GitHub Actions workflow: lint (ESLint + Prettier), type check (TypeScript), build on push/PR.                                              | 2h     | WXT init   |
| **B: Build & CI**      | Vitest configured with a single passing smoke test.                                                                                                                               | 1h     | WXT init   |

**Streams A and B are parallel** after WXT init (first 30 min of Stream A).

### Definition of Done

- [ ] `npm run dev` → extension loads in Chrome with no errors
- [ ] Clicking toolbar icon opens side panel with styled "Marx Meter" heading
- [ ] `npm run build` → produces loadable extension zip
- [ ] GitHub Actions CI passes on push (lint, types, test, build)
- [ ] TypeScript strict mode enabled
- [ ] Project structure matches PRD repo layout (`src/background/`, `src/content/`, `src/sidepanel/`, `src/lib/`, `data/`)

### Risks

- **WXT + Preact compatibility.** WXT officially supports Preact. Low risk, but verify HMR works in side panel context during init.
- **MV3 side panel API.** Chrome's `chrome.sidePanel` API is stable as of Chrome 114+. No risk for modern Chrome.

**Estimated total: 1 day**

---

## Milestone 1: Minimum Viable Analysis

**Goal:** Extract an article from one news site, send it to Gemini free tier, display structured analysis in the side panel.

**Deliverable:** User visits a CNN or NYT article, clicks the extension icon, and sees a class interest analysis (who benefits, who's absent, key framing choices) in the side panel within 10-15 seconds.

### Parallel Work Streams

| Stream                    | Task                                                                                                                                                                                    | Effort | Depends On              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------- |
| **A: Extraction**         | Integrate Mozilla Readability.js. Content script extracts article text, headline, byline, outlet domain from active tab DOM. Sends to background via `chrome.runtime.sendMessage`.      | 4h     | M0                      |
| **A: Extraction**         | Test extraction on 5 major sites (CNN, NYT, WaPo, Reuters, Guardian). Fix edge cases.                                                                                                   | 3h     | Readability integration |
| **B: AI Pipeline**        | Gemini adapter: call Google Generative AI SDK with free API key. Handle auth, rate limits, streaming response. Single function: `analyze(articleText, metadata) → AnalysisResult`.      | 4h     | M0                      |
| **B: AI Pipeline**        | Prompt template for Pass 1+2 combined: extraction + framing analysis. Structured JSON output schema. Store as versioned file in `data/prompts/`.                                        | 4h     | M0                      |
| **B: AI Pipeline**        | Define TypeScript types for `AnalysisResult` (who benefits, who's absent, framing choices with quotes, ideological axes scores).                                                        | 1h     | M0                      |
| **C: Side Panel Display** | Raw analysis renderer: takes `AnalysisResult`, displays each section. No polish — just readable output with section headers. Loading spinner during analysis. Error state if API fails. | 4h     | AnalysisResult types    |

**Streams A, B, and C are parallel.** C depends only on the shared types from B (1h task, done first).

### Integration (Sequential)

| Task                                                                                                                                 | Effort | Depends On           |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------ | -------------------- |
| Wire extraction → AI pipeline → side panel display. End-to-end flow: click icon → extract → analyze → display.                       | 3h     | A, B, C all complete |
| First-run API key entry: minimal text input in side panel for Gemini key, stored in `chrome.storage.local`. Validate with test call. | 2h     | Gemini adapter       |

### Definition of Done

- [ ] User clicks icon on a CNN article → sees structured analysis in side panel
- [ ] Analysis includes: Quick Take, Who Benefits, Who's Absent, 3+ Framing Choices with article quotes
- [ ] Ideological axes rendered as simple text scores (no visualization yet)
- [ ] Loading state shown during analysis (streaming preferred, but acceptable as single response)
- [ ] Error shown if API key missing or invalid
- [ ] Works on at least 3 of 5 test sites (CNN, NYT, WaPo, Reuters, Guardian)
- [ ] Extraction success rate >80% on test sites

### Risks

- **Gemini free tier rate limits.** 10 RPM, 250 RPD. Fine for development and individual use. If Google cuts limits again (they did Dec 2025), M3's multi-provider failover mitigates.
- **Prompt quality.** First prompt will be rough. Ship it, test on 10 articles, iterate. Don't over-engineer prompts before seeing real output.
- **Readability.js extraction failures.** Some sites use heavy JS rendering. Readability handles most static content well. Defer JS-heavy sites to later milestones.

**Estimated total: 3-4 days**

---

## Milestone 2: Polished Single-Provider Experience

**Goal:** Make the analysis experience feel like a real product — proper UI, ownership context, theoretical grounding, and in-page highlights.

**Deliverable:** User analyzes an article and gets a polished side panel with progressive disclosure, sees who owns the outlet, gets "Further Reading" links to foundational texts, and sees highlighted framing choices directly in the article.

### Parallel Work Streams

| Stream                    | Task                                                                                                                                                                                                                                                                                                                                 | Effort | Depends On               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------ |
| **A: Side Panel UI**      | Set up Storybook with `@storybook/preact-vite`. Create stories for each component as they're built. This becomes the primary UI development environment from here forward.                                                                                                                                                           | 2h     | M1                       |
| **A: Side Panel UI**      | Redesign side panel with progressive disclosure: Quick Take visible first, sections collapsible. Styled cards for each analysis section. Dark mode (system preference). Develop in Storybook with mock `AnalysisResult` data.                                                                                                        | 8h     | Storybook setup          |
| **A: Side Panel UI**      | Ideological axes visualization: horizontal bar charts (Tailwind + CSS, no charting lib).                                                                                                                                                                                                                                             | 3h     | M1                       |
| **A: Side Panel UI**      | Streaming response display: show analysis building in real-time as Gemini streams tokens.                                                                                                                                                                                                                                            | 4h     | M1                       |
| **B: Ownership Data**     | Curate ownership JSON for top 20 US outlets (NYT, WaPo, CNN, Fox, MSNBC, WSJ, Reuters, AP, NPR, PBS, Guardian US, HuffPost, Politico, The Hill, Axios, Vice, Vox, Bloomberg, Business Insider, Daily Beast). Fields: parent company, ownership chain, revenue model, political donations. Source from CJR, OpenSecrets, SEC filings. | 6h     | —                        |
| **B: Ownership Data**     | Ownership display component: shows parent company, ownership chain, donation summary. Collapsible detail.                                                                                                                                                                                                                            | 3h     | Ownership JSON           |
| **B: Ownership Data**     | Wire ownership lookup into analysis flow: match `outlet_domain` → ownership record → display in side panel above analysis.                                                                                                                                                                                                           | 2h     | Ownership component + M1 |
| **C: Reference Library**  | Curate 10 theoretical reference entries as JSON. Include: Manufacturing Consent, Prison Notebooks (Hegemony), Society of the Spectacle, Ideology & ISAs, German Ideology, Capital Vol 1 Ch 1, Capitalist Realism, Orientalism, Reform or Revolution, Undoing the Demos. Fields per PRD spec.                                         | 4h     | —                        |
| **C: Reference Library**  | Heuristic reference matcher: keyword/phrase matching from analysis output to reference entries. No AI needed — pattern match against `analysis_triggers[]` and `keywords[]`.                                                                                                                                                         | 3h     | Reference JSON           |
| **C: Reference Library**  | "Further Reading" UI component: expandable sections with concept name, plain-language summary, link to free text. Wired into analysis display.                                                                                                                                                                                       | 3h     | Matcher + M1 side panel  |
| **D: In-Page Highlights** | Content script: inject highlights into article DOM using Shadow DOM isolation. Three types: red underline (euphemisms), yellow highlight (sourcing), blue margin note (missing context). Map from `AnalysisResult.framingChoices[]` to text ranges in DOM.                                                                           | 6h     | M1                       |
| **D: In-Page Highlights** | Hover tooltip on highlights: shows analysis point summary. Click scrolls side panel to corresponding section.                                                                                                                                                                                                                        | 4h     | Highlight injection      |
| **D: In-Page Highlights** | Toggle highlights on/off from side panel. Persist preference.                                                                                                                                                                                                                                                                        | 1h     | Highlight injection      |

**All four streams (A, B, C, D) are fully parallel.** Each depends only on M1, not on each other.

### Integration (Sequential)

| Task                                                                                                                                                                      | Effort | Depends On  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- |
| Wire ownership + references + highlights into unified analysis flow. Side panel shows ownership at top, references inline with findings, highlights sync with side panel. | 4h     | All streams |
| Update prompt to output highlight-mappable data (specific quotes with character offsets or exact text spans for DOM matching).                                            | 2h     | Stream D    |

### Definition of Done

- [ ] Side panel has polished, progressive-disclosure UI with dark mode
- [ ] Ownership info displays for top 20 outlets (parent company, donations, revenue model)
- [ ] At least 5 theoretical references appear contextually in analysis output
- [ ] "Further Reading" sections expand to show concept summary + external link
- [ ] In-page highlights appear on analyzed articles (6 colors by type)
- [ ] Hover tooltip shows analysis summary; click scrolls side panel
- [ ] Highlights toggleable from side panel
- [ ] Streaming analysis display (text appears progressively)
- [ ] No visual interference with host page CSS (Shadow DOM isolation verified on 5 sites)

### Risks

- **Shadow DOM highlight injection.** Finding exact text ranges in diverse DOMs is fragile. Use `TreeWalker` + `Range` API. Accept imperfect matching initially — highlight the paragraph containing the quote if exact match fails.
- **Ownership data accuracy.** Corporate structures change. Date every entry with `last_updated`. Ship with best-effort data, iterate.
- **Prompt changes for highlight mapping.** Getting the AI to output exact text spans that match DOM content is non-trivial. May need post-processing to fuzzy-match AI output to DOM text.

**Estimated total: 8-10 days**

---

## Milestone 3: Multi-Provider & Resilience

**Goal:** Support multiple AI providers with automatic failover, cache analyses to avoid redundant API calls, and give users a settings page to configure their setup.

**Deliverable:** User can choose between Gemini, Groq, or Ollama. If one provider rate-limits, the next one kicks in automatically. Previously analyzed articles load instantly from cache.

### Parallel Work Streams

| Stream                    | Task                                                                                                                                                                                                                           | Effort | Depends On               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------ |
| **A: Provider Adapters**  | Groq adapter: OpenAI-compatible API. Support Llama 3.3 70B. Handle auth, rate limits, streaming. Conform to same `analyze()` interface as Gemini adapter.                                                                      | 3h     | M1 AI pipeline           |
| **A: Provider Adapters**  | Ollama adapter: localhost API. Model detection (list available models), health check, streaming. Simplified prompt variant for smaller models.                                                                                 | 4h     | M1 AI pipeline           |
| **A: Provider Adapters**  | Claude BYOK adapter: Anthropic SDK. Support Sonnet/Opus selection. XML-tagged prompts. Extended thinking for Pass 3 (prep for M4).                                                                                             | 4h     | M1 AI pipeline           |
| **A: Provider Adapters**  | Prompt adapter layer: abstract interface `AIProvider { analyze, stream, validateKey, getModels }`. Each adapter implements it. Provider-specific prompt adjustments (context window, output format).                           | 3h     | At least 2 adapters done |
| **B: Failover & Routing** | Multi-provider failover: configurable cascade order. On 429/5xx, try next provider. Exponential backoff per provider. Log which provider served each analysis.                                                                 | 4h     | Adapter layer            |
| **B: Failover & Routing** | Provider health dashboard in settings: show which providers are configured, last response time, error count.                                                                                                                   | 2h     | Failover logic           |
| **C: Caching**            | IndexedDB via Dexie.js: `CachedAnalysis` table per PRD schema. Cache key = `article_text_hash`. On analysis request, check cache first. TTL configurable (default 90 days).                                                    | 4h     | M1                       |
| **C: Caching**            | Cache hit UX: instant display with "Cached analysis from [date]" badge. "Re-analyze" button to force fresh analysis.                                                                                                           | 2h     | Cache layer              |
| **D: Settings Page**      | Full settings page (new extension page, not in side panel): AI tier selection (Free Cloud / Local / BYOK), provider config per tier, API key entry with validation, model selection dropdowns, failover order drag-to-reorder. | 8h     | M0                       |
| **D: Settings Page**      | First-run onboarding: detect no API key configured → show setup wizard. Direct links to each provider's API key page. "Test connection" button.                                                                                | 4h     | Settings page            |
| **D: Settings Page**      | Encrypt API keys before storing in `chrome.storage.local`. Use Web Crypto API with device-derived key.                                                                                                                         | 3h     | Settings page            |

**Streams A, B, C, D are parallel.** B depends on A (adapter layer). Everything else is independent.

### Integration (Sequential)

| Task                                                                                                                     | Effort | Depends On  |
| ------------------------------------------------------------------------------------------------------------------------ | ------ | ----------- |
| Wire settings → provider selection → failover → cache into main analysis flow. Settings changes take effect immediately. | 3h     | All streams |
| Test failover: simulate Gemini 429 → verify Groq takes over. Test Ollama offline → verify graceful fallback.             | 2h     | Integration |

### Definition of Done

- [ ] Gemini, Groq, and Ollama adapters all produce valid `AnalysisResult` from same article
- [ ] Claude BYOK adapter works with user-provided Anthropic key
- [ ] Failover triggers automatically on rate limit (tested with forced 429)
- [ ] Second analysis of same article loads from cache in <100ms
- [ ] Settings page allows full provider configuration
- [ ] First-run wizard guides user to get API key in <2 minutes
- [ ] API keys encrypted at rest
- [ ] Ollama health check detects available models and connection status
- [ ] Analysis records which provider/model was used

### Risks

- **Prompt quality variance across models.** Llama 3.3 70B on Groq may produce different quality than Gemini Flash. Accept variance — consistent output format matters more than identical analysis depth. Validate structured JSON output from each provider.
- **Ollama cold start.** First request to Ollama after model load can be slow (30s+). Show progress indicator. Consider a "warm up" ping on extension load if Ollama is configured.
- **Key encryption.** Web Crypto API in service workers has some gotchas. Test thoroughly. Fallback to base64 encoding with clear documentation that it's obfuscation, not security, if encryption proves unreliable in MV3 context.

**Estimated total: 8-10 days**

---

## Milestone 4: Full Analysis Depth

**Goal:** Ship the complete analytical framework — Reform/Revolution axis, AI-powered reframing, full reference library, and comprehensive ownership database.

**Deliverable:** User gets the full Marx Meter experience: deep multi-axis analysis including reform/revolution framing, "How Would This Read Differently?" rewrites, 20+ theoretical references surfaced contextually, and ownership data for 100 outlets.

### Parallel Work Streams

| Stream                        | Task                                                                                                                                                                                                | Effort | Depends On           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------- |
| **A: Reform/Revolution Axis** | Add reform/revolution scoring to Pass 2 prompt. Three-point classification (Reformist / Ambiguous / Revolutionary) with textual evidence. Indicator matching per PRD Section 4.5.                   | 4h     | M2 prompt            |
| **A: Reform/Revolution Axis** | UI component: spectrum visualization with indicator labels. Expandable evidence section showing which sentences led to the classification.                                                          | 3h     | M2 side panel        |
| **A: Reform/Revolution Axis** | Reference linking: auto-attach Luxemburg, Lenin, Fisher, Gramsci references to reform/revolution findings.                                                                                          | 1h     | M2 reference matcher |
| **B: Reframing Engine**       | Pass 3 prompt: given Pass 2 output + top 3 most ideologically loaded excerpts, generate worker/public-interest reframes. Same facts, different framing. Include theoretical basis for each reframe. | 6h     | M2 prompt            |
| **B: Reframing Engine**       | Reframing UI: side-by-side original vs. reframe, with "Further Reading" per reframe. Clear "alternative framing" label. Only shown for Tier 1 (capable models) and Tier 3.                          | 4h     | M2 side panel        |
| **B: Reframing Engine**       | Tier gating: Pass 3 only runs on Gemini Pro, DeepSeek R1, Claude. Skip for Ollama small models and Gemini Flash. Show "Upgrade to [tier] for reframing" prompt.                                     | 2h     | Adapter layer (M3)   |
| **C: Full Reference Library** | Expand from 10 to 20+ entries per PRD table. All fields populated: concept, author, work, section, summary, keywords, free URL, analysis triggers.                                                  | 6h     | M2 reference JSON    |
| **C: Full Reference Library** | Improve reference matcher: weighted keyword matching, topic-domain awareness (labor articles surface labor-specific references), dedup, relevance ranking.                                          | 4h     | M2 matcher           |
| **C: Full Reference Library** | Enhanced "Further Reading" UI: grouped by relevance, "most relevant" badge on top match, reading list save feature.                                                                                 | 3h     | M2 reference UI      |
| **D: Full Ownership DB**      | Expand from 20 to 100 outlets. Cover all major US national + top regional + key international English-language outlets. Structured research process with sources documented per entry.              | 12h    | M2 ownership JSON    |
| **D: Full Ownership DB**      | Add ownership data quality indicators: "last verified [date]", "source: [CJR/SEC/OpenSecrets]", confidence level.                                                                                   | 2h     | Expanded DB          |

**All four streams are fully parallel.**

### Integration (Sequential)

| Task                                                                                                                                                | Effort | Depends On  |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- |
| Wire reform/revolution + reframing into analysis flow. Update `AnalysisResult` types. Ensure side panel renders all new sections.                   | 3h     | All streams |
| Test full analysis on 10 articles across diverse topics (labor, housing, healthcare, police, foreign policy). Tune prompts based on output quality. | 4h     | Integration |

### Definition of Done

- [ ] Reform/Revolution axis appears in every analysis with textual evidence
- [ ] Reframing engine produces 3 alternative framings on Tier 3 and capable Tier 1 models
- [ ] Reframes use same facts as original (verified on 10 test articles)
- [ ] 20+ theoretical references in library, all with valid free URLs
- [ ] References appear contextually relevant (spot-check: >70% of surfaced references feel apt)
- [ ] 100 outlets in ownership DB with parent company + donations
- [ ] Full analysis (all sections) completes in <20s on Gemini Flash

### Risks

- **Reframing hallucination.** The AI may introduce facts not in the original article. Post-processing check: compare named entities and statistics in reframe vs. original. Flag discrepancies. This is the highest-risk feature in the product — ship with prominent "AI-generated alternative framing" disclaimer.
- **Ownership research is labor-intensive.** 100 outlets × ~10 min each = 16+ hours of research. Parallelize across contributors. Prioritize by traffic ranking. Accept incomplete data (missing donations is OK, missing parent company is not).
- **Prompt bloat.** Pass 3 adds significant prompt length. Monitor token usage. May need to truncate article text for smaller context windows.

**Estimated total: 10-12 days**

---

## Milestone 5: Sharing & Distribution

**Goal:** Make analyses shareable and ship the extension publicly.

**Deliverable:** User can generate share cards, use keyboard shortcuts, and install Marx Meter from the Chrome Web Store. The project has a public landing page and is open-source on GitHub.

### Parallel Work Streams

| Stream              | Task                                                                                                                                                                                       | Effort | Depends On       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------------- |
| **A: Share Cards**  | Quick Take card generation: html2canvas renders analysis summary as image. Includes headline, outlet, ownership badge, 3 key findings, ideological axes, branding + Chrome Web Store link. | 6h     | M2 side panel    |
| **A: Share Cards**  | Pull Quote card: user selects a framing choice, generates card with original text + analysis + theoretical reference.                                                                      | 3h     | Quick Take card  |
| **A: Share Cards**  | Share actions: copy image to clipboard, share via Web Share API (mobile), direct share URLs for Twitter/X, Mastodon, Bluesky.                                                              | 3h     | Card generation  |
| **B: UX Polish**    | Keyboard shortcut: configurable hotkey (default Ctrl+Shift+D). Right-click context menu "Decode This Article". Extension icon badge (analyzed state).                                      | 3h     | M1               |
| **B: UX Polish**    | Paywall detection: detect truncated content, show warning in analysis.                                                                                                                     | 2h     | M1 extraction    |
| **B: UX Polish**    | AI disclaimer footer on every analysis. "Re-analyze" and "Clear cache" actions.                                                                                                            | 1h     | M3 cache         |
| **B: UX Polish**    | WCAG 2.1 AA audit: keyboard navigation in side panel, focus management, ARIA labels, contrast ratios, screen reader testing.                                                               | 4h     | M2 side panel    |
| **C: Distribution** | Chrome Web Store listing: description, screenshots (5+), promo images, privacy policy, category selection. Prepare and submit for review.                                                  | 4h     | M4 complete      |
| **C: Distribution** | Landing page: GitHub Pages or Astro static site. Hero, features, screenshots, "Install" CTA, "How it works" section, link to source.                                                       | 4h     | —                |
| **C: Distribution** | Open-source repo prep: AGPL-3.0 license, CONTRIBUTING.md, CODE_OF_CONDUCT.md, PROMPT_AUDIT.md, issue templates, PR template for ownership data. Clean up repo, remove dev artifacts.       | 3h     | —                |
| **D: Beta Program** | Set up feedback channels: GitHub Discussions enabled, feedback form link in extension settings.                                                                                            | 1h     | —                |
| **D: Beta Program** | Beta distribution: share in DSA tech channels, leftist Reddit (r/socialism, r/media_criticism), Bluesky/Mastodon media literacy communities. Write launch post.                            | 3h     | CWS listing live |

**All four streams are fully parallel** (A, B, C, D). Stream D's beta launch depends on C's CWS listing.

### Definition of Done

- [ ] Quick Take and Pull Quote share cards render correctly with branding
- [ ] Share to clipboard, Twitter/X, Mastodon, Bluesky all functional
- [ ] Keyboard shortcut and context menu trigger analysis
- [ ] Extension passes WCAG 2.1 AA for side panel (keyboard nav, ARIA, contrast)
- [ ] Chrome Web Store listing approved and live
- [ ] Landing page deployed with install link
- [ ] Repo is public with AGPL-3.0, contributing guide, code of conduct
- [ ] Beta feedback collected from at least 20 external users
- [ ] All analysis output includes AI disclaimer

### Risks

- **Chrome Web Store review rejection.** CWS reviews MV3 compliance, permission justification, and content policy. The political nature of this extension could attract scrutiny. Mitigation: minimal permissions (only `activeTab`, `sidePanel`, `storage`), clear privacy policy, no remote code execution. Have Firefox AMO as backup distribution.
- **html2canvas rendering inconsistency.** html2canvas doesn't perfectly replicate all CSS. Test card rendering across analysis types. Consider Satori (Vercel) as alternative if html2canvas output quality is poor.

**Estimated total: 6-8 days**

---

## Milestone 6: Post-Launch Expansion

**Goal:** Expand browser support, add remaining BYOK options, and enable community contributions.

**Deliverable:** Firefox users can install. Power users can use OpenAI models. Auto-analyze saves clicks on news sites. Community can contribute ownership data via PRs.

### Parallel Work Streams

| Stream                    | Task                                                                                                                                                                                   | Effort | Depends On           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------- |
| **A: Firefox Port**       | WXT cross-browser build config. Test all features in Firefox. Handle API differences (`browser.*` vs `chrome.*`, side panel → sidebar). Fix Firefox-specific issues.                   | 8h     | M5                   |
| **A: Firefox Port**       | Firefox AMO listing: prepare and submit.                                                                                                                                               | 2h     | Firefox build        |
| **B: OpenAI BYOK**        | OpenAI adapter: function calling for structured output, GPT-4o support. Settings page integration.                                                                                     | 4h     | M3 adapter layer     |
| **B: OpenAI BYOK**        | HuggingFace + OpenRouter adapters (OpenAI-compatible API, different auth).                                                                                                             | 3h     | M3 adapter layer     |
| **C: Auto-Analyze**       | Curate list of known news domains (50+). On page load, if domain matches and setting enabled, trigger analysis automatically. Show subtle icon badge.                                  | 4h     | M3 settings          |
| **C: Auto-Analyze**       | Rate limiting: max 1 auto-analysis per 5 minutes, respect provider rate limits, prioritize user-initiated over auto.                                                                   | 2h     | Auto-analyze         |
| **D: Community Pipeline** | GitHub PR template for ownership data contributions. Validation script: lint JSON, check required fields, verify no duplicate domains. CI runs validation on PRs to `data/ownership/`. | 4h     | M4 ownership DB      |
| **D: Community Pipeline** | PR template for reference library additions. Same validation approach.                                                                                                                 | 2h     | M4 reference library |
| **D: Community Pipeline** | OWNERSHIP_DATA.md guide: how to research an outlet, required sources, data format, example PR.                                                                                         | 2h     | —                    |

**All four streams are fully parallel.**

### Definition of Done

- [ ] Firefox extension loads and all core features work (analysis, highlights, settings, share)
- [ ] Firefox AMO listing approved
- [ ] OpenAI GPT-4o produces valid analysis via BYOK
- [ ] HuggingFace and OpenRouter adapters work with free models
- [ ] Auto-analyze triggers on known news domains (when enabled)
- [ ] Auto-analyze respects rate limits and doesn't waste API quota
- [ ] Community PR template validates ownership data in CI
- [ ] OWNERSHIP_DATA.md published with clear contribution guide

### Risks

- **Firefox side panel API.** Firefox uses `browser.sidebarAction` which differs from Chrome's `sidePanel`. WXT abstracts some of this, but expect 2-3 days of Firefox-specific debugging.
- **Auto-analyze API cost.** Users on BYOK tiers could accidentally burn through API budget. Mitigate with clear settings warning, daily cap, and "analyzed today: N articles" counter.

**Estimated total: 6-8 days**

---

## Summary Timeline

| Milestone                       | Duration   | Cumulative | Key Deliverable                                          |
| ------------------------------- | ---------- | ---------- | -------------------------------------------------------- |
| **M0: Scaffolding**             | 1 day      | Day 1      | Extension loads in Chrome                                |
| **M1: Minimum Viable Analysis** | 3-4 days   | Day 5      | First article analyzed end-to-end                        |
| **M2: Polished Experience**     | 8-10 days  | Day 15     | Production-quality UI, ownership, references, highlights |
| **M3: Multi-Provider**          | 8-10 days  | Day 25     | Provider choice, failover, caching, settings             |
| **M4: Full Depth**              | 10-12 days | Day 37     | Complete analytical framework                            |
| **M5: Share & Ship**            | 6-8 days   | Day 45     | Chrome Web Store, public launch                          |
| **M6: Expand**                  | 6-8 days   | Day 53     | Firefox, OpenAI, auto-analyze, community                 |

**Total: ~8-10 weeks to public launch (M5), ~10-12 weeks to full expansion (M6).**

With 2 developers working in parallel, milestones compress by ~40% on streams with independent work.

---

## Parallelization Map

```
Week 1:     M0 ━━▶ M1-A(Extraction) ─────────────┐
                   M1-B(AI Pipeline) ─────────────┤
                   M1-C(Side Panel) ──────────────┤
                                                   ▼
Week 2-3:         M2-A(UI Polish) ────────────────┐
                  M2-B(Ownership 20) ─────────────┤
                  M2-C(References 10) ────────────┤
                  M2-D(Highlights) ───────────────┤
                                                   ▼
Week 4-5:         M3-A(Adapters) ─────────────────┐
                  M3-B(Failover) ──────▶(needs A) │
                  M3-C(Caching) ──────────────────┤
                  M3-D(Settings) ─────────────────┤
                                                   ▼
Week 6-7:         M4-A(Reform/Rev) ───────────────┐
                  M4-B(Reframing) ────────────────┤
                  M4-C(Refs expand) ──────────────┤
                  M4-D(Ownership 100) ────────────┤
                                                   ▼
Week 8-9:         M5-A(Share Cards) ──────────────┐
                  M5-B(UX Polish) ────────────────┤
                  M5-C(Distribution) ─────────────┤
                  M5-D(Beta) ─────────▶(needs C)  │
                                                   ▼
Week 10-12:       M6-A(Firefox) ──────────────────┐
                  M6-B(OpenAI) ───────────────────┤
                  M6-C(Auto-analyze) ─────────────┤
                  M6-D(Community) ────────────────┘
```

Each `━━` or `──` is an independent parallel stream within the milestone. The `▼` marks the integration point where streams merge before the next milestone begins.

---

## Testing Guidelines

### Testing Philosophy

**The pyramid for this project:**

```
        ╱ ╲           Manual / Exploratory
       ╱   ╲          (AI output quality, cross-site extraction, visual QA)
      ╱─────╲
     ╱       ╲        E2E — Playwright
    ╱         ╲       (full extension flows: click icon → extract → analyze → display)
   ╱───────────╲
  ╱             ╲     Integration
 ╱               ╲    (adapter → prompt → parse, extraction → messaging → display)
╱─────────────────╲   Unit — Vitest
                       (parsers, matchers, formatters, validators, pure functions)
```

The base is wide because most logic in this extension is **pure functions operating on data**: parse HTML → structured text, structured text → prompt, AI response → typed result, typed result → UI props. These are all unit-testable without browser context.

**What NOT to test:**

- Tailwind class names. They're not behavior.
- Preact's rendering internals. Trust the framework.
- Exact AI output text. It's non-deterministic. Test structure and constraints instead.
- Third-party library internals (Readability.js parsing logic, Dexie.js storage mechanics). Test your integration with them, not their code.
- One-liner pass-through functions. If it's `const getKey = (s) => s.domain`, skip it.

**Snapshots vs. behavioral tests:**

- Use snapshots **only** for share card HTML output (M5) where pixel-level regression matters.
- Everything else: behavioral assertions. "The Quick Take section is visible" not "the DOM tree matches this 200-line snapshot."
- Storybook visual tests (M2+) replace snapshots for component appearance.

**Testing AI output (the hard problem):**

AI responses are non-deterministic. You cannot assert exact text. Instead, test at three levels:

1. **Schema validation (deterministic, CI).** Every `AnalysisResult` must parse against a Zod/JSON schema. Fields present, correct types, arrays non-empty, scores within range. This catches structural failures — the AI returned prose instead of JSON, or omitted a required field.

2. **Constraint checking (deterministic, CI).** Business rules that must hold regardless of AI creativity: every `framingChoice` must include a `quote` that exists verbatim in the source article text. Every `ideologicalAxis` score is 0-10. `whoBenefits` and `whosAbsent` are non-empty arrays. Reframes contain no named entities absent from the original.

3. **Quality scoring (non-deterministic, manual + periodic CI).** Use a small eval suite: 10 articles with human-reviewed "gold standard" analyses. Run periodically (not on every push). Score with heuristics: did the analysis identify at least 2 of 3 expected framing choices? Is the reform/revolution classification within 1 point of human rating? Track scores over time to catch prompt regressions. Consider [Promptfoo](https://www.promptfoo.dev/docs/guides/evaluate-json/) for automated eval.

**Fixtures strategy:**

Store in `tests/fixtures/`:

- `articles/` — Saved HTML pages from 10+ news sites (CNN, NYT, WaPo, Reuters, Guardian, Fox, WSJ, NPR, Vox, AP). Snapshot the full page HTML, not live fetches. This makes tests deterministic and fast.
- `api-responses/` — Saved JSON responses from each AI provider (Gemini, Groq, Ollama, Claude). One valid response + one malformed response per provider.
- `analysis-results/` — Complete `AnalysisResult` objects for testing UI components. Include: minimal result, full result with all fields, result with missing optional fields, result with edge case data (very long quotes, unicode, empty arrays).
- `ownership/` — Subset of ownership JSON for tests.
- `references/` — Subset of reference library for tests.

---

### M0 — Scaffolding

| Area              | Type                | What to Test                                                                                                                                                      |
| ----------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build             | Unit (Vitest)       | Smoke test: `import` the main entry points (`background/index.ts`, `content/index.ts`, `sidepanel/index.tsx`) — they parse without error.                         |
| Build             | CI (GitHub Actions) | `pnpm build` exits 0. Output directory contains `manifest.json` with correct MV3 fields.                                                                          |
| Extension loading | E2E (Playwright)    | Load extension in Chromium via `launchPersistentContext` with `--load-extension`. Verify service worker registers. Verify side panel opens on toolbar icon click. |

**Mock:** Nothing. This is pure infrastructure.
**Test live:** Extension loading in real Chromium. Playwright must run headed — [extensions are unsupported in headless Chromium](https://playwright.dev/docs/chrome-extensions).
**CI:** Build smoke test and lint run on every push. Playwright extension load test runs on every push (headed Chromium in CI via `xvfb`).
**Must cover:** Build succeeds, extension loads, side panel opens. That's it.

---

### M1 — Article Extraction

| Area                     | Type        | Specific Test Cases                                                                                                                                                            |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Readability parsing      | Unit        | `extractArticle(cnnFixtureHtml)` returns `{ title, byline, content, excerpt }` with non-empty values.                                                                          |
|                          | Unit        | `extractArticle(paywallFixtureHtml)` returns partial content + `truncated: true` flag.                                                                                         |
|                          | Unit        | `extractArticle(nonArticlePage)` (e.g., YouTube, Google search) returns `null` or error.                                                                                       |
| Domain detection         | Unit        | `getOutletDomain("https://www.nytimes.com/2026/01/15/business/...")` → `"nytimes.com"`.                                                                                        |
|                          | Unit        | `getOutletDomain("https://amp.cnn.com/...")` → `"cnn.com"` (strips subdomain variants).                                                                                        |
| Content script messaging | Integration | Content script sends `{ type: 'ARTICLE_EXTRACTED', payload }` → background service worker receives it with correct shape. Use Playwright to trigger in real extension context. |
| Cross-site extraction    | E2E         | Load each of 5 fixture HTML pages in Playwright. Trigger extraction. Assert title and content are non-empty and content length > 500 chars.                                    |

**Fixtures needed:** 5 saved HTML pages (CNN, NYT, WaPo, Reuters, Guardian) + 1 paywall page + 1 non-article page.
**Mock:** Nothing for extraction — it's pure DOM parsing. Mock `chrome.runtime.sendMessage` in unit tests with `vi.fn()`.
**Test live:** Cross-site extraction E2E runs against saved fixtures loaded as `file://` URLs in Playwright.
**CI:** All unit + E2E extraction tests run on every push.
**Must cover:** Extraction returns valid structured data for every fixture. Non-article pages don't crash.
**Nice-to-have:** Extraction accuracy metrics (expected vs. extracted word count).

---

### M1 — AI Pipeline

| Area                      | Type        | Specific Test Cases                                                                                                                                      |
| ------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gemini adapter            | Unit        | `geminiAdapter.analyze(articleText, metadata)` with mocked fetch → returns valid `AnalysisResult`.                                                       |
|                           | Unit        | `geminiAdapter.analyze(...)` with mocked 429 response → throws `RateLimitError` with `retryAfter` field.                                                 |
|                           | Unit        | `geminiAdapter.analyze(...)` with mocked malformed JSON response → throws `ParseError`, does not crash.                                                  |
|                           | Unit        | `geminiAdapter.validateKey("valid-key")` with mocked 200 → returns `true`. Invalid key → `false`.                                                        |
| Prompt template           | Unit        | `buildPrompt(articleText, metadata, "pass1+2")` returns string containing article text and expected instruction segments. Length < context window limit. |
|                           | Unit        | `buildPrompt(...)` with 50,000 word article truncates to context window with truncation notice.                                                          |
| AnalysisResult validation | Unit        | `parseAnalysisResult(validJson)` returns typed object.                                                                                                   |
|                           | Unit        | `parseAnalysisResult(missingFieldsJson)` throws with specific missing field names.                                                                       |
|                           | Unit        | `parseAnalysisResult(scoresOutOfRange)` throws — axis scores outside 0-10 rejected.                                                                      |
| Streaming                 | Integration | Mock Gemini streaming response (Server-Sent Events). `streamAnalysis(...)` emits partial results, final result matches `AnalysisResult` schema.          |

**Fixtures needed:** `api-responses/gemini-valid.json`, `api-responses/gemini-malformed.json`, `api-responses/gemini-429.json`, `api-responses/gemini-stream-chunks.txt`.
**Mock:** All network calls. Never hit real Gemini in CI. Use `vi.mock` or `msw` (Mock Service Worker).
**Test live:** Manual only — run against real Gemini API during development to verify prompt quality. Not in CI.
**CI:** All unit tests with mocked responses.
**Must cover:** Valid response parsing, error handling for every failure mode (429, 500, malformed JSON, network timeout), schema validation.
**Nice-to-have:** Streaming chunk reassembly edge cases (partial JSON across chunks).

---

### M1 — Side Panel Display

| Area              | Type                                    | Specific Test Cases                                                                                                                              |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Analysis renderer | Unit (Vitest + @testing-library/preact) | Render `<AnalysisDisplay result={mockFullResult} />` → Quick Take section visible, Who Benefits list rendered, framing choices show quoted text. |
|                   | Unit                                    | Render with `result={null}, loading={true}` → spinner visible, no analysis sections.                                                             |
|                   | Unit                                    | Render with `error="Invalid API key"` → error message displayed, retry button visible.                                                           |
|                   | Unit                                    | Render with `result={mockMinimalResult}` (only required fields) → no crash, optional sections absent.                                            |

**Mock:** `AnalysisResult` fixtures. No API calls, no extraction.
**Test live:** Visual QA in browser during development.
**CI:** All component tests.
**Must cover:** Three states: loading, error, success. All required sections render from a full result.

---

### M2 — Side Panel UI (Storybook)

| Area                   | Type               | Specific Test Cases                                                                                                                  |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Component stories      | Visual (Storybook) | Every component has stories for: default state, empty/minimal data, full data, dark mode, overflow text (300-word quote).            |
| Progressive disclosure | Unit               | `<AnalysisDisplay />` — Quick Take visible on mount. "Who Benefits" section collapsed. Click expander → section visible.             |
|                        | Unit               | Collapsed sections have `aria-expanded="false"`. Expanded sections have `aria-expanded="true"`.                                      |
| Dark mode              | Visual (Storybook) | Stories exist for light + dark variants. Verified manually in Storybook.                                                             |
| Streaming display      | Unit               | Feed `<StreamingText chunks={["Partial ", "complete sentence."]} />` → renders progressively. Final state matches concatenated text. |
| Axes visualization     | Unit               | `<IdeologicalAxis label="Pro-capital" score={8} />` → bar width is 80%. `score={0}` → bar width is 0%. `score={10}` → 100%.          |

**Fixtures needed:** `analysis-results/full.json`, `analysis-results/minimal.json`, `analysis-results/overflow.json` (long text in every field).
**Mock:** All data. Storybook components receive props, never call APIs.
**CI:** Vitest component tests run on every push. Storybook build (`pnpm storybook:build`) runs on every push to catch broken stories. Optional: [Chromatic](https://www.chromatic.com/) or Playwright visual regression against Storybook.
**Must cover:** Every component has at least one Storybook story. Progressive disclosure toggles work. Axes render correct proportions.
**Nice-to-have:** Storybook interaction tests (play functions) for complex flows.

---

### M2 — Ownership Data

| Area              | Type | Specific Test Cases                                                                                                              |
| ----------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| JSON schema       | Unit | `validateOwnershipDb(ownershipJson)` — every entry has `domain`, `name`, `parent_company`, `last_updated`. No duplicate domains. |
|                   | Unit | `political_donations[].amount` is a number, not a string. `revenue_model` is one of enum values.                                 |
| Domain lookup     | Unit | `lookupOwnership("nytimes.com")` → returns NYT ownership record.                                                                 |
|                   | Unit | `lookupOwnership("unknownsite.com")` → returns `null`, does not throw.                                                           |
|                   | Unit | `lookupOwnership("amp.nytimes.com")` → normalizes to `nytimes.com`, returns record.                                              |
| Display component | Unit | `<OwnershipCard outlet={nytOwnership} />` → shows "The New York Times Company" as parent. Shows donation summary.                |
|                   | Unit | `<OwnershipCard outlet={null} />` → shows "Ownership data not available" message.                                                |

**Fixtures needed:** Subset of ownership JSON (5 outlets) for unit tests. Full DB validated in CI.
**Mock:** Nothing — ownership is static JSON.
**CI:** Schema validation runs on every push (catches bad edits to ownership data). Component tests on every push.
**Must cover:** Schema validation of the full ownership JSON file. Domain normalization. Null case.

---

### M2 — Reference Library

| Area              | Type | Specific Test Cases                                                                                                                                          |
| ----------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| JSON schema       | Unit | Every entry has `id`, `concept_name`, `author`, `work_title`, `year`, `plain_language_summary`, `keywords[]` (non-empty), `analysis_triggers[]` (non-empty). |
|                   | Unit | Every `free_url` is a valid URL or null. No broken Marxists.org links (HEAD request in a periodic CI job, not every push).                                   |
| Heuristic matcher | Unit | `matchReferences("This article quotes 3 executives and no workers")` → returns Manufacturing Consent (sourcing filter).                                      |
|                   | Unit | `matchReferences("layoffs described as right-sizing")` → returns at least one euphemism-related reference.                                                   |
|                   | Unit | `matchReferences("the weather is nice today")` → returns empty array (no false positives on irrelevant text).                                                |
|                   | Unit | Matcher returns max 5 references, deduplicated, sorted by relevance score.                                                                                   |
| UI component      | Unit | `<FurtherReading references={[mfgConsent]} />` → shows concept name, author, expandable summary.                                                             |
|                   | Unit | Click expander → summary + external link visible. Link has `target="_blank"` and `rel="noopener"`.                                                           |

**Fixtures needed:** Full reference library JSON validated in CI. Mock analysis text strings for matcher tests.
**Mock:** Nothing — all static data and pure functions.
**CI:** Schema validation + matcher unit tests on every push. URL validation weekly (cron job).
**Must cover:** Schema validity. Matcher returns relevant results for 5 known analysis patterns. No false positives on neutral text.

---

### M2 — In-Page Highlights

| Area                   | Type                     | Specific Test Cases                                                                                                                                 |
| ---------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text range matching    | Unit                     | `findTextRange(documentFixture, "officer-involved shooting")` → returns valid `Range` object spanning the exact text.                               |
|                        | Unit                     | `findTextRange(documentFixture, "text not in page")` → returns `null`.                                                                              |
|                        | Unit                     | `findTextRange(documentFixture, "text split across <span>tags</span>")` → returns `Range` spanning the full match (handles inline elements).        |
| Shadow DOM injection   | Integration (Playwright) | Load fixture HTML. Inject highlights. Assert highlights visible via Playwright locator inside shadow root. Assert page's original CSS is unchanged. |
|                        | Integration              | Inject highlights on CNN fixture. Inject highlights on NYT fixture. No CSS bleed in either direction.                                               |
| Tooltip                | Integration (Playwright) | Hover a highlight → tooltip appears with analysis summary text. Mouse away → tooltip disappears.                                                    |
| Highlight ↔ side panel | E2E (Playwright)         | Click highlight on page → side panel scrolls to corresponding analysis section. Verify section is in viewport.                                      |
| Toggle                 | E2E (Playwright)         | Toggle highlights off in side panel → all highlights removed from DOM. Toggle on → highlights reappear.                                             |

**Fixtures needed:** Saved HTML pages with known text that the analysis would highlight. Pre-built `AnalysisResult` with `framingChoices` whose quotes exist in the fixture.
**Mock:** Analysis result (don't call AI). Use pre-built result with known quotes.
**Test live:** Shadow DOM injection must run in real browser (Playwright). Cannot unit test DOM Range creation in jsdom reliably — jsdom's Range support is incomplete.
**CI:** Text range matching unit tests (using jsdom where possible). Playwright integration tests for injection + isolation.
**Must cover:** Text found and highlighted. Text not found doesn't crash. Shadow DOM isolation verified on 2+ site fixtures. Toggle works.
**Nice-to-have:** Performance test — highlighting 20 framing choices doesn't cause visible layout jank.

---

### M3 — Provider Adapters

| Area                  | Type | Specific Test Cases                                                                                                                                                                                                                                       |
| --------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interface conformance | Unit | Every adapter (`GeminiAdapter`, `GroqAdapter`, `OllamaAdapter`, `ClaudeAdapter`) implements `AIProvider { analyze, stream, validateKey, getModels }`. TypeScript enforces this at compile time. Runtime test: call each method, assert return type shape. |
| Gemini adapter        | Unit | Valid response → `AnalysisResult`. 429 → `RateLimitError`. 403 → `AuthError`. Malformed JSON → `ParseError`.                                                                                                                                              |
| Groq adapter          | Unit | Same test matrix as Gemini. Additionally: verify OpenAI-compatible request format (correct `model` field, `response_format: { type: "json_object" }`).                                                                                                    |
| Ollama adapter        | Unit | Same test matrix. Additionally: `getModels()` with mocked `/api/tags` response → returns model list. Health check: mocked 200 → healthy. Connection refused → `ConnectionError`.                                                                          |
| Claude adapter        | Unit | Same test matrix. Additionally: verify XML-tagged prompt format. Verify `extended_thinking` parameter set for Pass 3.                                                                                                                                     |
| Output normalization  | Unit | Feed each adapter's fixture response through its parser → all produce identical `AnalysisResult` shape. Same article, different providers → same TypeScript type, potentially different content.                                                          |

**Fixtures needed:** `api-responses/{gemini,groq,ollama,claude}-{valid,malformed,429,500}.json` — 4 files per provider, 16 total.
**Mock:** All network calls via `vi.mock` or `msw`.
**CI:** All adapter unit tests on every push.
**Must cover:** Every adapter handles valid response + every error type (429, 500, malformed, auth failure, timeout). Output conforms to `AnalysisResult` schema.

---

### M3 — Failover

| Area             | Type        | Specific Test Cases                                                                                                                                  |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cascade behavior | Integration | Configure failover order `[gemini, groq, ollama]`. Mock Gemini → 429. Assert Groq called next. Mock Groq → 429. Assert Ollama called.                |
|                  | Integration | All providers fail → user sees error with list of attempted providers and their errors.                                                              |
|                  | Integration | First provider succeeds → no subsequent providers called.                                                                                            |
| Backoff timing   | Unit        | After 429, backoff delay for that provider is exponential: 1s, 2s, 4s, 8s, max 60s. Assert delay values.                                             |
|                  | Unit        | Backoff resets after successful call.                                                                                                                |
| Provider logging | Unit        | After failover, `analysisResult.meta.provider` reflects which provider actually served the response. `meta.failoverChain` lists attempted providers. |

**Mock:** All provider responses. Use `vi.useFakeTimers()` for backoff timing.
**CI:** All tests on every push.
**Must cover:** Full cascade through all providers. All-fail error state. Backoff timing. Logging which provider served.

---

### M3 — Caching

| Area                | Type        | Specific Test Cases                                                                                                                                                          |
| ------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Write + read        | Integration | `cacheAnalysis(url, articleHash, result)` → `getCachedAnalysis(url, articleHash)` returns same result.                                                                       |
| Cache miss          | Integration | `getCachedAnalysis("never-seen-url", hash)` → returns `null`.                                                                                                                |
| Content-based dedup | Integration | Same article text at two different URLs (syndicated content) → same `articleHash` → cache hit on second URL.                                                                 |
| TTL expiry          | Integration | Cache entry with `analyzed_at` 91 days ago + TTL 90 days → `getCachedAnalysis` returns `null`. Entry 89 days ago → returns result. Use `vi.useFakeTimers()`.                 |
| Re-analyze          | Integration | `cacheAnalysis(url, hash, newResult)` overwrites existing entry. `getCachedAnalysis` returns new result.                                                                     |
| Hash stability      | Unit        | `hashArticleText(text)` produces same hash for same text. Different text → different hash. Whitespace normalization: `"hello  world"` and `"hello world"` produce same hash. |

**Mock:** Use `fake-indexeddb` (npm package) for Vitest — provides in-memory IndexedDB implementation. No real browser needed.
**CI:** All tests on every push.
**Must cover:** Write/read round-trip. Cache miss. TTL expiry. Hash stability.

---

### M3 — Settings & Key Encryption

| Area                  | Type             | Specific Test Cases                                                                                                                                                                                  |
| --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Encryption round-trip | Unit             | `encryptKey("sk-abc123")` → ciphertext (not plaintext). `decryptKey(ciphertext)` → `"sk-abc123"`.                                                                                                    |
|                       | Unit             | `encryptKey("")` → handles gracefully (empty string or error, not crash).                                                                                                                            |
| Settings persistence  | Integration      | `saveSettings({ aiTier: 1, geminiKey: "..." })` → `loadSettings()` returns same values with key decrypted.                                                                                           |
|                       | Integration      | `loadSettings()` on fresh install → returns defaults (tier 1, no keys).                                                                                                                              |
| Onboarding flow       | E2E (Playwright) | Fresh extension install → open side panel → onboarding wizard appears. Select Gemini → key input shown. Enter key → "Test connection" button works (mocked API). Wizard closes → analysis available. |
| Key validation        | Integration      | `validateKey("gemini", "valid-key")` with mocked 200 → stored. `validateKey("gemini", "bad-key")` with mocked 401 → error shown, not stored.                                                         |

**Mock:** `chrome.storage.local` via `vi.mock` in unit tests. Web Crypto API available in Vitest (Node 20+ has it). Playwright E2E uses real extension storage.
**CI:** Unit + integration tests on every push. Playwright onboarding E2E on every push.
**Must cover:** Encryption round-trip. Settings persist across extension restart. Invalid key rejected.

---

### M4 — Reform/Revolution Axis

| Area                     | Type | Specific Test Cases                                                                                                                             |
| ------------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------- |
| Prompt output validation | Unit | `parseReformRevolutionResult(validJson)` → `{ classification: "reformist"                                                                       | "ambiguous" | "revolutionary", score: 0-10, evidence: string[] }`. |
|                          | Unit | `evidence[]` entries are non-empty strings. At least 1 evidence entry.                                                                          |
|                          | Unit | Score and classification are consistent: score 0-3 → "reformist", 4-6 → "ambiguous", 7-10 → "revolutionary".                                    |
| Reference auto-linking   | Unit | Classification "reformist" → references include Luxemburg and/or Fisher. Classification "revolutionary" → references include Lenin and/or Marx. |
| UI visualization         | Unit | `<ReformRevolutionSpectrum score={2} />` → marker positioned at 20%. Label shows "Reformist".                                                   |
|                          | Unit | `<ReformRevolutionSpectrum score={5} />` → "Ambiguous". `score={9}` → "Revolutionary".                                                          |
| Evidence display         | Unit | `<EvidenceList evidence={["Quote one.", "Quote two."]} />` → both quotes rendered. Each has quotation marks or blockquote styling.              |

**Mock:** Pre-built analysis results with reform/revolution data.
**CI:** All unit tests on every push.
**Must cover:** Score/classification consistency. Reference linking. UI renders all three classifications.

---

### M4 — Reframing Engine

| Area                    | Type        | Specific Test Cases                                                                                                                                                                                           |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Factual consistency     | Unit        | `validateReframe(original, reframe)` → extract named entities from both (people, companies, numbers, dates). Assert reframe entities are a subset of original entities. No invented names, numbers, or dates. |
|                         | Unit        | `validateReframe(original, reframeWithInventedStat)` → returns `{ valid: false, violations: ["Statistic '45%' not found in original"] }`.                                                                     |
| Tier gating             | Unit        | `shouldRunPass3("gemini-2.5-flash")` → `false`. `shouldRunPass3("claude-sonnet-4-5")` → `true`. `shouldRunPass3("gemini-2.5-pro")` → `true`.                                                                  |
|                         | Integration | Analyze with Gemini Flash → reframing section shows "Available with [tier]" prompt, not reframed text. Analyze with Claude → reframing section shows actual reframes.                                         |
| Hallucination detection | Unit        | `detectHallucination(originalArticle, reframedPassage)` → checks for claims not grounded in source. Uses entity extraction + keyword overlap. Returns confidence score 0-1.                                   |
| Reframe display         | Unit        | `<ReframeCard original="Amazon announced..." reframe="Amazon is laying off..." reference={mfgConsent} />` → both texts visible, "Alternative framing" label visible, reference expandable.                    |

**Fixtures needed:** 5 original/reframe pairs — 3 valid, 2 with hallucinated facts.
**Mock:** AI responses. Factual consistency checking is a pure function on text.
**CI:** Factual consistency validator + tier gating + component tests on every push. Hallucination detection is heuristic — test the heuristic, not AI output.
**Must cover:** Tier gating logic. Factual consistency validator catches invented entities. UI labels reframes correctly.
**This is the highest-risk feature.** The factual consistency validator is a safety net, not a guarantee. Ship with prominent disclaimers.

---

### M4 — Reference Matching (Expanded)

| Area                   | Type | Specific Test Cases                                                                                                                                                          |
| ---------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Relevance ranking      | Unit | Analysis mentioning "layoffs" + "shareholder value" → reference list topped by Manufacturing Consent or Capital, not Orientalism.                                            |
| Topic-domain awareness | Unit | Labor article → labor-relevant references (Manufacturing Consent, Reform or Revolution). Foreign policy article → Orientalism, Imperialism. No cross-contamination in top 3. |
| Dedup                  | Unit | Same reference matched by 3 different triggers → appears once in output, relevance score reflects combined match strength.                                                   |
| Ceiling                | Unit | Analysis with 15 trigger matches → returns max 5 references, highest relevance first.                                                                                        |

**Mock:** Pre-built analysis text strings designed to trigger specific references.
**CI:** All unit tests on every push.
**Must cover:** Top reference is relevant for 5 known analysis patterns. Dedup works. Ceiling enforced.

---

### M5 — Share Cards

| Area            | Type              | Specific Test Cases                                                                                                                                   |
| --------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card generation | Integration       | `generateQuickTakeCard(analysisResult)` → returns `Blob` of type `image/png`. Image dimensions are within expected range (e.g., 1200x630 for social). |
|                 | Integration       | `generatePullQuoteCard(framingChoice, reference)` → returns `Blob`.                                                                                   |
| Card content    | Visual (Snapshot) | Generate card from fixture data → snapshot test against expected HTML before canvas rendering. This is the one place snapshots are appropriate.       |
| Clipboard       | E2E (Playwright)  | Click "Copy card" → read clipboard → clipboard contains image data.                                                                                   |
| Share URLs      | Unit              | `buildShareUrl("twitter", card, analysisUrl)` → returns valid Twitter intent URL with text and URL params. Same for Mastodon, Bluesky.                |
| Branding        | Unit              | Card HTML contains "Decoded with Marx Meter" text and Chrome Web Store URL.                                                                           |

**Mock:** `html2canvas` in unit tests — mock to return a fake canvas. Test the HTML template and share URL construction without rendering.
**Test live:** Card rendering visual quality is manual QA. Clipboard API requires Playwright E2E.
**CI:** Share URL construction + branding checks on every push. html2canvas rendering is a periodic manual check.
**Must cover:** Share URLs are valid. Branding present. Card generation doesn't throw.
**Nice-to-have:** Visual regression on generated card images.

---

### M5 — Accessibility

| Area                | Type             | Specific Test Cases                                                                                                                                                         |
| ------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keyboard navigation | E2E (Playwright) | Tab through side panel → every interactive element reachable. Focus order is logical (top to bottom, Quick Take → sections → actions).                                      |
|                     | E2E              | Enter/Space on collapsed section → expands. Escape on expanded section → collapses.                                                                                         |
| Focus management    | E2E              | Open side panel → first focusable element receives focus. Close and reopen → focus resets.                                                                                  |
| ARIA                | Unit             | Every collapsible section has `aria-expanded`. Every button has accessible name (not empty). Axes have `role="img"` + `aria-label` with score text.                         |
| Contrast            | Manual + CI      | Run [axe-core](https://github.com/dequelabs/axe-core) via `@axe-core/playwright` on side panel in both light and dark mode. Assert zero "serious" or "critical" violations. |
| Screen reader       | Manual           | VoiceOver (macOS): navigate side panel, verify all analysis sections are announced. This cannot be automated. Test before each milestone release.                           |

**CI:** axe-core contrast/ARIA checks on every push. Keyboard navigation E2E on every push.
**Manual:** Screen reader testing before M5 launch and each subsequent release.
**Must cover:** Zero axe-core critical violations. Full keyboard navigation. Focus management on open/close.

---

### M6 — Firefox

| Area              | Type                     | Specific Test Cases                                                                                                                           |
| ----------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Extension loading | E2E (Playwright Firefox) | Load extension in Firefox. Sidebar opens. (Firefox uses `browser.sidebarAction`, not `chrome.sidePanel`.)                                     |
| Feature parity    | E2E                      | Run the core E2E suite (extract → analyze → display) in Firefox. Same assertions as Chrome.                                                   |
| API abstraction   | Unit                     | `browserApi.storage.get("key")` works identically in Chrome and Firefox shims. `browserApi.sidePanel.open()` maps to correct API per browser. |
| CSS isolation     | E2E (Playwright Firefox) | Highlights render in Firefox. Shadow DOM isolation holds. Test on 2 fixture pages.                                                            |

**Mock:** WXT provides browser API polyfills. Unit test against those.
**Test live:** Playwright Firefox for E2E. Note: Playwright supports Firefox extensions via `launchPersistentContext` with `--load-extension` equivalent.
**CI:** Full E2E suite runs on both Chromium and Firefox. Firefox failures don't block Chrome releases initially — tracked as known issues.
**Must cover:** Extension loads. Core flow works (extract → analyze → display). Highlights render.

---

### M6 — Auto-Analyze

| Area            | Type        | Specific Test Cases                                                                                                                                          |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain matching | Unit        | `isKnownNewsDomain("cnn.com")` → `true`. `isKnownNewsDomain("google.com")` → `false`. `isKnownNewsDomain("amp.cnn.com")` → `true` (subdomain normalization). |
| Rate limiting   | Unit        | 1st call in 5 minutes → allowed. 2nd call within 5 minutes → blocked. After 5 minutes (fake timers) → allowed again.                                         |
|                 | Unit        | Daily cap (configurable, default 20) → 21st auto-analysis in a day → blocked. User-initiated analysis → always allowed regardless of cap.                    |
| Priority queue  | Integration | User clicks "Analyze" while auto-analyze is pending → user-initiated takes priority. Auto-analyze queued behind it.                                          |
|                 | Integration | Auto-analyze in progress + user clicks "Analyze" on different page → auto-analyze cancelled, user request served.                                            |
| Setting toggle  | E2E         | Auto-analyze disabled in settings → navigate to CNN → no analysis triggered. Enable → navigate to NYT → analysis triggered automatically.                    |

**Mock:** Provider responses. Use `vi.useFakeTimers()` for rate limit testing.
**CI:** All unit + integration tests on every push.
**Must cover:** Domain matching with normalization. Rate limiting enforced. User-initiated always takes priority over auto.

---

### CI Pipeline Summary

```
On every push / PR:
├── pnpm lint          (ESLint + Prettier)
├── pnpm typecheck     (tsc --noEmit)
├── pnpm test          (Vitest — unit + integration, ~30s)
├── pnpm test:e2e      (Playwright Chromium, headed via xvfb, ~2min)
├── pnpm build         (WXT production build)
└── pnpm storybook:build (from M2 onward — catches broken stories)

Weekly cron:
├── Reference library URL validation (HEAD requests to all free_url entries)
└── AI quality eval suite (10 articles × configured providers, score tracking)

Pre-release (manual trigger):
├── Playwright Firefox E2E suite (from M6)
├── axe-core accessibility audit
└── Screen reader manual testing checklist
```
