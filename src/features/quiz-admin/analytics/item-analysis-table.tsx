import { CohortItemAnalysis, ItemAnalysis, ItemOptionAnalysis } from "../data/quiz-analytics-repository";

interface ItemAnalysisTableProps {
  analysis: CohortItemAnalysis;
}

export function ItemAnalysisTable({ analysis }: ItemAnalysisTableProps) {
  if (analysis.items.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No questions found for this assessment.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {analysis.items.map((item) => (
        <ItemAnalysisRow key={item.questionVersionId} item={item} />
      ))}
    </div>
  );
}

function ItemAnalysisRow({ item }: { item: ItemAnalysis }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 sm:p-6 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {item.topicName || "Uncategorized"}
            </div>
            <h3 className="text-base font-medium">{item.prompt}</h3>
            <div className="text-xs text-muted-foreground">
              Version {item.questionVersionNumber}
            </div>
          </div>

          <div className="flex gap-6 text-sm shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">Responses</span>
              <span className="font-semibold text-lg">{item.responseCount}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">Correct</span>
              <span className="font-semibold text-lg">
                {item.correctResponseRate !== null ? `${item.correctResponseRate}%` : "0%"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-card">
        <h4 className="text-sm font-medium mb-4 text-muted-foreground">Option Distribution</h4>
        <div className="space-y-3">
          {item.options.map((option) => (
            <OptionRow key={option.questionOptionId} option={option} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OptionRow({ option }: { option: ItemOptionAnalysis }) {
  const percent = option.selectionPercent || 0;
  
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className={`shrink-0 w-1.5 h-10 rounded-full ${option.isCorrect ? "bg-green-500" : "bg-muted-foreground/30"}`} />
        <div className="flex-1 truncate text-sm">
          {option.optionText}
          {option.isCorrect && (
            <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Correct Answer
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 shrink-0 sm:w-1/3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full ${option.isCorrect ? "bg-green-500" : "bg-muted-foreground"}`} 
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="w-16 text-right text-sm tabular-nums">
          <span className="font-medium">{percent}%</span>
          <span className="text-muted-foreground ml-1 text-xs">({option.selectedCount})</span>
        </div>
      </div>
    </div>
  );
}
