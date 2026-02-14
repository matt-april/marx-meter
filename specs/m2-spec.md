# M2: Polished Single-Provider Experience — Detailed Implementation Spec

**Goal:** Make the analysis experience feel like a real product — proper UI, ownership context, theoretical grounding, and in-page highlights.

**Estimated effort:** 8-10 days
**Prerequisite:** M1 complete (extraction, AI pipeline, basic side panel)

---

## How This Spec Works

This spec is written for AI coding agents. Follow it literally. Do not improvise. Do not add features not described here. Do not refactor existing code unless the spec says to. If something is ambiguous, pick the simplest interpretation and move on.

**Every file path is absolute from the repo root** (`/Users/matt/repos/marx_meter/`). When the spec says `src/lib/ai/gemini.ts`, that means `/Users/matt/repos/marx_meter/src/lib/ai/gemini.ts`.

---

## Git Branching Strategy

This project uses **trunk-based development**. All work merges to `main`.

### Rules for Agents

1. **Each stream works on its own branch** off of `main`:
   - Stream A: `m2/sidepanel-ui`
   - Stream B: `m2/ownership-data`
   - Stream C: `m2/reference-library`
   - Stream D: `m2/in-page-highlights`
   - Integration: `m2/integration`

2. **Branch lifecycle:**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b m2/sidepanel-ui
   # ... do work, commit often ...
   git checkout main
   git pull origin main
   git merge m2/sidepanel-ui
   git push origin main
   git branch -d m2/sidepanel-ui
   ```

3. **Never force push to `main`.** If merge conflicts occur, resolve them manually.

4. **Commit messages:** Use conventional commits. Examples:
   - `feat(sidepanel): add Storybook setup with Preact Vite`
   - `feat(ownership): add ownership JSON for top 20 outlets`
   - `feat(references): add 10 theoretical reference entries`
   - `feat(highlights): inject Shadow DOM highlights into article`

5. **All four streams are parallel** — they can all start simultaneously after M1 is complete. No stream depends on another stream within M2. All depend only on M1.

### Merge Order

All four streams (A, B, C, D) can merge in any order since they're parallel. Integration branch merges last.

---

## Progress Tracking

**After completing each task, the agent MUST update `specs/PROGRESS.md`.**

### How to Update Progress

1. Open `specs/PROGRESS.md`
2. Find the M2 section
3. Change the task's status from `[ ]` to `[x]`
4. Add your agent name in the Owner column
5. Add any relevant notes (package versions installed, deviations from spec, etc.)

Example — before:

```
| Set up Storybook with @storybook/preact-vite | [ ] | | |
```

Example — after:

```
| Set up Storybook with @storybook/preact-vite | [x] | Agent-A | @storybook/preact-vite@9.x |
```

**If you are starting a task but haven't finished it**, mark it `[~]` (in progress).

**If a task is blocked**, mark it `[!]` and explain why in Notes.

---

## Package Dependencies

### Install Before Starting Any Stream

All agents need these shared dependencies. Run once at the start:

```bash
cd /Users/matt/repos/marx_meter
pnpm add -D @storybook/preact-vite storybook @vitest/coverage-v8
pnpm add preact
```

### Stream A Only (Side Panel UI)

```bash
pnpm add zustand
```

### Stream B Only (Ownership Data)

No additional packages needed — ownership data is static JSON.

### Stream C Only (Reference Library)

No additional packages needed — reference matching uses heuristic text matching.

### Stream D Only (In-Page Highlights)

No additional packages needed — uses native DOM APIs and Shadow DOM.

---

## Parallel Work Streams

```
M1 complete ─────┬──▶ Stream A: Side Panel UI (Storybook, progressive disclosure, dark mode, axes viz, streaming)
                 │
                 ├──▶ Stream B: Ownership Data (20 outlets JSON, display component, lookup)
                 │
                 ├──▶ Stream C: Reference Library (10 refs JSON, matcher, Further Reading UI)
                 │
                 └──▶ Stream D: In-Page Highlights (Shadow DOM injection, 3 highlight types, tooltips, toggle)

                                         ▼
                              Integration (wire all streams together)
```

### File Ownership Rules

**Stream A owns these files:**

- `src/entrypoints/sidepanel/components/` (modify existing components)
- `src/entrypoints/sidepanel/App.tsx` (modify to add progressive disclosure)
- `src/lib/ui/store.ts` (new — Zustand store for UI state)
- `.storybook/` (new — Storybook configuration)
- `src/stories/` (new — Storybook stories)
- `tests/sidepanel/` (modify existing)

**Stream B owns these files:**

- `data/ownership/ownership.json` (new)
- `src/lib/ownership/lookup.ts` (new)
- `src/lib/ownership/types.ts` (new)
- `src/entrypoints/sidepanel/components/OwnershipCard.tsx` (new)
- `tests/ownership/` (new)

**Stream C owns these files:**

- `data/references/references.json` (new)
- `src/lib/references/matcher.ts` (new)
- `src/lib/references/types.ts` (new)
- `src/entrypoints/sidepanel/components/FurtherReading.tsx` (new)
- `tests/references/` (new)

**Stream D owns these files:**

- `src/entrypoints/content.ts` (modify existing)
- `src/lib/highlights/injector.ts` (new)
- `src/lib/highlights/types.ts` (new)
- `src/lib/highlights/store.ts` (new — highlights toggle state)
- `tests/highlights/` (new)

**Integration owns these files:**

- `src/entrypoints/background.ts` (modify — add ownership lookup)
- `src/entrypoints/sidepanel/App.tsx` (modify — add ownership + references display)
- `src/lib/analysis/prompts.ts` (modify — add highlight mapping to output)

---

## Stream A: Side Panel UI

### Task A.1: Set Up Storybook with @storybook/preact-vite

**File: `.storybook/main.ts`**

```typescript
import type { StorybookConfig } from '@storybook/preact-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/preact-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;
```

**File: `.storybook/preview.ts`**

```typescript
import type { Preview } from '@storybook/preact';
import '../src/entrypoints/sidepanel/style.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
};

export default preview;
```

**Definition of Done:**

- [ ] `pnpm storybook` starts without errors
- [ ] Stories render in both dark and light mode
- [ ] At least one existing component has a story (test with LoadingSpinner)

---

### Task A.2: Progressive Disclosure Redesign

Redesign the side panel with collapsible sections. Quick Take is always visible, other sections can be collapsed/expanded.

**File: `src/lib/ui/store.ts`**

```typescript
import { create } from 'zustand';

interface UIState {
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  isSectionExpanded: (section: string) => boolean;
}

