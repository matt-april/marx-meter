# M0: Project Scaffolding — Detailed Implementation Spec

**Goal:** A Chrome MV3 extension that loads in the browser, opens a side panel on toolbar click, and passes CI.

**Estimated effort:** 1 day
**Prerequisite:** None (first milestone)

---

## Agent Assignment

This milestone has **two parallel work streams**. Each stream can be executed by a separate agent. They share a dependency on the initial project init (Task 1.1), which must complete first.

```
Task 1.1 (WXT Init) ──────┬──▶ Stream A: Extension Shell (Tasks 1.2–1.6)
                           └──▶ Stream B: Build & CI (Tasks 2.1–2.5)
```

**CRITICAL: Stream B must not modify any files created by Stream A, and vice versa.** Stream A owns `src/` and `wxt.config.ts`. Stream B owns `.github/`, `vitest.config.ts`, and CI-related `package.json` script entries.

---

## Task 1.1: Project Initialization (BLOCKING — do this first)

This task must complete before either stream begins.

### Steps

1. **Initialize WXT project:**
   ```bash
   cd /Users/matt/repos/marx_meter
   pnpm dlx wxt@latest init . --template vanilla --pm pnpm
   ```
   If the init command refuses to write into a non-empty directory, use a temp directory and move files:
   ```bash
   pnpm dlx wxt@latest init /tmp/marx-meter-init --template vanilla --pm pnpm
   cp -r /tmp/marx-meter-init/* /tmp/marx-meter-init/.* . 2>/dev/null || true
   rm -rf /tmp/marx-meter-init
   ```

2. **Install Preact and its Vite plugin:**
   ```bash
   pnpm add preact
   pnpm add -D @preact/preset-vite
   ```

3. **Install Tailwind CSS v4 Vite plugin:**
   ```bash
   pnpm add -D @tailwindcss/vite
   ```

4. **Configure `wxt.config.ts`** — this is the exact content:
   ```typescript
   import { defineConfig } from 'wxt';
   import preact from '@preact/preset-vite';
   import tailwindcss from '@tailwindcss/vite';

   export default defineConfig({
     srcDir: 'src',
     manifest: {
       name: 'Marx Meter',
       description: 'Decode the news. Who benefits? Now you\'ll know.',
       version: '0.0.1',
       action: {},
     },
     vite: () => ({
       plugins: [preact(), tailwindcss()],
     }),
   });
   ```

5. **Create directory structure:**
   ```
   src/
   ├── entrypoints/
   │   ├── background.ts
   │   ├── content.ts
   │   └── sidepanel/
   │       ├── index.html
   │       ├── main.tsx
   │       ├── App.tsx
   │       └── style.css
   ├── lib/
   │   ├── ai/
   │   ├── extraction/
   │   ├── analysis/
   │   ├── references/
   │   └── sharing/
   ├── common/
   │   └── types.ts
   └── assets/
   data/
   ├── ownership/
   ├── references/
   └── prompts/
   tests/
   └── fixtures/
       ├── articles/
       ├── api-responses/
       └── analysis-results/
   ```
   Create empty directories with `.gitkeep` files where needed.

6. **Configure TypeScript** — update `tsconfig.json`:
   ```json
   {
     "extends": "./.wxt/tsconfig.json",
     "compilerOptions": {
       "strict": true,
       "jsx": "react-jsx",
       "jsxImportSource": "preact"
     }
   }
   ```

7. **Verify setup:**
   ```bash
   pnpm dev
   ```
   Should start without errors. Kill the dev server after confirming.

### Definition of Done for Task 1.1
- [ ] `pnpm install` succeeds with no errors
- [ ] `wxt.config.ts` exists with Preact + Tailwind plugins configured
- [ ] `src/entrypoints/` directory exists
- [ ] `tsconfig.json` has `strict: true` and Preact JSX config
- [ ] `pnpm dev` starts without errors (even if extension does nothing yet)

---

## Stream A: Extension Shell

**Owner:** Agent A
**Depends on:** Task 1.1 complete
**Files this stream creates/modifies:**
- `src/entrypoints/background.ts`
- `src/entrypoints/content.ts`
- `src/entrypoints/sidepanel/index.html`
- `src/entrypoints/sidepanel/main.tsx`
- `src/entrypoints/sidepanel/App.tsx`
- `src/entrypoints/sidepanel/style.css`
- `src/common/types.ts`
- `public/icon/*.png` (extension icons)

**DO NOT modify:** `wxt.config.ts` (already configured in 1.1), `.github/`, `vitest.config.ts`, `package.json` scripts.

---

### Task 1.2: Background Service Worker

**File:** `src/entrypoints/background.ts`

```typescript
export default defineBackground(() => {
  console.log('Marx Meter background service worker loaded.');

  // Open side panel on toolbar icon click
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });
});
```

