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