export const useUIStore = create<UIState>((set, get) => ({
  expandedSections: new Set(['quickTake']),

  toggleSection: (section: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedSections);
      if (newExpanded.has(section)) {
        newExpanded.delete(section);
      } else {
        newExpanded.add(section);
      }
      return { expandedSections: newExpanded };
    });
  },

  isSectionExpanded: (section: string) => {
    return get().expandedSections.has(section);
  },
}));
```

**File: `src/entrypoints/sidepanel/components/CollapsibleSection.tsx`**

```tsx
import { useUIStore } from '../../../lib/ui/store';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  children: preact.ComponentChildren;
  defaultExpanded?: boolean;
}

export function CollapsibleSection({
  id,
  title,
  children,
  defaultExpanded = false,
}: CollapsibleSectionProps) {
  const { expandedSections, toggleSection } = useUIStore();
  const isExpanded = expandedSections.has(id) || defaultExpanded;

  return (
    <section class="rounded-lg bg-neutral-900 overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-800/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-400">{title}</h2>
        <svg
          class={`h-4 w-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        class={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div class="px-4 pb-4">{children}</div>
      </div>
    </section>
  );
}
```

**Definition of Done:**

- [ ] Quick Take section visible by default
- [ ] All other sections collapsed by default
- [ ] Clicking section header expands/collapses it
- [ ] Smooth transition animation on expand/collapse
- [ ] aria-expanded attribute updates correctly
- [ ] Works with keyboard (Enter/Space toggles)

---

### Task A.3: Dark Mode (System Preference)

Update App.tsx to detect system color scheme and apply appropriate styles.

**File: `src/entrypoints/sidepanel/App.tsx`** (modify — add dark mode)

Add a useEffect to detect system preference and update document class:

```tsx
// Add to existing imports
import { useState, useEffect } from 'preact/hooks';

// Add inside App component, after useState:
const [isDarkMode, setIsDarkMode] = useState(true);

useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  setIsDarkMode(mediaQuery.matches);

  const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}, []);

// Update the root div class:
<div class={`min-h-screen ${isDarkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'} p-4`}>
```

**Definition of Done:**

- [ ] Detects system preference on load
- [ ] Updates when system preference changes
- [ ] Light mode uses neutral-50/neutral-900 palette
- [ ] Dark mode uses neutral-950/neutral-100 palette

---

### Task A.4: Ideological Axes Visualization

Improve the existing IdeologicalAxes component with better bar chart visualization.

**File: `src/entrypoints/sidepanel/components/IdeologicalAxes.tsx`** (replace)

```tsx
import type { IdeologicalAxis } from '../../../common/types';

interface IdeologicalAxesProps {
  axes: IdeologicalAxis[];
}

const axisLabels: Record<IdeologicalAxis['name'], [string, string]> = {
  pro_capital_vs_pro_labor: ['Pro-capital', 'Pro-labor'],
  individualist_vs_systemic: ['Individualist', 'Systemic'],
  nationalist_vs_internationalist: ['Nationalist', 'Internationalist'],
};

const axisColors = {
  pro_capital_vs_pro_labor: 'from-blue-600 to-red-500',
  individualist_vs_systemic: 'from-purple-500 to-green-500',
  nationalist_vs_internationalist: 'from-yellow-500 to-teal-500',
};

export function IdeologicalAxes({ axes }: IdeologicalAxesProps) {
  return (
    <div class="space-y-4">
      {axes.map((axis) => {
        const [leftLabel, rightLabel] = axisLabels[axis.name] || [axis.name, ''];
        const pct = (axis.score / 10) * 100;
        const gradient = axisColors[axis.name] || 'from-neutral-500 to-neutral-400';

        return (
          <div key={axis.name} class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-neutral-400">{leftLabel}</span>
              <span class="font-medium text-neutral-300">{axis.label}</span>
              <span class="text-neutral-400">{rightLabel}</span>
            </div>
            <div class="relative h-3 rounded-full bg-neutral-800 overflow-hidden">
              <div
                class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r gradient"
                style={{ width: `${pct}%` }}
              />
              <div
                class="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full shadow-sm"
                style={{ left: `${pct}%` }}
              />
            </div>
            <p class="text-xs text-neutral-500">{axis.explanation}</p>
          </div>
        );
      })}
    </div>
  );
}
```

**Definition of Done:**

- [ ] Bar shows percentage fill based on score
- [ ] Gradient colors distinguish different axes
- [ ] White indicator marker shows exact position
- [ ] Axis label and explanation displayed

---

### Task A.5: Streaming Response Display

Update the analysis flow to show tokens as they arrive from the Gemini streaming API.

First, update the Gemini adapter to support streaming:

**File: `src/lib/ai/gemini.ts`** (modify — add streaming)

```typescript
import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ArticleData, AnalysisResult, AnalysisResultSchema } from '../../common/types';
import { AIProvider } from './types';
import { buildAnalysisPrompt } from '../analysis/prompts';

export class GeminiAdapter implements AIProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async analyze(article: ArticleData): Promise<AnalysisResult> {
    const prompt = buildAnalysisPrompt(article);

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(AnalysisResultSchema),
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned empty response');
    }

    const parsed = JSON.parse(text);
    const validated = AnalysisResultSchema.parse(parsed);
    return validated;
  }

  async *stream(article: ArticleData): AsyncGenerator<string, AnalysisResult, unknown> {
    const prompt = buildAnalysisPrompt(article);

    const stream = await this.client.models.generateContentStream({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(AnalysisResultSchema),
        temperature: 0.3,
      },
    });

    let fullText = '';
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        yield text;
      }
    }

    const validated = AnalysisResultSchema.parse(JSON.parse(fullText));
    return validated;
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new GoogleGenAI({ apiKey });
      const response = await testClient.models.generateContent({
        model: this.model,
        contents: 'Respond with the word "valid" and nothing else.',
      });
      return !!response.text;
    } catch {
      return false;
    }
  }
}
```

**File: `src/lib/ai/types.ts`** (modify)

```typescript
import { ArticleData, AnalysisResult } from '../../common/types';

export interface AIProvider {
  analyze(article: ArticleData): Promise<AnalysisResult>;
  stream(article: ArticleData): AsyncGenerator<string, AnalysisResult>;
  validateKey(apiKey: string): Promise<boolean>;
}
```

**File: `src/entrypoints/sidepanel/components/StreamingText.tsx`** (new)

```tsx
import { useState, useEffect } from 'preact/hooks';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
}

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState(text);

  useEffect(() => {
    if (isStreaming && text.length > displayedText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text);
      }, 20);
      return () => clearTimeout(timeout);
    } else {
      setDisplayedText(text);
    }
  }, [text, isStreaming, displayedText.length]);

  return (
    <span>
      {displayedText}
      {isStreaming && (
        <span class="inline-block h-4 w-0.5 animate-pulse bg-neutral-400 ml-0.5 align-middle" />
      )}
    </span>
  );
}
```

Update App.tsx to use streaming:

```tsx
// In handleAnalyze, replace the direct call with streaming:
// (The exact implementation will be done in integration)
```

**Definition of Done:**

- [ ] Gemini adapter has `stream()` method
- [ ] StreamingText component shows cursor while streaming
- [ ] Text appears progressively as tokens arrive

---

### Task A.6: Storybook Stories for Components

Create stories for all key components.

**File: `src/stories/QuickTake.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/preact';
import { QuickTake } from '../entrypoints/sidepanel/components/QuickTake';

