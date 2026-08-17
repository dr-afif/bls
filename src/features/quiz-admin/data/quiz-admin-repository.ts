import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../../lib/supabase/database.types";
import type {
  AdminQuestion,
  AdminQuiz,
  QuestionDraftValues,
  QuestionType,
  QuizAdminCatalog,
  QuizDraftValues,
  QuizType,
} from "../model/quiz-admin-types";

type Client = SupabaseClient<Database>;

function fail(code: string): never { throw new Error(code); }
function ensure(results: Array<{ error: unknown }>) {
  if (results.some((result) => result.error)) fail("QUIZ_ADMIN_DATA_UNAVAILABLE");
}

export async function listQuizAdminCatalog(client: Client): Promise<QuizAdminCatalog> {
  const [quizzes, quizVersions, composition, questions, questionVersions, options, assignments, topics, courses, cohorts, releases] = await Promise.all([
    client.from("quizzes").select("id, course_id, slug, quiz_type, title, current_version_id").order("updated_at", { ascending: false }).limit(100),
    client.from("quiz_versions").select("id, quiz_id, version_number, title, instructions, passing_score_percent, time_limit_minutes, attempt_limit, available_from, available_until, randomize_options, status, published_at, created_at").order("version_number", { ascending: false }).limit(500),
    client.from("quiz_version_questions").select("quiz_version_id, question_version_id, display_order").order("display_order"),
    client.from("questions").select("id, course_id, current_version_id").order("updated_at", { ascending: false }).limit(500),
    client.from("question_versions").select("id, question_id, version_number, question_type, prompt, reference_note, status, approved_at, created_at").order("version_number", { ascending: false }).limit(2000),
    client.from("question_options").select("id, question_version_id, option_text, display_order, is_correct").order("display_order").limit(10000),
    client.from("question_version_topics").select("question_version_id, topic_id"),
    client.from("bls_topics").select("id, name, active").order("display_order").order("name"),
    client.from("courses").select("id, title").neq("status", "archived").order("title"),
    client.from("cohorts").select("id, course_id, name, start_at, end_at").order("start_at", { ascending: false }).limit(200),
    client.from("cohort_quiz_releases").select("cohort_id, quiz_version_id, released_at").order("released_at", { ascending: false }).limit(500),
  ]);
  ensure([quizzes, quizVersions, composition, questions, questionVersions, options, assignments, topics, courses, cohorts, releases]);
  const courseById = new Map((courses.data ?? []).map((course) => [course.id, course.title]));

  const assembledQuestions: AdminQuestion[] = (questions.data ?? []).map((question) => ({
    courseId: question.course_id,
    courseTitle: courseById.get(question.course_id) ?? "Course unavailable",
    currentVersionId: question.current_version_id,
    id: question.id,
    versions: (questionVersions.data ?? []).filter((version) => version.question_id === question.id).map((version) => ({
      approvedAt: version.approved_at,
      createdAt: version.created_at,
      id: version.id,
      options: (options.data ?? []).filter((option) => option.question_version_id === version.id).map((option) => ({
        id: option.id, isCorrect: option.is_correct, order: option.display_order, text: option.option_text,
      })),
      prompt: version.prompt,
      referenceNote: version.reference_note,
      status: version.status,
      topicIds: (assignments.data ?? []).filter((item) => item.question_version_id === version.id).map((item) => item.topic_id),
      type: version.question_type,
      versionNumber: version.version_number,
    })),
  }));

  const assembledQuizzes: AdminQuiz[] = (quizzes.data ?? []).map((quiz) => ({
    courseId: quiz.course_id,
    courseTitle: courseById.get(quiz.course_id) ?? "Course unavailable",
    currentVersionId: quiz.current_version_id,
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    type: quiz.quiz_type,
    versions: (quizVersions.data ?? []).filter((version) => version.quiz_id === quiz.id).map((version) => ({
      attemptLimit: version.attempt_limit,
      availableFrom: version.available_from,
      availableUntil: version.available_until,
      createdAt: version.created_at,
      id: version.id,
      instructions: version.instructions,
      passingScorePercent: Number(version.passing_score_percent),
      publishedAt: version.published_at,
      questionVersionIds: (composition.data ?? []).filter((item) => item.quiz_version_id === version.id).map((item) => item.question_version_id),
      randomizeOptions: version.randomize_options,
      status: version.status,
      timeLimitMinutes: version.time_limit_minutes,
      title: version.title,
      versionNumber: version.version_number,
    })),
  }));

  return {
    cohorts: (cohorts.data ?? []).map((cohort) => ({ courseId: cohort.course_id, endAt: cohort.end_at, id: cohort.id, name: cohort.name, startAt: cohort.start_at })),
    courses: courses.data ?? [],
    questions: assembledQuestions,
    quizzes: assembledQuizzes,
    releases: (releases.data ?? []).map((release) => ({ cohortId: release.cohort_id, quizVersionId: release.quiz_version_id, releasedAt: release.released_at })),
    topics: topics.data ?? [],
  };
}

