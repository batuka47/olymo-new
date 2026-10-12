-- Quizzes: built by staff in /admin/quizzes, placed in articles with the editor's "Quiz" block
-- (body_json keeps only the quiz id). Readers answer without signing in; answers are counted per
-- option, with no personal data.

-- Tables ---------------------------------------------------------------------------------------

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 500),
  -- "Дарааллын төрөл": questions in the order written, or shuffled for every attempt.
  order_mode text not null default 'fixed' check (order_mode in ('random', 'fixed')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  sort_order integer not null default 0,
  text text not null check (char_length(btrim(text)) between 1 and 500),
  -- The 1600 px file of an upload in quizzes/{quiz id}/, as for covers.
  image_path text,
  image_alt text check (char_length(image_alt) <= 200),
  -- Shown once the question is answered.
  explanation text not null default '' check (char_length(explanation) <= 1000)
);

create index quiz_questions_quiz_idx on public.quiz_questions (quiz_id, sort_order);

create table public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  sort_order integer not null default 0,
  text text not null check (char_length(btrim(text)) between 1 and 300),
  is_correct boolean not null default false
);

create index quiz_options_question_idx on public.quiz_options (question_id, sort_order);

-- How many readers chose each option ("Уншигчдын 62% зөв хариулсан").
create table public.quiz_option_counts (
  option_id uuid primary key references public.quiz_options (id) on delete cascade,
  answers bigint not null default 0 check (answers >= 0)
);

