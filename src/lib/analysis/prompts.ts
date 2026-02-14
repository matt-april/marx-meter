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

For "framingChoices": Identify at least 3 specific framing choices. For each one:
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
