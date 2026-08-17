create index attempt_questions_question_version_idx
  on public.attempt_questions (question_version_id);
create index attempt_questions_topic_idx
  on public.attempt_questions (topic_id) where topic_id is not null;
create index attempt_question_options_source_option_idx
  on public.attempt_question_options (question_option_id);
