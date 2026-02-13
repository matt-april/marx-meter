# Marx Meter — Progress Tracker

> **Updated by AI agents during implementation.** Check this file to see what's done, what's in progress, and what's blocked.

## Status Key

- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Complete
- `[!]` — Blocked (see notes)

---

## M0: Project Scaffolding

**Status:** Not started
**Goal:** Extension loads in Chrome, opens side panel, CI passes.

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Init WXT project with Preact + Tailwind | [ ] | | |
| Side panel renders with styled heading | [ ] | | |
| Background service worker + content script stubs | [ ] | | |
| Vite build produces loadable zip | [ ] | | |
| GitHub Actions CI (lint, types, test, build) | [ ] | | |
| Vitest configured with smoke test | [ ] | | |
| Project structure matches spec | [ ] | | |

---

## M1: Minimum Viable Analysis

**Status:** Not started
**Goal:** Extract article from news site, analyze with Gemini, display in side panel.

### Stream A: Extraction
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Integrate Readability.js in content script | [ ] | | |
| Extract title, byline, content, outlet domain | [ ] | | |
| Content script → background messaging | [ ] | | |
| Test extraction on 5 major sites | [ ] | | |

### Stream B: AI Pipeline
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Define AnalysisResult TypeScript types | [ ] | | |
| Gemini adapter (auth, rate limits, streaming) | [ ] | | |
| Pass 1+2 prompt template | [ ] | | |
| Structured JSON output schema | [ ] | | |

### Stream C: Side Panel Display
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Raw analysis renderer component | [ ] | | |
| Loading spinner state | [ ] | | |
| Error state display | [ ] | | |

### Integration
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Wire extraction → AI → display end-to-end | [ ] | | |
| First-run API key entry (Gemini) | [ ] | | |

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
