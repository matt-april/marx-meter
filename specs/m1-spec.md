# M1: Minimum Viable Analysis — Detailed Implementation Spec

**Goal:** User visits a news article, clicks the extension icon, and sees a structured class interest analysis in the side panel.

**Estimated effort:** 3-4 days
**Prerequisite:** M0 complete (extension loads, side panel opens, CI passes)

---

## How This Spec Works

This spec is written for AI coding agents. Follow it literally. Do not improvise. Do not add features not described here. Do not refactor existing code unless the spec says to. If something is ambiguous, pick the simplest interpretation and move on.

**Every file path is absolute from the repo root** (`/Users/matt/repos/marx_meter/`). When the spec says `src/lib/ai/gemini.ts`, that means `/Users/matt/repos/marx_meter/src/lib/ai/gemini.ts`.

---

## Git Branching Strategy

This project uses **trunk-based development**. All work merges to `main`.

### Rules for Agents

1. **Each stream works on its own branch** off of `main`:
   - Stream A: `m1/extraction`
   - Stream B: `m1/ai-pipeline`
   - Stream C: `m1/sidepanel-display`
   - Integration: `m1/integration`

2. **Branch lifecycle:**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b m1/extraction    # (or m1/ai-pipeline, m1/sidepanel-display)
   # ... do work, commit often ...
   git checkout main
   git pull origin main
   git merge m1/extraction          # merge your branch into main
   git push origin main
   git branch -d m1/extraction      # delete the branch
   ```

3. **Never force push to `main`.** If merge conflicts occur, resolve them manually.

4. **Commit messages:** Use conventional commits. Examples:
   - `feat(extraction): integrate Readability.js for article parsing`
   - `feat(ai): add Gemini adapter with structured output`
   - `test(extraction): add unit tests for domain detection`
   - `feat(sidepanel): add analysis display component`

5. **Stream B must merge first** because it defines shared types that C depends on. Then A and C can merge in any order. Integration branch merges last.

### Merge Order

```
Stream B (types + AI pipeline)  →  merge to main first
Stream A (extraction)           →  merge to main second (no dependency on B)
Stream C (side panel display)   →  merge to main third (depends on B's types)
Integration                     →  merge to main last (depends on A, B, C)
```

---

## Progress Tracking

**After completing each task, the agent MUST update `specs/PROGRESS.md`.**

### How to Update Progress

1. Open `specs/PROGRESS.md`
2. Find the M1 section
3. Change the task's status from `[ ]` to `[x]`
4. Add your agent name in the Owner column
5. Add any relevant notes (package versions installed, deviations from spec, etc.)

Example — before:

```
| Integrate Readability.js in content script | [ ] | | |
```

Example — after:

```
| Integrate Readability.js in content script | [x] | Agent-A | @mozilla/readability@0.5.0 |
```

**If you are starting a task but haven't finished it**, mark it `[~]` (in progress).

**If a task is blocked**, mark it `[!]` and explain why in Notes.

---

## Package Dependencies

### Install Before Starting Any Stream

All agents need these shared dependencies. Run once at the start:

```bash
cd /Users/matt/repos/marx_meter
pnpm add @mozilla/readability
pnpm add zod
```

### Stream B Only (AI Pipeline)

```bash
pnpm add @google/genai zod-to-json-schema
```

### Stream C Only (Side Panel)

No additional packages needed. Uses existing Preact + Tailwind from M0.

---

## Parallel Work Streams

```
                    ┌──▶ Stream A: Extraction (content script + Readability.js)
                    │
M0 complete ────────┼──▶ Stream B: AI Pipeline (types + Gemini adapter + prompt)
                    │         │
                    │         │ (shared types defined here)
                    │         ▼
                    └──▶ Stream C: Side Panel Display (depends on B's types only)
                                │
                                ▼
                         Integration (wires A → B → C)
```

### File Ownership Rules

**Stream A owns these files (no other stream may modify them):**

- `src/lib/extraction/readability.ts`
- `src/lib/extraction/domain.ts`
- `src/entrypoints/content.ts` (modify existing)
- `tests/extraction/` (entire directory)
- `tests/fixtures/articles/` (HTML fixture files)

**Stream B owns these files:**

- `src/common/types.ts` (modify existing — add AnalysisResult types)
- `src/lib/ai/gemini.ts`
- `src/lib/ai/types.ts`
- `src/lib/analysis/prompts.ts`
- `data/prompts/pass1-pass2.txt`
- `tests/ai/` (entire directory)
- `tests/fixtures/api-responses/` (JSON fixture files)

**Stream C owns these files:**

- `src/entrypoints/sidepanel/App.tsx` (modify existing)
- `src/entrypoints/sidepanel/components/AnalysisDisplay.tsx`
- `src/entrypoints/sidepanel/components/LoadingSpinner.tsx`
- `src/entrypoints/sidepanel/components/ErrorDisplay.tsx`
- `src/entrypoints/sidepanel/components/QuickTake.tsx`
- `src/entrypoints/sidepanel/components/WhoBenefits.tsx`
- `src/entrypoints/sidepanel/components/FramingChoices.tsx`
- `src/entrypoints/sidepanel/components/IdeologicalAxes.tsx`
- `tests/sidepanel/` (entire directory)
- `tests/fixtures/analysis-results/` (JSON fixture files)

**Integration owns these files:**

- `src/entrypoints/background.ts` (modify existing)
- `src/entrypoints/sidepanel/App.tsx` (modify to wire everything together)
- `src/entrypoints/sidepanel/components/ApiKeyInput.tsx`

---

## Stream B: AI Pipeline (DO THIS FIRST — defines shared types)

Stream B must complete its types task (B.1) before Stream C can begin, because C needs the `AnalysisResult` type to render components.

### Task B.1: Define AnalysisResult TypeScript Types + Zod Schemas

**File: `src/common/types.ts`**

Replace the entire contents of this file with:

```typescript
import { z } from 'zod';

// ─── Article Data (extracted by content script) ───

export const ArticleDataSchema = z.object({
  title: z.string(),
  byline: z.string().nullable(),
  content: z.string(),
  textContent: z.string(),
  excerpt: z.string(),
  domain: z.string(),
  url: z.string().url(),
  publishedTime: z.string().nullable(),
  siteName: z.string().nullable(),
});

export type ArticleData = z.infer<typeof ArticleDataSchema>;

// ─── Analysis Result (returned by AI pipeline) ───

export const FramingChoiceSchema = z.object({
  type: z.enum([
    'euphemism',
    'passive_voice',
    'source_bias',
    'omission',
    'headline_mismatch',
    'other',
  ]),
  quote: z.string().describe('Exact quote from the article text'),
  explanation: z.string().describe('Why this framing choice matters, in plain language'),
});

export type FramingChoice = z.infer<typeof FramingChoiceSchema>;

export const IdeologicalAxisSchema = z.object({
  name: z.enum([
    'pro_capital_vs_pro_labor',
    'individualist_vs_systemic',
    'nationalist_vs_internationalist',
  ]),
  score: z
    .number()
    .min(0)
    .max(10)
    .describe('0 = first pole (e.g. pro-capital), 10 = second pole (e.g. pro-labor)'),
  label: z.string().describe('Human-readable label for the score, e.g. "Strongly pro-capital"'),
  explanation: z.string().describe('Brief explanation of why this score was given'),
});

export type IdeologicalAxis = z.infer<typeof IdeologicalAxisSchema>;

export const AnalysisResultSchema = z.object({
  quickTake: z
    .string()
    .describe('2-3 sentence summary of the key framing and class interests at play'),
  whoBenefits: z.array(z.string()).min(1).describe('Groups positioned favorably by the framing'),
  whosAbsent: z
    .array(z.string())
    .min(1)
    .describe('Perspectives or stakeholders conspicuously missing'),
  framingChoices: z
    .array(FramingChoiceSchema)
    .min(1)
    .describe('Specific framing choices identified in the article'),
  ideologicalAxes: z
    .array(IdeologicalAxisSchema)
    .min(1)
    .describe('Multi-axis ideological assessment'),
  sourceAnalysis: z
    .object({
      totalSources: z.number().int().min(0),
      corporateOrOfficial: z.number().int().min(0),
      workerOrCommunity: z.number().int().min(0),
      anonymous: z.number().int().min(0),
      summary: z.string(),
    })
    .describe('Breakdown of who is quoted and how often'),
  missingContext: z.string().describe('What systemic or historical context does the article omit?'),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ─── Message types for chrome.runtime messaging ───

export interface ExtractArticleMessage {
  type: 'EXTRACT_ARTICLE';
}

export interface ArticleExtractedMessage {
  type: 'ARTICLE_EXTRACTED';
  payload: ArticleData;
}

export interface ExtractionFailedMessage {
  type: 'EXTRACTION_FAILED';
  error: string;
}

export interface AnalyzeArticleMessage {
  type: 'ANALYZE_ARTICLE';
  payload: ArticleData;
}

export interface AnalysisCompleteMessage {
  type: 'ANALYSIS_COMPLETE';
  payload: AnalysisResult;
}

export interface AnalysisErrorMessage {
  type: 'ANALYSIS_ERROR';
  error: string;
}

export type RuntimeMessage =
  | ExtractArticleMessage
  | ArticleExtractedMessage
  | ExtractionFailedMessage
  | AnalyzeArticleMessage
  | AnalysisCompleteMessage
  | AnalysisErrorMessage;
```

**Definition of Done:**

- [ ] `pnpm typecheck` passes with new types
- [ ] All Zod schemas are defined and exported
- [ ] All TypeScript types derived from schemas via `z.infer`
- [ ] Message types cover the full content script ↔ background ↔ sidepanel flow

---

### Task B.2: Gemini Adapter

**File: `src/lib/ai/types.ts`**

```typescript
import { ArticleData, AnalysisResult } from '../../common/types';

export interface AIProvider {
  analyze(article: ArticleData): Promise<AnalysisResult>;
  validateKey(apiKey: string): Promise<boolean>;
}
```

**File: `src/lib/ai/gemini.ts`**

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

**Important notes for the implementing agent:**

- The `@google/genai` package is the NEW official Google Gen AI SDK. Do NOT use `@google/generative-ai` (that package is deprecated).
- `zodToJsonSchema` converts a Zod schema to a JSON Schema object, which is what the Gemini API expects for `responseJsonSchema`.
- `temperature: 0.3` is intentionally low — we want consistent, analytical output, not creative writing.
- The `model` defaults to `gemini-2.5-flash` which has generous free tier limits (10 RPM, 250 RPD).

**Definition of Done:**

- [ ] `GeminiAdapter` class implements `AIProvider` interface
- [ ] `analyze()` sends prompt to Gemini, parses JSON response, validates with Zod
- [ ] `validateKey()` makes a test API call and returns boolean
- [ ] `pnpm typecheck` passes

---

### Task B.3: Analysis Prompt Template

**File: `src/lib/analysis/prompts.ts`**

```typescript
import { ArticleData } from '../../common/types';

export function buildAnalysisPrompt(article: ArticleData): string {
  const truncatedContent = article.textContent.slice(0, 30000);
  const isTruncated = article.textContent.length > 30000;

  return `You are a critical media analyst specializing in class interest analysis, drawing on the tradition of materialist media criticism (Herman & Chomsky, Gramsci, Marx).

Analyze the following news article. Your job is to identify:
1. Whose class and economic interests are served by this article's framing
2. Whose perspectives are absent
3. Specific framing techniques used (euphemisms, passive voice, source bias, omissions)
4. Where the article falls on ideological axes

Be specific. Every claim must reference a direct quote or observable pattern in the article text. Do not make vague generalizations.

---

ARTICLE METADATA:
- Headline: ${article.title}
- Outlet: ${article.siteName || article.domain}
- Byline: ${article.byline || 'Unknown'}
- URL: ${article.url}
${isTruncated ? '- NOTE: Article was truncated to fit context window. Analysis may be incomplete.' : ''}

ARTICLE TEXT:
${truncatedContent}

---

ANALYSIS INSTRUCTIONS:

For "quickTake": Write 2-3 sentences that a busy reader could scan to understand the key class interests and framing choices at play. Be direct and specific — name the groups that benefit and the techniques used.

For "whoBenefits": List the specific groups (e.g., "shareholders", "pharmaceutical companies", "landlords", "police unions") that are positioned favorably by the article's framing. Be specific, not generic.

For "whosAbsent": List specific perspectives or stakeholders that are conspicuously missing from the article. Think about who is affected but not quoted or considered.

For "framingChoices": Identify all notable framing choices in the article. For each one:
- "type": Classify as one of: "euphemism" (loaded or sanitizing language), "passive_voice" (obscures who did what), "source_bias" (who is/isn't quoted), "omission" (what context is missing), "headline_mismatch" (headline doesn't match body), or "other".
- "quote": Copy the EXACT text from the article that demonstrates this framing choice. This must be a verbatim quote that appears in the article text above.
- "explanation": Explain in plain language why this framing choice matters — what does it hide, normalize, or emphasize?

For "ideologicalAxes": Score the article on these three axes (0-10):
- "pro_capital_vs_pro_labor": 0 = strongly pro-capital framing, 10 = strongly pro-labor framing
- "individualist_vs_systemic": 0 = frames issues as individual choices/failures, 10 = frames issues as systemic/structural
- "nationalist_vs_internationalist": 0 = nationalist framing, 10 = internationalist framing
For each axis, provide a brief explanation of why you assigned that score.

For "sourceAnalysis": Count how many sources/people are quoted in the article and categorize them:
- "corporateOrOfficial": executives, government officials, police spokespeople, analysts
- "workerOrCommunity": workers, union reps, community members, affected people
- "anonymous": unnamed sources
- "summary": One sentence summarizing the sourcing pattern.

For "missingContext": What systemic, historical, or structural context does the article omit? What would a reader need to know to fully understand this issue?

Respond with valid JSON matching the schema provided. Do not include any text outside the JSON object.`;
}
```

**File: `data/prompts/pass1-pass2.txt`**

Copy the exact same prompt text from the `buildAnalysisPrompt` function above (the template literal content, with `${...}` placeholders shown as `{{variable_name}}`). This file serves as the open-source, auditable version of the prompt. The actual runtime prompt is in `prompts.ts`.

```
You are a critical media analyst specializing in class interest analysis, drawing on the tradition of materialist media criticism (Herman & Chomsky, Gramsci, Marx).

Analyze the following news article. Your job is to identify:
1. Whose class and economic interests are served by this article's framing
2. Whose perspectives are absent
3. Specific framing techniques used (euphemisms, passive voice, source bias, omissions)
4. Where the article falls on ideological axes

Be specific. Every claim must reference a direct quote or observable pattern in the article text. Do not make vague generalizations.

---

ARTICLE METADATA:
- Headline: {{title}}
- Outlet: {{siteName or domain}}
- Byline: {{byline or "Unknown"}}
- URL: {{url}}

ARTICLE TEXT:
{{textContent, truncated to 30000 chars}}

---

[Analysis instructions follow — see prompts.ts for full text]
```

**Definition of Done:**

- [ ] `buildAnalysisPrompt()` returns a string containing the article text and analysis instructions
- [ ] Prompt truncates articles longer than 30,000 characters
- [ ] `data/prompts/pass1-pass2.txt` contains the human-readable prompt template
- [ ] Prompt instructs model to output JSON matching `AnalysisResultSchema`

---

### Task B.4: Tests for AI Pipeline

**File: `tests/fixtures/api-responses/gemini-valid.json`**

Create a valid `AnalysisResult` JSON object that the Gemini API would return. Use this as the fixture:

```json
{
  "quickTake": "This article frames mass layoffs at TechCorp as a positive 'restructuring' that will benefit shareholders, while centering investor reaction and analyst commentary. No workers or union representatives are quoted despite 5,000 job losses.",
  "whoBenefits": ["TechCorp shareholders", "C-suite executives", "Wall Street analysts"],
  "whosAbsent": [
    "Laid-off workers",
    "Labor unions",
    "Affected communities",
    "Remaining employees facing increased workloads"
  ],
  "framingChoices": [
    {
      "type": "euphemism",
      "quote": "workforce optimization initiative",
      "explanation": "The phrase 'workforce optimization' sanitizes the reality of 5,000 people losing their jobs. It frames human suffering as a technical process improvement."
    },
    {
      "type": "source_bias",
      "quote": "According to Goldman Sachs analyst Jane Smith, the restructuring positions TechCorp for long-term growth",
      "explanation": "The only named source is a Wall Street analyst who benefits from stock price increases. No workers, union reps, or community members are quoted."
    },
    {
      "type": "passive_voice",
      "quote": "positions were eliminated as part of the strategic review",
      "explanation": "Passive construction obscures who made the decision to fire 5,000 people. Positions weren't 'eliminated' — executives chose to lay off workers."
    }
  ],
  "ideologicalAxes": [
    {
      "name": "pro_capital_vs_pro_labor",
      "score": 2,
      "label": "Strongly pro-capital",
      "explanation": "The article centers shareholder value and stock price reaction, treating layoffs as a positive business strategy."
    },
    {
      "name": "individualist_vs_systemic",
      "score": 3,
      "label": "Mostly individualist",
      "explanation": "Frames the layoffs as a company-specific strategic decision rather than part of broader tech industry labor trends."
    },
    {
      "name": "nationalist_vs_internationalist",
      "score": 5,
      "label": "Neutral",
      "explanation": "No significant nationalist or internationalist framing detected."
    }
  ],
  "sourceAnalysis": {
    "totalSources": 4,
    "corporateOrOfficial": 3,
    "workerOrCommunity": 0,
    "anonymous": 1,
    "summary": "Three of four sources are corporate executives or Wall Street analysts. Zero workers are quoted despite being the primary people affected."
  },
  "missingContext": "The article omits TechCorp's $3B stock buyback program announced last quarter, executive compensation increases of 40% over the same period, and the fact that revenue actually increased 12% year-over-year. It also omits industry-wide trends of using 'AI restructuring' as justification for breaking union organizing efforts."
}
```

**File: `tests/fixtures/api-responses/gemini-malformed.json`**

```json
{
  "quickTake": "Some analysis here",
  "whoBenefits": [],
  "framingChoices": "this should be an array not a string"
}
```

**File: `tests/ai/gemini.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisResultSchema, type ArticleData } from '../../src/common/types';
import validResponse from '../fixtures/api-responses/gemini-valid.json';
import malformedResponse from '../fixtures/api-responses/gemini-malformed.json';

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn(),
      },
    })),
  };
});

