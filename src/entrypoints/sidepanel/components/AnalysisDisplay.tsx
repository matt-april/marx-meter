import type { AnalysisResult } from '../../../common/types';
import { QuickTake } from './QuickTake';
import { WhoBenefits } from './WhoBenefits';
import { FramingChoices } from './FramingChoices';
import { IdeologicalAxes } from './IdeologicalAxes';

interface AnalysisDisplayProps {
  result: AnalysisResult;
  articleTitle: string;
  articleDomain: string;
}

export function AnalysisDisplay({ result, articleTitle, articleDomain }: AnalysisDisplayProps) {
  return (
    <div class="space-y-4">
      <header class="border-b border-neutral-800 pb-3">
        <h2 class="text-sm font-semibold text-neutral-200 line-clamp-2">{articleTitle}</h2>
        <p class="mt-1 text-xs text-neutral-500">{articleDomain}</p>
      </header>

      <QuickTake text={result.quickTake} />

      <WhoBenefits benefits={result.whoBenefits} absent={result.whosAbsent} />

      <FramingChoices choices={result.framingChoices} />

      <IdeologicalAxes axes={result.ideologicalAxes} />

      <section class="rounded-lg bg-neutral-900 p-4">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Source Analysis
        </h2>
        <p class="mt-2 text-sm text-neutral-300">{result.sourceAnalysis.summary}</p>
        <div class="mt-2 flex gap-4 text-xs text-neutral-500">
          <span>Corporate/Official: {result.sourceAnalysis.corporateOrOfficial}</span>
          <span>Worker/Community: {result.sourceAnalysis.workerOrCommunity}</span>
          <span>Anonymous: {result.sourceAnalysis.anonymous}</span>
        </div>
      </section>

      <section class="rounded-lg bg-neutral-900 p-4">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Missing Context
        </h2>
        <p class="mt-2 text-sm text-neutral-300">{result.missingContext}</p>
      </section>
    </div>
  );
}
