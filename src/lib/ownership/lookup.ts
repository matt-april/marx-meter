import ownershipData from '../../../data/ownership/ownership.json';
import type { OutletOwnership } from './types';

const typedOwnershipData = ownershipData as unknown as OutletOwnership[];

export function lookupOwnership(domain: string): OutletOwnership | null {
  const normalizedDomain = normalizeDomain(domain);
  return typedOwnershipData.find((outlet) => outlet.domain === normalizedDomain) || null;
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
