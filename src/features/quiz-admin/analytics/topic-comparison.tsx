import { TopicComparison } from "../data/quiz-analytics-repository";

interface Props {
  topics: TopicComparison[];
}

export function TopicComparisonView({ topics }: Props) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-2">Topic performance</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Topic accuracy is based on all scored question responses for the cohort. Response counts are shown to provide context.
      </p>

      <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
        <div className="space-y-6">
          {topics.map((topic) => {
            const hasPre = topic.preTest.percentage !== null;
            const hasPost = topic.postTest.percentage !== null;

            return (
              <div key={topic.topicId} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-sm">{topic.topicName}</span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {topic.learningGain !== null ? (
                      <span className={topic.learningGain >= 0 ? "text-success" : "text-destructive"}>
                        {topic.learningGain > 0 ? "+" : ""}{topic.learningGain} pp
                      </span>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                
                <div className="grid grid-cols-[3rem_1fr_3rem] gap-3 items-center text-xs">
                  <span className="text-right text-muted-foreground">Pre</span>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex items-center">
                    {hasPre ? (
                      <div className="h-full bg-primary/70" style={{ width: `${topic.preTest.percentage}%` }} />
                    ) : (
                      <span className="text-[10px] pl-2 text-muted-foreground w-full">No submitted data</span>
                    )}
                  </div>
                  <span className="font-medium text-right">{hasPre ? `${topic.preTest.percentage}%` : "—"}</span>
                </div>

                <div className="grid grid-cols-[3rem_1fr_3rem] gap-3 items-center text-xs">
                  <span className="text-right text-muted-foreground">Post</span>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex items-center">
                    {hasPost ? (
                      <div className="h-full bg-primary" style={{ width: `${topic.postTest.percentage}%` }} />
                    ) : (
                      <span className="text-[10px] pl-2 text-muted-foreground w-full">No submitted data</span>
                    )}
                  </div>
                  <span className="font-medium text-right">{hasPost ? `${topic.postTest.percentage}%` : "—"}</span>
                </div>

                <div className="text-[10px] text-muted-foreground pl-15 ml-15 text-center mt-1">
                  {topic.preTest.scoredResponseCount} pre responses · {topic.postTest.scoredResponseCount} post responses
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[32rem] text-left text-sm border-collapse">
              <caption className="sr-only">Detailed topic performance table</caption>
              <thead className="bg-muted/65">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Topic</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-right">Pre-test accuracy</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-right text-xs font-normal text-muted-foreground">Responses</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-right">Post-test accuracy</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-right text-xs font-normal text-muted-foreground">Responses</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topics.map((topic) => (
                  <tr key={topic.topicId}>
                    <th scope="row" className="px-3 py-2 font-medium">{topic.topicName}</th>
                    <td className="px-3 py-2 text-right">{topic.preTest.percentage !== null ? `${topic.preTest.percentage}%` : "—"}</td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">{topic.preTest.scoredResponseCount}</td>
                    <td className="px-3 py-2 text-right">{topic.postTest.percentage !== null ? `${topic.postTest.percentage}%` : "—"}</td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">{topic.postTest.scoredResponseCount}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {topic.learningGain !== null ? (
                        <span className={topic.learningGain >= 0 ? "text-success" : "text-destructive"}>
                          {topic.learningGain > 0 ? "+" : ""}{topic.learningGain} pp
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
