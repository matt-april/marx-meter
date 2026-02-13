# CLAUDE.md

## Project Overview

Marx Meter is a Chrome browser extension (Manifest V3) that analyzes news articles for class interests, framing choices, and ideological positioning. It uses AI to deconstruct articles in-place and grounds findings in leftist theoretical texts.

## Key Documents

- `specs/marx-meter-prd.md` — Full product requirements document (source of truth for features)
- `specs/IMPLEMENTATION_PLAN.md` — Milestone-based implementation plan with testing guidelines
- `specs/PROGRESS.md` — Current status of all milestones and tasks (updated by agents during implementation)
- `specs/` — Detailed specs for work in progress (one file per feature/task as needed)

## Tech Stack

- **Extension framework:** WXT (Web Extension Toolkit) with Vite
- **UI:** Preact + Tailwind CSS v4
- **State:** Zustand
- **Component dev:** Storybook (`@storybook/preact-vite`, from M2 onward)
- **Storage:** IndexedDB via Dexie.js
- **Testing:** Vitest (unit/integration) + Playwright (E2E, must run headed for extension tests)
- **Package manager:** pnpm
- **CI:** GitHub Actions

## Development Approach

- **Trunk-based development** — all work goes to `main`
- **Vertical slices** — each milestone delivers a complete user-facing feature end-to-end
- Milestones are M0 (scaffolding) through M6 (post-launch expansion)

## Architecture

Client-heavy, server-optional. No backend. Three AI tiers:
- Tier 1: Free cloud APIs (Gemini, Groq) — default, zero setup friction
- Tier 2: Ollama local — maximum privacy
- Tier 3: Anthropic Claude BYOK — best quality

All AI adapters implement a shared `AIProvider` interface: `{ analyze, stream, validateKey, getModels }`.

## Project Structure

```
src/
├── background/        # Service worker (API calls, routing, caching)
├── content/           # Content scripts (DOM extraction, in-page highlights)
├── sidepanel/         # Side panel UI (Preact components)
├── settings/          # Settings page
├── lib/
│   ├── ai/            # AI provider adapters
│   ├── extraction/    # Article extraction (Readability.js)
│   ├── analysis/      # Analysis orchestration, prompt chain
│   ├── references/    # Theoretical reference matching
│   └── sharing/       # Share card generation
└── common/            # Shared types, utils, constants

data/
├── ownership/         # Static JSON ownership database
├── references/        # Static JSON reference library
└── prompts/           # Versioned prompt templates

tests/
└── fixtures/          # Saved HTML pages, mock API responses, analysis results
```

## Commands

```bash
pnpm dev              # Dev mode with HMR
pnpm build            # Production build
pnpm test             # Vitest unit + integration
pnpm test:e2e         # Playwright (headed Chromium)
pnpm storybook        # Storybook component dev
pnpm storybook:build  # Build storybook (CI)
pnpm lint             # ESLint + Prettier
pnpm typecheck        # tsc --noEmit
```

## Testing Conventions

- **Never hit real AI APIs in CI.** Mock all provider responses with fixtures in `tests/fixtures/api-responses/`.
- **AI output is non-deterministic.** Test structure (schema validation via Zod), not content. Test constraints (scores in range, quotes exist in source text), not exact text.
- **Playwright extension tests require headed Chromium** — extensions don't work in headless mode. CI uses `xvfb`.
- **Storybook stories serve as visual tests** for all UI components. Every component gets at least one story.
- **Snapshots used only for share card HTML.** Everything else uses behavioral assertions.
- Fixtures live in `tests/fixtures/`: saved HTML pages (`articles/`), mock API responses (`api-responses/`), pre-built analysis results (`analysis-results/`).

## Key Design Decisions

- **Preact over React** — ~3KB bundle, ideal for extension size constraints
- **pnpm over Bun** — WXT ecosystem compatibility, no edge case risk
- **Static bundled data** — ownership DB and reference library are JSON files shipped with the extension, zero network calls for lookups
- **Shadow DOM for highlights** — in-page highlight injection uses shadow DOM to avoid CSS conflicts with host pages
- **Multi-provider failover** — cascades through free providers on 429s (Gemini → Groq → HuggingFace)
- **All prompts are open-source** — stored as versioned files in `data/prompts/`, community-auditable

## Style

- TypeScript strict mode
- ESLint + Prettier
- Preact components in `.tsx`
- Tailwind utility classes, no custom CSS unless Shadow DOM requires it
