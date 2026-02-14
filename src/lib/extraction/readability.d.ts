declare module '@mozilla/readability' {
  interface ReadabilityArticle {
    title: string | undefined;
    byline: string | null | undefined;
    content: string | undefined;
    textContent: string | undefined;
    excerpt: string | undefined;
    publishedTime: string | null | undefined;
    siteName: string | null | undefined;
    length: number;
    lang: string | null | undefined;
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
