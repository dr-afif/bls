import { Link } from "react-router-dom";
import { LearnerComparison } from "../data/quiz-analytics-repository";
import { Button } from "../../../components/ui/button";

interface Props {
  learners: LearnerComparison[];
}

export function LearnerComparisonTable({ learners }: Props) {
  if (!learners || learners.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-4">Learner comparison</h3>
      
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[48rem] text-left text-sm border-collapse">
          <caption className="sr-only">Learner pre-test and post-test comparison</caption>
          <thead className="bg-muted/65">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Learner</th>
              <th scope="col" className="px-4 py-3 font-semibold">Pre-test score</th>
              <th scope="col" className="px-4 py-3 font-semibold">Post-test score</th>
              <th scope="col" className="px-4 py-3 font-semibold">Change</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {learners.map((learner) => {
              const hasPre = learner.preTest.scorePercent !== null;
              const hasPost = learner.postTest.scorePercent !== null;
              
              return (
                <tr key={learner.learnerId}>
                  <th scope="row" className="px-4 py-3 font-medium">
                    {learner.learnerName}
                  </th>
                  
                  <td className="px-4 py-3">
                    {hasPre ? (
                      <span className="font-semibold">{learner.preTest.scorePercent}%</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not submitted</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3">
                    {hasPost ? (
                      <span className="font-semibold">{learner.postTest.scorePercent}%</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not submitted</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 font-medium">
                    {learner.learningGain !== null ? (
                      <span className={learner.learningGain >= 0 ? "text-success" : "text-destructive"}>
                        {learner.learningGain > 0 ? "+" : ""}{learner.learningGain} pp
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {learner.preTest.attemptId && (
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2">
                          <Link to={`/app/admin/results/${learner.preTest.attemptId}`} aria-label={`View pre-test attempt detail for ${learner.learnerName}`}>
                            Pre-test detail
                          </Link>
                        </Button>
                      )}
                      {learner.postTest.attemptId && (
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2">
                          <Link to={`/app/admin/results/${learner.postTest.attemptId}`} aria-label={`View post-test attempt detail for ${learner.learnerName}`}>
                            Post-test detail
                          </Link>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
