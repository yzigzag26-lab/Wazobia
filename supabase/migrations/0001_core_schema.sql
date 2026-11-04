-- =============================================================================
-- WAZOBIA — core schema (0001)
-- =============================================================================
-- Scope rule: every table here is required by an endpoint that
-- `docs/api/api-contract.md` already documents and the frontend is already built
-- against. Nothing is added "for later". Endpoints contracted but not yet built
-- (§2.8 speech/community/research) get no tables until their consent and privacy
-- model exists — inventing storage for data we have no policy to protect is
-- worse than having no storage.
--
-- Contract sections served by this migration:
--   §2.1 GET  /languages            -> languages, dialects
--   §2.2 GET  /users/me             -> profiles, user_roles
--   §2.3 POST /ai/chat              -> conversations, conversation_messages
--   §2.5 GET  /dictionary/search    -> dictionary_entries
--   §2.6 GET  /courses, /lessons/:id, POST /progress
--                                   -> courses, lessons, lesson_sentences,
--                                      lesson_progress
--
-- Security model (blueprint §3, §10.6):
--   * RLS is enabled on EVERY table. There is no table visible to the anon or
--     authenticated role without a policy.
--   * Public read is granted only to content that is meant to be public:
--     enabled languages, enabled dialects, courses, lessons and APPROVED
--     dictionary entries.
--   * A client can never write reference content. `user_roles` is not
--     client-writable at all — authorization is decided server-side, because
--     hiding a control in the UI is not access control.
--   * Users can only ever touch their own profile, conversations and progress.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
-- `unaccent` + `pg_trgm` exist so dictionary search can be tolerant of tone
-- marks and alternate orthography (blueprint §9.7) without normalising the
-- STORED headword, which must keep its canonical spelling.
create extension if not exists "unaccent" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

-- NOTE ON PRIVILEGES: the `grant` statements at the bottom of this file are NOT
-- sufficient on their own. Supabase grants ALL on new `public` tables to anon
-- and authenticated via ALTER DEFAULT PRIVILEGES, so every table below is born
-- world-writable and an explicit `grant select` only ADDS to that. Migration
-- 0002_security_hardening.sql revokes the inherited privileges and re-grants
-- exactly what each role needs. Always apply 0002; never apply 0001 alone.

-- -----------------------------------------------------------------------------
-- Tone-mark-tolerant folding
-- -----------------------------------------------------------------------------
-- `unaccent()` is only STABLE because it reads a dictionary table at runtime,
-- which disqualifies it from generated columns and expression indexes. The
-- dictionary is fixed for the life of the database, so wrapping it in an
-- IMMUTABLE function is safe and is the standard Postgres workaround.
--
-- What this achieves for Yorùbá, which is the hard case:
--   ẹ ọ ṣ are distinct LETTERS, not accented e/o/s, but a learner who types
--   "ekaaro" on a phone keyboard must still find "ẹ káàrọ̀". Folding maps
--   ẹ→e, ọ→o, ṣ→s and drops the tone marks, producing a search key. The stored
--   headword is never modified, so display keeps full orthography.
create or replace function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, extensions
as $$
  select extensions.unaccent(input);
$$;

