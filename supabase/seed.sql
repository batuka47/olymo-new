-- Local sample content. Runs on `supabase db reset`; never push it to the hosted project.
-- Every title starts with [ЖИШЭЭ] so sample rows are easy to spot and delete.
-- Dates are relative to now() so the samples stay "current" after every reset.

insert into public.tags (slug, label) values
  ('esh', 'ЭЕШ'),
  ('scholarship', 'Тэтгэлэг'),
  ('math', 'Математик');

insert into public.articles (
  slug, title, excerpt, body_json, body_html, category_slug, cover_alt, author_name,
  status, publish_at, is_featured, is_good_to_know, is_breaking,
  subject, level_text, registration_deadline, exam_date, audience, location, fee_text, organizer,
  registration_url
) values
(
  'matematikiin-ulsyn-olimpiadyn-burtgel',
  '[ЖИШЭЭ] Математикийн улсын олимпиадын бүртгэл эхэллээ: шалгуур, хуваарь',
  'I шатны бүртгэл 10 сарын 20 хүртэл үргэлжилнэ. Оролцох шалгуур, шалгалтын хуваарь, бүртгүүлэх заавар.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"[ЖИШЭЭ] Математикийн улсын олимпиадын I шатны бүртгэл эхэллээ."}]},{"type":"paragraph","content":[{"type":"text","text":"ЕБС-ийн 6–12-р ангийн сурагчид сургуулиараа дамжуулан бүртгүүлнэ."}]}]}',
  '<p>[ЖИШЭЭ] Математикийн улсын олимпиадын I шатны бүртгэл эхэллээ.</p><p>ЕБС-ийн 6–12-р ангийн сурагчид сургуулиараа дамжуулан бүртгүүлнэ.</p>',
  'olympiad', 'Олимпиадад оролцож буй сурагчид', 'Редакц',
  'published', now() - interval '1 day', true, false, true,
  'math', 'ЕБС 6–12', current_date + 5, current_date + 21, 'ЕБС-ийн сурагчид', 'Аймаг, дүүргийн төв сургуулиуд',
  'Үнэгүй', 'Боловсролын яам', 'https://example.com/olympiad'
),
(
  'esh-2027-shalgaltyn-huvaar',
  '[ЖИШЭЭ] ЭЕШ 2027: шалгалтын хуваарь болон бүртгэлийн журам',
  'Элсэлтийн ерөнхий шалгалтын бүртгэл, хуваарь, шинэчлэгдсэн журмын гол өөрчлөлтүүд.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"[ЖИШЭЭ] ЭЕШ 2027-ийн бүртгэлийн журам батлагдлаа."}]}]}',
  '<p>[ЖИШЭЭ] ЭЕШ 2027-ийн бүртгэлийн журам батлагдлаа.</p>',
  'education', 'Шалгалт өгч буй сурагчид', 'Редакц',
  'published', now() - interval '2 days', true, true, true,
  null, null, null, null, null, null, null, null, null
),
(
  'bakalavryn-tetgelegt-hotolboruud',
  '[ЖИШЭЭ] Бакалаврын тэтгэлэгт хөтөлбөрүүд: хугацаа, шаардлага',
  'Гадаадын их сургуулиудын бүрэн болон хагас тэтгэлэгт хөтөлбөрүүдийн өргөдөл хүлээн авах хугацаа.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"[ЖИШЭЭ] Энэ жилийн тэтгэлэгт хөтөлбөрүүдийн жагсаалт."}]}]}',
  '<p>[ЖИШЭЭ] Энэ жилийн тэтгэлэгт хөтөлбөрүүдийн жагсаалт.</p>',
  'world', 'Их сургуулийн кампус', 'Редакц',
  'published', now() - interval '3 days', true, true, false,
  null, null, null, null, null, null, null, null, null
),
(
  'surguuli-hoorondyn-sagsan-bombog',
  '[ЖИШЭЭ] Сургууль хоорондын сагсан бөмбөгийн аварга шалгаруулах тэмцээн',
  'Нийслэлийн ЕБС-иудын сагсан бөмбөгийн тэмцээнд 40 гаруй баг оролцоно.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"[ЖИШЭЭ] Тэмцээн ирэх долоо хоногт эхэлнэ."}]}]}',
  '<p>[ЖИШЭЭ] Тэмцээн ирэх долоо хоногт эхэлнэ.</p>',
  'sports', 'Сагсан бөмбөг тоглож буй сурагчид', 'Редакц',
  'published', now() - interval '4 days', false, false, false,
  null, null, null, null, null, null, null, null, null
),
(
  'hiimel-oyuny-hakaton-burtgel',
  '[ЖИШЭЭ] Хиймэл оюуны хакатон: оюутны багууд бүртгүүлж эхэллээ',
  '48 цагийн хакатонд 3–5 хүний бүрэлдэхүүнтэй оюутны багууд оролцоно.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"[ЖИШЭЭ] Хакатоны бүртгэл нээгдлээ."}]}]}',
  '<p>[ЖИШЭЭ] Хакатоны бүртгэл нээгдлээ.</p>',
  'technology', 'Хакатонд оролцож буй баг', 'Редакц',
  'published', now() - interval '5 days', true, false, false,
  null, null, null, null, null, null, null, null, null
),
(
  'zaluu-sudlaachdyn-hural',
  '[ЖИШЭЭ] Залуу судлаачдын эрдэм шинжилгээний хурлын илтгэл хүлээн авна',
  'Бакалавр, магистрын оюутнуудын судалгааны илтгэлийг сарын эцэс хүртэл хүлээн авна.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"[ЖИШЭЭ] Илтгэлийн хураангуйг цахимаар илгээнэ."}]}]}',
  '<p>[ЖИШЭЭ] Илтгэлийн хураангуйг цахимаар илгээнэ.</p>',
  'science', 'Илтгэл тавьж буй оюутан', 'Редакц',
  'published', now() - interval '6 days', false, true, false,
  null, null, null, null, null, null, null, null, null
);