const meta: Meta<typeof QuickTake> = {
  title: 'Components/QuickTake',
  component: QuickTake,
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof QuickTake>;

export const Default: Story = {
  args: {
    text: 'This article frames mass layoffs as a positive "restructuring" that will benefit shareholders, while centering investor reaction and analyst commentary.',
  },
};

export const Short: Story = {
  args: {
    text: 'Quick summary here.',
  },
};

export const Long: Story = {
  args: {
    text: 'This is a much longer quick take that goes into significant detail about the framing choices in the article. It covers multiple angles and provides substantial context for the reader to understand what this article is really about.',
  },
};
```

Create similar stories for: WhoBenefits, FramingChoices, IdeologicalAxes, OwnershipCard, FurtherReading.

**Definition of Done:**

- [ ] Each major component has at least one story
- [ ] Stories work in both dark and light mode
- [ ] `pnpm storybook:build` succeeds

---

## Stream B: Ownership Data

### Task B.1: Curate Ownership JSON for Top 20 Outlets

**File: `data/ownership/ownership.json`**

```json
[
  {
    "domain": "nytimes.com",
    "name": "The New York Times",
    "parent_company": "The New York Times Company",
    "ownership_chain": [
      { "name": "The New York Times Company", "type": "public", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "A.G. Sulzberger (Class B)", "type": "individual" },
      { "name": "Mexican Billionaire Families (indirect)", "type": "institutional" }
    ],
    "revenue_model": "subscription + advertising",
    "political_donations": [
      { "recipient": "Democrats", "amount": 2500000, "cycle": "2024", "party": "D" },
      { "recipient": "Republicans", "amount": 150000, "cycle": "2024", "party": "R" }
    ],
    "other_properties": ["The Wirecutter", "NYT Cooking", "The Athletic"],
    "editorial_notes": "Founded 1851. Class B shares controlled by Sulzberger family ensure editorial independence.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "washingtonpost.com",
    "name": "The Washington Post",
    "parent_company": "Nash Holdings",
    "ownership_chain": [
      { "name": "Nash Holdings", "type": "private", "ownership_pct": 100 },
      { "name": "Jeff Bezos", "type": "individual", "ownership_pct": 100 }
    ],
    "major_shareholders": [{ "name": "Jeff Bezos", "type": "individual" }],
    "revenue_model": "subscription + advertising",
    "political_donations": [
      { "recipient": "Democrats", "amount": 3000000, "cycle": "2024", "party": "D" }
    ],
    "other_properties": ["The Washington Post Magazine"],
    "editorial_notes": "Acquired by Jeff Bezos in 2013. Founded 1877.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "cnn.com",
    "name": "CNN",
    "parent_company": "Warner Bros. Discovery",
    "ownership_chain": [
      { "name": "Warner Bros. Discovery", "type": "public", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "John Malone", "type": "individual" },
      { "name": "Vanguard", "type": "institutional" },
      { "name": "BlackRock", "type": "institutional" }
    ],
    "revenue_model": "advertising + subscription",
    "political_donations": [
      { "recipient": "Democrats", "amount": 1800000, "cycle": "2024", "party": "D" }
    ],
    "other_properties": ["CNN International", "HLN", "CNN Business"],
    "editorial_notes": "Founded 1980. Merged with Discovery in 2022.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "foxnews.com",
    "name": "Fox News",
    "parent_company": "Fox Corporation",
    "ownership_chain": [
      { "name": "Fox Corporation", "type": "public", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "Lachlan Murdoch", "type": "individual" },
      { "name": "Vanguard", "type": "institutional" }
    ],
    "revenue_model": "advertising",
    "political_donations": [
      { "recipient": "Republicans", "amount": 5000000, "cycle": "2024", "party": "R" }
    ],
    "other_properties": ["Fox Business", "Fox Sports", "Fox Television Stations"],
    "editorial_notes": "Founded 1996. Split from 21st Century Fox in 2019.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "wsj.com",
    "name": "The Wall Street Journal",
    "parent_company": "News Corp",
    "ownership_chain": [
      { "name": "News Corp", "type": "public", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "Rupert Murdoch", "type": "individual" },
      { "name": "Cramer Rosenthal", "type": "institutional" }
    ],
    "revenue_model": "subscription + advertising",
    "political_donations": [
      { "recipient": "Republicans", "amount": 4000000, "cycle": "2024", "party": "R" }
    ],
    "other_properties": ["Barron's", "MarketWatch", "FN"],
    "editorial_notes": "Founded 1889. Known for conservative editorial stance.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "reuters.com",
    "name": "Reuters",
    "parent_company": "Thomson Reuters",
    "ownership_chain": [
      { "name": "Thomson Reuters", "type": "public", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "The Woodbridge Company", "type": "institutional" },
      { "name": "BlackRock", "type": "institutional" }
    ],
    "revenue_model": "subscription + news services",
    "political_donations": [],
    "other_properties": ["Reuters News Agency", "Westlaw", "Check"],
    "editorial_notes": "Founded 1851. Known for neutral, factual journalism.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "apnews.com",
    "name": "Associated Press",
    "parent_company": "Associated Press Cooperative",
    "ownership_chain": [
      { "name": "Associated Press Cooperative", "type": "nonprofit", "ownership_pct": 100 }
    ],
    "major_shareholders": [],
    "revenue_model": "subscription + licensing",
    "political_donations": [],
    "other_properties": ["AP News", "AP Images", "AP Video"],
    "editorial_notes": "Founded 1846. Nonprofit news cooperative owned by participating newspapers.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "npr.org",
    "name": "NPR",
    "parent_company": "NPR",
    "ownership_chain": [
      { "name": "NPR", "type": "nonprofit", "ownership_pct": 100 }
    ],
    "major_shareholders": [],
    "revenue_model": "donations + sponsorship",
    "political_donations": [],
    "other_properties": ["NPR News Now", "Planet Money", "This American Life"],
    "editorial_notes": "Founded 1970. Listener-supported, editorial independence from government.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "pbs.org",
    "name": "PBS",
    "parent_company": "Public Broadcasting Service",
    "ownership_chain": [
      { "name": "Public Broadcasting Service", "type": "nonprofit", "ownership_pct": 100 }
    ],
    "major_shareholders": [],
    "revenue_model": "government funding + donations",
    "political_donations": [],
    "other_properties": ["PBS NewsHour", "Frontline", "NOVA"],
    "editorial_notes": "Founded 1970. Receives federal funding but editorial独立.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "theguardian.com",
    "name": "The Guardian",
    "parent_company": "Guardian Media Group",
    "ownership_chain": [
      { "name": "Scott Trust", "type": "trust", "ownership_pct": 100 }
    ],
    "major_shareholders": [],
    "revenue_model": "subscription + advertising",
    "political_donations": [],
    "other_properties": ["The Observer", "Guardian US", "Guardian Australia"],
    "editorial_notes": "Founded 1821. Owned by Scott Trust, prioritizes editorial independence over profit.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "huffpost.com",
    "name": "HuffPost",
    "parent_company": "Yahoo (Verizon Media)",
    "ownership_chain": [
      { "name": "Verizon Media", "type": "subsidiary", "ownership_pct": 100 },
      { "name": "Apollo Global Management", "type": "private_equity", "ownership_pct": 100 }
    ],
    "major_shareholders": [{ "name": "Apollo Global Management", "type": "private_equity" }],
    "revenue_model": "advertising",
    "political_donations": [],
    "other_properties": ["Yahoo News", "TechCrunch", "AOL"],
    "editorial_notes": "Founded 2005. Sold to Verizon 2019, then to Apollo 2021.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "politico.com",
    "name": "Politico",
    "parent_company": "Axios",
    "ownership_chain": [
      { "name": "Axios Media", "type": "public", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "Cox Enterprises", "type": "institutional" },
      { "name": "BlackRock", "type": "institutional" }
    ],
    "revenue_model": "subscription + advertising",
    "political_donations": [],
    "other_properties": ["Politico Europe", "Playbook", "Morning Score"],
    "editorial_notes": "Founded 2007. Known for political journalism and insider coverage.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "thehill.com",
    "name": "The Hill",
    "parent_company": "The Hill Media",
    "ownership_chain": [
      { "name": "The Hill Media", "type": "private", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "James B. Finkel", "type": "individual" }
    ],
    "revenue_model": "advertising",
    "political_donations": [],
    "other_properties": ["The Hill TV", "Rising"],
    "editorial_notes": "Founded 1994. Center-right editorial stance.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "axios.com",
    "name": "Axios",
    "parent_company": "Axios Media",
    "ownership_chain": [
      { "name": "Axios Media", "type": "public", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "Cox Enterprises", "type": "institutional" },
      { "name": "BlackRock", "type": "institutional" }
    ],
    "revenue_model": "subscription + advertising",
    "political_donations": [],
    "other_properties": ["Axios Pro", "Axios Sports", "Axios Local"],
    "editorial_notes": "Founded 2017 by former Politico journalists. Known for concise news.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "vice.com",
    "name": "Vice",
    "parent_company": "Vice Media",
    "ownership_chain": [
      { "name": "Vice Media", "type": "private", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "Luminate", "type": "institutional" },
      { "name": "The Raine Group", "type": "institutional" }
    ],
    "revenue_model": "advertising + content deals",
    "political_donations": [],
    "other_properties": ["Vice News", "Viceland", "Vice Studios"],
    "editorial_notes": "Founded 2004. Known for youth-focused documentary content.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "vox.com",
    "name": "Vox",
    "parent_company": "Vox Media",
    "ownership_chain": [
      { "name": "Vox Media", "type": "private", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "", "type": "institutional"Comcast Ventures },
      { "name": "Accel", "type": "institutional" }
    ],
    "revenue_model": "subscription + advertising",
    "political_donations": [],
    "other_properties": ["New York Magazine", "The Cut", "Grub Street"],
    "editorial_notes": "Founded 2014. Known for explainer journalism.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "bloomberg.com",
    "name": "Bloomberg",
    "parent_company": "Bloomberg L.P.",
    "ownership_chain": [
      { "name": "Bloomberg L.P.", "type": "private", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "Michael Bloomberg", "type": "individual" }
    ],
    "revenue_model": "subscription",
    "political_donations": [
      { "recipient": "Democrats", "amount": 15000000, "cycle": "2024", "party": "D" }
    ],
    "other_properties": ["Bloomberg Law", "Bloomberg Tax", "Bloomberg TV"],
    "editorial_notes": "Founded 1981. Michael Bloomberg also owns 90% of News Corp.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "businessinsider.com",
    "name": "Business Insider",
    "parent_company": "Insider Inc.",
    "ownership_chain": [
      { "name": "Insider Inc.", "type": "subsidiary", "ownership_pct": 100 },
      { "name": "Axel Springer", "type": "public", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "Axel Springer", "type": "public" }
    ],
    "revenue_model": "subscription + advertising",
    "political_donations": [],
    "other_properties": ["Insider Intelligence", "Markets Insider"],
    "editorial_notes": "Founded 2007. Acquired by Axel Springer in 2015.",
    "last_updated": "2026-02-01"
  },
  {
    "domain": "thedailybeast.com",
    "name": "The Daily Beast",
    "parent_company": "The Daily Beast",
    "ownership_chain": [
      { "name": "The Daily Beast", "type": "private", "ownership_pct": 100 }
    ],
    "major_shareholders": [
      { "name": "John F. W. Rogers (founder)", "type": "individual" }
    ],
    "revenue_model": "subscription + advertising",
    "political_donations": [],
    "other_properties": ["The New Beast"],
    "editorial_notes": "Founded 2008 by Tina Brown and John W. Rogers.",
    "last_updated": "2026-02-01"
  }
]
```

**Definition of Done:**

- [ ] JSON file contains 20 outlet entries
- [ ] Each entry has: domain, name, parent_company, ownership_chain, revenue_model, political_donations, other_properties, editorial_notes, last_updated
- [ ] political_donations contains valid amounts and cycles

---

### Task B.2: Ownership Lookup Utility

**File: `src/lib/ownership/types.ts`**

```typescript
import { z } from 'zod';

export const OwnershipChainSchema = z.object({
  name: z.string(),
  type: z.enum([
    'public',
    'private',
    'nonprofit',
    'trust',
    'private_equity',
    'subsidiary',
    'individual',
    'institutional',
  ]),
  ownership_pct: z.number().min(0).max(100),
});

export const PoliticalDonationSchema = z.object({
  recipient: z.string(),
  amount: z.number(),
  cycle: z.string(),
  party: z.enum(['D', 'R', 'I']),
});

export const OutletOwnershipSchema = z.object({
  domain: z.string(),
  name: z.string(),
  parent_company: z.string(),
  ownership_chain: z.array(OwnershipChainSchema),
  major_shareholders: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['individual', 'institutional', 'private_equity']),
    }),
  ),
  revenue_model: z.string(),
  political_donations: z.array(PoliticalDonationSchema),
  other_properties: z.array(z.string()),
  editorial_notes: z.string().nullable(),
  last_updated: z.string(),
});

