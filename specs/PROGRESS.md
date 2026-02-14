# Marx Meter — Progress Tracker

> **Updated by AI agents during implementation.** Check this file to see what's done, what's in progress, and what's blocked.

## Status Key

- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Complete
- `[!]` — Blocked (see notes)

---

## M0: Project Scaffolding

**Status:** Complete
**Goal:** Extension loads in Chrome, opens side panel, CI passes.

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Init WXT project with Preact + Tailwind | [x] | Agent | WXT 0.20.17, Preact 10.28.3, Tailwind v4 |
| Side panel renders with styled heading | [x] | Agent | Dark bg, Tailwind utility classes |
| Background service worker + content script stubs | [x] | Agent | Opens side panel on toolbar click |
| Vite build produces loadable zip | [x] | Agent | `.output/chrome-mv3/manifest.json` verified |
| GitHub Actions CI (lint, types, test, build) | [x] | Agent | `.github/workflows/ci.yml` |
| Vitest configured with smoke test | [x] | Agent | 2 tests passing |
| Project structure matches spec | [x] | Agent | All dirs + .gitkeep files created |

---

## M1: Minimum Viable Analysis

**Status:** Complete
**Goal:** Extract article from news site, analyze with Gemini, display in side panel.

### Stream A: Extraction
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Integrate Readability.js in content script | [x] | Agent | @mozilla/readability, custom .d.ts |
| Extract title, byline, content, outlet domain | [x] | Agent | readability.ts + domain.ts |
| Content script → background messaging | [x] | Agent | EXTRACT_ARTICLE → ARTICLE_EXTRACTED |
| Test extraction on 5 major sites | [x] | Agent | 14 tests passing (vitest + jsdom) |

### Stream B: AI Pipeline
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Define AnalysisResult TypeScript types | [x] | Agent | Zod schemas in common/types.ts |
| Gemini adapter (auth, rate limits, streaming) | [x] | Agent | gemini.ts, @google/genai SDK |
| Pass 1+2 prompt template | [x] | Agent | prompts.ts + data/prompts/pass1-pass2.txt |
| Structured JSON output schema | [x] | Agent | zod-to-json-schema, 28 tests passing |

### Stream C: Side Panel Display
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Raw analysis renderer component | [x] | Agent | AnalysisDisplay + 6 sub-components |
| Loading spinner state | [x] | Agent | LoadingSpinner.tsx |
| Error state display | [x] | Agent | ErrorDisplay.tsx with onRetry |

### Integration
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Wire extraction → AI → display end-to-end | [x] | Agent | App.tsx state machine, background.ts handler |
| First-run API key entry (Gemini) | [x] | Agent | ApiKeyInput.tsx, browser.storage.local |

---

## M2: Polished Single-Provider Experience

**Status:** Not started
**Goal:** Production UI, ownership data, theoretical references, in-page highlights.

### Stream A: Side Panel UI
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Set up Storybook with @storybook/preact-vite | [ ] | | |
| Progressive disclosure redesign | [ ] | | |
| Dark mode (system preference) | [ ] | | |
| Ideological axes visualization | [ ] | | |
| Streaming response display | [ ] | | |

### Stream B: Ownership Data
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Curate top 20 outlets ownership JSON | [ ] | | |
| Ownership display component | [ ] | | |
| Wire domain → ownership lookup into flow | [ ] | | |

### Stream C: Reference Library
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Curate 10 reference entries JSON | [ ] | | |
| Heuristic reference matcher | [ ] | | |
| Further Reading UI component | [ ] | | |

### Stream D: In-Page Highlights
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Shadow DOM highlight injection (3 colors) | [ ] | | |
| Text range matching from AnalysisResult | [ ] | | |
| Hover tooltip with analysis summary | [ ] | | |
| Click highlight → scroll side panel | [ ] | | |
| Toggle highlights on/off | [ ] | | |

### Integration
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Wire ownership + references + highlights | [ ] | | |
| Update prompt for highlight-mappable output | [ ] | | |

---

## M3: Multi-Provider & Resilience

