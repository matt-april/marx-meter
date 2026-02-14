# Guidelines for Writing Milestone Specs

This document tells you how to produce a detailed implementation spec for a Marx Meter milestone. Follow it step by step. Do not skip steps.

---

## When to Use This

You are writing a spec when the project owner asks for a new milestone spec (e.g., "create a spec for M2"). The output is a single markdown file in `specs/` named `m{N}-spec.md` (e.g., `specs/m2-spec.md`).

---

## Required Inputs

Before writing, you must read and understand ALL of these documents:

| Document | Why You Need It |
|----------|-----------------|
| `specs/IMPLEMENTATION_PLAN.md` | The milestone's goals, streams, tasks, effort estimates, definition of done, and risks. This is your primary source. |
| `specs/marx-meter-prd.md` | Product requirements, data models, analysis dimensions, UX flows. Refer to this for feature behavior and type definitions. |
| `specs/PROGRESS.md` | Current status of all milestones. Tells you what's already done and what the new milestone can depend on. |
| Previous milestone spec (e.g., `specs/m0-scaffolding.md`, `specs/m1-spec.md`) | Format reference. Match the style, level of detail, and section structure. |
| Actual codebase (`src/`, `tests/`, `package.json`, `wxt.config.ts`, `tsconfig.json`) | You must know what files exist, what packages are installed, what the current code looks like. Read every file the new milestone will modify. |

**Do not write the spec from memory or from the implementation plan alone.** The implementation plan describes *what* to build. Your spec describes *exactly how*, down to file contents. You cannot write exact file contents without reading the current files.

---

## Research Phase

### Step 1: Read the Implementation Plan

Read the milestone section in `specs/IMPLEMENTATION_PLAN.md`. Extract:
- The goal (one sentence)
- The parallel work streams and their tasks
- Dependencies between streams
- The definition of done
- Risks

### Step 2: Read the PRD Sections

Identify which PRD sections are relevant to this milestone. Read them. Extract:
- Type definitions and data models
- UI behavior descriptions
- API contracts
- Any constraints or design principles

### Step 3: Read the Current Codebase

Read every file the milestone will touch or depend on. At minimum:
- All files in `src/` that will be modified
- `package.json` (current dependencies and scripts)
- `wxt.config.ts` (current extension config)
- `tsconfig.json` (current TypeScript config)
- `vitest.config.ts` (current test config)
- The previous milestone's spec (for format reference)

**If the milestone introduces a new external library or API**, research it:
- Find the correct npm package name and current version
- Read the official documentation for the API surface you'll use
- Get working code examples — use Playwright MCP to browse docs pages if needed
- Verify the package isn't deprecated (e.g., `@google/generative-ai` was replaced by `@google/genai`)

### Step 4: Read Progress

Read `specs/PROGRESS.md` to confirm what's done. Don't spec work that's already complete.

---

## Writing Phase

### Structure

Use this exact section structure. Every section is mandatory.

```markdown
# M{N}: {Milestone Name} — Detailed Implementation Spec

**Goal:** {one sentence}
**Estimated effort:** {from implementation plan}
**Prerequisite:** {previous milestone}

---

## How This Spec Works
{Boilerplate: explain this is for AI agents, be literal, don't improvise}

## Git Branching Strategy
{Branch names, merge order, commit message conventions}

## Progress Tracking
{How agents update PROGRESS.md — include before/after examples}

## Package Dependencies
{Exact pnpm add commands, split by stream if needed}

## Parallel Work Streams
{ASCII diagram showing streams and dependencies}

### File Ownership Rules
{Which stream owns which files — explicit, no overlap}

## Stream {A/B/C/...}: {Name}
### Task {X.Y}: {Name}
{File path, complete file contents, definition of done}

## Integration Phase
### Task I.{N}: {Name}
{File path, complete file contents, definition of done}

## Cleanup Tasks
{Template artifacts to remove, renames, etc.}

## What to Test (Summary)
{Table: area, test type, location, what it validates}

## M{N} Definition of Done (Complete Milestone)
{Checklist — every box must be checked before milestone is done}

## Files Created in This Milestone (Complete List)
{New files, modified files, deleted files}
```

### Rules for Each Section

#### File Contents

**For every file the milestone creates or modifies, provide the COMPLETE file contents.** Not pseudocode. Not "implement something like this." The actual TypeScript/TSX/JSON/HTML that should be in the file.

Why: The implementing agents are cheap and will take shortcuts if given ambiguity. Complete file contents leave no room for interpretation.

Exceptions:
- Very large data files (e.g., a 100-outlet ownership JSON) — provide the schema, 2-3 example entries, and instructions for how to generate the rest.
- HTML fixture files — provide a realistic example and describe what properties it must have.