export type OutletOwnership = z.infer<typeof OutletOwnershipSchema>;
```

**File: `src/lib/ownership/lookup.ts`**

```typescript
import ownershipData from '../../../data/ownership/ownership.json';
import type { OutletOwnership } from './types';

export function lookupOwnership(domain: string): OutletOwnership | null {
  const normalizedDomain = normalizeDomain(domain);
  return ownershipData.find((outlet) => outlet.domain === normalizedDomain) || null;
}

function normalizeDomain(domain: string): string {
  const stripPrefixes = ['www.', 'amp.', 'm.', 'mobile.', 'edition.'];
  let normalized = domain.toLowerCase();
  for (const prefix of stripPrefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length);
      break;
    }
  }
  return normalized;
}

export function formatDonations(
  donations: { recipient: string; amount: number; party: string }[],
): string {
  if (!donations.length) return 'No significant donations reported';

  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  const dem = donations.filter((d) => d.party === 'D').reduce((sum, d) => sum + d.amount, 0);
  const rep = donations.filter((d) => d.party === 'R').reduce((sum, d) => sum + d.amount, 0);

  const format = (n: number) =>
    n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;

  if (dem > 0 && rep > 0) {
    return `${format(dem)}D / ${format(rep)}R (${format(total)} total, 2024)`;
  } else if (dem > 0) {
    return `${format(dem)} to Democrats (2024)`;
  } else if (rep > 0) {
    return `${format(rep)} to Republicans (2024)`;
  }
  return 'No significant donations reported';
}
```

**Definition of Done:**

- [ ] lookupOwnership returns ownership data for known domains
- [ ] Returns null for unknown domains
- [ ] Normalizes domain (strips www., amp., etc.)
- [ ] formatDonations produces readable summary

---

### Task B.3: Ownership Display Component

**File: `src/entrypoints/sidepanel/components/OwnershipCard.tsx`**

```tsx
import type { OutletOwnership } from '../../../lib/ownership/types';
import { formatDonations } from '../../../lib/ownership/lookup';