**Requirements:**
- Uses WXT's `defineBackground` wrapper (auto-imported by WXT)
- Uses `browser.action.onClicked` to open side panel
- Uses `browser.sidePanel.open()` API
- No other logic — this is a stub

---

### Task 1.3: Content Script Stub

**File:** `src/entrypoints/content.ts`

```typescript
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    console.log('Marx Meter content script loaded.');
  },
});
```

**Requirements:**
- Uses WXT's `defineContentScript` wrapper
- `matches: ['<all_urls>']` — runs on all pages (will be narrowed later)
- `runAt: 'document_idle'` — doesn't block page load
- No other logic — this is a stub

---

### Task 1.4: Side Panel HTML Entry Point

**File:** `src/entrypoints/sidepanel/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Marx Meter</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

**Requirements:**
- Minimal HTML shell
- Single `#app` mount point
- Loads `main.tsx` as module

---

### Task 1.5: Side Panel Preact App

**File:** `src/entrypoints/sidepanel/style.css`

```css
@import "tailwindcss";
```

**File:** `src/entrypoints/sidepanel/main.tsx`

```tsx
import { render } from 'preact';
import { App } from './App';
import './style.css';

render(<App />, document.getElementById('app')!);
```

**File:** `src/entrypoints/sidepanel/App.tsx`

```tsx
export function App() {
  return (
    <div class="min-h-screen bg-neutral-950 text-neutral-100 p-4">
      <h1 class="text-xl font-bold tracking-tight">Marx Meter</h1>
      <p class="mt-2 text-sm text-neutral-400">
        Navigate to a news article and click Analyze to begin.
      </p>
    </div>
  );
}
```

**Requirements:**
- Preact `render()` mounts to `#app`
- Tailwind v4 imported via `@import "tailwindcss"` (v4 convention — no `@tailwind` directives)
- `App` component uses Tailwind utility classes
- Dark background by default (`bg-neutral-950`, `text-neutral-100`)
- Uses `class` not `className` (Preact convention — both work, but `class` is idiomatic Preact)

---

### Task 1.6: Extension Icons

Create simple placeholder icons. Use a solid red square with "MM" text, or any minimal placeholder.

**Files:**
- `public/icon/16.png` — 16x16
- `public/icon/32.png` — 32x32
- `public/icon/48.png` — 48x48
- `public/icon/128.png` — 128x128

Update `wxt.config.ts` manifest to reference icons:

**WAIT** — Stream A should NOT modify `wxt.config.ts` directly. Instead, create a file `src/assets/icons-note.md` with the required manifest addition:

```
Icons are in public/icon/. Add to wxt.config.ts manifest:
  icons: {
    16: '/icon/16.png',
    32: '/icon/32.png',
    48: '/icon/48.png',
    128: '/icon/128.png',
  },
```

This will be merged after both streams complete.

**Alternatively**, since icon config is in the manifest block that was already set up in 1.1, Agent A may add the `icons` field to the `manifest` object in `wxt.config.ts`. This is acceptable because it only adds a field — it does not change existing config.

---

### Task 1.7: Common Types Stub

**File:** `src/common/types.ts`

```typescript
/**
 * Placeholder for shared types.
 * Will be populated in M1 with AnalysisResult, ArticleData, etc.
 */
export interface ArticleData {
  title: string;
  byline: string | null;
  content: string;
  excerpt: string;
  domain: string;
  url: string;
}
```

**Requirements:**
- Single interface as a starting point
- Will be expanded in M1

---

### Stream A Definition of Done
- [ ] `pnpm dev` → extension loads in Chrome
- [ ] Clicking toolbar icon opens side panel
- [ ] Side panel shows "Marx Meter" heading with dark background and Tailwind styling
- [ ] Background service worker logs to console on load
- [ ] Content script logs to console on any page
- [ ] No TypeScript errors (`pnpm typecheck` or `tsc --noEmit`)
- [ ] Extension icons appear in Chrome toolbar

---

## Stream B: Build & CI

**Owner:** Agent B
**Depends on:** Task 1.1 complete
**Files this stream creates/modifies:**
- `vitest.config.ts`
- `tests/smoke.test.ts`
- `.github/workflows/ci.yml`
- `package.json` (only the `scripts` block — adding test/lint/typecheck scripts)
- `.eslintrc.cjs` or `eslint.config.js`
- `.prettierrc`

**DO NOT modify:** `src/entrypoints/`, `src/common/`, `wxt.config.ts`, `public/`.

---

### Task 2.1: Install Dev Dependencies

