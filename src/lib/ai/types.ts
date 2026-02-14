import { ArticleData, AnalysisResult } from '../../common/types';

export interface AIProvider {
  analyze(article: ArticleData): Promise<AnalysisResult>;
  validateKey(apiKey: string): Promise<boolean>;
}