create or replace function public.wazobia_fold(input text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, extensions
as $$
  -- Fold diacritics (including the dot-below letters ẹ ọ ṣ ị ụ), lowercase,
  -- and reduce everything that is not a letter or digit to nothing, so that
  -- "ẹ káàrọ̀", "e kaaro" and "ekaaro" all collapse to "ekaaro".
  select regexp_replace(
           lower(public.immutable_unaccent(input)),
           '[^a-z0-9]',
           '',
           'g'
         );
$$;

comment on function public.wazobia_fold(text) is
  'Search-only folding (tone marks, dot-below letters, punctuation). Never applied to stored or displayed text.';

-- -----------------------------------------------------------------------------
-- Languages (§2.1)
-- -----------------------------------------------------------------------------
create table if not exists public.languages (
  -- ISO 639-1. The frontend uses this directly in URLs and `lang` attributes.
  code          text primary key check (code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  -- Endonym in FULL orthography. "Yorùbá", never "Yoruba": tone marks are
  -- data, not presentation, and the frontend refuses to repair them.
  native_name   text not null check (length(trim(native_name)) > 0),
  english_name  text not null check (length(trim(english_name)) > 0),
  role          text not null check (role in ('target', 'bridge')),
  direction     text not null default 'ltr' check (direction in ('ltr', 'rtl')),
  enabled       boolean not null default true,
  -- Stable display order, so the UI never depends on insertion order.
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

comment on column public.languages.native_name is
  'Endonym with full orthography (e.g. Yorùbá). Read verbatim by the frontend; never normalised.';

-- -----------------------------------------------------------------------------
-- Dialects (§2.1 `dialect_count`)
-- -----------------------------------------------------------------------------
create table if not exists public.dialects (
  id             uuid primary key default gen_random_uuid(),
  language_code  text not null references public.languages (code) on delete cascade,
  name           text not null check (length(trim(name)) > 0),
  native_name    text,
  enabled        boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists dialects_language_idx on public.dialects (language_code);

-- -----------------------------------------------------------------------------
-- Profiles (§2.2)
-- -----------------------------------------------------------------------------
-- One row per Supabase auth user. `id` IS the auth user id, so a profile can
-- never be orphaned or point at somebody else's account.
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  display_name        text not null default '' check (length(display_name) <= 80),
  preferred_language  text references public.languages (code),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Roles (§2.2 `roles[]`)
-- -----------------------------------------------------------------------------
-- A separate table rather than a column on `profiles`, because a role is a
-- grant with provenance. Note there is deliberately NO insert/update/delete
-- policy: the only way to change a role is the service-role key, server-side.
create table if not exists public.user_roles (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        text not null check (role in ('learner', 'contributor', 'reviewer', 'admin')),
  granted_at  timestamptz not null default now(),
  granted_by  uuid references public.profiles (id) on delete set null,
  primary key (user_id, role)
);

-- Every new auth user gets a profile and the baseline `learner` role, so the
-- application never has to handle a signed-in user with no profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'learner')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Courses, lessons, sentences (§2.6)
-- -----------------------------------------------------------------------------
create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title         text not null check (length(trim(title)) > 0),
  language_code text not null references public.languages (code),
  level         text not null check (level in ('beginner', 'intermediate', 'advanced')),
  description   text,
  sort_order    integer not null default 0,
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists courses_language_idx on public.courses (language_code);

create table if not exists public.lessons (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses (id) on delete cascade,
  slug          text not null check (slug ~ '^[a-z0-9-]+$'),
  title         text not null check (length(trim(title)) > 0),
  summary       text,
  sort_order    integer not null default 0,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (course_id, slug)
);

create index if not exists lessons_course_idx on public.lessons (course_id);

create table if not exists public.lesson_sentences (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons (id) on delete cascade,
  position    integer not null,
  text        text not null check (length(trim(text)) > 0),
  translation text not null default '',
  -- NULLABLE ON PURPOSE (contract §2.6). Word-level highlighting is only
  -- offered when a provider supplies reliable alignment; when it cannot, this
  -- stays null and the UI falls back rather than faking synchronisation.
  start_ms    integer check (start_ms is null or start_ms >= 0),
  unique (lesson_id, position)
);

create index if not exists lesson_sentences_lesson_idx on public.lesson_sentences (lesson_id, position);

-- -----------------------------------------------------------------------------
-- Lesson progress (§2.6 POST /progress — idempotent per learner + lesson)
-- -----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  lesson_id     uuid not null references public.lessons (id) on delete cascade,
  status        text not null default 'in_progress'
                  check (status in ('in_progress', 'completed')),
  -- Monotonic: progress never moves backwards on replay.
  percent       integer not null default 0 check (percent between 0 and 100),
  started_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  completed_at  timestamptz,
  primary key (user_id, lesson_id)
);

-- -----------------------------------------------------------------------------
-- Dictionary (§2.5)
-- -----------------------------------------------------------------------------
create table if not exists public.dictionary_entries (
  id             uuid primary key default gen_random_uuid(),
  -- Canonical spelling, preserved exactly. The frontend will not repair it.
  headword       text not null check (length(trim(headword)) > 0),
  language_code  text not null references public.languages (code),
  part_of_speech text,
  gloss          text,
  tone_pattern   text,
  -- Provenance is a first-class column, not a label bolted on in the UI.
  review_status  text not null default 'pending'
                   check (review_status in ('approved', 'pending', 'rejected')),
  reviewed_by    uuid references public.profiles (id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Derived search key. Generated, so it can never drift from the headword, and
-- the canonical text above is never mutated by a search.
alter table public.dictionary_entries
  add column if not exists search_key text
  generated always as (public.wazobia_fold(headword)) stored;

-- Trigram index supports both exact and tolerant matching on the folded key.
create index if not exists dictionary_entries_search_trgm_idx
  on public.dictionary_entries using gin (search_key extensions.gin_trgm_ops);

create index if not exists dictionary_entries_language_idx
  on public.dictionary_entries (language_code, review_status);

-- -----------------------------------------------------------------------------
-- Conversations (§2.3)
-- -----------------------------------------------------------------------------
create table if not exists public.conversations (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  language_code  text references public.languages (code),
  title          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists conversations_user_idx on public.conversations (user_id, updated_at desc);

create table if not exists public.conversation_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null check (length(content) <= 20000),
  -- Truthful provenance, persisted with the message so history cannot later be
  -- re-labelled. `ai_generated` must never be presented as verified.
  answer_type      text check (answer_type in ('ai_generated', 'reviewed_resource', 'mixed')),
  sources          jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists conversation_messages_conversation_idx
  on public.conversation_messages (conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- Public read surface for §2.1
-- -----------------------------------------------------------------------------
-- The endpoint needs `dialect_count`, and counting per row in application code
-- would be N+1. `security_invoker = true` means the caller's RLS on the
-- underlying tables still applies — the view is not a privilege escalation.
create or replace view public.languages_public
with (security_invoker = true)
as
select
  l.code,
  l.native_name,
  l.english_name,
  l.role,
  l.direction,
  l.enabled,
  coalesce(d.dialect_count, 0)::integer as dialect_count,
  l.sort_order
from public.languages l
left join (
  select language_code, count(*) as dialect_count
  from public.dialects
  where enabled
  group by language_code
) d on d.language_code = l.code
where l.enabled;

comment on view public.languages_public is
  'Enabled languages with their dialect count. Backs GET /api/v1/languages.';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.languages             enable row level security;
alter table public.dialects              enable row level security;
alter table public.profiles              enable row level security;
alter table public.user_roles            enable row level security;
alter table public.courses               enable row level security;
alter table public.lessons               enable row level security;
alter table public.lesson_sentences      enable row level security;
alter table public.lesson_progress       enable row level security;
alter table public.dictionary_entries    enable row level security;
alter table public.conversations         enable row level security;
alter table public.conversation_messages enable row level security;

-- --- Reference content: readable by anyone, writable by nobody ---------------
-- No INSERT/UPDATE/DELETE policy exists for these tables, so with RLS enabled
-- every client write is denied. Content is loaded by migration or by the
-- service role.

drop policy if exists languages_public_read on public.languages;
create policy languages_public_read on public.languages
  for select using (enabled);

drop policy if exists dialects_public_read on public.dialects;
create policy dialects_public_read on public.dialects
  for select using (
    enabled
    and exists (
      select 1 from public.languages l
      where l.code = dialects.language_code and l.enabled
    )
  );

drop policy if exists courses_public_read on public.courses;
create policy courses_public_read on public.courses
  for select using (published);

drop policy if exists lessons_public_read on public.lessons;
create policy lessons_public_read on public.lessons
  for select using (
    published
    and exists (
      select 1 from public.courses c
      where c.id = lessons.course_id and c.published
    )
  );

drop policy if exists lesson_sentences_public_read on public.lesson_sentences;
create policy lesson_sentences_public_read on public.lesson_sentences
  for select using (
    exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_sentences.lesson_id
        and l.published and c.published
    )
  );

-- Unreviewed dictionary content is not public. Only `approved` rows are, which
-- is what lets the UI label provenance honestly.
drop policy if exists dictionary_approved_read on public.dictionary_entries;
create policy dictionary_approved_read on public.dictionary_entries
  for select using (review_status = 'approved');

-- --- Own-data tables: the user and nobody else ------------------------------

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- No INSERT: profiles are created by the `handle_new_user` trigger only.
-- No DELETE: deleting the auth user cascades.

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles
  for select using (auth.uid() = user_id);

-- NO write policy of any kind. Role grants are service-role only.

drop policy if exists conversations_owner_all on public.conversations;
create policy conversations_owner_all on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists conversation_messages_owner_all on public.conversation_messages;
create policy conversation_messages_owner_all on public.conversation_messages
  for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists lesson_progress_owner_all on public.lesson_progress;
create policy lesson_progress_owner_all on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- PRIVILEGES
-- =============================================================================
-- RLS narrows what a role may see; it does not grant table access. The anon and
-- authenticated roles need SELECT to reach the policies above, and the own-data
-- tables additionally need write verbs.
grant usage on schema public to anon, authenticated;

grant select on public.languages, public.dialects, public.courses, public.lessons,
                public.lesson_sentences, public.dictionary_entries
  to anon, authenticated;

grant select on public.languages_public to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, preferred_language, updated_at) on public.profiles to authenticated;

grant select on public.user_roles to authenticated;

grant select, insert, update, delete on public.conversations, public.conversation_messages
  to authenticated;

grant select, insert, update, delete on public.lesson_progress to authenticated;

-- =============================================================================
-- SEED — the launch catalogue (blueprint §7, §9.2, §16.1)
-- =============================================================================
-- Native names carry full orthography. These four rows are what let the
-- frontend delete its hardcoded `src/config/languages.ts` list.
insert into public.languages (code, native_name, english_name, role, direction, enabled, sort_order)
values
  ('yo', 'Yorùbá',  'Yoruba',  'target', 'ltr', true, 10),
  ('ha', 'Hausa',   'Hausa',   'target', 'ltr', true, 20),
  ('ig', 'Igbo',    'Igbo',    'target', 'ltr', true, 30),
  ('en', 'English', 'English', 'bridge', 'ltr', true, 90)
on conflict (code) do update
  set native_name  = excluded.native_name,
      english_name = excluded.english_name,
      role         = excluded.role,
      direction    = excluded.direction,
      enabled      = excluded.enabled,
      sort_order   = excluded.sort_order;

-- =============================================================================
-- Integrity check: fail the migration if the seed lost its orthography
-- =============================================================================
-- The single most likely way to break the contract is a well-meaning "fix" that
-- strips the tone marks, or a client library that normalises on the way in.
-- `Yorùbá` must contain U+00F9 (ù). If it does not, abort loudly here rather
-- than ship a catalogue the frontend cannot use.
do $$
begin
  if not exists (
    select 1 from public.languages
    where code = 'yo' and native_name = 'Yorùbá'
  ) then
    raise exception
      'Seed integrity: languages.native_name for "yo" must carry full orthography (U+00F9 LATIN SMALL LETTER U WITH GRAVE).';
  end if;
end $$;
