import { describe, it, expect } from 'vitest';
import { lookupOwnership, formatDonations } from '../../src/lib/ownership/lookup';

describe('lookupOwnership', () => {
  it('returns ownership data for known domains', () => {
    const result = lookupOwnership('nytimes.com');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('The New York Times');
    expect(result?.parent_company).toBe('The New York Times Company');
  });

  it('returns null for unknown domains', () => {
    const result = lookupOwnership('unknown-site.com');
    expect(result).toBeNull();
  });

  it('normalizes www. prefix', () => {
    const result = lookupOwnership('www.washingtonpost.com');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('The Washington Post');
  });

  it('normalizes m. prefix', () => {
    const result = lookupOwnership('m.cnn.com');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('CNN');
  });

  it('normalizes mobile. prefix', () => {
    const result = lookupOwnership('mobile.nytimes.com');
    expect(result).not.toBeNull();
  });

  it('normalizes amp. prefix', () => {
    const result = lookupOwnership('amp.reuters.com');
    expect(result).not.toBeNull();
  });

  it('normalizes edition. prefix', () => {
    const result = lookupOwnership('edition.theguardian.com');
    expect(result).not.toBeNull();
  });

  it('handles case insensitive domains', () => {
    const result = lookupOwnership('CNN.COM');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('CNN');
  });
});

describe('formatDonations', () => {
  it('returns no donations message for empty array', () => {
    const result = formatDonations([]);
    expect(result).toBe('No significant donations reported');
  });

  it('formats Democratic donations', () => {
    const result = formatDonations([{ recipient: 'Democrats', amount: 2500000, party: 'D' }]);
    expect(result).toBe('$2.5M to Democrats (2024)');
  });

  it('formats Republican donations', () => {
    const result = formatDonations([{ recipient: 'Republicans', amount: 5000000, party: 'R' }]);
    expect(result).toBe('$5.0M to Republicans (2024)');
  });

  it('formats both parties combined', () => {
    const result = formatDonations([
      { recipient: 'Democrats', amount: 2500000, party: 'D' },
      { recipient: 'Republicans', amount: 150000, party: 'R' },
    ]);
    expect(result).toBe('$2.5MD / $150KR ($2.6M total, 2024)');
  });

  it('formats small amounts in thousands', () => {
    const result = formatDonations([{ recipient: 'Republicans', amount: 50000, party: 'R' }]);
    expect(result).toBe('$50K to Republicans (2024)');
  });
});