interface OwnershipCardProps {
  ownership: OutletOwnership;
}

export function OwnershipCard({ ownership }: OwnershipCardProps) {
  return (
    <section class="rounded-lg bg-neutral-900 overflow-hidden">
      <button
        class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-800/50 transition-colors"
        aria-expanded="false"
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-400">Ownership</h2>
        </div>
        <svg class="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div class="px-4 pb-4 space-y-3">
        <div>
          <p class="text-sm font-medium text-neutral-200">{ownership.name}</p>
          <p class="text-xs text-neutral-400">Owned by {ownership.parent_company}</p>
        </div>
        <div class="text-xs text-neutral-400">
          <p>Revenue: {ownership.revenue_model}</p>
          <p class="mt-1">{formatDonations(ownership.political_donations)}</p>
        </div>
        {ownership.other_properties.length > 0 && (
          <div class="text-xs text-neutral-500">
            <p>Other properties: {ownership.other_properties.slice(0, 3).join(', ')}</p>
          </div>
        )}
        {ownership.editorial_notes && (
          <div class="text-xs text-neutral-500 italic border-t border-neutral-800 pt-2 mt-2">
            {ownership.editorial_notes}
          </div>
        )}
      </div>
    </section>
  );
}

interface OwnershipUnknownProps {
  domain: string;
}

