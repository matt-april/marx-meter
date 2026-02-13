# Product Requirements Document: Marx Meter

**Version:** 2.1
**Author:** Matt
**Date:** February 13, 2026
**Status:** Draft

---

## 1. Vision & Mission

### Vision
A world where every person can critically analyze media and understand whose interests are being served by the news they consume.

### Mission
Build an open-source browser extension that deconstructs news articles in-place to reveal class interests, framing choices, ownership structures, and ideological underpinnings — grounded in the tradition of materialist media criticism and accessible to everyone, not just those with media studies degrees.

### Tagline
*"Who benefits? Now you'll know."*

---

## 2. Problem Statement

Most people consume news passively, unaware of the editorial framing, ownership structures, and class interests embedded in the stories they read. Critical media literacy — understanding *who* is telling you *what* and *why* — is a skill traditionally limited to academia. Meanwhile:

- Six corporations control over 90% of U.S. media.
- News outlets routinely frame labor disputes, housing policy, healthcare, and economic issues in ways that serve capital over workers.
- Readers lack accessible tools to identify framing techniques like passive voice in police reporting, euphemisms for corporate layoffs, or the absence of worker perspectives in labor coverage.
- Media ownership databases exist but are fragmented and inaccessible to general audiences.
- The rich tradition of leftist media criticism (Herman & Chomsky, Gramsci, Debord, etc.) is locked in books that most people will never read.

There is no consumer tool that combines AI-powered textual analysis with media ownership data and grounded leftist theory to give readers an instant, contextual breakdown of the ideological lens through which their news is filtered — right where they read it.

---

## 3. Target Users

### Primary Personas

**The Curious Reader** — A politically engaged person (25–45) who reads news daily and senses bias but lacks the framework to articulate it. They want analysis *while reading*, not as a separate activity.

**The Organizer** — A DSA member, union organizer, or activist who needs to quickly deconstruct media narratives for newsletters, teach-ins, or social media counter-narratives. Time-strapped, needs fast results without leaving the page.

**The Educator** — A high school or college instructor teaching media literacy, political science, or journalism ethics. Needs a tool that can generate discussion prompts and illustrate framing techniques with real examples, connected to foundational texts.

### Secondary Personas

**The Student** — Doing research or writing papers on media bias, needs structured analysis they can cite and build on. The literature references give them a starting point for deeper reading.

**The Self-Educator** — Interested in leftist theory but intimidated by dense academic texts. The extension serves as a gateway, showing how theory applies to the news they already read.

---

## 4. Core Features

### 4.1 In-Page Article Extraction

**Description:** The extension detects and extracts article content from the active browser tab. No copy-paste, no separate app — analysis happens in context.

**Activation Methods:**

| Method | Details |
|---|---|
| Toolbar icon click | Click the extension icon while on any news article page |
| Right-click context menu | Right-click → "Decode This Article" |
| Keyboard shortcut | Configurable hotkey (default: `Ctrl+Shift+D` / `Cmd+Shift+D`) |

**Requirements:**
- Extract article text, headline, byline, publication date, and outlet name from the active tab's DOM
- Handle major CMS layouts: WordPress, Arc, Chorus (Vox Media), Reuters/AP wire formats, Substack, Medium, Ghost
- Automatic outlet identification from URL domain
- Graceful handling of paywalled content: analyze whatever is visible in the DOM, flag if content appears truncated
- All extraction happens client-side — no article text is sent to any server we control
- Support for reader-mode / simplified article views

### 4.2 Class Interest Analysis (Core AI Feature)

**Description:** The primary analysis engine. Uses AI to identify whose economic and class interests are served or harmed by the article's framing.

**Analysis Dimensions:**

1. **Who Benefits?** — Identify which groups (capital, labor, landlords, tenants, corporations, workers, etc.) are positioned favorably by the article's framing.

2. **Who Is Absent?** — Identify perspectives, voices, or stakeholders that are conspicuously missing. (e.g., "This article about a factory closure quotes the CEO and a market analyst but no workers or union representatives.")

3. **Language & Framing Deconstruction:**
   - Passive vs. active voice analysis (e.g., "Officer-involved shooting" vs. "Police shot")
   - Euphemism detection (e.g., "right-sizing" = layoffs, "entitlement reform" = cuts)
   - Source hierarchy — who is quoted first, most, and with authority?
   - Headline vs. body alignment — does the headline editorialize beyond the reported facts?

4. **Ideological Framing Score** — A multi-axis assessment (NOT a simple left-right score):
   - Pro-capital ↔ Pro-labor
   - Individualist ↔ Systemic framing
   - Status quo ↔ Reform ↔ Revolutionary (three-point spectrum, see Section 4.7)
   - Nationalist ↔ Internationalist

5. **Historical & Structural Context** — What systemic context does the article omit? (e.g., An article about homelessness that never mentions housing commodification or wage stagnation.)

**Output Format:** Structured, annotated breakdown with specific quotes from the article mapped to analysis points. Each claim must reference the source text.

### 4.3 Media Ownership Lookup

**Description:** Bundled ownership database shipped with the extension, enriched by optional API lookups.

**Data Points:**
- Parent company and corporate ownership chain
- Major shareholders (institutional and individual)
- Known political donations by ownership (FEC data)
- Other media properties owned by the same parent
- Revenue model (ad-supported, subscription, nonprofit, state-funded)
- Any known editorial policy statements or documented biases

**Data Sources:**
- Bundled JSON dataset of top 200 outlets (shipped with extension, updated via extension updates)
- Columbia Journalism Review's media ownership database
- OpenCorporates API (optional, for deeper lookups)
- FEC campaign finance data / OpenSecrets API
- SEC filings (for publicly traded parent companies)
- Community-contributed additions via GitHub PRs