// Mock zod-to-json-schema (it's a build-time concern, not relevant to test logic)
vi.mock('zod-to-json-schema', () => ({
  zodToJsonSchema: vi.fn().mockReturnValue({}),
}));

import { GeminiAdapter } from '../../src/lib/ai/gemini';
import { GoogleGenAI } from '@google/genai';

const mockArticle: ArticleData = {
  title: 'TechCorp Announces Workforce Optimization',
  byline: 'John Reporter',
  content: '<p>Article HTML content here</p>',
  textContent:
    'TechCorp announced today a workforce optimization initiative affecting 5,000 positions. According to Goldman Sachs analyst Jane Smith, the restructuring positions TechCorp for long-term growth. Positions were eliminated as part of the strategic review.',
  excerpt: 'TechCorp announced workforce optimization',
  domain: 'wsj.com',
  url: 'https://www.wsj.com/articles/techcorp-layoffs',
  publishedTime: '2026-02-10',
  siteName: 'The Wall Street Journal',
};

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;
  let mockGenerateContent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new GeminiAdapter('fake-api-key');
    // Get reference to the mocked generateContent
    const mockInstance = (GoogleGenAI as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
    mockGenerateContent = mockInstance.models.generateContent;
  });

  describe('analyze', () => {
    it('returns a valid AnalysisResult when Gemini returns valid JSON', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(validResponse),
      });

      const result = await adapter.analyze(mockArticle);

      expect(result.quickTake).toBeTruthy();
      expect(result.whoBenefits.length).toBeGreaterThanOrEqual(1);
      expect(result.whosAbsent.length).toBeGreaterThanOrEqual(1);
      expect(result.framingChoices.length).toBeGreaterThanOrEqual(1);
      expect(result.ideologicalAxes.length).toBeGreaterThanOrEqual(1);

      // Validate the full result against the Zod schema
      const validated = AnalysisResultSchema.safeParse(result);
      expect(validated.success).toBe(true);
    });

    it('throws when Gemini returns empty response', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: null });

      await expect(adapter.analyze(mockArticle)).rejects.toThrow('Gemini returned empty response');
    });

    it('throws ZodError when Gemini returns malformed JSON', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(malformedResponse),
      });

      await expect(adapter.analyze(mockArticle)).rejects.toThrow();
    });

    it('throws when Gemini returns non-JSON text', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'This is not JSON at all',
      });

      await expect(adapter.analyze(mockArticle)).rejects.toThrow();
    });

    it('passes article data into the prompt', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(validResponse),
      });

      await adapter.analyze(mockArticle);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('TechCorp Announces Workforce Optimization');
      expect(callArgs.contents).toContain('wsj.com');
    });

    it('requests JSON response format', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(validResponse),
      });

      await adapter.analyze(mockArticle);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.config.responseMimeType).toBe('application/json');
    });
  });

  describe('validateKey', () => {
    it('returns true for a valid key', async () => {
      // The constructor creates a new GoogleGenAI instance inside validateKey,
      // so we need to mock the constructor to return a working mock
      const mockGenerate = vi.fn().mockResolvedValueOnce({ text: 'valid' });
      (GoogleGenAI as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
        models: { generateContent: mockGenerate },
      }));

      const result = await adapter.validateKey('valid-key');
      expect(result).toBe(true);
    });

    it('returns false for an invalid key', async () => {
      (GoogleGenAI as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
        models: {
          generateContent: vi.fn().mockRejectedValueOnce(new Error('401 Unauthorized')),
        },
      }));

      const result = await adapter.validateKey('bad-key');
      expect(result).toBe(false);
    });
  });
});
```

**File: `tests/ai/prompt.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { buildAnalysisPrompt } from '../../src/lib/analysis/prompts';
import type { ArticleData } from '../../src/common/types';

