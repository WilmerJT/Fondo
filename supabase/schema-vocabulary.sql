create table if not exists public.vocabulary (
  id text primary key,
  category text not null,
  source_text text not null,
  target_text text not null,
  part_of_speech text default 'noun',
  image_url text default '',
  audio_url text default '',
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_vocabulary_category
  on public.vocabulary (category);

create index if not exists idx_vocabulary_status
  on public.vocabulary (status);

create index if not exists idx_vocabulary_source_text
  on public.vocabulary (source_text);

create trigger set_vocabulary_updated_at
before update on public.vocabulary
for each row
execute procedure moddatetime(updated_at);