export function OwnershipUnknown({ domain }: OwnershipUnknownProps) {
  return (
    <section class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">Ownership</h2>
      <p class="mt-2 text-sm text-neutral-400">No ownership data available for {domain}</p>
    </section>
  );
}
```

**Definition of Done:**

- [ ] Shows parent company name
- [ ] Shows revenue model
- [ ] Shows formatted political donations
- [ ] Shows other properties if available
- [ ] Shows "unknown" state when no data

---

## Stream C: Reference Library

### Task C.1: Curate 10 Theoretical Reference Entries

**File: `data/references/references.json`**

```json
[
  {
    "id": "manufacturing-consent-filters",
    "concept_name": "The Propaganda Model & Filtering",
    "author": "Edward S. Herman & Noam Chomsky",
    "work_title": "Manufacturing Consent: The Political Economy of the Mass Media",
    "year": 1988,
    "specific_section": "Chapter 1: The Propaganda Model",
    "plain_language_summary": "Herman and Chomsky argue that Western media systematically filters news through five 'filters': ownership/advertising, sourcing, flak, anti-communism, and the 'free market' ideology. These structural factors explain why US media consistently serve elite interests.",
    "keywords": [
      "propaganda",
      "media bias",
      "corporate media",
      "sourcing",
      "advertising",
      "flak",
      "elite",
      "filters",
      "manufacturing consent"
    ],
    "analysis_triggers": [
      "no workers quoted",
      "only executives",
      "corporate sources",
      "advertiser pressure",
      "official sources only",
      "no alternative perspective",
      "no labor union",
      "no community voices"
    ],
    "free_url": "https://www.marxists.org/archive/chomsky/1988/manufacturing-consent.htm"
  },
  {
    "id": "gramsci-hegemony",
    "concept_name": "Cultural Hegemony",
    "author": "Antonio Gramsci",
    "work_title": "Prison Notebooks (Selections)",
    "year": "1929-1935",
    "specific_section": "Notebook 12: The Concept of Culture",
    "plain_language_summary": "Gramsci argues that ruling classes maintain power not just through force but by winning 'cultural hegemony'—making their worldview appear natural and common sense. Media play a key role in spreading hegemonic ideas that serve elite interests.",
    "keywords": [
      "hegemony",
      "cultural dominance",
      "common sense",
      "ruling class",
      "ideology",
      "civil society",
      "consent",
      "organic intellectuals"
    ],
    "analysis_triggers": [
      "presented as inevitable",
      "no alternative mentioned",
      "common sense",
      "naturally",
      "everyone knows",
      "just the way it is"
    ],
    "free_url": "https://www.marxists.org/archive/gramsci/prison_notebooks/"
  },
  {
    "id": "society-spectacle",
    "concept_name": "The Spectacle",
    "author": "Guy Debord",
    "work_title": "The Society of the Spectacle",
    "year": 1967,
    "specific_section": "Theses 1-34",
    "plain_language_summary": "Debord argues that modern capitalism has created a 'spectacle'—a mediated reality where direct experience is replaced by images and representations. The spectacle presents what appears to be good as good, shaping how we understand reality itself.",
    "keywords": [
      "spectacle",
      "mediated reality",
      "images",
      "representation",
      "consumerism",
      "capitalist realism",
      "appearance",
      "reality"
    ],
    "analysis_triggers": [
      "image-focused",
      "celebrity",
      "surface level",
      "entertainment",
      "as seen on tv",
      "viral",
      "trending"
    ],
    "free_url": "https://www.marxists.org/reference/archive/debord/society.htm"
  },
  {
    "id": "althusser-ideology",
    "concept_name": "Ideology & Ideological State Apparatuses",
    "author": "Louis Althusser",
    "work_title": "Ideology and Ideological State Apparatuses",
    "year": 1970,
    "specific_section": "Notes from the Essay",
    "plain_language_summary": "Althusser argues that ideology reproduces the conditions of production by shaping how people understand their place in society. Schools, media, and religion function as 'Ideological State Apparatuses' that train people to accept existing social relations as natural.",
    "keywords": [
      "ideology",
      "interpellation",
      "ISA",
      "hegemony",
      "reproduction",
      "ideological state apparatuses",
      "subject",
      "ideological"
    ],
    "analysis_triggers": [
      "should accept",
      "normal",
      "proper way",
      "citizens should",
      "moral",
      "values",
      "family values"
    ],
    "free_url": "https://www.marxists.org/reference/archive/althusser/1970/ideology.htm"
  },
  {
    "id": "german-ideology-ruling-class",
    "concept_name": "Ruling Class Ideas",
    "author": "Karl Marx & Friedrich Engels",
    "work_title": "The German Ideology",
    "year": 1846,
    "specific_section": "Part I: Feuerbach",
    "plain_language_summary": "Marx and Engels argue that the ideas of the ruling class become the dominant ideas in any society because they control the means of material production AND the means of mental production. The ruling ideas are the ideas of ruling material relations.",
    "keywords": [
      "ruling class",
      "ideology",
      "dominant ideology",
      "ideas",
      "material production",
      "mental production",
      "superstructure"
    ],
    "analysis_triggers": [
      "experts say",
      "officials",
      "authorities",
      "established",
      "mainstream",
      "experts agree"
    ],
    "free_url": "https://www.marxists.org/archive/marx/works/1845/german-ideology/"
  },
  {
    "id": "capital-commodity-fetishism",
    "concept_name": "Commodity Fetishism",
    "author": "Karl Marx",
    "work_title": "Capital, Volume I",
    "year": 1867,
    "specific_section": "Chapter 1, Section 4: The Fetishism of the Commodity",
    "plain_language_summary": "Marx introduces the concept of 'commodity fetishism'—the way social relations between people appear as relations between things. This concept helps explain how market relationships can seem natural and apolitical when they're actually structured by power.",
    "keywords": [
      "commodity fetishism",
      "market",
      "capitalism",
      "things",
      "natural",
      "apolitical",
      "economic",
      "market forces"
    ],
    "analysis_triggers": [
      "market forces",
      "the market",
      "economic",
      "just business",
      "profit motive",
      "supply and demand"
    ],
    "free_url": "https://www.marxists.org/archive/marx/works/1867-c1/"
  },
  {
    "id": "capitalist-realism",
    "concept_name": "Capitalist Realism",
    "author": "Mark Fisher",
    "work_title": "Capitalist Realism: Is There No Alternative?",
    "year": 2009,
    "specific_section": "Part One: The Concept",
    "plain_language_summary": "Fisher argues that post-2008 capitalism has developed a form of 'realism' where the idea of any alternative to capitalism seems impossible or unrealistic. This 'capitalist realism' operates as a pervasive atmosphere limiting political imagination.",
    "keywords": [
      "capitalist realism",
      "no alternative",
      "TINA",
      "impossible",
      "realistic",
      "there is no alternative",
      "common sense"
    ],
    "analysis_triggers": [
      "no alternative",
      "unrealistic",
      "not realistic",
      "pie in the sky",
      "wouldn't work",
      "idealistic",
      "utopian"
    ],
    "free_url": "https://www.goodreads.com/book/show/191474.Capitalist_Realism"
  },
  {
    "id": "orientalism",
    "concept_name": "Orientalism",
    "author": "Edward Said",
    "work_title": "Orientalism",
    "year": 1978,
    "specific_section": "Introduction",
    "plain_language_summary": "Said argues that Western representations of 'the East' (Middle East, Asia) have been systematically distorted through a colonial lens that portrays these regions as exotic, backward, and irrational. This 'Orientalism' continues to shape how Western media cover these regions.",
    "keywords": [
      "orientalism",
      "foreign",
      "exotic",
      "other",
      "western",
      "colonial",
      "islamophobia",
      "Middle East",
      "terrorist"
    ],
    "analysis_triggers": [
      "terrorist",
      "radical",
      "extremist",
      "backward",
      "exotic",
      "ancient",
      "tribal",
      "foreign threat"
    ],
    "free_url": "https://www.goodreads.com/book/show/29810.Orientalism"
  },
  {
    "id": "reform-or-revolution",
    "concept_name": "Reform vs. Revolution",
    "author": "Rosa Luxemburg",
    "work_title": "Reform or Revolution",
    "year": 1899,
    "specific_section": "The Problem",
    "plain_language_summary": "Luxemburg argues that reform and revolution cannot be separated—attempts to reform capitalism within its existing framework ultimately fail because the system inherently requires exploitation. True change requires revolutionary transformation of the relations of production.",
    "keywords": [
      "reform",
      "revolution",
      "reformism",
      "revolutionary",
      "incremental",
      "systemic",
      "structural",
      "gradual"
    ],
    "analysis_triggers": [
      "reform",
      "compromise",
      "bipartisan",
      "incremental",
      "practical",
      "step by step",
      "within the system"
    ],
    "free_url": "https://www.marxists.org/archive/luxemburg/1900/reform-or-revolution/"
  },
  {
    "id": "undoing-demos",
    "concept_name": "Neoliberal Rationality",
    "author": "Wendy Brown",
    "work_title": "Undoing the Demos: The Reinvention of Democracy",
    "year": 2015,
    "specific_section": "Chapter 1: American Democracy in the Twilight of Neoliberalism",
    "plain_language_summary": "Brown argues that neoliberalism is not just an economic policy but a transformation of political life itself—reducing human beings to 'human capital' and treating democracy as a market phenomenon rather than collective self-governance.",
    "keywords": [
      "neoliberalism",
      "human capital",
      "austerity",
      "privatization",
      "market",
      "democracy",
      "entrepreneurial",
      "competitiveness"
    ],
    "analysis_triggers": [
      "austerity",
      "efficiency",
      "cost-cutting",
      "privatization",
      "entrepreneur",
      "self-reliance",
      "personal responsibility"
    ],
    "free_url": "https://zonebooks.org/titles/Brown-Undoing-the-Demos.html"
  }
]
```

**Definition of Done:**

- [ ] JSON file contains 10 reference entries
- [ ] Each entry has: id, concept_name, author, work_title, year, specific_section, plain_language_summary, keywords[], analysis_triggers[], free_url

---

### Task C.2: Heuristic Reference Matcher

**File: `src/lib/references/types.ts`**

```typescript
import { z } from 'zod';