-- One counted answer per question per address a day: salted address hashes only, removed after a
-- day by record_quiz_answer itself.
create table public.quiz_answer_log (
  ip_hash text not null,
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index quiz_answer_log_ip_idx on public.quiz_answer_log (ip_hash, created_at);

-- Exactly one correct option per question ----------------------------------------------------------

-- Checked when the transaction commits, so a quiz can be saved in any order (see save_quiz). A
-- question deleted in the same transaction is not checked.
create function public.quiz_question_has_one_correct_option()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  -- One function for both tables: read the row as JSON, as their columns differ.
  changed jsonb := coalesce(to_jsonb(new), to_jsonb(old));
  question uuid := (
    case tg_table_name when 'quiz_questions' then changed ->> 'id' else changed ->> 'question_id' end
  )::uuid;
begin
  if exists (select 1 from public.quiz_questions q where q.id = question)
    and (select count(*) from public.quiz_options o where o.question_id = question and o.is_correct) <> 1
  then
    raise exception 'Every quiz question needs exactly one correct option'
      using errcode = '23514';
  end if;
  return null;
end;
$$;

create constraint trigger quiz_options_one_correct
  after insert or update or delete on public.quiz_options
  deferrable initially deferred
  for each row execute function public.quiz_question_has_one_correct_option();

create constraint trigger quiz_questions_one_correct
  after insert on public.quiz_questions
  deferrable initially deferred
  for each row execute function public.quiz_question_has_one_correct_option();

-- Row level security: staff write; the public reads active quizzes ---------------------------------

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_option_counts enable row level security;
alter table public.quiz_answer_log enable row level security;

create policy "Public reads active quizzes, staff read all"
  on public.quizzes for select to anon, authenticated
  using (is_active or (select private.is_staff()));
create policy "Staff insert quizzes"
  on public.quizzes for insert to authenticated
  with check ((select private.is_staff()));
create policy "Staff update quizzes"
  on public.quizzes for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete quizzes"
  on public.quizzes for delete to authenticated
  using ((select private.is_staff()));

create policy "Anyone reads questions of visible quizzes"
  on public.quiz_questions for select to anon, authenticated
  using (exists (select 1 from public.quizzes z where z.id = quiz_id));
create policy "Staff insert quiz questions"
  on public.quiz_questions for insert to authenticated
  with check ((select private.is_staff()));
create policy "Staff update quiz questions"
  on public.quiz_questions for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete quiz questions"
  on public.quiz_questions for delete to authenticated
  using ((select private.is_staff()));

create policy "Anyone reads options of visible questions"
  on public.quiz_options for select to anon, authenticated
  using (exists (select 1 from public.quiz_questions q where q.id = question_id));
create policy "Staff insert quiz options"
  on public.quiz_options for insert to authenticated
  with check ((select private.is_staff()));
create policy "Staff update quiz options"
  on public.quiz_options for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete quiz options"
  on public.quiz_options for delete to authenticated
  using ((select private.is_staff()));

-- Counts are written only by record_quiz_answer (service role); staff may read them. The log has
-- no policy at all.
create policy "Staff read quiz answer counts"
  on public.quiz_option_counts for select to authenticated
  using ((select private.is_staff()));

-- Functions --------------------------------------------------------------------------------------

-- Saves a whole quiz in one transaction: the quiz, its questions and options (kept by id, so answer
-- counts survive edits), deleting what the editor removed. Runs with the caller's rights.
create function public.save_quiz(quiz jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  saved_quiz uuid := (quiz ->> 'id')::uuid;
  question jsonb;
  saved_question uuid;
  choice jsonb;
begin
  insert into public.quizzes as z (id, title, description, order_mode, is_active)
  values (
    saved_quiz,
    quiz ->> 'title',
    coalesce(quiz ->> 'description', ''),
    quiz ->> 'order_mode',
    (quiz ->> 'is_active')::boolean
  )
  on conflict (id) do update
  set title = excluded.title,
    description = excluded.description,
    order_mode = excluded.order_mode,
    is_active = excluded.is_active;

  delete from public.quiz_questions q
  where q.quiz_id = saved_quiz
    and q.id not in (
      select (value ->> 'id')::uuid from jsonb_array_elements(quiz -> 'questions')
    );

  for question in select value from jsonb_array_elements(quiz -> 'questions') loop
    saved_question := (question ->> 'id')::uuid;
    insert into public.quiz_questions as q
      (id, quiz_id, sort_order, text, image_path, image_alt, explanation)
    values (
      saved_question,
      saved_quiz,
      (question ->> 'sort_order')::integer,
      question ->> 'text',
      question ->> 'image_path',
      question ->> 'image_alt',
      coalesce(question ->> 'explanation', '')
    )
    on conflict (id) do update
    set sort_order = excluded.sort_order,
      text = excluded.text,
      image_path = excluded.image_path,
      image_alt = excluded.image_alt,
      explanation = excluded.explanation
    -- An id that belongs to another quiz is not taken over.
    where q.quiz_id = excluded.quiz_id;
    if not found then
      raise exception 'Question % belongs to another quiz', saved_question;
    end if;

    delete from public.quiz_options o
    where o.question_id = saved_question
      and o.id not in (
        select (value ->> 'id')::uuid from jsonb_array_elements(question -> 'options')
      );

    for choice in select value from jsonb_array_elements(question -> 'options') loop
      insert into public.quiz_options as o (id, question_id, sort_order, text, is_correct)
      values (
        (choice ->> 'id')::uuid,
        saved_question,
        (choice ->> 'sort_order')::integer,
        choice ->> 'text',
        (choice ->> 'is_correct')::boolean
      )
      on conflict (id) do update
      set sort_order = excluded.sort_order,
        text = excluded.text,
        is_correct = excluded.is_correct
      where o.question_id = excluded.question_id;
      if not found then
        raise exception 'Option % belongs to another question', choice ->> 'id';
      end if;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.save_quiz(jsonb) from public, anon;
grant execute on function public.save_quiz(jsonb) to authenticated;

-- "Used in N articles" in /admin/quizzes: articles whose text holds the quiz block.
create function public.quiz_article_counts()
returns table (quiz_id uuid, article_count bigint)
language sql
stable
set search_path = ''
as $$
  select z.id, count(a.id)
  from public.quizzes z
  left join public.articles a on a.body_html like '%data-quiz="' || z.id::text || '"%'
  group by z.id;
$$;

revoke execute on function public.quiz_article_counts() from public, anon;
grant execute on function public.quiz_article_counts() to authenticated;

-- Counts a reader's answer and returns the share of answers to that question that were correct
-- (0–100), or null for an option of an inactive or unknown quiz. Each address counts once per
-- question a day and at most 300 times an hour; past that the answer is not counted, but the
-- share is still returned. Only the server (service role) may call it.
create function public.record_quiz_answer(option_id uuid, ip_hash text)
returns integer
language plpgsql
set search_path = ''
as $$
-- Unqualified names are columns; the parameters are always written record_quiz_answer.x.
#variable_conflict use_column
declare
  question uuid;
begin
  select o.question_id into question
  from public.quiz_options o
  join public.quiz_questions q on q.id = o.question_id
  join public.quizzes z on z.id = q.quiz_id
  where o.id = record_quiz_answer.option_id and z.is_active;
  if question is null then
    return null;
  end if;

  delete from public.quiz_answer_log where created_at < now() - interval '1 day';

  if not exists (
      select 1 from public.quiz_answer_log l
      where l.ip_hash = record_quiz_answer.ip_hash and l.question_id = question
    )
    and (
      select count(*) from public.quiz_answer_log l
      where l.ip_hash = record_quiz_answer.ip_hash and l.created_at > now() - interval '1 hour'
    ) < 300
  then
    insert into public.quiz_answer_log (ip_hash, question_id)
    values (record_quiz_answer.ip_hash, question);
    insert into public.quiz_option_counts as c (option_id, answers)
    values (record_quiz_answer.option_id, 1)
    on conflict (option_id) do update set answers = c.answers + 1;
  end if;

  return (
    select round(100.0 * sum(c.answers) filter (where o.is_correct) / nullif(sum(c.answers), 0))
    from public.quiz_options o
    join public.quiz_option_counts c on c.option_id = o.id
    where o.question_id = question
  );
end;
$$;

revoke execute on function public.record_quiz_answer(uuid, text) from public, anon, authenticated;
grant execute on function public.record_quiz_answer(uuid, text) to service_role;
