# Marx Meter

_"Which side are you on?"_

A browser extension that deconstructs news articles in-place to reveal class interests, framing choices, ownership structures, and ideological underpinnings — grounded in materialist media criticism and accessible to everyone.

## What It Does

Click the extension icon on any news article. Marx Meter:

1. **Extracts** the article text directly from the page
2. **Analyzes** framing, sourcing bias, and ideological positioning using AI
3. **Shows ownership** — who owns this outlet, who do they donate to
4. **Grounds findings** in foundational leftist texts (Herman & Chomsky, Gramsci, Marx, etc.)
5. **Highlights** framing choices directly in the article text

No account. No backend. No tracking. Analysis happens in your browser.

## Architecture

Client-heavy, server-optional. The extension works with zero backend infrastructure — all processing happens in the browser using your own AI API key.

- **Tier 1 (Default):** Free cloud AI (Google Gemini, Groq) — no credit card needed
- **Tier 2:** Local AI via Ollama — maximum privacy, works offline
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
│       ├── analysis/      # Analysis orchestration
│       ├── references/    # Theoretical reference matching
│       └── sharing/       # Share card generation
├── data/
│   ├── ownership/         # Outlet ownership database (JSON)
│   ├── references/        # Theoretical reference library (JSON)
│   └── prompts/           # Versioned prompt templates
├── tests/
│   └── fixtures/          # Saved HTML pages, mock API responses
└── docs/
```

## Documentation

- [Product Requirements Document](./specs/marx-meter-prd.md)
- [Implementation Plan](./specs/IMPLEMENTATION_PLAN.md)
- [Progress Tracker](./specs/PROGRESS.md)

## License

AGPL-3.0 — All derivative works must remain open-source.