const mockArticle: ArticleData = {
  title: 'Test Article Headline',
  byline: 'Test Author',
  content: '<p>HTML content</p>',
  textContent: 'Plain text content of the article.',
  excerpt: 'Test excerpt',
  domain: 'example.com',
  url: 'https://example.com/article',
  publishedTime: '2026-01-01',
  siteName: 'Example News',
};

describe('buildAnalysisPrompt', () => {
  it('includes article title in the prompt', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).toContain('Test Article Headline');
  });

  it('includes article domain in the prompt', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).toContain('Example News');
  });

  it('includes article text content in the prompt', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).toContain('Plain text content of the article.');
  });

  it('includes byline in the prompt', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).toContain('Test Author');
  });

  it('falls back to domain when siteName is null', () => {
    const article = { ...mockArticle, siteName: null };
    const prompt = buildAnalysisPrompt(article);
    expect(prompt).toContain('example.com');
  });

  it('truncates articles longer than 30000 characters', () => {
    const longArticle = {
      ...mockArticle,
      textContent: 'A'.repeat(50000),
    };
    const prompt = buildAnalysisPrompt(longArticle);
    // The prompt should contain at most 30000 A's, not 50000
    const aCount = (prompt.match(/A/g) || []).length;
    expect(aCount).toBe(30000);
  });

  it('adds truncation notice for long articles', () => {
    const longArticle = {
      ...mockArticle,
      textContent: 'A'.repeat(50000),
    };
    const prompt = buildAnalysisPrompt(longArticle);
    expect(prompt).toContain('truncated');
  });

  it('does not add truncation notice for short articles', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).not.toContain('truncated');
  });

  it('includes analysis instructions for all required output fields', () => {
    const prompt = buildAnalysisPrompt(mockArticle);
    expect(prompt).toContain('quickTake');
    expect(prompt).toContain('whoBenefits');
    expect(prompt).toContain('whosAbsent');
    expect(prompt).toContain('framingChoices');
    expect(prompt).toContain('ideologicalAxes');
    expect(prompt).toContain('sourceAnalysis');
    expect(prompt).toContain('missingContext');
  });
});
```

**File: `tests/ai/schema-validation.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { AnalysisResultSchema, ArticleDataSchema } from '../../src/common/types';
import validResponse from '../fixtures/api-responses/gemini-valid.json';

