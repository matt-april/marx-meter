import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ArticleData, AnalysisResult, AnalysisResultSchema } from '../../common/types';
import { AIProvider } from './types';
import { buildAnalysisPrompt } from '../analysis/prompts';

export class GeminiAdapter implements AIProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async analyze(article: ArticleData): Promise<AnalysisResult> {
    const prompt = buildAnalysisPrompt(article);

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(AnalysisResultSchema),
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned empty response');
    }

    const parsed = JSON.parse(text);
    const validated = AnalysisResultSchema.parse(parsed);
    return validated;
  }

  async *stream(article: ArticleData): AsyncGenerator<string, AnalysisResult, unknown> {
    const prompt = buildAnalysisPrompt(article);

    const stream = await this.client.models.generateContentStream({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(AnalysisResultSchema),
        temperature: 0.3,
      },
    });

    let fullText = '';
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        yield text;
      }
    }

    const validated = AnalysisResultSchema.parse(JSON.parse(fullText));
    return validated;
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new GoogleGenAI({ apiKey });
      const response = await testClient.models.generateContent({
        model: this.model,
        contents: 'Respond with the word "valid" and nothing else.',
      });
      return !!response.text;
    } catch {
      return false;
    }
  }
}
