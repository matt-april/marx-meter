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
