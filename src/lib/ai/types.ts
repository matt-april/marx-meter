import { ArticleData, AnalysisResult } from '../../common/types';

export interface AIProvider {
  analyze(article: ArticleData): Promise<AnalysisResult>;
  stream(article: ArticleData): AsyncGenerator<string, AnalysisResult>;
  validateKey(apiKey: string): Promise<boolean>;
}