**Implementation Note:** The core ownership database is a static JSON file bundled with the extension. This means ownership lookups require zero network calls for covered outlets, work offline, and have no privacy implications. The dataset is versioned alongside the extension code.

### 4.4 Theoretical Reference Engine

**Description:** Every analytical conclusion is grounded in and linked to foundational leftist texts. The extension doesn't just tell you *what* framing is happening — it tells you *which thinkers* described this phenomenon and *where to read more*.

**Reference Library (Bundled):**

The extension ships with a curated mapping of analytical concepts to source texts:

| Concept | Primary References |
|---|---|
| Manufacturing Consent / Propaganda Model | Herman & Chomsky, *Manufacturing Consent* (1988) — Ch. 1-2 (5 filters) |
| Cultural Hegemony / Naturalizing ideology | Gramsci, *Prison Notebooks* (1929–35) — "Hegemony" sections |
| Spectacle / Mediated reality | Debord, *The Society of the Spectacle* (1967) — Theses 1–34 |
| Ideology & interpellation | Althusser, *Ideology and Ideological State Apparatuses* (1970) |
| Base/superstructure & media | Marx & Engels, *The German Ideology* (1846) — Part I |
| Commodity fetishism in media | Marx, *Capital* Vol. 1 (1867) — Ch. 1, Section 4 |
| Recuperation / co-optation of dissent | Debord, *The Society of the Spectacle* — Theses 203–211 |
| Ruling class control of ideas | Marx & Engels, *The German Ideology* — "Ruling class ideas" |
| Orientalism / imperial framing | Said, *Orientalism* (1978) — Introduction + Ch. 1 |
| Racial capitalism & media | Robinson, *Black Marxism* (1983) — Ch. 1, 9–12 |
| Feminism & media objectification | hooks, *Feminist Theory: From Margin to Center* (1984) |
| Public sphere & its limits | Habermas, *The Structural Transformation of the Public Sphere* (1962) |
| Inverted totalitarianism / managed democracy | Wolin, *Democracy Incorporated* (2008) |
| Neoliberal rationality | Brown, *Undoing the Demos* (2015) — Ch. 1–3 |
| Reform vs. revolution debate | Luxemburg, *Reform or Revolution* (1899); Lenin, *What Is to Be Done?* (1902) |
| Capitalist realism / "no alternative" | Fisher, *Capitalist Realism* (2009) |
| Mutual aid vs. charity framing | Kropotkin, *Mutual Aid* (1902); Spade, *Mutual Aid* (2020) |
| Primitive accumulation / enclosure narratives | Marx, *Capital* Vol. 1 — Ch. 26–33 |
| Labor aristocracy & media complicity | Lenin, *Imperialism* (1917) — Ch. 8 |
| Dialectical analysis | Engels, *Anti-Dühring* (1878); Ollman, *Dance of the Dialectic* (2003) |

**How References Appear in Analysis:**

Each analytical finding includes a `📚 Further Reading` link that expands to show:
- The relevant theoretical concept name
- Author, work, and specific chapter/section
- A 1–2 sentence plain-language explanation of how the concept applies
- A link to a free online version where available (Marxists.org, Internet Archive, etc.)

