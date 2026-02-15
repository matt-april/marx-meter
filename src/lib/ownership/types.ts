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