export const ReferenceSchema = z.object({
  id: z.string(),
  concept_name: z.string(),
  author: z.string(),
  work_title: z.string(),
  year: z.union([z.string(), z.number()]),
  specific_section: z.string(),
  plain_language_summary: z.string(),
  keywords: z.array(z.string()),
  analysis_triggers: z.array(z.string()),
  free_url: z.string().nullable(),
});

export type Reference = z.infer<typeof ReferenceSchema>;

export interface MatchedReference extends Reference {
  relevance_score: number;
  matched_triggers: string[];
}
```

**File: `src/lib/references/matcher.ts`**

```typescript
import referencesData from '../../../data/references/references.json';
import type { Reference, MatchedReference } from './types';

export function matchReferences(analysisText: string): MatchedReference[] {
  const lowerText = analysisText.toLowerCase();
  const scoredReferences: { ref: Reference; score: number; triggers: string[] }[] = [];

  for (const ref of referencesData) {
    let score = 0;
    const matchedTriggers: string[] = [];

    for (const trigger of ref.analysis_triggers) {
      if (lowerText.includes(trigger.toLowerCase())) {
        score += 2;
        matchedTriggers.push(trigger);
      }
    }

    for (const keyword of ref.keywords) {
      const keywordRegex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
      const matches = lowerText.match(keywordRegex);
      if (matches) {
        score += matches.length * 0.5;
      }
    }

    if (score > 0) {
      scoredReferences.push({ ref, score, triggers: matchedTriggers });
    }
  }

  scoredReferences.sort((a, b) => b.score - a.score);

  return scoredReferences.slice(0, 5).map(({ ref, score, triggers }) => ({
    ...ref,
    relevance_score: Math.min(score, 10),
    matched_triggers: triggers,
  }));
}

export function getAllReferences(): Reference[] {
  return referencesData;
}
```

**Definition of Done:**

- [ ] matchReferences returns relevant references based on analysis text
- [ ] Results are sorted by relevance score
- [ ] Maximum 5 references returned
- [ ] Keyword matching is case-insensitive

---

### Task C.3: Further Reading UI Component

**File: `src/entrypoints/sidepanel/components/FurtherReading.tsx`**

```tsx
import type { MatchedReference } from '../../../lib/references/types';

interface FurtherReadingProps {
  references: MatchedReference[];
}

