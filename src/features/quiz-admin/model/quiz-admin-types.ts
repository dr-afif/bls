import { z } from "zod";

export type QuestionType = "single_best_answer" | "true_false";
export type QuestionVersionStatus = "draft" | "approved" | "published" | "retired";
export type QuizType = "pre_test" | "post_test";
export type QuizVersionStatus = "draft" | "published" | "retired";

export type AdminQuestionVersion = {
  approvedAt: string | null;
  createdAt: string;
  id: string;
  options: Array<{ id: string; isCorrect: boolean; order: number; text: string }>;
  prompt: string;
  referenceNote: string | null;
  status: QuestionVersionStatus;
  topicIds: string[];
  type: QuestionType;
  versionNumber: number;
};

export type AdminQuestion = {
  courseId: string;
  courseTitle: string;
  currentVersionId: string | null;
  id: string;
  versions: AdminQuestionVersion[];
};

export type AdminQuizVersion = {
  attemptLimit: number;
  availableFrom: string | null;
  availableUntil: string | null;
  createdAt: string;
  id: string;
  instructions: string;
  passingScorePercent: number;
  publishedAt: string | null;
  questionVersionIds: string[];
  randomizeOptions: boolean;
  status: QuizVersionStatus;
  timeLimitMinutes: number;
  title: string;
  versionNumber: number;
};

export type AdminQuiz = {
  courseId: string;
  courseTitle: string;
  currentVersionId: string | null;
  id: string;
  slug: string;
  title: string;
  type: QuizType;
  versions: AdminQuizVersion[];
};

export type QuizAdminCatalog = {
  cohorts: Array<{ courseId: string; endAt: string; id: string; name: string; startAt: string }>;
  courses: Array<{ id: string; title: string }>;
  questions: AdminQuestion[];
  quizzes: AdminQuiz[];
  releases: Array<{ cohortId: string; quizVersionId: string; releasedAt: string }>;
  topics: Array<{ active: boolean; id: string; name: string }>;
};

const optionSchema = z.object({ text: z.string().trim().min(1, "Enter option text.").max(1000) });

export const questionDraftSchema = z.object({
  correctIndex: z.number().int().nonnegative(),
  options: z.array(optionSchema).min(2, "Add at least two options.").max(8),
  prompt: z.string().trim().min(2, "Enter the question prompt.").max(2000),
  referenceNote: z.string().trim().max(2000),
  topicIds: z.array(z.string().uuid()).min(1, "Choose at least one active BLS topic."),
  type: z.enum(["single_best_answer", "true_false"]),
}).superRefine((value, context) => {
  if (value.correctIndex >= value.options.length) {
    context.addIssue({ code: "custom", message: "Choose one correct option.", path: ["correctIndex"] });
  }
  if (value.type === "true_false" && value.options.length !== 2) {
    context.addIssue({ code: "custom", message: "True or false questions require exactly two options.", path: ["options"] });
  }
});

export const quizDraftSchema = z.object({
  attemptLimit: z.number().int().min(1).max(10),
  availableFrom: z.string(),
  availableUntil: z.string(),
  instructions: z.string().trim().min(2, "Enter learner instructions.").max(2000),
  passingScorePercent: z.number().min(0).max(100),
  questionVersionIds: z.array(z.string().uuid()).min(1, "Add at least one published question."),
  randomizeOptions: z.boolean(),
  timeLimitMinutes: z.number().int().min(1).max(240),
  title: z.string().trim().min(2, "Enter a quiz title.").max(160),
}).superRefine((value, context) => {
  if (value.availableFrom && value.availableUntil && value.availableUntil <= value.availableFrom) {
    context.addIssue({ code: "custom", message: "The closing time must be after the opening time.", path: ["availableUntil"] });
  }
});

export type QuestionDraftValues = z.infer<typeof questionDraftSchema>;
export type QuizDraftValues = z.infer<typeof quizDraftSchema>;