function quizError(error: { message: string } | null, fallback: string): never {
  const known = ["QUIZ_ADMIN_REQUIRED", "QUESTION_VERSION_NOT_EDITABLE", "QUESTION_VERSION_NOT_PUBLISHABLE", "QUIZ_VERSION_NOT_EDITABLE", "QUIZ_VERSION_NOT_PUBLISHABLE", "QUIZ_QUESTIONS_INVALID", "QUIZ_RELEASE_DENIED", "QUIZ_UNAVAILABLE"].find((code) => error?.message.includes(code));
  fail(known ?? fallback);
}

export async function createQuestion(client: Client, input: QuestionDraftValues & { courseId: string }) {
  const { data, error } = await client.rpc("admin_create_question_draft", {
    target_correct_option: input.correctIndex + 1,
    target_course_id: input.courseId,
    target_option_texts: input.options.map((option) => option.text.trim()),
    target_prompt: input.prompt.trim(),
    target_question_type: input.type,
    target_reference_note: input.referenceNote.trim(),
    target_topic_ids: input.topicIds,
  });
  if (error || !data?.[0]) quizError(error, "QUESTION_CREATE_FAILED");
  return data[0];
}

export async function updateQuestionDraft(client: Client, versionId: string, input: QuestionDraftValues) {
  const { error } = await client.rpc("admin_replace_question_draft", {
    target_correct_option: input.correctIndex + 1,
    target_option_texts: input.options.map((option) => option.text.trim()),
    target_prompt: input.prompt.trim(),
    target_question_type: input.type,
    target_reference_note: input.referenceNote.trim(),
    target_topic_ids: input.topicIds,
    target_version_id: versionId,
  });
  if (error) quizError(error, "QUESTION_UPDATE_FAILED");
}

export async function createQuestionVersion(client: Client, questionId: string) {
  const { data, error } = await client.rpc("admin_create_question_version_draft", { target_question_id: questionId });
  if (error || !data?.[0]) quizError(error, "QUESTION_VERSION_CREATE_FAILED");
  return data[0];
}

export async function publishQuestion(client: Client, versionId: string) {
  const { error } = await client.rpc("admin_publish_question_version", { target_version_id: versionId });
  if (error) quizError(error, "QUESTION_PUBLICATION_FAILED");
}

export async function createQuiz(client: Client, input: QuizDraftValues & { courseId: string; slug: string; type: QuizType }) {
  const { data, error } = await client.rpc("admin_create_quiz_draft", {
    target_attempt_limit: input.attemptLimit,
    target_course_id: input.courseId,
    target_instructions: input.instructions.trim(),
    target_passing_score_percent: input.passingScorePercent,
    target_question_version_ids: input.questionVersionIds,
    target_quiz_type: input.type,
    target_randomize_options: input.randomizeOptions,
    target_slug: input.slug.trim().toLowerCase(),
    target_time_limit_minutes: input.timeLimitMinutes,
    target_title: input.title.trim(),
  });
  if (error || !data?.[0]) quizError(error, "QUIZ_CREATE_FAILED");
  return data[0];
}

export async function updateQuizDraft(client: Client, versionId: string, input: QuizDraftValues) {
  const { error } = await client.rpc("admin_replace_quiz_draft", {
    target_attempt_limit: input.attemptLimit,
    target_available_from: (input.availableFrom ? new Date(input.availableFrom).toISOString() : null) as unknown as string,
    target_available_until: (input.availableUntil ? new Date(input.availableUntil).toISOString() : null) as unknown as string,
    target_instructions: input.instructions.trim(),
    target_passing_score_percent: input.passingScorePercent,
    target_question_version_ids: input.questionVersionIds,
    target_randomize_options: input.randomizeOptions,
    target_time_limit_minutes: input.timeLimitMinutes,
    target_title: input.title.trim(),
    target_version_id: versionId,
  });
  if (error) quizError(error, "QUIZ_UPDATE_FAILED");
}

export async function createQuizVersion(client: Client, quizId: string) {
  const { data, error } = await client.rpc("admin_create_quiz_version_draft", { target_quiz_id: quizId });
  if (error || !data?.[0]) quizError(error, "QUIZ_VERSION_CREATE_FAILED");
  return data[0];
}

export async function publishQuiz(client: Client, versionId: string) {
  const { error } = await client.rpc("admin_publish_quiz_version", { target_version_id: versionId });
  if (error) quizError(error, "QUIZ_PUBLICATION_FAILED");
}

export async function releasePostTest(client: Client, cohortId: string, quizId: string) {
  const { error } = await client.rpc("release_cohort_post_test", {
    target_cohort_id: cohortId,
    target_quiz_id: quizId,
    target_request_id: crypto.randomUUID(),
  });
  if (error) quizError(error, "QUIZ_RELEASE_FAILED");
}

export const questionTypeLabels: Record<QuestionType, string> = {
  single_best_answer: "Single best answer",
  true_false: "True or false",
};
