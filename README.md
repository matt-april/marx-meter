# Marx Meter

_"The ideas of the ruling class are in every epoch the ruling ideas."_ — Karl Marx

A browser extension that analyzes news articles through the lens of class interest, using AI and the Marxist theoretical tradition. Every article has a point of view shaped by ownership, funding, and institutional culture — Marx Meter makes that visible.

## What It Does

Click the extension icon on any news article. Marx Meter:

1. **Identifies class interests** — who benefits from the article's framing, and whose interests are served by the way the story is told
2. **Exposes framing choices** — euphemisms, passive voice, source bias, omissions, and naturalization of economic relations
3. **Names who's missing** — which workers, communities, and affected peoples have been excluded from the narrative
4. **Scores ideological positioning** — where the article falls on capital vs. labor, individual vs. systemic, and nationalist vs. internationalist axes
5. **Shows media ownership** — who owns the outlet, who funds them, and what class interests they represent
6. **Grounds analysis in theory** — connects findings to Marx, Gramsci, Luxemburg, Lenin, and 20+ thinkers in the socialist tradition
7. **Highlights in-page** — marks framing choices directly in the article text so you can see them in context

No account. No backend. No tracking. Analysis happens in your browser.

## Why This Exists

Media shapes how people understand the world. But media is produced within a system of class relations — outlets are owned by capital, funded by corporate advertisers, and staffed by professionals trained in institutions that take existing economic arrangements for granted. What gets reported, who gets quoted, and how stories are framed all reflect this.

Marx Meter applies materialist analysis to the news you're already reading. It asks the questions that mainstream media criticism doesn't: whose class interest does this framing serve? What structural context has been omitted? What would this story look like from the standpoint of labor rather than capital?

The goal is to build class consciousness — to help readers develop the habit of seeing class dynamics in everything they read.

## Architecture

Client-heavy, server-optional. The extension works with zero backend infrastructure — all processing happens in the browser. No data leaves your machine except the API call to the AI provider you choose.

- **Tier 1 (Default):** Free cloud AI (Google Gemini, Groq) — no credit card, no friction
- **Tier 2:** Local AI via Ollama — maximum privacy, works offline, nothing leaves your machine
- **Tier 3:** Premium BYOK (Anthropic Claude) — best analysis quality

## Tech Stack

| Layer               | Technology               |
| ------------------- | ------------------------ |
| Extension Framework | WXT (Vite)               |
| UI                  | Preact + Tailwind CSS v4 |
| State               | Zustand                  |
| Component Dev       | Storybook                |
| Storage             | IndexedDB (Dexie.js)     |
| Testing             | Vitest + Playwright      |
| Package Manager     | pnpm                     |
| CI/CD               | GitHub Actions           |

## Development

```bash
pnpm install
pnpm dev          # Load extension in Chrome with HMR
pnpm build        # Production build
pnpm test         # Unit + integration tests
pnpm test:e2e     # Playwright extension tests
pnpm storybook    # Component development
```

## Project Structure

```
marx-meter/
├── src/
│   ├── background/        # Service worker (API calls, model routing)
│   ├── content/           # Content scripts (DOM extraction, highlights)
│   ├── sidepanel/         # Side panel UI (Preact components)
│   ├── settings/          # Settings page
│   └── lib/
│       ├── ai/            # AI adapters (Gemini, Groq, Ollama, Claude)
│       ├── extraction/    # Article extraction logic
│       ├── analysis/      # Analysis orchestration, prompt chain
│       ├── references/    # Theoretical reference matching
│       └── sharing/       # Share card generation
├── data/
│   ├── ownership/         # Outlet ownership database (JSON)
│   ├── references/        # Theoretical reference library (JSON)
│   └── prompts/           # Versioned prompt templates (open-source, auditable)
├── research/
│   └── thinkers/          # 22 Marxist thinkers — bios, key works, indexed by topic
├── tests/
│   └── fixtures/          # Saved HTML pages, mock API responses
└── specs/
```

## Theoretical Foundation

Marx Meter's analysis draws on a reference library of 22 thinkers in the Marxist tradition, indexed by article topic, framing pattern, and analytical concept so the AI can apply the most relevant theoretical grounding to any article:

Marx, Engels, Lafargue, DeLeon, Plekhanov, Kautsky, Zetkin, Connolly, Lenin, Luxemburg, Kollontai, Trotsky, Lukacs, Korsch, Roy, Bukharin, Gramsci, Mariategui, James, Padmore, Mattick, Draper.

All prompts are open-source and stored as versioned files. You can read exactly what the AI is instructed to do.

## Documentation

- [Product Requirements Document](./specs/marx-meter-prd.md)
- [Implementation Plan](./specs/IMPLEMENTATION_PLAN.md)
- [Progress Tracker](./specs/PROGRESS.md)
- [Thinker Reference Index](./research/thinkers/INDEX.md)

## License

AGPL-3.0 — All derivative works must remain open-source.
