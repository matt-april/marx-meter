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

export interface AnalysisWithOwnership {
  type: 'ANALYSIS_WITH_OWNERSHIP';
  payload: {
    analysis: AnalysisResult;
    ownership: import('../lib/ownership/types').OutletOwnership | null;
  };
}

export interface AnalysisErrorMessage {
  type: 'ANALYSIS_ERROR';
  error: string;
}

export interface HighlightsToggleMessage {
  type: 'HIGHLIGHTS_TOGGLE';
  payload: boolean;
}

export interface HighlightClickMessage {
  type: 'HIGHLIGHT_CLICK';
  payload: { highlightId: string };
}

export interface InjectHighlightsMessage {
  type: 'INJECT_HIGHLIGHTS';
  payload: import('../lib/highlights/types').Highlight[];
}

export interface ClearHighlightsMessage {
  type: 'CLEAR_HIGHLIGHTS';
}

export interface HighlightReportMessage {
  type: 'HIGHLIGHT_REPORT';
  payload: import('../lib/highlights/types').HighlightReport;
}

export type RuntimeMessage =
  | ExtractArticleMessage
  | ArticleExtractedMessage
  | ExtractionFailedMessage
  | AnalyzeArticleMessage
  | AnalysisCompleteMessage
  | AnalysisWithOwnership
  | AnalysisErrorMessage
  | HighlightsToggleMessage
  | HighlightClickMessage
  | InjectHighlightsMessage
  | ClearHighlightsMessage
  | HighlightReportMessage;
