export type QuizKind = "pre_test" | "post_test";
export type QuizAttemptStatus = "in_progress" | "submitted" | "timed_out" | "invalidated";
export type QuizQuestionKind = "single_best_answer" | "true_false";

export type QuizAvailability = {
  attemptLimit: number;
  attemptsUsed: number;
  availableFrom: string | null;
  availableUntil: string | null;
  instructions: string;
  quizId: string;
  released: boolean;
  timeLimitMinutes: number;
  title: string;
  type: QuizKind;
  versionId: string;
};

export type QuizAttemptStart = {
  attemptId: string;
  expiresAt: string;
  resumed: boolean;
  startedAt: string;
  status: QuizAttemptStatus;
};

export type QuizAttemptOption = { displayOrder: number; id: string; text: string };
export type QuizAttemptQuestion = {
  attemptQuestionId: string;
  displayOrder: number;
  options: QuizAttemptOption[];
  prompt: string;
  selectedOptionId: string | null;
  type: QuizQuestionKind;
};
export type QuizAttemptPayload = {
  attemptId: string;
  expiresAt: string;
  questions: QuizAttemptQuestion[];
  status: QuizAttemptStatus;
};
export type QuizTopicResult = { earned: number; percent: number; possible: number; topicId: string };
export type QuizSubmissionResult = {
  attemptId: string;
  passed: boolean | null;
  scorePercent: number | null;
  status: "submitted";
  topicSummary: QuizTopicResult[];
};

export interface QuizRepository {
  getAttempt(attemptId: string): Promise<QuizAttemptPayload>;
  listAvailable(): Promise<QuizAvailability[]>;
  saveAnswer(attemptQuestionId: string, attemptOptionId: string): Promise<{ savedAt: string }>;
  startAttempt(quizId: string, requestId: string): Promise<QuizAttemptStart>;
  submitAttempt(attemptId: string, requestId: string): Promise<QuizSubmissionResult>;
}