insert into public.article_tags (article_id, tag_slug)
select id, 'math' from public.articles where slug = 'matematikiin-ulsyn-olimpiadyn-burtgel'
union all
select id, 'esh' from public.articles where slug = 'esh-2027-shalgaltyn-huvaar'
union all
select id, 'scholarship' from public.articles where slug = 'bakalavryn-tetgelegt-hotolboruud';

insert into public.events (
  slug, title, excerpt, body_json, body_html, event_type, organizer, starts_at, ends_at,
  location, price_text, contact_phone, registration_url, is_featured, status, publish_at
) values
(
  'zaluu-sudlaachdyn-forum',
  '[ЖИШЭЭ] Залуу судлаачдын форум',
  'Залуу судлаачид судалгааныхаа үр дүнг танилцуулж, туршлага солилцоно.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"[ЖИШЭЭ] Форумын хөтөлбөр удахгүй зарлагдана."}]}]}',
  '<p>[ЖИШЭЭ] Форумын хөтөлбөр удахгүй зарлагдана.</p>',
  'conference', 'МУИС', now() + interval '12 days', now() + interval '12 days 6 hours',
  'МУИС, II байр', 'Үнэгүй', '[УТАС]', 'https://example.com/forum', false,
  'published', now() - interval '1 day'
),
(
  'ai-hakaton-48-tsag',
  '[ЖИШЭЭ] AI хакатон — 48 цаг',
  'Хиймэл оюуны шийдэл бүтээх 48 цагийн оюутны хакатон.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"[ЖИШЭЭ] Багийн бүртгэл нээлттэй."}]}]}',
  '<p>[ЖИШЭЭ] Багийн бүртгэл нээлттэй.</p>',
  'hackathon', '[ЗОХИОН БАЙГУУЛАГЧ]', now() + interval '19 days', now() + interval '21 days',
  '[БАЙРШИЛ]', '[ҮНЭ]', '[УТАС]', 'https://example.com/hackathon', true,
  'published', now() - interval '2 days'
);

-- Off: its image file does not exist, and the site would show it broken. Replace the image in
-- /admin/ads (or add a new ad there) to see ads locally.
insert into public.ads (title, image_path, link_url, placement, starts_at, ends_at, is_active)
values (
  '[ЖИШЭЭ] Нүүр хуудасны баннер',
  'samples/ad-home-1.webp',
  'https://example.com',
  'home_1',
  now() - interval '1 day',
  now() + interval '30 days',
  false
);

-- Info pages ----------------------------------------------------------------------------------
-- Their text comes from migration 20261007000100_info_page_content.sql. The team is local only:
-- four placeholders to fill in /admin/pages; the site hides "[...]" names.
insert into public.team_members (name, role, sort_order) values
  ('[Нэр]', '[Албан тушаал]', 0),
  ('[Нэр]', '[Албан тушаал]', 1),
  ('[Нэр]', '[Албан тушаал]', 2),
  ('[Нэр]', '[Албан тушаал]', 3);