describe('AnalysisResultSchema', () => {
  it('validates a correct analysis result', () => {
    const result = AnalysisResultSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it('rejects when whoBenefits is empty', () => {
    const invalid = { ...validResponse, whoBenefits: [] };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when whosAbsent is empty', () => {
    const invalid = { ...validResponse, whosAbsent: [] };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when framingChoices is empty', () => {
    const invalid = { ...validResponse, framingChoices: [] };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when ideologicalAxes score is out of range', () => {
    const invalid = {
      ...validResponse,
      ideologicalAxes: [
        { name: 'pro_capital_vs_pro_labor', score: 15, label: 'Invalid', explanation: 'test' },
      ],
    };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when ideologicalAxes score is negative', () => {
    const invalid = {
      ...validResponse,
      ideologicalAxes: [
        { name: 'pro_capital_vs_pro_labor', score: -1, label: 'Invalid', explanation: 'test' },
      ],
    };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid framing choice type', () => {
    const invalid = {
      ...validResponse,
      framingChoices: [{ type: 'not_a_valid_type', quote: 'test', explanation: 'test' }],
    };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid axis name', () => {
    const invalid = {
      ...validResponse,
      ideologicalAxes: [{ name: 'fake_axis', score: 5, label: 'test', explanation: 'test' }],
    };
    const result = AnalysisResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects when quickTake is missing', () => {
    const { quickTake, ...rest } = validResponse;
    const result = AnalysisResultSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('ArticleDataSchema', () => {
  it('validates correct article data', () => {
    const article = {
      title: 'Test',
      byline: null,
      content: '<p>content</p>',
      textContent: 'content',
      excerpt: 'excerpt',
      domain: 'example.com',
      url: 'https://example.com/article',
      publishedTime: null,
      siteName: null,
    };
    const result = ArticleDataSchema.safeParse(article);
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const article = {
      title: 'Test',
      byline: null,
      content: 'content',
      textContent: 'content',
      excerpt: 'excerpt',
      domain: 'example.com',
      url: 'not-a-url',
      publishedTime: null,
      siteName: null,
    };
    const result = ArticleDataSchema.safeParse(article);
    expect(result.success).toBe(false);
  });
});
```

**Definition of Done for all B tasks:**

- [ ] `pnpm test` passes for all tests in `tests/ai/`
- [ ] `pnpm typecheck` passes
- [ ] Gemini adapter handles valid response, empty response, malformed JSON, and non-JSON
- [ ] Schema validates correct data and rejects invalid data for every field

---

## Stream A: Extraction

This stream can start in parallel with Stream B. It has no dependency on Stream B's types until the integration phase.

### Task A.1: Readability.js Integration

**File: `src/lib/extraction/readability.ts`**

```typescript
import { Readability } from '@mozilla/readability';

export interface ReadabilityResult {
  title: string;
  byline: string | null;
  content: string;
  textContent: string;
  excerpt: string;
  publishedTime: string | null;
  siteName: string | null;
}

/**
 * Extract article content from a DOM document using Mozilla's Readability.js.
 * Returns null if the page is not an article or extraction fails.
 *
 * IMPORTANT: Readability modifies the document it receives.
 * Always pass a cloned document: `document.cloneNode(true)`.
 */
export function extractArticle(doc: Document): ReadabilityResult | null {
  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article) {
    return null;
  }

  return {
    title: article.title,
    byline: article.byline,
    content: article.content,
    textContent: article.textContent,
    excerpt: article.excerpt,
    publishedTime: article.publishedTime,
    siteName: article.siteName,
  };
}
```

**Note for implementing agent:** The `@mozilla/readability` package does NOT ship TypeScript types. You need to create a type declaration file:

**File: `src/lib/extraction/readability.d.ts`**

```typescript
declare module '@mozilla/readability' {
  interface ReadabilityArticle {
    title: string;
    byline: string | null;
    content: string;
    textContent: string;
    excerpt: string;
    publishedTime: string | null;
    siteName: string | null;
    length: number;
    lang: string | null;
  }

  interface ReadabilityOptions {
    debug?: boolean;
    maxElemsToParse?: number;
    nbTopCandidates?: number;
    charThreshold?: number;
    classesToPreserve?: string[];
    keepClasses?: boolean;
    disableJSONLD?: boolean;
  }

  export class Readability {
    constructor(doc: Document, options?: ReadabilityOptions);
    parse(): ReadabilityArticle | null;
  }
}
```

**Definition of Done:**

- [ ] `extractArticle()` returns structured article data from a valid HTML document
- [ ] Returns `null` for non-article pages
- [ ] Type declarations exist for `@mozilla/readability`
- [ ] `pnpm typecheck` passes

---

### Task A.2: Domain Detection Utility

**File: `src/lib/extraction/domain.ts`**

```typescript
/**
 * Extract the base outlet domain from a URL.
 * Strips "www.", "amp.", "m.", and other common subdomains.
 *
 * Examples:
 *   "https://www.nytimes.com/2026/01/15/business/..." → "nytimes.com"
 *   "https://amp.cnn.com/..." → "cnn.com"
 *   "https://m.washingtonpost.com/..." → "washingtonpost.com"
 */
export function getOutletDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const stripPrefixes = ['www.', 'amp.', 'm.', 'mobile.', 'edition.'];
    let domain = hostname;
    for (const prefix of stripPrefixes) {
      if (domain.startsWith(prefix)) {
        domain = domain.slice(prefix.length);
        break; // only strip one prefix
      }
    }
    return domain;
  } catch {
    return url; // fallback: return the input if URL parsing fails
  }
}
```

**Definition of Done:**

- [ ] `getOutletDomain()` correctly strips common subdomains
- [ ] Handles invalid URLs gracefully (returns input)
- [ ] `pnpm typecheck` passes

---

### Task A.3: Content Script — Extract and Send to Background

**File: `src/entrypoints/content.ts`** (replace entire contents)

```typescript
import { extractArticle } from '../lib/extraction/readability';
import { getOutletDomain } from '../lib/extraction/domain';
import type {
  ArticleData,
  ExtractArticleMessage,
  ArticleExtractedMessage,
  ExtractionFailedMessage,
} from '../common/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    console.log('Marx Meter content script loaded.');

    // Listen for extraction requests from the background/sidepanel
    browser.runtime.onMessage.addListener(
      (message: ExtractArticleMessage, _sender, sendResponse) => {
        if (message.type !== 'EXTRACT_ARTICLE') return;

        try {
          const clonedDoc = document.cloneNode(true) as Document;
          const result = extractArticle(clonedDoc);

          if (!result) {
            const response: ExtractionFailedMessage = {
              type: 'EXTRACTION_FAILED',
              error:
                'Could not extract article content from this page. It may not be a news article.',
            };
            sendResponse(response);
            return;
          }

          const articleData: ArticleData = {
            title: result.title,
            byline: result.byline,
            content: result.content,
            textContent: result.textContent,
            excerpt: result.excerpt,
            domain: getOutletDomain(window.location.href),
            url: window.location.href,
            publishedTime: result.publishedTime,
            siteName: result.siteName,
          };

          const response: ArticleExtractedMessage = {
            type: 'ARTICLE_EXTRACTED',
            payload: articleData,
          };
          sendResponse(response);
        } catch (err) {
          const response: ExtractionFailedMessage = {
            type: 'EXTRACTION_FAILED',
            error: err instanceof Error ? err.message : 'Unknown extraction error',
          };
          sendResponse(response);
        }

        return true; // indicates async sendResponse
      },
    );
  },
});
```

**Definition of Done:**

- [ ] Content script listens for `EXTRACT_ARTICLE` messages
- [ ] Calls `extractArticle()` on a cloned document
- [ ] Returns `ArticleExtractedMessage` on success
- [ ] Returns `ExtractionFailedMessage` on failure
- [ ] `pnpm typecheck` passes

---

### Task A.4: Tests for Extraction

**Fixture files:** Save real HTML from news sites as fixtures. You need at minimum 3 fixture files. These should be actual saved HTML pages (view source, save as). If you cannot save real HTML, create realistic test HTML.

**File: `tests/fixtures/articles/sample-article.html`**

Create a realistic article HTML fixture. It must contain:

- An `<article>` or main content area
- A headline in an `<h1>` tag
- A byline
- Multiple paragraphs of article text
- At least one blockquote or quoted source

Here is a minimal example you can use:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      property="og:title"
      content="TechCorp Announces Major Restructuring Amid Record Profits"
    />
    <meta property="article:author" content="Jane Reporter" />
    <meta property="article:published_time" content="2026-02-10T10:00:00Z" />
    <title>TechCorp Announces Major Restructuring Amid Record Profits - Example News</title>
  </head>
  <body>
    <header>
      <nav>Example News</nav>
    </header>
    <article>
      <h1>TechCorp Announces Major Restructuring Amid Record Profits</h1>
      <p class="byline">By Jane Reporter | February 10, 2026</p>
      <p>
        TechCorp announced today a workforce optimization initiative that will result in the
        elimination of approximately 5,000 positions across its global operations, even as the
        company reported record quarterly revenue of $48.2 billion.
      </p>
      <p>
        "This restructuring positions TechCorp for sustainable long-term growth in the AI era," said
        CEO Mark Williams in a statement to investors.
      </p>
      <p>
        According to Goldman Sachs analyst Jane Smith, the restructuring positions TechCorp for
        long-term growth. "We see this as a positive signal for shareholders," Smith wrote in a
        research note.
      </p>
      <p>
        Positions were eliminated as part of the strategic review, with the majority of cuts
        affecting customer support and content moderation teams.
      </p>
      <p>
        TechCorp's stock rose 4.2% in after-hours trading following the announcement. The company's
        market capitalization now exceeds $2 trillion.
      </p>
      <p>
        An unnamed administration official said the White House was "monitoring the situation" but
        declined to comment further on whether any policy response was planned.
      </p>
      <p>
        The workforce optimization initiative is expected to save the company approximately $1.2
        billion annually, which TechCorp said would be redirected toward artificial intelligence
        research and development.
      </p>
    </article>
  </body>
</html>
```