#### Type Definitions

- Use Zod schemas as the single source of truth for all data shapes.
- Derive TypeScript types from Zod using `z.infer<typeof Schema>`.
- Include `.describe()` on Zod fields — these become documentation and help AI models understand field intent.
- Put shared types in `src/common/types.ts`. Put module-specific types in the module's own `types.ts`.

#### Function Signatures

For every function the milestone introduces:
- Full signature with parameter types and return type
- JSDoc comment explaining what it does (one sentence)
- Example input/output if the behavior isn't obvious

#### Tests

For every test file:
- Provide the complete test file contents
- Every `it()` block with a descriptive name and the assertions
- Specify what fixtures are needed and provide their contents
- State what is mocked and how (vi.mock path, mock return values)

Test rules:
- Never hit real external APIs in tests — always mock
- Test structure (schema validation), not content (AI output text)
- Test constraints (scores in range, arrays non-empty), not exact values
- Use fixtures from `tests/fixtures/`

#### Dependencies

- List every new npm package with exact `pnpm add` commands
- Separate runtime deps from dev deps (`pnpm add` vs `pnpm add -D`)
- Split by stream if different streams need different packages
- Verify the package name is correct and not deprecated before writing it in the spec

#### Git Strategy

- One branch per stream: `m{N}/{stream-name}`
- State the merge order explicitly
- Explain which stream must merge first and why (usually the one that defines shared types)
- Conventional commit messages: `feat(scope)`, `test(scope)`, `fix(scope)`

#### File Ownership

- Every file in the milestone must be owned by exactly one stream
- No two streams may modify the same file
- If two streams both need to modify a file, one stream creates it and the other modifies it in the integration phase
- State ownership as an explicit list per stream

#### Progress Tracking

Include instructions for agents to update `specs/PROGRESS.md`:
- Mark tasks `[~]` when starting, `[x]` when done, `[!]` if blocked
- Add agent name in Owner column
- Add relevant notes (package versions, deviations)
- Include a before/after example

#### Definition of Done

Every task needs its own definition of done (checklist of 2-5 items). The milestone needs an overall definition of done that aggregates all tasks plus integration criteria.

The milestone DoD must include:
- `pnpm lint` passes
- `pnpm typecheck` passes
- `pnpm test` passes
- `pnpm build` produces a loadable extension
- User-facing behavior works (describe the specific flow)
- `specs/PROGRESS.md` updated

---

## Quality Checklist

Before submitting the spec, verify:

- [ ] Every file the milestone creates is listed with complete contents
- [ ] Every file the milestone modifies is listed with the exact changes
- [ ] Every file the milestone deletes is listed
- [ ] Every new npm package has a `pnpm add` command
- [ ] Every npm package name has been verified as current (not deprecated)
- [ ] Every external API/library used has been researched — code examples are based on actual documentation, not guesses
- [ ] File ownership has no overlaps between streams
- [ ] Merge order is stated and the rationale is clear
- [ ] Every test file has complete contents with all assertions
- [ ] Fixtures are provided for all mocked data
- [ ] No test hits a real external API
- [ ] Type definitions use Zod schemas with `.describe()` annotations
- [ ] The milestone DoD includes lint, typecheck, test, build, and user-facing behavior checks
- [ ] Progress tracking instructions are included with examples
- [ ] The "Files Created/Modified/Deleted" section is complete and accurate

---

## Common Mistakes to Avoid

1. **Specifying a deprecated package.** Always verify package names against npm or official docs. Libraries change fast — `@google/generative-ai` became `@google/genai`, for example.

2. **Providing pseudocode instead of real code.** The implementing agents will not fill in the gaps well. Write the actual code.

3. **Overlapping file ownership.** If two streams both need to touch `App.tsx`, designate one stream as the owner and have the other stream's changes happen in the integration phase.

4. **Forgetting to read the current codebase.** You cannot write accurate file modifications without knowing what's in the file right now. `import` paths, existing function signatures, existing state — all of it matters.

5. **Missing the integration phase.** Parallel streams produce isolated pieces. Someone has to wire them together. The integration phase is where that happens. Don't skip it.

6. **Not providing test fixtures.** If a test needs a JSON fixture, provide the JSON. If it needs an HTML file, provide the HTML. Don't say "create a fixture" — provide it.

7. **Specifying tests that hit real APIs.** Every external API call must be mocked. Say which module to mock and what the mock returns.

8. **Vague definitions of done.** "It works" is not a definition of done. "User clicks Analyze on a CNN article and sees a Quick Take section with 2-3 sentences" is.