```bash
pnpm add -D vitest @testing-library/preact @testing-library/jest-dom jsdom
pnpm add -D eslint prettier eslint-config-prettier
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

---

### Task 2.2: Vitest Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

**File:** `tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
```

---

### Task 2.3: Smoke Test

**File:** `tests/smoke.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('build smoke test', () => {
  it('common types module is importable', async () => {
    const types = await import('../src/common/types');
    expect(types).toBeDefined();
  });

  it('typescript strict mode is enforced', () => {
    // This test exists to verify the test runner works.
    // TypeScript strict mode is verified by tsc --noEmit in CI.
    const value: string = 'Marx Meter';
    expect(value).toBe('Marx Meter');
  });
});
```

**Requirements:**
- Tests pass with `pnpm vitest run`
- Imports from `src/` work via the configured alias
- This is intentionally minimal — real tests come in M1

---

### Task 2.4: ESLint + Prettier Config

**File:** `eslint.config.js`

```javascript
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        jsxPragma: 'h',
        jsxFragmentPragma: 'Fragment',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  prettier,
  {
    ignores: ['.output/', '.wxt/', 'dist/', 'node_modules/'],
  },
];
```

**File:** `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

**Note:** If the ESLint flat config approach causes issues with the installed packages, fall back to a `.eslintrc.cjs` with the equivalent config. The exact ESLint config format matters less than having it work. Do not spend more than 15 minutes debugging ESLint config — get it working and move on.

---

### Task 2.5: Package.json Scripts

Add these scripts to `package.json` (merge with existing, do not overwrite):

```json
{
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "zip": "wxt zip",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint src/ tests/ --fix",
    "format": "prettier --write 'src/**/*.{ts,tsx}' 'tests/**/*.{ts,tsx}'",
    "typecheck": "tsc --noEmit"
  }
}
```

**Requirements:**
- `pnpm test` runs Vitest and passes
- `pnpm lint` runs without crashing (warnings OK, errors must be zero)
- `pnpm typecheck` passes
- `pnpm build` produces output in `.output/`

---

### Task 2.6: GitHub Actions CI

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Verify build output
        run: |
          test -f .output/chrome-mv3/manifest.json
          echo "Build output verified."
```

**Requirements:**
- Runs on push to `main` and on PRs
- Uses pnpm v9 + Node 20
- Four checks: lint, typecheck, test, build
- Build verification: checks that `manifest.json` exists in output
- No Playwright E2E yet — that comes in M1

---

### Stream B Definition of Done
- [ ] `pnpm test` runs and passes (1 smoke test)
- [ ] `pnpm lint` runs with zero errors
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` produces `.output/chrome-mv3/manifest.json`
- [ ] `.github/workflows/ci.yml` exists and is valid YAML
- [ ] ESLint + Prettier configs exist

---

## Post-Streams: Merge & Verify

After both streams complete, one agent (or a human) does the final integration:

1. **Add icons to manifest** — if not already done, add the `icons` field to `wxt.config.ts` manifest.

2. **Run full verification:**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

3. **Manual smoke test:**
   - Load `.output/chrome-mv3` as unpacked extension in Chrome
   - Click toolbar icon → side panel opens with "Marx Meter" heading
   - Open DevTools → Console → see background + content script log messages

4. **Update progress tracker** — mark all M0 tasks as `[x]` in `specs/PROGRESS.md`.

### M0 Complete Definition of Done
- [ ] All Stream A tasks complete
- [ ] All Stream B tasks complete
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass
- [ ] Extension loads in Chrome manually
- [ ] Side panel opens and shows styled content
- [ ] CI workflow file exists and is valid
- [ ] Progress tracker updated

---

## Files Created in This Milestone (Complete List)

```
.github/workflows/ci.yml
.eslintrc.cjs OR eslint.config.js
.prettierrc
vitest.config.ts
tests/setup.ts
tests/smoke.test.ts
src/entrypoints/background.ts
src/entrypoints/content.ts
src/entrypoints/sidepanel/index.html
src/entrypoints/sidepanel/main.tsx
src/entrypoints/sidepanel/App.tsx
src/entrypoints/sidepanel/style.css
src/common/types.ts
src/lib/ai/.gitkeep
src/lib/extraction/.gitkeep
src/lib/analysis/.gitkeep
src/lib/references/.gitkeep
src/lib/sharing/.gitkeep
src/assets/ (icons or placeholder)
public/icon/16.png
public/icon/32.png
public/icon/48.png
public/icon/128.png
data/ownership/.gitkeep
data/references/.gitkeep
data/prompts/.gitkeep
tests/fixtures/articles/.gitkeep
tests/fixtures/api-responses/.gitkeep
tests/fixtures/analysis-results/.gitkeep
```

## Files Modified in This Milestone

```
package.json (scripts + dependencies)
tsconfig.json (strict mode + Preact JSX)
wxt.config.ts (Preact + Tailwind plugins, manifest, srcDir)
```
