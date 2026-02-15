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
