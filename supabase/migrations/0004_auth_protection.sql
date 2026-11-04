-- ============================================================================
-- 0004 — auth-backed API protection
-- ============================================================================
-- The user chose "straight sign-in, no email verification". That decision is
-- about *convenience of signup* and says nothing about whether endpoints are
-- protected. This migration adds the protection, which until now did not exist
-- in any form.
--
-- What was actually missing before this file:
--
--   * `POST /api/v1/translate` and `POST /api/v1/ai/chat` were open to the
--     internet. Each call spends a paid provider credit. Anyone who found the
--     URL could drain the account. That is the concrete risk this closes.
--   * There was no rate limiting anywhere.
--   * `GET /api/v1/users/me` had a contract but no way to resolve a caller.
--
-- Design: the API functions never hold the service-role key. They take the
-- caller's own access token and forward it to PostgREST, so `auth.uid()` is the
-- real user and every policy below is enforced by the database rather than by
-- a handler remembering to check something.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Rate limiting
-- ----------------------------------------------------------------------------
-- Deliberately a table rather than an in-memory counter: Vercel functions are
-- stateless and horizontally scaled, so a module-level Map would reset on every
-- cold start and would not be shared between instances. That is not a limit.
create table if not exists public.api_rate_limits (
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  scope         text        not null check (length(scope) between 1 and 64),
  window_start  timestamptz not null,
  counter       integer     not null default 0 check (counter >= 0),
  primary key (user_id, scope, window_start)
);

comment on table public.api_rate_limits is
  'Per-user fixed-window counters for cost-bearing endpoints. Never readable by clients.';

-- No client may read or write this table directly. The only way in or out is
-- `consume_rate_limit()` below, which is SECURITY DEFINER and derives the user
-- from the verified JWT rather than from anything the caller supplies.
alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;
revoke all on public.api_rate_limits from public;

/**
 * Consume one unit from a fixed window.
 *
 * Returns true when the caller is within budget and the unit was consumed,
 * false when the budget is exhausted. The caller is `auth.uid()` — never a
 * parameter — so a client cannot spend someone else's budget or reset its own
 * by claiming a different identity.
 *
 * `insert ... on conflict do update` keeps this atomic under concurrency: two
 * simultaneous requests both increment rather than both reading the same
 * starting count.
 */
create or replace function public.consume_rate_limit(
  p_scope             text,
  p_max_per_window    integer,
  p_window_seconds    integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user          uuid := auth.uid();
  v_window_start  timestamptz;
  v_counter       integer;
begin
  -- No verified identity, no budget. This is also the guard that stops the
  -- function being useful to an anonymous caller.
  if v_user is null then
    return false;
  end if;

  if p_scope is null or length(trim(p_scope)) = 0 then
    return false;
  end if;

  if p_max_per_window is null or p_max_per_window < 1 then
    return false;
  end if;

  if p_window_seconds is null or p_window_seconds < 1 then
    return false;
  end if;

  -- Truncate "now" down to the start of its window so every request inside the
  -- same window collides on the same primary key.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits as t (user_id, scope, window_start, counter)
  values (v_user, p_scope, v_window_start, 1)
  on conflict (user_id, scope, window_start)
  do update set counter = t.counter + 1
  returning t.counter into v_counter;

  return v_counter <= p_max_per_window;
end;
$$;

comment on function public.consume_rate_limit(text, integer, integer) is
  'Atomic fixed-window rate limit for the calling user (auth.uid()). Returns false when over budget.';

-- Callable by signed-in users only, and it can only act on their own budget.
revoke all on function public.consume_rate_limit(text, integer, integer) from public;
revoke all on function public.consume_rate_limit(text, integer, integer) from anon;
grant execute on function public.consume_rate_limit(text, integer, integer) to authenticated;

-- Old windows are dead weight. Cheap enough to run opportunistically; there is
-- no scheduler in this project yet, so the API function prunes on write.
create or replace function public.prune_rate_limits(p_older_than_seconds integer)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.api_rate_limits
  where window_start < now() - make_interval(secs => p_older_than_seconds);
$$;

revoke all on function public.prune_rate_limits(integer) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Profile integrity
-- ----------------------------------------------------------------------------
-- `handle_new_user` inserts a profile with a client-controllable display name
-- from `raw_user_meta_data`. Two guards: clamp it, and make sure a user cannot
-- later escalate their own fields through the profile UPDATE policy.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
begin
  -- Truncate rather than reject: a signup must not fail because someone typed a
  -- very long name. The check constraint allows 80 characters.
  v_display_name := left(
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    80
  );

  insert into public.profiles (id, display_name)
  values (new.id, v_display_name)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'learner')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

/**
 * Keep `updated_at` honest without trusting the client to send it.
 *
 * This matters for `profiles`: without it, a client can PATCH its own row and
 * never update the timestamp, so an operator reading the table cannot tell
 * when a name last changed.
 */
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists dictionary_entries_touch_updated_at on public.dictionary_entries;
create trigger dictionary_entries_touch_updated_at
  before update on public.dictionary_entries
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Close the privilege gaps an INSERT-only-signup model exposes
-- ----------------------------------------------------------------------------
-- `profiles` and `user_roles` are written exclusively by SECURITY DEFINER
-- triggers. If anon or authenticated can INSERT directly, a user can create a
-- profile for a *different* uuid, or grant themselves `admin`. Revoke the
-- write path entirely; the trigger runs as the definer and is unaffected.
revoke insert, delete on public.profiles from anon, authenticated;
revoke insert, update, delete on public.user_roles from anon, authenticated;

-- Narrow UPDATE column grants were already set in 0001; re-state them so this
-- file is self-contained and a fresh database cannot drift.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, preferred_language) on public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Verification
-- ----------------------------------------------------------------------------
do $$
declare
  v_anon_can_read_limits boolean;
  v_auth_can_exec_consume boolean;
begin
  -- The client must not be able to read the rate-limit table.
  select has_table_privilege('anon', 'public.api_rate_limits', 'SELECT')
    into v_anon_can_read_limits;
  if v_anon_can_read_limits then
    raise exception 'anon can still read api_rate_limits';
  end if;

  select has_function_privilege(
    'authenticated',
    'public.consume_rate_limit(text, integer, integer)',
    'EXECUTE'
  ) into v_auth_can_exec_consume;
  if not v_auth_can_exec_consume then
    raise exception 'authenticated cannot execute consume_rate_limit';
  end if;
end;
$$;
