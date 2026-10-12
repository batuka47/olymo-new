-- Removes the local sample content from a database it should not be in. Not a migration: run it
-- by hand in the hosted project's SQL editor at launch, if samples or test rows were ever loaded
-- there (supabase/seed.sql is local only, but `db push --include-seed` would send it).
-- It deletes only rows that are still marked as samples: titles starting with [ЖИШЭЭ], team
-- members whose name is still a "[Нэр]" placeholder, and the three sample tags once unused.

begin;

-- Their tags, comments and views go with them (on delete cascade).
delete from public.articles where title like '[ЖИШЭЭ]%';
delete from public.events where title like '[ЖИШЭЭ]%';
delete from public.ads where title like '[ЖИШЭЭ]%';
delete from public.team_members where name like '[%]';

delete from public.tags
where slug in ('esh', 'scholarship', 'math')
  and not exists (select 1 from public.article_tags where article_tags.tag_slug = tags.slug);

commit;
