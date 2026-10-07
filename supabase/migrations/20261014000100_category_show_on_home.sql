-- "Нүүрэнд харуулах": categories whose newest article gets a tile in the home page's "Салбар
-- бүрээс" section. At most four are ticked (the form and its server action keep to that); with none
-- ticked the section picks categories itself (see src/lib/categories/home.ts).

alter table public.categories
  add column show_on_home boolean not null default false;