**File: `tests/fixtures/articles/non-article.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Google Search</title>
  </head>
  <body>
    <div id="search-form">
      <input type="text" name="q" />
      <button>Search</button>
    </div>
    <div id="results">
      <p>No article content here.</p>
    </div>
  </body>
</html>
```

**File: `tests/extraction/readability.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractArticle } from '../../src/lib/extraction/readability';

function loadFixture(filename: string): Document {
  const html = readFileSync(join(__dirname, '../fixtures/articles', filename), 'utf-8');
  const dom = new JSDOM(html, { url: 'https://example.com/article' });
  return dom.window.document;
}

describe('extractArticle', () => {
  it('extracts title from a news article', () => {
    const doc = loadFixture('sample-article.html');
    const result = extractArticle(doc);
    expect(result).not.toBeNull();
    expect(result!.title).toContain('TechCorp');
  });

  it('extracts non-empty text content', () => {
    const doc = loadFixture('sample-article.html');
    const result = extractArticle(doc);
    expect(result).not.toBeNull();
    expect(result!.textContent.length).toBeGreaterThan(500);
  });

  it('extracts text content containing key article phrases', () => {
    const doc = loadFixture('sample-article.html');
    const result = extractArticle(doc);
    expect(result).not.toBeNull();
    expect(result!.textContent).toContain('workforce optimization');
  });

  it('returns null for non-article pages', () => {
    const doc = loadFixture('non-article.html');
    const result = extractArticle(doc);
    // Readability may return null or a result with very short content
    if (result !== null) {
      expect(result.textContent.length).toBeLessThan(200);
    }
  });

  it('extracts byline when available', () => {
    const doc = loadFixture('sample-article.html');
    const result = extractArticle(doc);
    expect(result).not.toBeNull();
    // Byline detection is heuristic — it may or may not find "Jane Reporter"
    // Just check it doesn't crash
    expect(result!.byline === null || typeof result!.byline === 'string').toBe(true);
  });
});
```

**File: `tests/extraction/domain.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { getOutletDomain } from '../../src/lib/extraction/domain';

describe('getOutletDomain', () => {
  it('strips www. prefix', () => {
    expect(getOutletDomain('https://www.nytimes.com/2026/article')).toBe('nytimes.com');
  });

  it('strips amp. prefix', () => {
    expect(getOutletDomain('https://amp.cnn.com/article')).toBe('cnn.com');
  });

  it('strips m. prefix', () => {
    expect(getOutletDomain('https://m.washingtonpost.com/article')).toBe('washingtonpost.com');
  });

  it('strips mobile. prefix', () => {
    expect(getOutletDomain('https://mobile.reuters.com/article')).toBe('reuters.com');
  });

  it('strips edition. prefix', () => {
    expect(getOutletDomain('https://edition.cnn.com/article')).toBe('cnn.com');
  });

  it('leaves domains without common prefixes unchanged', () => {
    expect(getOutletDomain('https://reuters.com/article')).toBe('reuters.com');
  });

  it('handles subdomains that are not common prefixes', () => {
    expect(getOutletDomain('https://news.google.com/article')).toBe('news.google.com');
  });

  it('returns input string for invalid URLs', () => {
    expect(getOutletDomain('not-a-url')).toBe('not-a-url');
  });

  it('handles URLs with paths and query params', () => {
    expect(getOutletDomain('https://www.theguardian.com/us-news/2026/article?utm=test')).toBe(
      'theguardian.com',
    );
  });
});
```

**Definition of Done for all A tasks:**

- [ ] `pnpm test` passes for all tests in `tests/extraction/`
- [ ] `extractArticle()` returns valid data for the sample article fixture
- [ ] `extractArticle()` returns null (or very short content) for non-article pages
- [ ] `getOutletDomain()` passes all domain normalization tests
- [ ] Content script compiles without TypeScript errors

---

## Stream C: Side Panel Display

**Depends on:** Task B.1 (types must be defined). Stream C can start as soon as B.1 is merged.

### Task C.1: Analysis Display Components

Create the following component files. All components use Preact and Tailwind CSS. Use `class` (not `className`) — this is idiomatic Preact.

**File: `src/entrypoints/sidepanel/components/LoadingSpinner.tsx`**

```tsx
export function LoadingSpinner() {
  return (
    <div class="flex flex-col items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-200" />
      <p class="mt-4 text-sm text-neutral-400">Analyzing article...</p>
    </div>
  );
}
```

**File: `src/entrypoints/sidepanel/components/ErrorDisplay.tsx`**

