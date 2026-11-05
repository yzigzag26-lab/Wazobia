-- =============================================================================
-- 0006 — Profile username, and a save path that actually persists
-- =============================================================================
-- Why this exists
-- ---------------
-- The profile page showed "No username set" and "No email set" for a signed-in
-- user whose account plainly has both. Two causes, both in the database layer:
--
--   1. `profiles` had no `username` column. The registration form collected a
--      username, validated it, and then discarded it — the sign-up form said so
--      in a comment. Nothing could ever read it back, so the field was
--      decorative.
--
--   2. `authenticated` held only SELECT on `profiles` until 0004 granted
--      UPDATE on the columns it needs. So the page could read a name but never
--      save one, regardless of what the form claimed.
--
-- This migration adds the missing column, backfills it from the value captured
-- at sign-up, keeps it in sync for new signups, and documents the save path.
--
-- What is NOT added
-- -----------------
-- An email column. The address lives in `auth.users.email` and is already
-- returned by `/users/me` from the verified token. Copying it into `profiles`
-- would create a second, staler copy of the same fact — exactly the kind of
-- duplication that produces the "profile page disagrees with the account"
-- symptom this migration is fixing.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The column
-- -----------------------------------------------------------------------------
-- Nullable, not empty-string-defaulted: "no username" and "username is the
-- empty string" are different states, and only the first is true for a user who
-- never picked one. The CHECK mirrors the client's validation (3–24 characters,
-- lower-case letters, digits, underscore, full stop) so the database cannot hold
-- a value the UI would reject.
alter table public.profiles
  add column if not exists username text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_format'
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username is null or username ~ '^[a-z0-9_.]{3,24}$');
  end if;
end
$$;

-- Case-insensitive uniqueness: `Ada` and `ada` must not both exist. A partial
-- index because NULL is allowed (many users will never set one) and NULLs must
-- not collide with each other.
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

comment on column public.profiles.username is
  'Public handle. Unique case-insensitively. NULL when never chosen; the CHECK matches the client-side format rule.';

-- -----------------------------------------------------------------------------
-- 2. Backfill from the sign-up metadata
-- -----------------------------------------------------------------------------
-- `raw_user_meta_data->>'username'` was sent by the registration form for every
-- account created since the field existed. Recovering it now is the difference
-- between "your username was never saved" and "it was saved but unreadable".
--
-- Only applied where it passes the CHECK, so a malformed legacy value cannot
-- abort the migration. Existing rows win: a username already set is never
-- overwritten by older metadata.
update public.profiles p
set username = lower(btrim(u.raw_user_meta_data ->> 'username'))
from auth.users u
where u.id = p.id
  and p.username is null
  and u.raw_user_meta_data ->> 'username' is not null
  and lower(btrim(u.raw_user_meta_data ->> 'username')) ~ '^[a-z0-9_.]{3,24}$';

-- A collision could still block the index for two accounts that chose the same
-- handle before uniqueness existed. Detect and report rather than fail blindly:
-- the operator picks which one keeps it.
do $$
declare
  v_collisions integer;
begin
  select count(*) into v_collisions
  from (
    select lower(username)
    from public.profiles
    where username is not null
    group by lower(username)
    having count(*) > 1
  ) dupes;

  if v_collisions > 0 then
    raise warning
      'profiles contains % duplicate username(s) after backfill; each must be resolved manually before uniqueness can be relied on',
      v_collisions;
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 3. Keep the trigger in sync for new signups
-- -----------------------------------------------------------------------------
-- The original trigger read only `display_name`. A username supplied at signup
-- was therefore dropped on the floor. Reading it here means a new account's
-- handle is persisted from the first request, with no client round trip.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_username     text;
begin
  -- Truncate rather than reject: a signup must not fail because someone typed a
  -- very long name. The check constraint allows 80 characters.
  v_display_name := left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80);

  -- `nullif` keeps an empty or whitespace-only value as NULL rather than as a
  -- username that fails the CHECK and aborts the insert.
  v_username := nullif(lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', ''))), '');

  -- A handle that does not match the format is dropped, not fatal: the account
  -- is more important than the handle, and the user can set one in Profile.
  if v_username is not null and v_username !~ '^[a-z0-9_.]{3,24}$' then
    v_username := null;
  end if;

  insert into public.profiles (id, display_name, username)
  values (new.id, v_display_name, v_username)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'learner')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- The trigger itself is unchanged; re-create it so this file is self-contained.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. Grant the save path
-- -----------------------------------------------------------------------------
-- 0004 already granted UPDATE on (display_name, preferred_language). The new
-- column needs adding — and `updated_at` stays ungranted on purpose: it is
-- maintained by the trigger-less default, and a client has no business setting
-- it. Re-stated in full so a fresh database cannot drift from an existing one.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, preferred_language, username) on public.profiles
  to authenticated;

-- RLS remains the boundary that decides WHICH row: `profiles_update_own`
-- (migration 0001) requires `auth.uid() = id` for both USING and WITH CHECK, so
-- the column grant above cannot be used to edit somebody else's row.

-- -----------------------------------------------------------------------------
-- 5. Verification
-- -----------------------------------------------------------------------------
do $$
declare
  v_has_column     boolean;
  v_can_update     boolean;
  v_can_set_email  boolean;
  v_rls            boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'username'
  ) into v_has_column;

  select has_column_privilege('authenticated', 'public.profiles', 'username', 'UPDATE')
    into v_can_update;

  -- The email must never be writable from a client: it is the identity the
  -- token is issued for.
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'email'
  ) into v_can_set_email;

  select relrowsecurity into v_rls
  from pg_class where oid = 'public.profiles'::regclass;

  if not v_has_column then
    raise exception 'profiles.username was not created';
  end if;
  if not v_can_update then
    raise exception 'authenticated cannot update profiles.username';
  end if;
  if v_can_set_email then
    raise exception 'profiles has an email column; the address must live only in auth.users';
  end if;
  if not coalesce(v_rls, false) then
    raise exception 'RLS is not enabled on public.profiles';
  end if;

  raise notice 'profiles: username added, backfilled, updatable by owner only';
end
$$;
