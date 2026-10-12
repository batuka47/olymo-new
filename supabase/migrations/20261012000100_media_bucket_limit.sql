-- The browser keeps uploads under 4.5 MB (src/lib/images/fit.ts); the bucket allows 10 MB so an
-- image that is still a little over (a very long infographic) uploads instead of failing.

update storage.buckets
set file_size_limit = 10485760
where id = 'media';