```tsx
interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div class="rounded-lg border border-red-800 bg-red-950 p-4">
      <p class="text-sm font-medium text-red-300">Analysis Error</p>
      <p class="mt-1 text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          class="mt-3 rounded bg-red-800 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
```

**File: `src/entrypoints/sidepanel/components/QuickTake.tsx`**

```tsx
interface QuickTakeProps {
  text: string;
}

export function QuickTake({ text }: QuickTakeProps) {
  return (
    <section class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">Quick Take</h2>
      <p class="mt-2 text-sm leading-relaxed text-neutral-200">{text}</p>
    </section>
  );
}
```

**File: `src/entrypoints/sidepanel/components/WhoBenefits.tsx`**

```tsx
interface WhoBenefitsProps {
  benefits: string[];
  absent: string[];
}

export function WhoBenefits({ benefits, absent }: WhoBenefitsProps) {
  return (
    <section class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Who Benefits / Who's Absent
      </h2>
      <div class="mt-3 space-y-3">
        <div>
          <h3 class="text-xs font-medium text-green-400">Benefits:</h3>
          <ul class="mt-1 space-y-1">
            {benefits.map((b) => (
              <li key={b} class="text-sm text-neutral-300">
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 class="text-xs font-medium text-red-400">Absent:</h3>
          <ul class="mt-1 space-y-1">
            {absent.map((a) => (
              <li key={a} class="text-sm text-neutral-300">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
```

**File: `src/entrypoints/sidepanel/components/FramingChoices.tsx`**

