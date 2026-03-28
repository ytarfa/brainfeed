-- ============================================================
-- Brainfeed — Supabase Schema Migration
-- Run this in your Supabase SQL editor (project: brainfeed)
-- ============================================================

-- ----------------------
-- PROFILES
-- ----------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  avatar_url    text,
  onboarding_completed boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------
-- SPACES
-- ----------------------
create table if not exists public.spaces (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.profiles(id) on delete cascade,
  name                text not null,
  description         text,
  is_public           boolean not null default false,
  share_token         text unique,
  ai_auto_categorize  boolean not null default true,
  taste_profile       jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ----------------------
-- SPACE MEMBERS
-- ----------------------
create table if not exists public.space_members (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('editor', 'viewer')),
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique (space_id, user_id)
);

-- ----------------------
-- CATEGORIZATION RULES
-- ----------------------
create table if not exists public.categorization_rules (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces(id) on delete cascade,
  rule_type   text not null check (rule_type in ('domain', 'url_contains', 'source_type', 'keyword')),
  rule_value  text not null,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- ----------------------
-- BOOKMARKS
-- ----------------------
create table if not exists public.bookmarks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  url                 text,
  title               text,
  description         text,
  content_type        text not null check (content_type in ('link', 'note', 'image', 'pdf', 'file')),
  source_type         text check (source_type in ('github', 'youtube', 'twitter', 'article', 'amazon', 'academic', 'instagram', 'reddit', 'generic', 'manual')),
  enrichment_status   text not null default 'pending' check (enrichment_status in ('pending', 'processing', 'completed', 'failed')),
  enriched_data       jsonb,
  thumbnail_url       text,
  notes               text,
  tags                text[] not null default '{}',
  raw_content         text,
  file_path           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Full-text search index
create index if not exists bookmarks_fts_idx on public.bookmarks
  using gin (to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(raw_content, '') || ' ' ||
    coalesce(notes, '')
  ));

-- Tags index
create index if not exists bookmarks_tags_idx on public.bookmarks using gin (tags);

-- ----------------------
-- BOOKMARK SPACES (many-to-many)
-- ----------------------
create table if not exists public.bookmark_spaces (
  id          uuid primary key default gen_random_uuid(),
  bookmark_id uuid not null references public.bookmarks(id) on delete cascade,
  space_id    uuid not null references public.spaces(id) on delete cascade,
  added_by    text not null check (added_by in ('user', 'ai_auto', 'ai_suggestion', 'sync')),
  confidence  real,
  created_at  timestamptz not null default now(),
  unique (bookmark_id, space_id)
);

-- ----------------------
-- ACTIVITY LOG
-- ----------------------
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces(id) on delete cascade,
  bookmark_id uuid not null references public.bookmarks(id) on delete cascade,
  user_id     uuid references public.profiles(id),
  action      text not null check (action in ('auto_categorized', 'suggestion_accepted', 'suggestion_rejected', 'manually_moved', 'correction')),
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- ----------------------
-- SYNC SOURCES
-- ----------------------
create table if not exists public.sync_sources (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  space_id        uuid not null references public.spaces(id) on delete cascade,
  platform        text not null check (platform in ('youtube', 'spotify', 'rss', 'reddit')),
  external_id     text not null,
  external_name   text,
  sync_frequency  text not null check (sync_frequency in ('15min', '1h', '6h', 'daily')),
  last_synced_at  timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.categorization_rules enable row level security;
alter table public.bookmarks enable row level security;
alter table public.bookmark_spaces enable row level security;
alter table public.activity_log enable row level security;
alter table public.sync_sources enable row level security;

-- PROFILES
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- SPACES
create policy "Owner full access to spaces" on public.spaces
  for all using (auth.uid() = owner_id);
create policy "Members can view spaces" on public.spaces
  for select using (
    exists (
      select 1 from public.space_members
      where space_id = spaces.id and user_id = auth.uid()
    )
  );

-- SPACE MEMBERS
create policy "Owner can manage members" on public.space_members
  for all using (
    exists (
      select 1 from public.spaces
      where id = space_members.space_id and owner_id = auth.uid()
    )
  );
create policy "Members can view memberships" on public.space_members
  for select using (
    user_id = auth.uid() or
    exists (
      select 1 from public.spaces
      where id = space_members.space_id and owner_id = auth.uid()
    )
  );

-- CATEGORIZATION RULES
create policy "Owner and editors can manage rules" on public.categorization_rules
  for all using (
    exists (
      select 1 from public.spaces where id = categorization_rules.space_id and owner_id = auth.uid()
    ) or
    exists (
      select 1 from public.space_members
      where space_id = categorization_rules.space_id and user_id = auth.uid() and role = 'editor'
    )
  );
create policy "Viewers can read rules" on public.categorization_rules
  for select using (
    exists (
      select 1 from public.space_members
      where space_id = categorization_rules.space_id and user_id = auth.uid() and role = 'viewer'
    )
  );

-- BOOKMARKS
create policy "Users can CRUD own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id);
create policy "Space members can view bookmarks" on public.bookmarks
  for select using (
    exists (
      select 1 from public.bookmark_spaces bs
      join public.space_members sm on sm.space_id = bs.space_id
      where bs.bookmark_id = bookmarks.id and sm.user_id = auth.uid()
    )
  );

-- BOOKMARK SPACES
create policy "Bookmark owner can manage bookmark_spaces" on public.bookmark_spaces
  for all using (
    exists (
      select 1 from public.bookmarks
      where id = bookmark_spaces.bookmark_id and user_id = auth.uid()
    )
  );
create policy "Space editors can manage bookmark_spaces" on public.bookmark_spaces
  for insert with check (
    exists (
      select 1 from public.space_members
      where space_id = bookmark_spaces.space_id and user_id = auth.uid() and role = 'editor'
    )
  );
create policy "Space editors can delete bookmark_spaces" on public.bookmark_spaces
  for delete using (
    exists (
      select 1 from public.space_members
      where space_id = bookmark_spaces.space_id and user_id = auth.uid() and role = 'editor'
    )
  );

-- ACTIVITY LOG
create policy "Space members can view activity" on public.activity_log
  for select using (
    exists (
      select 1 from public.spaces where id = activity_log.space_id and owner_id = auth.uid()
    ) or
    exists (
      select 1 from public.space_members
      where space_id = activity_log.space_id and user_id = auth.uid()
    )
  );

-- SYNC SOURCES
create policy "Users can CRUD own sync sources" on public.sync_sources
  for all using (auth.uid() = user_id);

-- ============================================================
-- STORAGE — user-uploads bucket
-- Run these after creating the bucket in the Storage UI
-- ============================================================

-- Create the bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload to own folder" on storage.objects
  for insert with check (
    bucket_id = 'user-uploads' and
    (storage.foldername(name))[1] = 'user-uploads' and
    (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users can read own uploads" on storage.objects
  for select using (
    bucket_id = 'user-uploads' and
    (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users can delete own uploads" on storage.objects
  for delete using (
    bucket_id = 'user-uploads' and
    (storage.foldername(name))[2] = auth.uid()::text
  );
