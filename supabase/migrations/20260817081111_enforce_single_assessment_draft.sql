-- Parent-row locks in the versioning RPCs serialize creation; these partial
-- unique indexes ensure one editable branch remains visible per stable record.
create unique index question_versions_one_draft_idx
  on public.question_versions (question_id) where status = 'draft';
create unique index quiz_versions_one_draft_idx
  on public.quiz_versions (quiz_id) where status = 'draft';
