-- Quizzes: exactly one correct option per question, RLS (staff write, public reads active quizzes),
-- save_quiz, record_quiz_answer and the usage counts. Run with `npm run db:test`; rolled back.
begin;

create extension if not exists pgtap with schema extensions;
select plan(27);


insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-quiz-editor@test.local', now(), now()),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pgtap-quiz-reader@test.local', now(), now());
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-0000000000f1';

-- A quiz as the editor's form sends it: q1 has options a1 (correct), a2; q2 has b1, b2 (correct).
create function pg_temp.quiz(active boolean, q1_correct text, q2_correct text) returns jsonb
language sql as $$
  select jsonb_build_object(
    'id', '00000000-0000-0000-0000-00000000a000', 'title', 'Туршилтын quiz', 'description', '',
    'order_mode', 'fixed', 'is_active', active,
    'questions', jsonb_build_array(
      jsonb_build_object('id', '00000000-0000-0000-0000-00000000a100', 'sort_order', 1,
        'text', 'Нэг дүгээр асуулт', 'image_path', null, 'image_alt', null, 'explanation', 'Тайлбар',
        'options', jsonb_build_array(
          jsonb_build_object('id', '00000000-0000-0000-0000-00000000a101', 'sort_order', 1, 'text', 'А', 'is_correct', q1_correct in ('a1', 'both')),
          jsonb_build_object('id', '00000000-0000-0000-0000-00000000a102', 'sort_order', 2, 'text', 'Б', 'is_correct', q1_correct in ('a2', 'both')))),
      jsonb_build_object('id', '00000000-0000-0000-0000-00000000a200', 'sort_order', 2,
        'text', 'Хоёр дахь асуулт', 'image_path', null, 'image_alt', null, 'explanation', '',
        'options', jsonb_build_array(
          jsonb_build_object('id', '00000000-0000-0000-0000-00000000a201', 'sort_order', 1, 'text', 'В', 'is_correct', q2_correct = 'b1'),
          jsonb_build_object('id', '00000000-0000-0000-0000-00000000a202', 'sort_order', 2, 'text', 'Г', 'is_correct', q2_correct = 'b2')))));
$$;

-- The one-correct check runs at commit; these run it right after the change (setting the
-- constraints to immediate checks what is pending), inside the test's own savepoint.
create function pg_temp.checked(statement text) returns void
language plpgsql as $$
begin
  execute statement;
  set constraints all immediate;
  set constraints all deferred;
end;
$$;

create function pg_temp.save(active boolean, q1_correct text, q2_correct text) returns void
language plpgsql as $$
begin
  perform public.save_quiz(pg_temp.quiz(active, q1_correct, q2_correct));
  set constraints all immediate;
  set constraints all deferred;
end;
$$;

-- Exactly one correct option ---------------------------------------------------------------------
select lives_ok($$select pg_temp.save(true, 'a1', 'b2')$$, 'a quiz with one correct option per question saves');
select ok(
  (select count(*) from public.quiz_questions where quiz_id = '00000000-0000-0000-0000-00000000a000') = 2
    and (select count(*) from public.quiz_options where is_correct) >= 2,
  'its questions and options are stored'
);
select throws_ok($$select pg_temp.save(true, 'both', 'b2')$$, '23514', null, 'two correct options are refused');
select throws_ok($$select pg_temp.save(true, 'none', 'b2')$$, '23514', null, 'no correct option is refused');
select throws_ok(
  $$select pg_temp.checked('update public.quiz_options set is_correct = true where id = ''00000000-0000-0000-0000-00000000a102''')$$,
  '23514', null, 'marking a second option correct directly is refused'
);
select throws_ok(
  $$select pg_temp.checked('insert into public.quiz_questions (quiz_id, text) values (''00000000-0000-0000-0000-00000000a000'', ''Хариултгүй'')')$$,
  '23514', null, 'a question without a correct option is refused'
);
select lives_ok($$select pg_temp.save(true, 'a2', 'b2')$$, 'the correct option can move to another one');
select ok(
  (select is_correct from public.quiz_options where id = '00000000-0000-0000-0000-00000000a102'),
  'the moved answer is saved'
);

-- Answers ----------------------------------------------------------------------------------------
set local role service_role;
select is(public.record_quiz_answer('00000000-0000-0000-0000-00000000a102', 'ip-1'), 100, 'a correct first answer: 100% correct');
select is(public.record_quiz_answer('00000000-0000-0000-0000-00000000a101', 'ip-2'), 50, 'a wrong second answer: 50%');
select is(public.record_quiz_answer('00000000-0000-0000-0000-00000000a101', 'ip-1'), 50, 'the same address answering again is not counted');
select ok(
  (select sum(answers) from public.quiz_option_counts) = 2,
  'two answers are counted'
);
reset role;
select lives_ok($$select pg_temp.save(true, 'a2', 'b2')$$, 'saving the quiz again');
select ok((select sum(answers) from public.quiz_option_counts) = 2, 'keeps the answer counts (options keep their ids)');

-- The public: active quizzes only, nothing written --------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select ok((select count(*) from public.quizzes) = 1, 'anon: reads an active quiz');
select ok((select count(*) from public.quiz_options) = 4, 'anon: reads its options (with the correct one, for instant feedback)');
select ok((select count(*) from public.quiz_option_counts) = 0, 'anon: cannot read answer counts');
select throws_ok($$select public.record_quiz_answer('00000000-0000-0000-0000-00000000a101', 'x')$$, '42501', null, 'anon: cannot count answers directly');
select throws_ok($$select pg_temp.save(true, 'a1', 'b2')$$, '42501', null, 'anon: cannot save quizzes');
reset role;

update public.quizzes set is_active = false where id = '00000000-0000-0000-0000-00000000a000';
set local role anon;
select ok((select count(*) from public.quizzes) = 0 and (select count(*) from public.quiz_questions) = 0, 'anon: an inactive quiz and its questions are hidden');
reset role;
set local role service_role;
select is(public.record_quiz_answer('00000000-0000-0000-0000-00000000a101', 'ip-3'), null, 'answers to an inactive quiz are not counted');
reset role;

-- Staff write, readers do not ----------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated"}', true);
select throws_ok($$select pg_temp.save(true, 'a1', 'b2')$$, '42501', null, 'reader: cannot save quizzes');
select ok((select count(*) from public.quizzes) = 0, 'reader: does not see the inactive quiz');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}', true);
select lives_ok($$select pg_temp.save(true, 'a1', 'b1')$$, 'editor: saves quizzes');
insert into public.articles (slug, title, category_slug, body_html)
values ('quiz-article', 'Quiz', 'education', '<figure class="quiz" data-quiz="00000000-0000-0000-0000-00000000a000"></figure>');
select is(
  (select article_count from public.quiz_article_counts() where quiz_id = '00000000-0000-0000-0000-00000000a000'),
  1::bigint, 'editor: sees how many articles use the quiz'
);
delete from public.quizzes where id = '00000000-0000-0000-0000-00000000a000';
select ok(not exists (select 1 from public.quiz_options), 'editor: deleting a quiz deletes its questions and options');
reset role;
select ok(not exists (select 1 from public.quiz_option_counts), 'and their answer counts');

select * from finish();
rollback;