**Example:**
> **Finding:** This article quotes 3 corporate executives and 1 "unnamed administration official" but zero workers or union representatives.
>
> 📚 **Manufacturing Consent — The Propaganda Model**
> Herman & Chomsky argue that mainstream media systematically favors elite sources because of structural dependencies on corporate advertising, government access, and official "experts." This sourcing pattern is a textbook example of their third filter: "sourcing mass media news."
> → [Read Chapter 2 on Marxists.org](#)

### 4.5 Reform vs. Revolution Framing Axis

**Description:** A dedicated analytical dimension that assesses where an article's implicit assumptions fall on the reform–revolution spectrum. This goes beyond the standard ideological axes to ask a question central to socialist strategy: *Does this article assume the existing system can be fixed, or does it (intentionally or not) reveal contradictions that suggest systemic transformation is necessary?*

**Three-Point Spectrum:**

```
┌─────────────────────────────────────────────────────────────┐
│  REFORMIST         │        AMBIGUOUS        │ REVOLUTIONARY │
│                    │                         │               │
│  Assumes existing  │  Identifies systemic    │ Frames issues │
│  institutions can  │  problems but proposes  │ as inherent   │
│  solve the problem │  solutions within the   │ contradictions │
│  with policy       │  current system, or     │ of capitalism  │
│  adjustments       │  presents tension       │ requiring      │
│                    │  between reform and     │ structural     │
│                    │  deeper change          │ transformation │
├─────────────────────────────────────────────────────────────┤
│  Indicators:       │  Indicators:            │ Indicators:    │
│  • "We need better │  • Acknowledges system  │ • Names        │
│    regulation"     │    failures but stops   │   capitalism   │
│  • Centers         │    short of systemic    │   as the       │
│    electoral       │    critique             │   problem      │
│    solutions       │  • Platforming both     │ • Centers      │
│  • Treats market   │    reformist and        │   worker       │
│    failures as     │    radical voices       │   ownership    │
│    exceptions      │  • Tension between      │ • Questions    │
│  • "Bipartisan"    │    headline and body    │   property     │
│    framing         │                         │   relations    │
└─────────────────────────────────────────────────────────────┘
```

**Reference Texts for This Axis:**
- Luxemburg, *Reform or Revolution* (1899) — The foundational text
- Lenin, *What Is to Be Done?* (1902) — On the limits of trade-union consciousness
- Fisher, *Capitalist Realism* (2009) — On how media forecloses revolutionary imagination
- Gramsci, *Prison Notebooks* — On how reformism serves hegemonic stability

**Implementation Note:** The AI analysis should identify specific textual evidence for the placement on this spectrum. It's not enough to say "this article is reformist" — the analysis must show *which sentences or framings* lead to that conclusion, and *which theoretical framework* explains why that matters.

### 4.6 Shareable Analysis Cards

**Description:** Generate visually compelling, shareable summary cards from the analysis panel.

**Card Types:**
- **Quick Take** — Single-image summary card with headline, outlet, ownership badge, and 3 key framing findings
- **Pull Quote** — Highlight a specific framing choice with the theoretical reference

**Requirements:**
- Generated client-side using Canvas API or html2canvas (no server needed)
- Copy to clipboard as image
- Direct share to Twitter/X, Mastodon, Bluesky (via share API or URL schemes)
- Include "Decoded with [extension name]" branding + Chrome Web Store link for organic growth

### 4.7 "How Would This Read Differently?" Reframing Engine

**Description:** AI-powered rewrite of key passages showing how the same facts could be framed from a worker/public interest perspective.

**Example:**
> **Original:** "Amazon announced plans to streamline operations, resulting in 18,000 position eliminations as part of its cost optimization strategy."
>
> **Reframed:** "Amazon is laying off 18,000 workers to boost profits after a hiring spree during the pandemic, when the company's revenue surged while warehouse workers reported dangerous conditions."

**Constraints:**
- Reframes must use the same underlying facts — no fabrication
- Clearly labeled as alternative framing, not "the truth"
- Educational purpose: teach users to recognize framing, not replace one bias with another
- Each reframe includes a 📚 reference explaining the theoretical basis for the alternative framing

---

## 5. Technical Architecture

### 5.1 System Overview

The extension is designed as a **client-heavy, server-optional** architecture. The core experience works with zero backend infrastructure — all processing can happen in the browser using the user's own AI API key.

```
┌──────────────────────────────────────────────────────────────┐
│                  Browser Extension                            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Content     │  │   Popup /    │  │   Background      │  │
│  │   Script      │  │   Side Panel │  │   Service Worker  │  │
│  │              │  │              │  │                   │  │
│  │  • DOM       │  │  • Analysis  │  │  • AI API calls   │  │
│  │    extraction│  │    display   │  │  • Model routing   │  │
│  │  • In-page   │  │  • Settings  │  │  • Ownership DB   │  │
│  │    highlights│  │  • Share     │  │    lookups         │  │
│  │  • Overlay   │  │    cards     │  │  • Rate limiting   │  │
│  │    injection │  │  • Reading   │  │  • Cache (IDB)     │  │
│  │              │  │    list      │  │                   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │
│         │                 │                    │              │
│         └─────────── Message Passing ──────────┘              │
├──────────────────────────────────────────────────────────────┤
│                  Bundled Data                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Ownership   │  │  Reference   │  │  Prompt           │  │
│  │  Database    │  │  Library     │  │  Templates         │  │
│  │  (JSON)      │  │  (JSON)      │  │  (versioned)       │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│                  External AI APIs                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tier 1 — Free Cloud (Default)                       │   │
│  │  Google Gemini │ Groq │ HuggingFace │ OpenRouter     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tier 2 — Local              │  Tier 3 — BYOK        │   │
│  │  Ollama (localhost)          │  Anthropic Claude      │   │
│  │                              │  OpenAI (optional)     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Extension Framework | Chrome Extension Manifest V3 + Firefox WebExtension | Cross-browser compat; MV3 is required for Chrome Web Store going forward |
| UI Framework | Preact + Tailwind CSS (in side panel) | Lightweight React alternative ideal for extensions; small bundle size |
| State Management | Zustand | Minimal, works great with Preact, no boilerplate |
| Build System | Vite + CRXJS or WXT (Web Extension Toolkit) | WXT is purpose-built for cross-browser extension development with HMR |
| Article Extraction | Readability.js (Mozilla) + custom DOM parsers | Same engine behind Firefox Reader View; battle-tested, runs client-side |
| Local Storage | IndexedDB (via Dexie.js) | Cache analyses, store settings, offline ownership DB |
| AI — Free Cloud (Default) | Google Gemini API, Groq, HuggingFace, OpenRouter | Free cloud inference, no credit card needed; Gemini for quality, Groq for speed, failover across providers |
| AI — Local | Ollama (local) via `localhost` API | Runs Llama 3, Mistral, Qwen locally; zero cost, maximum privacy, offline capable |
| AI — Premium BYOK | Anthropic Claude API (BYOK) | Best reasoning for nuanced ideological analysis; user provides their own key |
| AI — Alt BYOK | OpenAI API (BYOK) | Some users may prefer GPT-4o; support as secondary option |
| Share Card Rendering | html2canvas or Satori (Vercel) | Client-side image generation, no server needed |
| Testing | Vitest + Playwright (extension testing) | Fast unit tests + E2E browser extension testing |
| CI/CD | GitHub Actions | Automated builds, Chrome Web Store + Firefox AMO publishing |

### 5.3 AI Model Strategy — Tiered Analysis

The extension supports three tiers of AI analysis. The user chooses their tier in settings. The key design principle: **the default experience requires zero local installs and zero API keys beyond a free one.**

**Tier 1: Free Cloud APIs (Default — Zero Setup Friction)**

The default tier uses free cloud inference APIs that require only a free API key (no credit card, no local install). The extension walks users through getting a key on first run.

| Provider | Model | Free Limits | Strengths |
|---|---|---|---|
| **Google Gemini** (recommended default) | Gemini 2.5 Flash | 10 RPM, 250 RPD, 250K TPM | Best free limits, 1M context window, no credit card required, structured output support |
| **Google Gemini** | Gemini 2.5 Pro | 5 RPM, 100 RPD, 250K TPM | Strongest reasoning on free tier, but lower daily quota |
| **Groq** | Llama 3.3 70B Versatile | 30 RPM, 1,000 RPD, 6K TPM | Blazing fast inference on custom LPU hardware, very generous daily limits |
| **Groq** | Llama 4 Maverick 17B | 30 RPM, 1,000 RPD | Newer model, strong reasoning |
| **HuggingFace Inference** | Llama 3.1 70B, Mistral, Qwen 2.5 | 30 RPM, 14,400 RPD | Massive model variety, OpenAI-compatible API |
| **OpenRouter** | Various free models (Llama 3.3 70B, DeepSeek R1, Gemma 3 27B) | 20 RPM, 50 RPD (200 w/ $10 lifetime topup) | Single key, many free models, easy switching |

**Recommended default flow:**
1. First run → prompt user to select a free provider (Gemini recommended for quality, Groq for speed)
2. Link directly to provider's API key page (e.g., `aistudio.google.com/apikey`)
3. User pastes key → extension validates with a test call → ready to analyze
4. Total time from install to first analysis: **~2 minutes**

**Multi-provider failover:** The extension can be configured to cascade through multiple free providers. If Gemini returns a 429 (rate limited), automatically try Groq, then HuggingFace. This gives users effectively unlimited free analyses per day across combined providers.

- **Cost:** $0 (all providers offer genuinely free tiers, no credit card required)
- **Privacy:** Article text sent to the chosen provider's API under their respective data policies; keys stored encrypted locally
- **Tradeoffs:** Rate limits exist but are generous for individual use (a user analyzing 5–10 articles/day will never hit limits on any single provider); free tiers can change without warning (Google notably cut limits in Dec 2025)

**Tier 2: Ollama Local (Maximum Privacy / Offline Use)**

- **Model:** Ollama running locally (Llama 3.1 8B, Mistral 7B, or Qwen 2.5 7B recommended; 70B+ for higher quality on capable hardware)
- **Setup:** User installs Ollama (`ollama.com`), pulls a model, extension connects to `http://localhost:11434`
- **Capabilities:** Solid framing analysis, euphemism detection, source counting. May miss nuance on complex ideological analysis with smaller models; can match Tier 3 quality with 70B+ models on capable hardware.
- **Cost:** $0 (electricity only)
- **Privacy:** Maximum — nothing leaves the user's machine. Ideal for journalists, activists in sensitive contexts, or anyone who doesn't want article reading habits sent to cloud providers.
- **Tradeoffs:** Requires local install + multi-GB model download, slower on older hardware

**Tier 3: Premium Cloud with BYOK (Best Analysis Quality)**

- **Model:** Claude Sonnet 4.5 (default) or Claude Opus 4.5 (user-selectable)
- **Setup:** User enters their Anthropic API key in extension settings
- **Capabilities:** Full multi-pass analysis, nuanced reform/revolution classification, high-quality reframing, sophisticated theoretical grounding
- **Cost:** ~$0.01–0.05 per analysis (user pays via their own API account)
- **Privacy:** Article text sent to Anthropic's API under their data policy; API keys stored using `chrome.storage.local` with encryption, never synced, never transmitted to any server we control
- **Also supported:** OpenAI GPT-4o (BYOK), Google Gemini paid tiers (BYOK)

**Prompt Adaptation Layer:**

A prompt adapter normalizes the analysis prompts across all providers via a unified interface:

```
PromptTemplate (canonical, provider-agnostic)
    ├── GeminiAdapter     → Google AI SDK, structured output via response_schema
    ├── GroqAdapter       → OpenAI-compatible API, optimized for Llama/Mixtral models
    ├── HuggingFaceAdapter → OpenAI-compatible API, model-agnostic
    ├── OpenRouterAdapter → OpenAI-compatible API, model routing via model param
    ├── OllamaAdapter     → Simplified prompts, shorter context, JSON mode
    ├── ClaudeAdapter     → Full prompts, XML tags, extended thinking
    └── OpenAIAdapter     → Function calling for structured output
```

All prompt templates are stored as versioned JSON files bundled with the extension and open-source.

**Why default to free cloud instead of Ollama:**
- Ollama requires installing a separate application, downloading a multi-GB model, and having capable hardware. This is a significant friction barrier for the target audience (organizers, educators, curious readers — not all developers).
- Free cloud APIs require only pasting an API key, which takes ~60 seconds. The extension links directly to the key generation page.
- For a socialist education tool, **accessibility is a political choice.** The lowest-friction path to a first analysis must be the default.

### 5.4 AI Prompt Architecture

The analysis engine uses a structured, multi-pass prompt chain. The number of passes adapts to the AI tier:

**Pass 1 — Extraction & Classification (All Tiers)**
- Extract: headline, lede, sources quoted (name + role + affiliation), key claims, statistics cited
- Classify: topic domain (labor, housing, healthcare, police, foreign policy, etc.)
- Output: structured JSON

**Pass 2 — Deep Framing Analysis (All Tiers, depth varies)**
- Input: Pass 1 output + full article text + topic-specific analysis rubric
- Analyze: all dimensions from Section 4.2, including reform/revolution axis
- Match findings to theoretical reference library entries
- Output: structured analysis with source-text citations and reference IDs

**Pass 3 — Theoretical Synthesis & Reframing (Tier 3 BYOK Only)**
- Input: Pass 2 output + matched reference entries from the bundled library
- Synthesize: connect findings to theoretical frameworks with specific chapter/section citations
- Generate: reframed passages for top 3 most ideologically loaded excerpts
- Output: final enriched analysis

**For Tier 2 (Ollama with small models):** Passes 1 and 2 are combined into a single, simplified prompt. Theoretical references are matched heuristically by the extension code (keyword matching against the reference library) rather than by the model. Reframing is basic or omitted.

**For Tier 1 (Free Cloud APIs):** Full Pass 1 + Pass 2 with most models (Gemini 2.5 Flash and Llama 3.3 70B are capable enough for strong analysis). Pass 3 attempted if model quality is sufficient (Gemini 2.5 Pro, DeepSeek R1). Theoretical references use a hybrid of AI matching + heuristic fallback.

**Prompt Design Principles:**
- All prompts open-source and community-auditable
- Versioned with semantic versioning (prompt changes = minor version bump)
- Include few-shot examples for each topic domain
- Temperature: 0.3 for analysis, 0.7 for reframing
- Tier 1 prompts optimized for 4K context windows; Tier 2 prompts can use full context

### 5.5 Data Models

All data stored locally in IndexedDB:

```
CachedAnalysis
├── id (auto-increment)
├── url (indexed)
├── url_hash (for dedup)
├── article_text_hash (content-based cache key)
├── outlet_domain
├── analyzed_at (timestamp)
├── model_tier (1|2|3)
├── model_id (e.g., "gemini-2.5-flash", "llama-3.3-70b", "claude-sonnet-4-5")
├── prompt_version
├── extraction_result (JSON — Pass 1 output)
├── analysis_result (JSON — Pass 2 output)
├── synthesis_result (JSON — Pass 3 output, nullable)
├── reform_revolution_score (number, 0–10)
├── theoretical_references[] (reference IDs matched)
└── share_card_image (Blob, nullable)

OutletOwnership (bundled, read-only)
├── domain (primary key)
├── name
├── parent_company
├── ownership_chain[] → { name, type, ownership_pct }
├── revenue_model
├── political_donations[] → { recipient, amount, cycle, party }
├── other_properties[]
├── editorial_notes
└── last_updated

TheoreticalReference (bundled, read-only)
├── id (e.g., "manufacturing-consent-filters")
├── concept_name
├── author
├── work_title
├── year
├── specific_section
├── plain_language_summary (1-2 sentences)
├── keywords[] (for heuristic matching in Tier 1)
├── free_url (Marxists.org, Internet Archive, etc.)
└── analysis_triggers[] (phrases/patterns that should surface this reference)

UserSettings
├── ai_tier (1|2|3)
├── # Tier 1 — Free Cloud
├── free_provider (gemini|groq|huggingface|openrouter)
├── free_provider_failover_order[] (e.g., ["gemini","groq","huggingface"])
├── gemini_api_key (encrypted)
├── gemini_model (default: gemini-2.5-flash)
├── groq_api_key (encrypted)
├── groq_model (default: llama-3.3-70b-versatile)
├── huggingface_api_key (encrypted)
├── huggingface_model (default: meta-llama/Llama-3.1-70B-Instruct)
├── openrouter_api_key (encrypted)
├── openrouter_model (default: meta-llama/llama-3.3-70b-instruct:free)
├── # Tier 2 — Local
├── ollama_url (default: http://localhost:11434)
├── ollama_model (default: llama3.1:8b)
├── # Tier 3 — Premium BYOK
├── anthropic_api_key (encrypted)
├── anthropic_model (default: claude-sonnet-4-5)
├── openai_api_key (encrypted)
├── openai_model (default: gpt-4o)
├── # General
├── keyboard_shortcut
├── auto_analyze (boolean — analyze on page load for known news domains)
├── show_inline_highlights (boolean, default: true)
└── analysis_history_retention_days (default: 90)
```

---

## 6. UX & Design

### 6.1 Core User Flow

```
1. User navigates to a news article
2. Clicks extension icon (or keyboard shortcut, or right-click)
3. Side panel opens with loading state + progressive reveal:

   ┌─────────────────────────────────────────────┐
   │  📰 Headline + Outlet                       │
   │  🏢 Ownership: News Corp → Rupert Murdoch   │
   │     💰 $2.3M to Republican candidates (2024) │
   │─────────────────────────────────────────────│
   │  🔍 Quick Take                              │
   │  "This article frames mass layoffs as       │
   │   shareholder value creation, centering      │
   │   investor sentiment over worker impact."    │
   │─────────────────────────────────────────────│
   │  👥 Who Benefits / Who's Absent              │
   │     Benefits: Shareholders, C-suite          │
   │     Absent: Workers, unions, communities     │
   │─────────────────────────────────────────────│
   │  📝 Framing Annotations                     │
   │  [highlighted excerpts with explanations]    │
   │─────────────────────────────────────────────│
   │  📊 Ideological Axes                        │
   │  Pro-capital ████████░░                      │
   │  Individualist ██████░░░░                    │
   │  Reform ↔ Revolution [REFORMIST]             │
   │  Nationalist ████░░░░░░                      │
   │─────────────────────────────────────────────│
   │  📚 Theoretical Grounding                   │
   │  ▸ Manufacturing Consent — 3rd Filter        │
   │  ▸ Capitalist Realism — "No Alternative"     │
   │  ▸ Luxemburg — Reform or Revolution          │
   │    [each expandable with summary + link]     │
   │─────────────────────────────────────────────│
   │  🔄 "How Would This Read Differently?"       │
   │  [3 reframed passages, each with 📚 ref]     │
   │─────────────────────────────────────────────│
   │  📤 Share Card  │  💾 Save  │  ⚙️ Settings  │
   └─────────────────────────────────────────────┘

4. Meanwhile, article text on the page gets subtle
   highlights on key framing choices (opt-in)
5. Clicking a highlight scrolls the side panel
   to the relevant analysis point
```

### 6.2 In-Page Highlights (Content Script)

When analysis completes, the content script can optionally inject subtle highlights into the article text:

- **Red underline** — Euphemisms or loaded language
- **Yellow highlight** — Sourcing imbalances (e.g., "an unnamed official said")
- **Blue margin note** — Missing context or absent perspectives

Hovering a highlight shows a tooltip with the analysis point + 📚 reference. Clicking scrolls the side panel to that section.

Highlights are **on by default** and toggled via the side panel. They use CSS custom properties scoped to the extension's shadow DOM to avoid interfering with page styles.

### 6.3 Design Principles

- **Zero friction** — One click from reading to analysis. No account, no paste, no navigation.
- **In-context** — Analysis appears alongside the article, not in a separate tab.
- **Progressive disclosure** — Quick Take first, details on demand. Theoretical references are expandable, not in-your-face.
- **Educational, not preachy** — Show, don't tell. Let the analysis and the theory speak.
- **Privacy-first** — No analytics, no tracking, no phoning home. API calls go directly from user's browser to their chosen AI provider.
- **Accessible** — WCAG 2.1 AA minimum, keyboard navigable side panel, screen reader support.
- **Fast** — Streaming analysis output so users see results building in real-time.
- **Dark mode** — Matches the user's system preference and the article page's color scheme.
- **Lightweight** — Extension bundle < 2MB including all bundled data.

---

## 7. MVP Scope (v1.0)

### In Scope
- Chrome extension (Manifest V3)
- One-click article analysis from any news page
- Side panel analysis display with all core dimensions
- In-page text highlights and annotations (euphemisms, sourcing imbalances, missing context) with hover tooltips and side panel linking
- Free cloud AI tier as default (Google Gemini API free tier, Groq free tier, or HuggingFace Inference — no local install required)
- Ollama local model support (for maximum privacy / offline use)
- Anthropic Claude BYOK support (advanced tier)
- Bundled ownership database (top 100 outlets)
- Bundled theoretical reference library (20+ texts)
- Reform vs. Revolution framing axis
- 📚 Further Reading links on all analysis findings
- Shareable Quick Take cards (client-side image generation)
- Analysis caching in IndexedDB
- Keyboard shortcut activation
- No account required, no backend, no tracking

### Out of Scope (v2+)
- Firefox extension port (v1.1 — WXT makes this straightforward)
- OpenAI BYOK support
- Auto-analyze on page load for known news domains
- Community ownership database contributions (GitHub PR workflow)
- Analysis export (PDF, markdown)
- Educator toolkit (lesson plan templates, discussion guides)
- Non-English language support
- Podcast/video transcript analysis (paste transcript as text workaround)
- Safari extension

---

## 8. Success Metrics

### Launch Metrics (First 30 Days)
| Metric | Target |
|---|---|
| Chrome Web Store installs | 5,000 |
| Articles analyzed (aggregate, anonymous count only) | 10,000 |
| Share cards generated | 1,000 |
| GitHub stars | 200 |
| Chrome Web Store rating | 4.5+ stars |

### Growth Metrics (6 Months)
| Metric | Target |
|---|---|
| Active weekly users | 15,000 |
| DSA chapters recommending the tool | 20 |
| Educators using in classrooms | 30 |
| Contributors to ownership database | 20 |
| Theoretical reference library entries | 50+ |

### Quality Metrics
| Metric | Target |
|---|---|
| Analysis accuracy — Tier 3 BYOK (human review sample) | >85% agreement |
| Analysis accuracy — Tier 1 Free Cloud (human review) | >75% agreement |
| Analysis accuracy — Tier 2 Ollama 8B (human review) | >65% agreement |
| Article extraction success rate | >90% across top 50 news sites |
| Median analysis latency — Tier 2 | <12 seconds |
| Median analysis latency — Tier 1 (local, M-series Mac) | <30 seconds |

---

## 9. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| AI hallucination in analysis | High | Multi-pass validation, require source-text citations for every claim, prominent AI disclaimer |
| Chrome Web Store rejection | High | Ensure compliance with MV3 policies; no remote code execution; clear privacy policy; transparent permissions |
| Free cloud API rate limits / changes | High | Multi-provider failover (Gemini → Groq → HuggingFace); cached analyses reduce repeat calls; Google notably cut free limits in Dec 2025 without warning |
| Accusations of partisan bias | Medium | Open-source prompts, multi-axis framing (not binary), grounding in published academic theory, community audit |
| API key security | Medium | Encrypt keys in `chrome.storage.local`, never sync to cloud, clear documentation of data flow |
| Outlet ownership data staleness | Medium | Quarterly update cadence, community PR workflow, last-updated timestamps visible to users |
| Content script conflicts with news site JS | Medium | Shadow DOM isolation, minimal DOM manipulation, user toggle to disable highlights |
| Free provider deprecation | Medium | Provider-agnostic prompt adapter layer means switching providers requires zero prompt changes; users can always fall back to Ollama or BYOK |
| Hostile takedown via Chrome Web Store report abuse | Low | Firefox AMO as backup distribution, self-hosted .crx for direct install, AGPL source always available |

---

## 10. Sustainability & Cost Model

This is a public good with zero operating costs by design.

**Why no backend = no costs:**
- AI inference is either local (Ollama) or paid by the user (BYOK)
- Ownership database is bundled static data
- Analysis caching is client-side (IndexedDB)
- Share cards are rendered client-side
- Distribution is via Chrome Web Store (free) and GitHub (free)

**Ongoing costs:**
| Item | Cost |
|---|---|
| Chrome Web Store developer account | $5 one-time |
| Domain for project site / docs | ~$12/year |
| GitHub (public repo) | $0 |
| **Total annual cost** | **~$12/year** |

**User costs (AI inference):**
| Tier | User Cost Per Analysis |
|---|---|
| Tier 1 — Free Cloud (Gemini, Groq, HuggingFace, OpenRouter) | $0 |
| Tier 2 — Ollama (local) | $0 (electricity only) |
| Tier 3 — Claude Sonnet (BYOK) | ~$0.01–0.03 |
| Tier 3 — Claude Opus (BYOK) | ~$0.05–0.15 |

**Funding model (if desired):**
- GitHub Sponsors / Open Collective for development time
- Grant applications to media literacy foundations
- No premium tier, no paywall, no ads — ever

---

## 11. Development Roadmap

### Phase 1: Core Extension (Weeks 1–4)
- [ ] Initialize WXT project with Preact + Tailwind
- [ ] Chrome MV3 extension scaffolding (background worker, content script, side panel)
- [ ] Article extraction using Readability.js + custom parsers for top 10 news sites
- [ ] Free cloud AI integration: Gemini adapter + Groq adapter (OpenAI-compatible)
- [ ] Ollama integration (localhost API, model detection, health check)
- [ ] Anthropic Claude BYOK integration (key storage, model selection)
- [ ] Prompt adapter layer (unified interface across all providers)
- [ ] Multi-provider failover logic (Gemini → Groq → HuggingFace on 429)
- [ ] Core analysis prompt chain (Pass 1 + Pass 2)
- [ ] Side panel UI: analysis display with progressive reveal
- [ ] In-page highlight system (content script, shadow DOM isolation)
- [ ] Highlight ↔ side panel linking (click highlight → scroll to analysis point)
- [ ] Settings page: AI tier selection, API key entry, model config
- [ ] First-run onboarding flow (free API key setup wizard with direct links to provider key pages)

### Phase 2: Data & Theory (Weeks 5–8)
- [ ] Curate and bundle top 100 outlet ownership database (JSON)
- [ ] Build theoretical reference library (20+ entries, JSON)
- [ ] Implement reference matching — heuristic (Tier 1/2) and AI-driven (Tier 3)
- [ ] Reform vs. Revolution axis implementation and scoring
- [ ] Pass 3 prompt (theoretical synthesis + reframing) for Tier 3
- [ ] Ownership display component in side panel
- [ ] 📚 Further Reading expandable sections with external links (Marxists.org, Internet Archive)
- [ ] Analysis caching layer (IndexedDB via Dexie.js)
- [ ] HuggingFace + OpenRouter adapter integration

### Phase 3: Polish & Launch (Weeks 9–12)
- [ ] Share card generation (html2canvas, copy to clipboard)
- [ ] Keyboard shortcut configuration
- [ ] Highlight styling refinement (red underline, yellow highlight, blue margin notes)
- [ ] Highlight hover tooltips with analysis summaries + 📚 references
- [ ] Extension icon badge (analyzed/not-analyzed state)
- [ ] Privacy policy and Chrome Web Store listing
- [ ] Project landing page (GitHub Pages or simple static site)
- [ ] Open-source repo setup (AGPL-3.0, contributing guide, code of conduct, prompt audit process)
- [ ] Beta launch: DSA tech channels, leftist Reddit, media literacy Twitter/Bluesky
- [ ] Collect feedback, iterate on prompts and UX

### Phase 4: Expansion (Months 4–6)
- [ ] Firefox extension port via WXT
- [ ] OpenAI BYOK support
- [ ] Auto-analyze mode for known news domains
- [ ] Community ownership data contribution workflow (GitHub PR template)
- [ ] Educator toolkit (lesson plans, discussion question generator)
- [ ] Analysis export (PDF, markdown)
- [ ] Additional free provider adapters as new options emerge

---

## 12. Open-Source & Community

### License
AGPL-3.0 — Ensures all derivative works remain open-source, including hosted versions or forks. This prevents co-optation by commercial entities.

### Repository Structure
```
decode-the-news/
├── src/
│   ├── background/        # Service worker (API calls, model routing)
│   ├── content/           # Content scripts (DOM extraction, highlights)
│   ├── sidepanel/         # Side panel UI (Preact components)
│   ├── settings/          # Settings page
│   ├── lib/
│   │   ├── ai/            # AI adapters (Ollama, Claude, OpenAI)
│   │   ├── extraction/    # Article extraction logic
│   │   ├── analysis/      # Analysis orchestration
│   │   ├── references/    # Theoretical reference matching
│   │   └── sharing/       # Share card generation
│   └── common/            # Shared types, utils, constants
├── data/
│   ├── ownership/         # Outlet ownership database (JSON)
│   ├── references/        # Theoretical reference library (JSON)
│   └── prompts/           # Versioned prompt templates
├── tests/
├── docs/
│   ├── CONTRIBUTING.md
│   ├── PROMPT_AUDIT.md    # How to review/propose prompt changes
│   ├── OWNERSHIP_DATA.md  # How to contribute ownership data
│   └── SETUP_OLLAMA.md    # Ollama installation guide
├── wxt.config.ts
├── LICENSE                # AGPL-3.0
└── CODE_OF_CONDUCT.md
```

### Community Structure
- **GitHub Discussions** — Feature requests, analysis methodology debates, prompt improvement proposals
- **Contributing Guide** — Clear guidelines for code, prompt engineering, ownership data, and reference library contributions
- **Prompt Audit Process** — All analysis prompts are versioned. Changes require PR review from at least 2 maintainers. Each prompt version is tagged and reproducible.
- **Ownership Data PRs** — Template for contributing outlet ownership research with required sources
- **Code of Conduct** — Anti-harassment, pro-solidarity. The tool exists to empower working people.

### Key Community Contributions Needed
- Outlet ownership research (especially local/regional media)
- Theoretical reference library expansion
- Topic-specific analysis rubrics (labor, housing, healthcare, criminal justice, foreign policy)
- Non-English language prompt development
- Accessibility testing and improvements
- Firefox / Safari testing

---

## 13. Ethical Considerations

1. **We show framing, not "truth"** — The tool identifies *how* stories are framed, not which framing is "correct." It has a materialist, class-conscious perspective, and that is stated transparently.

2. **Grounded in theory, not vibes** — Every analytical claim is linked to published theoretical frameworks. Users can trace the reasoning chain from article text → analytical finding → theoretical foundation → source text. This is auditable, debatable, and educational.

3. **No false balance** — The tool does not treat "pro-capital" and "pro-labor" framings as equally valid by default. It has an explicit normative commitment to working-class interests, and that is documented honestly.

4. **Privacy by architecture** — No backend, no analytics, no tracking, no telemetry. The extension does not phone home. API calls go directly from the user's browser to their chosen AI provider. Ownership data is bundled, not fetched. The only network calls are AI inference requests initiated by the user.

5. **AI limitations disclaimer** — Every analysis includes a note that this is AI-generated analysis meant to augment human critical thinking, not replace it. The theoretical references exist precisely so users can verify and deepen the analysis themselves.

6. **Open methodology** — Every prompt, rubric, heuristic, and reference mapping is open-source and auditable. Users should be able to understand *how* the tool reaches its conclusions and *why* it surfaces particular theoretical frameworks.

7. **No data extraction** — Article text is processed locally or sent only to the user's chosen AI provider. We never collect, store, or transmit article content or analysis results to any server we control.

---

## Appendix A: Competitive Landscape

| Tool | What It Does | Gap We Fill |
|---|---|---|
| AllSides | Left/center/right media bias ratings | Binary axis, no class analysis, no ownership, no theory |
| Ground News | Aggregates coverage from multiple outlets | Shows *that* bias exists, not *how* it works or *why* |
| Ad Fontes Media (Media Bias Chart) | Rates outlets on reliability + bias | Static ratings, no per-article analysis, no class lens |
| NewsGuard | Trust scores for outlets | Funded by establishment interests, no class lens, browser extension but no analysis |
| FAIR (Fairness & Accuracy In Reporting) | Leftist media criticism | Manual analysis, not scalable, no individual tool |

**Our differentiator:** Per-article AI analysis with a class-conscious lens + media ownership data + theoretical grounding in leftist literature + zero-cost privacy-first architecture + runs in-browser where you read. No one else does this.

---

## Appendix B: Example Analysis Output

**Article:** "Tech Giants Report Strong Earnings Amid Workforce Reductions"
**Outlet:** Wall Street Journal
**Ownership:** News Corp → Rupert Murdoch (Executive Chairman). $4.1M to Republican candidates (2020–2024 cycles). Also owns: Fox News, NY Post, The Times (UK), HarperCollins.

**Quick Take:** This article frames mass layoffs as a positive business strategy ("workforce optimization"), centers investor sentiment over worker impact, and quotes 3 analysts vs. 0 affected workers.

**Who Benefits:** Shareholders, executive leadership, "the market"
**Who's Absent:** Laid-off workers, labor unions, affected communities, workers who remain (and now carry heavier workloads)

**Key Framing Choices:**
- "Workforce reductions" — euphemism for layoffs
  📚 *Manufacturing Consent* — Euphemism as a tool of the propaganda model's self-censorship filter
- "Strong earnings" placed *before* job losses in headline — primes reader to see layoffs as positive
  📚 *The Society of the Spectacle*, Thesis 12 — The spectacle presents "what is good appears, what appears is good"
- Passive construction: "positions were eliminated" — obscures who made the decision
  📚 *Ideology and Ideological State Apparatuses* — Linguistic structures that naturalize power relations
- No mention of executive compensation in the same period
- No mention of stock buybacks funded by labor cost savings
  📚 *Capital* Vol. 1, Ch. 25 — The general law of capitalist accumulation

**Ideological Axes:**
- Pro-capital ████████░░ (8/10)
- Individualist ██████░░░░ (6/10)
- Nationalist ████░░░░░░ (4/10)

**Reform vs. Revolution: REFORMIST (2/10)**
This article operates entirely within capitalist realism — layoffs are presented as a natural and rational market response, not as a choice made by executives to redistribute value from workers to shareholders. The framing forecloses any discussion of alternative ownership structures, codetermination, or the inherent conflict between profit maximization and worker wellbeing.
📚 Fisher, *Capitalist Realism* (2009) — "It is easier to imagine the end of the world than the end of capitalism"
📚 Luxemburg, *Reform or Revolution* (1899) — On how reformist framing obscures the structural nature of exploitation

---

*This document is a living PRD. Version history is tracked in Git.*
