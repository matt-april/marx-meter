import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisResultSchema, type ArticleData } from '../../src/common/types';
import validResponse from '../fixtures/api-responses/gemini-valid.json';
import malformedResponse from '../fixtures/api-responses/gemini-malformed.json';

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function () {
      return {
        models: {
          generateContent: vi.fn(),
        },
      };
    }),
  };
});

// Mock zod-to-json-schema (it's a build-time concern, not relevant to test logic)
vi.mock('zod-to-json-schema', () => ({
  zodToJsonSchema: vi.fn().mockReturnValue({}),
}));

import { GeminiAdapter } from '../../src/lib/ai/gemini';
import { GoogleGenAI } from '@google/genai';

const mockArticle: ArticleData = {
  title: 'TechCorp Announces Workforce Optimization',
  byline: 'John Reporter',
  content: '<p>Article HTML content here</p>',
  textContent: 'TechCorp announced today a workforce optimization initiative affecting 5,000 positions. According to Goldman Sachs analyst Jane Smith, the restructuring positions TechCorp for long-term growth. Positions were eliminated as part of the strategic review.',
  excerpt: 'TechCorp announced workforce optimization',
  domain: 'wsj.com',
  url: 'https://www.wsj.com/articles/techcorp-layoffs',
  publishedTime: '2026-02-10',
  siteName: 'The Wall Street Journal',
};

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;
  let mockGenerateContent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new GeminiAdapter('fake-api-key');
    // Get reference to the mocked generateContent
    const mockInstance = (GoogleGenAI as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
    mockGenerateContent = mockInstance.models.generateContent;
  });

  describe('analyze', () => {
    it('returns a valid AnalysisResult when Gemini returns valid JSON', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(validResponse),
      });

      const result = await adapter.analyze(mockArticle);

      expect(result.quickTake).toBeTruthy();
      expect(result.whoBenefits.length).toBeGreaterThanOrEqual(1);
      expect(result.whosAbsent.length).toBeGreaterThanOrEqual(1);
      expect(result.framingChoices.length).toBeGreaterThanOrEqual(1);
      expect(result.ideologicalAxes.length).toBeGreaterThanOrEqual(1);

      // Validate the full result against the Zod schema
      const validated = AnalysisResultSchema.safeParse(result);
      expect(validated.success).toBe(true);
    });

    it('throws when Gemini returns empty response', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: null });

      await expect(adapter.analyze(mockArticle)).rejects.toThrow('Gemini returned empty response');
    });

    it('throws ZodError when Gemini returns malformed JSON', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(malformedResponse),
      });

      await expect(adapter.analyze(mockArticle)).rejects.toThrow();
    });

    it('throws when Gemini returns non-JSON text', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'This is not JSON at all',
      });

      await expect(adapter.analyze(mockArticle)).rejects.toThrow();
    });

    it('passes article data into the prompt', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(validResponse),
      });

      await adapter.analyze(mockArticle);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('TechCorp Announces Workforce Optimization');
      expect(callArgs.contents).toContain('wsj.com');
    });

    it('requests JSON response format', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(validResponse),
      });

      await adapter.analyze(mockArticle);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.config.responseMimeType).toBe('application/json');
    });
  });

  describe('validateKey', () => {
    it('returns true for a valid key', async () => {
      // The constructor creates a new GoogleGenAI instance inside validateKey,
      // so we need to mock the constructor to return a working mock
      const mockGenerate = vi.fn().mockResolvedValueOnce({ text: 'valid' });
      (GoogleGenAI as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(function () {
        return { models: { generateContent: mockGenerate } };
      });

      const result = await adapter.validateKey('valid-key');
      expect(result).toBe(true);
    });

    it('returns false for an invalid key', async () => {
      (GoogleGenAI as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(function () {
        return {
          models: {
            generateContent: vi.fn().mockRejectedValueOnce(new Error('401 Unauthorized')),
          },
        };
      });

      const result = await adapter.validateKey('bad-key');
      expect(result).toBe(false);
    });
  });
});
