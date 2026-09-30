-- Public "media" bucket for article, event and ad images. Anyone can view files through their
-- public URL; only staff can list, upload, replace or delete them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Staff list media"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.is_staff()));

create policy "Staff upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_staff()));

create policy "Staff replace media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_staff()))
  with check (bucket_id = 'media' and (select public.is_staff()));

create policy "Staff delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_staff()));