```tsx
import type { FramingChoice } from '../../../common/types';

interface FramingChoicesProps {
  choices: FramingChoice[];
}

const typeLabels: Record<FramingChoice['type'], string> = {
  euphemism: 'Euphemism',
  passive_voice: 'Passive Voice',
  source_bias: 'Source Bias',
  omission: 'Omission',
  headline_mismatch: 'Headline Mismatch',
  other: 'Other',
};

const typeColors: Record<FramingChoice['type'], string> = {
  euphemism: 'text-red-400 bg-red-950',
  passive_voice: 'text-orange-400 bg-orange-950',
  source_bias: 'text-yellow-400 bg-yellow-950',
  omission: 'text-blue-400 bg-blue-950',
  headline_mismatch: 'text-purple-400 bg-purple-950',
  other: 'text-neutral-400 bg-neutral-800',
};

export function FramingChoices({ choices }: FramingChoicesProps) {
  return (
    <section class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Framing Choices
      </h2>
      <div class="mt-3 space-y-3">
        {choices.map((choice, i) => (
          <div key={i} class="border-l-2 border-neutral-700 pl-3">
            <span
              class={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${typeColors[choice.type]}`}
            >
              {typeLabels[choice.type]}
            </span>
            <blockquote class="mt-1 text-sm italic text-neutral-400">"{choice.quote}"</blockquote>
            <p class="mt-1 text-sm text-neutral-300">{choice.explanation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**File: `src/entrypoints/sidepanel/components/IdeologicalAxes.tsx`**

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

export function IdeologicalAxes({ axes }: IdeologicalAxesProps) {
  return (
    <section class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Ideological Axes
      </h2>
      <div class="mt-3 space-y-4">
        {axes.map((axis) => {
          const [leftLabel, rightLabel] = axisLabels[axis.name] || [axis.name, ''];
          const pct = (axis.score / 10) * 100;
          return (
            <div key={axis.name}>
              <div class="flex items-center justify-between text-xs text-neutral-500">
                <span>{leftLabel}</span>
                <span>{rightLabel}</span>
              </div>
              <div class="mt-1 h-2 rounded-full bg-neutral-800">
                <div class="h-2 rounded-full bg-neutral-400" style={{ width: `${pct}%` }} />
              </div>
              <p class="mt-1 text-xs text-neutral-500">
                {axis.label} ({axis.score}/10) — {axis.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

**File: `src/entrypoints/sidepanel/components/AnalysisDisplay.tsx`**

```tsx
import type { AnalysisResult } from '../../../common/types';
import { QuickTake } from './QuickTake';
import { WhoBenefits } from './WhoBenefits';
import { FramingChoices } from './FramingChoices';
import { IdeologicalAxes } from './IdeologicalAxes';

interface AnalysisDisplayProps {
  result: AnalysisResult;
  articleTitle: string;
  articleDomain: string;
}

export function AnalysisDisplay({ result, articleTitle, articleDomain }: AnalysisDisplayProps) {
  return (
    <div class="space-y-4">
      <header class="border-b border-neutral-800 pb-3">
        <h2 class="text-sm font-semibold text-neutral-200 line-clamp-2">{articleTitle}</h2>
        <p class="mt-1 text-xs text-neutral-500">{articleDomain}</p>
      </header>

      <QuickTake text={result.quickTake} />

      <WhoBenefits benefits={result.whoBenefits} absent={result.whosAbsent} />

      <FramingChoices choices={result.framingChoices} />

      <IdeologicalAxes axes={result.ideologicalAxes} />

      <section class="rounded-lg bg-neutral-900 p-4">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Source Analysis
        </h2>
        <p class="mt-2 text-sm text-neutral-300">{result.sourceAnalysis.summary}</p>
        <div class="mt-2 flex gap-4 text-xs text-neutral-500">
          <span>Corporate/Official: {result.sourceAnalysis.corporateOrOfficial}</span>
          <span>Worker/Community: {result.sourceAnalysis.workerOrCommunity}</span>
          <span>Anonymous: {result.sourceAnalysis.anonymous}</span>
        </div>
      </section>

      <section class="rounded-lg bg-neutral-900 p-4">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Missing Context
        </h2>
        <p class="mt-2 text-sm text-neutral-300">{result.missingContext}</p>
      </section>
    </div>
  );
}
```

**Definition of Done:**

- [ ] All 7 component files created
- [ ] Components render without errors when given valid props
- [ ] `pnpm typecheck` passes
- [ ] Components use Tailwind utility classes, no custom CSS

---

### Task C.2: Tests for Side Panel Components

**File: `tests/fixtures/analysis-results/full.json`**

Use the same content as `tests/fixtures/api-responses/gemini-valid.json` — it's a valid `AnalysisResult`.

```bash
cp tests/fixtures/api-responses/gemini-valid.json tests/fixtures/analysis-results/full.json
```

**File: `tests/fixtures/analysis-results/minimal.json`**

```json
{
  "quickTake": "Basic analysis of a short article.",
  "whoBenefits": ["Corporate interests"],
  "whosAbsent": ["Workers"],
  "framingChoices": [
    {
      "type": "euphemism",
      "quote": "workforce optimization",
      "explanation": "Sanitizes the reality of layoffs."
    }
  ],
  "ideologicalAxes": [
    {
      "name": "pro_capital_vs_pro_labor",
      "score": 3,
      "label": "Pro-capital",
      "explanation": "Centers business interests."
    }
  ],
  "sourceAnalysis": {
    "totalSources": 1,
    "corporateOrOfficial": 1,
    "workerOrCommunity": 0,
    "anonymous": 0,
    "summary": "Only corporate sources quoted."
  },
  "missingContext": "No systemic context provided."
}
```

**File: `tests/sidepanel/AnalysisDisplay.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { AnalysisDisplay } from '../../src/entrypoints/sidepanel/components/AnalysisDisplay';
import type { AnalysisResult } from '../../src/common/types';
import fullResult from '../fixtures/analysis-results/full.json';
import minimalResult from '../fixtures/analysis-results/minimal.json';

describe('AnalysisDisplay', () => {
  it('renders Quick Take section', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText('Quick Take')).toBeTruthy();
    expect(screen.getByText(/frames mass layoffs/i)).toBeTruthy();
  });

  it('renders Who Benefits list', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText('TechCorp shareholders')).toBeTruthy();
  });

  it("renders Who's Absent list", () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText('Laid-off workers')).toBeTruthy();
  });

  it('renders framing choices with quotes', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText(/workforce optimization initiative/)).toBeTruthy();
  });

  it('renders ideological axes', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText('Pro-capital')).toBeTruthy();
    expect(screen.getByText('Pro-labor')).toBeTruthy();
  });

  it('renders source analysis summary', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText(/Wall Street analysts/)).toBeTruthy();
  });

  it('renders missing context', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText(/stock buyback/)).toBeTruthy();
  });

  it('renders article title and domain in header', () => {
    render(
      <AnalysisDisplay
        result={fullResult as AnalysisResult}
        articleTitle="Test Article"
        articleDomain="example.com"
      />,
    );
    expect(screen.getByText('Test Article')).toBeTruthy();
    expect(screen.getByText('example.com')).toBeTruthy();
  });

  it('renders with minimal data without crashing', () => {
    render(
      <AnalysisDisplay
        result={minimalResult as AnalysisResult}
        articleTitle="Minimal"
        articleDomain="test.com"
      />,
    );
    expect(screen.getByText('Quick Take')).toBeTruthy();
    expect(screen.getByText('Basic analysis of a short article.')).toBeTruthy();
  });
});
```

**File: `tests/sidepanel/LoadingSpinner.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { LoadingSpinner } from '../../src/entrypoints/sidepanel/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders loading text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Analyzing article...')).toBeTruthy();
  });
});
```

**File: `tests/sidepanel/ErrorDisplay.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { ErrorDisplay } from '../../src/entrypoints/sidepanel/components/ErrorDisplay';

describe('ErrorDisplay', () => {
  it('renders error message', () => {
    render(<ErrorDisplay message="Invalid API key" />);
    expect(screen.getByText('Invalid API key')).toBeTruthy();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorDisplay message="Error" onRetry={() => {}} />);
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorDisplay message="Error" />);
    expect(screen.queryByText('Try Again')).toBeNull();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorDisplay message="Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
```

**Definition of Done:**

- [ ] `pnpm test` passes for all tests in `tests/sidepanel/`
- [ ] All three states tested: loading, error, success
- [ ] Minimal data renders without crashing
- [ ] Error retry button fires callback

---

## Integration Phase

**Depends on:** Streams A, B, and C ALL complete and merged to `main`.

### Task I.1: Wire Background Service Worker

**File: `src/entrypoints/background.ts`** (replace entire contents)

```typescript
import { GeminiAdapter } from '../lib/ai/gemini';
import type {
  ArticleExtractedMessage,
  ExtractionFailedMessage,
  AnalysisCompleteMessage,
  AnalysisErrorMessage,
} from '../common/types';

export default defineBackground(() => {
  console.log('Marx Meter background service worker loaded.');

  // Open side panel on toolbar icon click
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });

  // Listen for analysis requests from the side panel
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ANALYZE_ARTICLE') {
      handleAnalysis(message.payload)
        .then((result) => {
          const response: AnalysisCompleteMessage = {
            type: 'ANALYSIS_COMPLETE',
            payload: result,
          };
          sendResponse(response);
        })
        .catch((err) => {
          const response: AnalysisErrorMessage = {
            type: 'ANALYSIS_ERROR',
            error: err instanceof Error ? err.message : 'Analysis failed',
          };
          sendResponse(response);
        });
      return true; // indicates async sendResponse
    }
  });
});

async function handleAnalysis(article: import('../common/types').ArticleData) {
  // Read API key from storage
  const storage = await browser.storage.local.get('geminiApiKey');
  const apiKey = storage.geminiApiKey;

  if (!apiKey) {
    throw new Error(
      'No Gemini API key configured. Please enter your API key in the extension settings.',
    );
  }

  const adapter = new GeminiAdapter(apiKey);
  return adapter.analyze(article);
}
```

**Definition of Done:**

- [ ] Background script listens for `ANALYZE_ARTICLE` messages
- [ ] Reads API key from `chrome.storage.local`
- [ ] Creates `GeminiAdapter` and calls `analyze()`
- [ ] Returns `ANALYSIS_COMPLETE` or `ANALYSIS_ERROR`
- [ ] `pnpm typecheck` passes

---

### Task I.2: API Key Input Component

**File: `src/entrypoints/sidepanel/components/ApiKeyInput.tsx`**

```tsx
import { useState } from 'preact/hooks';

interface ApiKeyInputProps {
  onKeySubmit: (key: string) => void;
  isValidating: boolean;
  error: string | null;
}

export function ApiKeyInput({ onKeySubmit, isValidating, error }: ApiKeyInputProps) {
  const [key, setKey] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (key.trim()) {
      onKeySubmit(key.trim());
    }
  };

  return (
    <div class="rounded-lg bg-neutral-900 p-4">
      <h2 class="text-sm font-semibold text-neutral-200">Set Up Gemini API Key</h2>
      <p class="mt-2 text-xs text-neutral-400">
        Marx Meter uses Google's Gemini AI to analyze articles. You need a free API key to get
        started.
      </p>
      <ol class="mt-3 space-y-1 text-xs text-neutral-400">
        <li>
          1. Go to{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-400 underline"
          >
            aistudio.google.com/apikey
          </a>
        </li>
        <li>2. Click "Create API Key" (free, no credit card needed)</li>
        <li>3. Copy the key and paste it below</li>
      </ol>
      <form onSubmit={handleSubmit} class="mt-4">
        <input
          type="password"
          value={key}
          onInput={(e) => setKey((e.target as HTMLInputElement).value)}
          placeholder="Paste your Gemini API key"
          class="w-full rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-neutral-600"
          disabled={isValidating}
        />
        {error && <p class="mt-2 text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={!key.trim() || isValidating}
          class="mt-3 w-full rounded bg-neutral-700 px-3 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? 'Validating...' : 'Save API Key'}
        </button>
      </form>
    </div>
  );
}
```

---

### Task I.3: Wire Up App.tsx (Main Orchestration)

**File: `src/entrypoints/sidepanel/App.tsx`** (replace entire contents)

```tsx
import { useState, useEffect } from 'preact/hooks';
import type { AnalysisResult, ArticleData } from '../../common/types';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ApiKeyInput } from './components/ApiKeyInput';

type AppState =
  | { status: 'idle' }
  | { status: 'needs_key' }
  | { status: 'validating_key' }
  | { status: 'key_error'; error: string }
  | { status: 'extracting' }
  | { status: 'analyzing'; articleTitle: string; articleDomain: string }
  | { status: 'error'; error: string }
  | {
      status: 'done';
      result: AnalysisResult;
      articleTitle: string;
      articleDomain: string;
    };

export function App() {
  const [state, setState] = useState<AppState>({ status: 'idle' });

  // Check for API key on mount
  useEffect(() => {
    browser.storage.local.get('geminiApiKey').then((storage) => {
      if (!storage.geminiApiKey) {
        setState({ status: 'needs_key' });
      }
    });
  }, []);

  const handleApiKeySubmit = async (key: string) => {
    setState({ status: 'validating_key' });

    try {
      // Store key (validation will happen on first use)
      await browser.storage.local.set({ geminiApiKey: key });
      setState({ status: 'idle' });
    } catch {
      setState({ status: 'key_error', error: 'Failed to save API key.' });
    }
  };

  const handleAnalyze = async () => {
    setState({ status: 'extracting' });

    try {
      // Get the active tab
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setState({ status: 'error', error: 'No active tab found.' });
        return;
      }

      // Request extraction from content script
      const extractionResponse = await browser.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_ARTICLE',
      });

      if (extractionResponse.type === 'EXTRACTION_FAILED') {
        setState({ status: 'error', error: extractionResponse.error });
        return;
      }

      const article: ArticleData = extractionResponse.payload;

      setState({
        status: 'analyzing',
        articleTitle: article.title,
        articleDomain: article.domain,
      });

      // Request analysis from background script
      const analysisResponse = await browser.runtime.sendMessage({
        type: 'ANALYZE_ARTICLE',
        payload: article,
      });

      if (analysisResponse.type === 'ANALYSIS_ERROR') {
        setState({ status: 'error', error: analysisResponse.error });
        return;
      }

      setState({
        status: 'done',
        result: analysisResponse.payload,
        articleTitle: article.title,
        articleDomain: article.domain,
      });
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    }
  };

  return (
    <div class="min-h-screen bg-neutral-950 text-neutral-100 p-4">
      <h1 class="text-xl font-bold tracking-tight">Marx Meter</h1>

      {state.status === 'needs_key' && (
        <div class="mt-4">
          <ApiKeyInput onKeySubmit={handleApiKeySubmit} isValidating={false} error={null} />
        </div>
      )}

      {state.status === 'validating_key' && (
        <div class="mt-4">
          <ApiKeyInput onKeySubmit={handleApiKeySubmit} isValidating={true} error={null} />
        </div>
      )}

      {state.status === 'key_error' && (
        <div class="mt-4">
          <ApiKeyInput onKeySubmit={handleApiKeySubmit} isValidating={false} error={state.error} />
        </div>
      )}

      {state.status === 'idle' && (
        <div class="mt-4">
          <p class="text-sm text-neutral-400">
            Navigate to a news article and click Analyze to begin.
          </p>
          <button
            onClick={handleAnalyze}
            class="mt-4 w-full rounded bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Analyze This Article
          </button>
        </div>
      )}

      {state.status === 'extracting' && (
        <div class="mt-4">
          <LoadingSpinner />
          <p class="text-center text-xs text-neutral-500 mt-2">Extracting article content...</p>
        </div>
      )}

      {state.status === 'analyzing' && (
        <div class="mt-4">
          <LoadingSpinner />
        </div>
      )}

      {state.status === 'error' && (
        <div class="mt-4">
          <ErrorDisplay message={state.error} onRetry={handleAnalyze} />
        </div>
      )}

      {state.status === 'done' && (
        <div class="mt-4">
          <AnalysisDisplay
            result={state.result}
            articleTitle={state.articleTitle}
            articleDomain={state.articleDomain}
          />
          <button
            onClick={handleAnalyze}
            class="mt-4 w-full rounded bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-700"
          >
            Re-analyze
          </button>
        </div>
      )}
    </div>
  );
}
```

**Definition of Done:**

- [ ] App shows API key input when no key is stored
- [ ] App shows "Analyze" button when key exists
- [ ] Clicking "Analyze" extracts article via content script, then sends to background for AI analysis
- [ ] Loading state shown during extraction and analysis
- [ ] Error state shown with retry button
- [ ] Analysis result displayed using `AnalysisDisplay` component
- [ ] `pnpm typecheck` passes

---

### Task I.4: Update Manifest Permissions

The extension needs `storage` and `tabs` permissions for the integration to work.

**File: `wxt.config.ts`** — add permissions to the manifest:

```typescript
import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Marx Meter',
    description: 'Which side are you on?',
    version: '0.1.0',
    action: {},
    permissions: ['storage', 'activeTab'],
    icons: {
      '16': '/icon/16.png',
      '32': '/icon/32.png',
      '48': '/icon/48.png',
      '128': '/icon/128.png',
    },
  },
  vite: () => ({
    plugins: [preact(), tailwindcss()],
  }),
});
```

Changes from M0:

- Added `permissions: ['storage', 'activeTab']`
- Bumped version from `0.0.1` to `0.1.0`

**Definition of Done:**

- [ ] `permissions` array includes `storage` and `activeTab`
- [ ] Version bumped to `0.1.0`
- [ ] `pnpm build` produces a valid manifest with these permissions

---

## Cleanup Tasks

These should be done during integration:

### Remove M0 Template Artifacts

Delete these leftover files from the WXT template that are not part of Marx Meter:

- `src/entrypoints/popup/` (entire directory — we use side panel, not popup)
- `src/components/counter.ts` (template demo code)
- `src/assets/typescript.svg` (template asset)

### Update package.json name

Change `"name": "wxt-starter"` to `"name": "marx-meter"` in `package.json`.

---

## What to Test (Summary)

| Area                   | Test Type     | Location                               | What It Validates                                                            |
| ---------------------- | ------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| Zod schemas            | Unit          | `tests/ai/schema-validation.test.ts`   | AnalysisResult validates correct data, rejects invalid data                  |
| Gemini adapter         | Unit (mocked) | `tests/ai/gemini.test.ts`              | Handles valid/empty/malformed/non-JSON responses                             |
| Prompt builder         | Unit          | `tests/ai/prompt.test.ts`              | Includes article data, truncates long articles, references all output fields |
| Readability extraction | Unit          | `tests/extraction/readability.test.ts` | Extracts articles, returns null for non-articles                             |
| Domain detection       | Unit          | `tests/extraction/domain.test.ts`      | Strips prefixes, handles edge cases                                          |
| Side panel components  | Unit          | `tests/sidepanel/*.test.tsx`           | Renders all states, error retry works                                        |

**Never test:**

- Actual Gemini API calls (all mocked)
- Tailwind class names
- Preact rendering internals

---

## M1 Definition of Done (Complete Milestone)

All of these must be true before M1 is considered complete:

- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (all unit tests)
- [ ] `pnpm build` produces a loadable extension
- [ ] User can enter a Gemini API key in the side panel
- [ ] User clicks "Analyze" on a news article → sees structured analysis
- [ ] Analysis includes: Quick Take, Who Benefits, Who's Absent, 3+ Framing Choices with quotes
- [ ] Ideological axes rendered as text scores with bar visualization
- [ ] Loading state shown during analysis
- [ ] Error shown if API key missing or extraction fails
- [ ] All fixture tests pass with mocked data
- [ ] `specs/PROGRESS.md` updated with all M1 tasks marked `[x]`
- [ ] Template artifacts removed (popup dir, counter.ts, typescript.svg)
- [ ] Package name updated to `marx-meter`

---

## Files Created in This Milestone (Complete List)

### New Files

```
src/common/types.ts                              (modified — replace contents)
src/lib/ai/types.ts
src/lib/ai/gemini.ts
src/lib/analysis/prompts.ts
src/lib/extraction/readability.ts
src/lib/extraction/readability.d.ts
src/lib/extraction/domain.ts
src/entrypoints/sidepanel/components/AnalysisDisplay.tsx
src/entrypoints/sidepanel/components/LoadingSpinner.tsx
src/entrypoints/sidepanel/components/ErrorDisplay.tsx
src/entrypoints/sidepanel/components/QuickTake.tsx
src/entrypoints/sidepanel/components/WhoBenefits.tsx
src/entrypoints/sidepanel/components/FramingChoices.tsx
src/entrypoints/sidepanel/components/IdeologicalAxes.tsx
src/entrypoints/sidepanel/components/ApiKeyInput.tsx
data/prompts/pass1-pass2.txt
tests/ai/gemini.test.ts
tests/ai/prompt.test.ts
tests/ai/schema-validation.test.ts
tests/extraction/readability.test.ts
tests/extraction/domain.test.ts
tests/sidepanel/AnalysisDisplay.test.tsx
tests/sidepanel/LoadingSpinner.test.tsx
tests/sidepanel/ErrorDisplay.test.tsx
tests/fixtures/articles/sample-article.html
tests/fixtures/articles/non-article.html
tests/fixtures/api-responses/gemini-valid.json
tests/fixtures/api-responses/gemini-malformed.json
tests/fixtures/analysis-results/full.json
tests/fixtures/analysis-results/minimal.json
```

### Modified Files

```
src/entrypoints/content.ts                       (replace contents)
src/entrypoints/background.ts                    (replace contents)
src/entrypoints/sidepanel/App.tsx                (replace contents)
wxt.config.ts                                    (add permissions, bump version)
package.json                                     (rename, add dependencies)
```

### Deleted Files

```
src/entrypoints/popup/                           (entire directory)
src/components/counter.ts
src/assets/typescript.svg
```