**Status:** Not started
**Goal:** Multiple AI providers, failover, caching, settings page.

### Stream A: Provider Adapters
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Groq adapter (OpenAI-compatible) | [ ] | | |
| Ollama adapter (localhost, health check) | [ ] | | |
| Claude BYOK adapter (Anthropic SDK) | [ ] | | |
| AIProvider abstract interface layer | [ ] | | |

### Stream B: Failover & Routing
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Multi-provider failover with backoff | [ ] | | |
| Provider health dashboard | [ ] | | |

### Stream C: Caching
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| IndexedDB via Dexie.js (CachedAnalysis) | [ ] | | |
| Cache hit UX + re-analyze button | [ ] | | |

### Stream D: Settings Page
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Full settings page (tier, provider, keys) | [ ] | | |
| First-run onboarding wizard | [ ] | | |
| API key encryption (Web Crypto) | [ ] | | |

### Integration
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Wire settings → provider → failover → cache | [ ] | | |
| Test failover with simulated 429s | [ ] | | |

---

## M4: Full Analysis Depth

**Status:** Not started
**Goal:** Reform/Revolution axis, reframing engine, full reference + ownership data.

### Stream A: Reform/Revolution Axis
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Reform/revolution scoring in Pass 2 prompt | [ ] | | |
| Spectrum UI visualization | [ ] | | |
| Auto-link axis-specific references | [ ] | | |

### Stream B: Reframing Engine
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Pass 3 prompt (reframing) | [ ] | | |
| Reframing UI (side-by-side + reference) | [ ] | | |
| Tier gating (skip for small models) | [ ] | | |

### Stream C: Full Reference Library
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Expand to 20+ reference entries | [ ] | | |
| Improved matcher (weighted, topic-aware) | [ ] | | |
| Enhanced Further Reading UI | [ ] | | |

### Stream D: Full Ownership DB
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Expand to 100 outlets | [ ] | | |
| Data quality indicators | [ ] | | |

### Integration
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Wire all new sections into analysis flow | [ ] | | |
| Prompt tuning across 10 test articles | [ ] | | |

---

## M5: Sharing & Distribution

**Status:** Not started
**Goal:** Share cards, accessibility, Chrome Web Store launch.

### Stream A: Share Cards
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Quick Take card generation (html2canvas) | [ ] | | |
| Pull Quote card | [ ] | | |
| Share actions (clipboard, Twitter, Mastodon, Bluesky) | [ ] | | |

### Stream B: UX Polish
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Keyboard shortcut + context menu | [ ] | | |
| Paywall detection | [ ] | | |
| AI disclaimer footer | [ ] | | |
| WCAG 2.1 AA audit + fixes | [ ] | | |

### Stream C: Distribution
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Chrome Web Store listing + submit | [ ] | | |
| Landing page (GitHub Pages) | [ ] | | |
| Open-source repo prep (license, guides) | [ ] | | |

### Stream D: Beta
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Feedback channels (GitHub Discussions) | [ ] | | |
| Beta launch posts | [ ] | | |

---

## M6: Post-Launch Expansion

**Status:** Not started
**Goal:** Firefox, OpenAI BYOK, auto-analyze, community pipeline.

### Stream A: Firefox
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| WXT cross-browser build + Firefox testing | [ ] | | |
| Firefox AMO listing | [ ] | | |

### Stream B: OpenAI BYOK
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| OpenAI adapter (function calling) | [ ] | | |
| HuggingFace + OpenRouter adapters | [ ] | | |

### Stream C: Auto-Analyze
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Known news domain list + auto-trigger | [ ] | | |
| Rate limiting + priority queue | [ ] | | |

### Stream D: Community Pipeline
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Ownership data PR template + CI validation | [ ] | | |
| Reference library PR template | [ ] | | |
| OWNERSHIP_DATA.md contribution guide | [ ] | | |

---

## Blockers & Open Questions

| Issue | Milestone | Status | Resolution |
|-------|-----------|--------|------------|
| *None yet* | | | |