export function FurtherReading({ references }: FurtherReadingProps) {
  if (references.length === 0) {
    return null;
  }

  return (
    <section class="rounded-lg bg-neutral-900 overflow-hidden">
      <button
        class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-800/50 transition-colors"
        aria-expanded="false"
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Further Reading ({references.length})
          </h2>
        </div>
        <svg class="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div class="px-4 pb-4 space-y-3">
        {references.map((ref) => (
          <div key={ref.id} class="border-l-2 border-neutral-700 pl-3">
            <h3 class="text-sm font-medium text-neutral-200">{ref.concept_name}</h3>
            <p class="text-xs text-neutral-400 mt-0.5">
              {ref.author}, <em>{ref.work_title}</em> ({ref.year})
            </p>
            <p class="text-xs text-neutral-500 mt-2">{ref.plain_language_summary}</p>
            {ref.free_url && (
              <a
                href={ref.free_url}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                Read free on Marxists.org →
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Definition of Done:**

- [ ] Shows list of matched references
- [ ] Each reference shows: concept name, author, work, summary
- [ ] Includes link to free URL if available
- [ ] Collapsible section

---

## Stream D: In-Page Highlights

### Task D.1: Shadow DOM Highlight Injection

**File: `src/lib/highlights/types.ts`**

```typescript
import { z } from 'zod';

export const HighlightTypeSchema = z.enum(['euphemism', 'sourcing', 'missing_context']);

export type HighlightType = z.infer<typeof HighlightTypeSchema>;

export const HighlightSchema = z.object({
  id: z.string(),
  type: HighlightTypeSchema,
  text: z.string(),
  explanation: z.string(),
  reference: z.string().optional(),
});

export type Highlight = z.infer<typeof HighlightSchema>;

export const highlightColors: Record<
  HighlightType,
  { bg: string; border: string; tooltip: string }
> = {
  euphemism: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.5)',
    tooltip: 'Euphemism detected',
  },
  sourcing: {
    bg: 'rgba(234, 179, 8, 0.2)',
    border: 'rgba(234, 179, 8, 0.5)',
    tooltip: 'Sourcing concern',
  },
  missing_context: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.5)',
    tooltip: 'Missing context',
  },
};
```

**File: `src/lib/highlights/injector.ts`**

```typescript
import type { Highlight, HighlightType } from './types';
import { highlightColors } from './types';

let shadowRoot: ShadowRoot | null = null;
let highlightContainer: HTMLDivElement | null = null;
let tooltipsContainer: HTMLDivElement | null = null;

function ensureShadowRoot(): ShadowRoot {
  if (!shadowRoot) {
    const host = document.createElement('div');
    host.id = 'marx-meter-highlights';
    host.style.cssText = 'position: absolute; z-index: 999999; pointer-events: none;';
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .highlight {
        pointer-events: auto;
        cursor: pointer;
        border-bottom: 2px solid;
        position: relative;
        transition: background-color 0.2s;
      }
      .highlight:hover {
        filter: brightness(1.2);
      }
      .tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 12px;
        background: #171717;
        color: #e5e5e5;
        font-size: 12px;
        line-height: 1.4;
        border-radius: 6px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        margin-bottom: 8px;
      }
      .highlight:hover .tooltip {
        opacity: 1;
        visibility: visible;
      }
      .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: #171717;
      }
    `;
    shadowRoot.appendChild(style);

    highlightContainer = document.createElement('div');
    shadowRoot.appendChild(highlightContainer);
  }
  return shadowRoot;
}

export function injectHighlights(highlights: Highlight[]): void {
  const root = ensureShadowRoot();
  if (!highlightContainer) return;

  highlightContainer.innerHTML = '';

  for (const highlight of highlights) {
    const ranges = findTextRanges(document, highlight.text);
    const colors = highlightColors[highlight.type];

    for (const range of ranges) {
      try {
        const span = document.createElement('span');
        span.className = 'highlight';
        span.style.backgroundColor = colors.bg;
        span.style.borderBottomColor = colors.border;

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = `${colors.tooltip}: ${highlight.explanation}`;
        span.appendChild(tooltip);

        range.surroundContents(span);

        span.addEventListener('click', () => {
          window.postMessage({ type: 'MARX_METER_HIGHLIGHT_CLICK', highlight }, '*');
        });
      } catch (e) {
        console.warn('Marx Meter: Could not highlight range', e);
      }
    }
  }
}

function findTextRanges(doc: Document, text: string): Range[] {
  const ranges: Range[] = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);

  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    const index = node.textContent?.indexOf(text);
    if (index !== null && index >= 0) {
      const range = doc.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      ranges.push(range);

      if (ranges.length >= 3) return ranges;
    }
  }

  return ranges;
}

export function clearHighlights(): void {
  const host = document.getElementById('marx-meter-highlights');
  if (host) {
    host.remove();
  }
  shadowRoot = null;
  highlightContainer = null;
}

export function isHighlightEnabled(): boolean {
  return document.getElementById('marx-meter-highlights') !== null;
}
```

**Definition of Done:**

- [ ] Injects highlights into page using Shadow DOM
- [ ] Three highlight types with distinct colors
- [ ] Hover shows tooltip with explanation
- [ ] Highlights don't interfere with page CSS

---

### Task D.2: Highlight Toggle State

**File: `src/lib/highlights/store.ts`**

```typescript
import { create } from 'zustand';

interface HighlightsState {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
}

export const useHighlightsStore = create<HighlightsState>((set) => ({
  enabled: true,

  toggle: () => set((state) => ({ enabled: !state.enabled })),

  setEnabled: (enabled: boolean) => set({ enabled }),
}));
```

Update content script to load/save state:

```typescript
// In content script main():
browser.storage.local.get('highlightsEnabled').then((storage) => {
  if (storage.highlightsEnabled === false) {
    return;
  }
  // Listen for analysis results and inject highlights
});
```

---

### Task D.3: Highlight ↔ Side Panel Communication

Add message types:

**File: `src/common/types.ts`** (add)

```typescript
export interface HighlightsToggleMessage {
  type: 'HIGHLIGHTS_TOGGLE';
  payload: boolean;
}

export interface HighlightClickMessage {
  type: 'HIGHLIGHT_CLICK';
  payload: { highlightId: string };
}

export type RuntimeMessage =
  // ... existing messages
  HighlightsToggleMessage | HighlightClickMessage;
```

---

## Integration Phase

### Task I.1: Wire Ownership + References into Analysis Flow

**File: `src/entrypoints/background.ts`** (modify)

Add ownership lookup after analysis:

```typescript
// Inside handleAnalysis, after getting the result:
const ownership = lookupOwnership(article.domain);

// Send both analysis and ownership to sidepanel
return { analysis: result, ownership };
```

### Task I.2: Update App.tsx to Show New Components

**File: `src/entrypoints/sidepanel/App.tsx`** (major modification)

Full rewrite to include:

- Progressive disclosure with CollapsibleSection
- OwnershipCard above analysis
- FurtherReading below analysis
- Highlights toggle button
- Dark mode detection
- Streaming support

### Task I.3: Update Prompt for Highlight Mapping

**File: `src/lib/analysis/prompts.ts`** (modify)

Add instruction to output framing choices with exact quotes that can be matched to DOM:

```typescript
// In the prompt, add:
// For each framingChoice, ensure the "quote" field contains exact text from the article.
// This text will be used to highlight passages in the original article.
```

**Definition of Done:**

- [ ] Ownership shows above analysis
- [ ] References show below relevant sections
- [ ] Highlights can be toggled on/off
- [ ] Side panel scroll works when highlight clicked

---

## What to Test (Summary)

| Area                   | Test Type   | Location            | What It Validates                     |
| ---------------------- | ----------- | ------------------- | ------------------------------------- |
| Storybook              | Visual      | `.storybook/`       | Components render correctly           |
| Progressive disclosure | Unit        | `tests/sidepanel/`  | Sections expand/collapse correctly    |
| Dark mode              | Unit        | `tests/sidepanel/`  | Detects system preference             |
| Ownership lookup       | Unit        | `tests/ownership/`  | Returns correct data for domains      |
| Reference matching     | Unit        | `tests/references/` | Matches relevant references           |
| Highlight injection    | Integration | `tests/highlights/` | Highlights appear in DOM              |
| Shadow DOM isolation   | Integration | Playwright          | Page CSS doesn't leak into highlights |

---

## M2 Definition of Done (Complete Milestone)

All of these must be true before M2 is considered complete:

- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (all unit tests)
- [ ] `pnpm build` produces a loadable extension
- [ ] `pnpm storybook` runs successfully
- [ ] Side panel has polished, progressive-disclosure UI with dark mode
- [ ] Ownership info displays for top 20 outlets
- [ ] At least 5 theoretical references appear contextually in analysis output
- [ ] "Further Reading" sections expand to show concept summary + external link
- [ ] In-page highlights appear on analyzed articles (3 colors by type)
- [ ] Hover tooltip shows analysis summary; click scrolls side panel
- [ ] Highlights toggleable from side panel
- [ ] Streaming analysis display (text appears progressively)
- [ ] No visual interference with host page CSS (Shadow DOM isolation)
- [ ] `specs/PROGRESS.md` updated with all M2 tasks marked `[x]`

---

## Files Created in This Milestone (Complete List)

### New Files

```
.storybook/main.ts
.storybook/preview.ts
src/lib/ui/store.ts
src/lib/ownership/types.ts
src/lib/ownership/lookup.ts
src/lib/references/types.ts
src/lib/references/matcher.ts
src/lib/highlights/types.ts
src/lib/highlights/injector.ts
src/lib/highlights/store.ts
data/ownership/ownership.json
data/references/references.json
src/entrypoints/sidepanel/components/CollapsibleSection.tsx
src/entrypoints/sidepanel/components/OwnershipCard.tsx
src/entrypoints/sidepanel/components/FurtherReading.tsx
src/entrypoints/sidepanel/components/StreamingText.tsx
src/stories/*.stories.tsx
tests/ownership/*.test.ts
tests/references/*.test.ts
tests/highlights/*.test.ts
```

### Modified Files

```
src/entrypoints/sidepanel/App.tsx
src/entrypoints/sidepanel/components/*.tsx
src/entrypoints/content.ts
src/entrypoints/background.ts
src/lib/ai/gemini.ts
src/lib/ai/types.ts
src/lib/analysis/prompts.ts
src/common/types.ts
package.json
```

### Deleted Files

```
(None)
```
