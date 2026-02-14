declare module '@mozilla/readability' {
  interface ReadabilityArticle {
    title: string;
    byline: string | null;
    content: string;
    textContent: string;
    excerpt: string;
    publishedTime: string | null;
    siteName: string | null;
    length: number;
    lang: string | null;
  }

  interface ReadabilityOptions {
    debug?: boolean;
    maxElemsToParse?: number;
    nbTopCandidates?: number;
    charThreshold?: number;
    classesToPreserve?: string[];
    keepClasses?: boolean;
    disableJSONLD?: boolean;
  }

  export class Readability {
    constructor(doc: Document, options?: ReadabilityOptions);
    parse(): ReadabilityArticle | null;
  }
}
