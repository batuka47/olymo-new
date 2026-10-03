-- Event types become a fixed list of keys, like olympiad subjects; the labels (Хурал, Хакатон, …)
-- live in messages/mn.json. Free text written so far is mapped onto the list.

update public.events
set event_type = case event_type
  when 'Хурал' then 'conference'
  when 'Хакатон' then 'hackathon'
  when 'Үзэсгэлэн' then 'exhibition'
  when 'Сургалт' then 'training'
  when 'Тэмцээн' then 'competition'
  else 'other'
end;

alter table public.events
  alter column event_type set default 'other',
  alter column event_type set not null,
  add constraint events_event_type_check check (
    event_type in ('conference', 'hackathon', 'exhibition', 'training', 'competition', 'other')
  );
