-- =============================================================================
-- WAZOBIA — security hardening (0002)
-- =============================================================================
-- WHY THIS MIGRATION EXISTS
--
-- 0001 enabled Row Level Security on every table and granted SELECT to the
-- public roles. That looked correct, and reading the SQL it *was* correct as
-- written. It was still insecure.
--
-- Supabase ships a default privilege configuration on the `public` schema:
--
--     alter default privileges in schema public
--       grant all on tables to anon, authenticated, service_role;
--
-- So every table created by 0001 was born with full INSERT/UPDATE/DELETE
-- granted to `anon` and `authenticated`. The `grant select` statements in 0001
-- were ADDITIVE — they added a privilege that was already implied, and removed
-- nothing. RLS does still block rows, but the privilege layer was wide open,
-- which means:
--
--   * `anon` held INSERT/UPDATE/DELETE on `languages`, `courses`,
--     `dictionary_entries` and every other reference table.
--   * `authenticated` held INSERT on `user_roles` — an elevated privilege on the
--     table that decides authorisation. RLS would have blocked the write (no
--     write policy exists), but defence in depth is the entire point: a single
--     future `create policy ... for all` mistake would have turned a latent
--     grant into a live privilege escalation.
--
-- This was found by probing the live database rather than by reading the file:
--
--     select has_table_privilege('anon','public.user_roles','insert');  -- true
--
-- The fix is to state the intended privileges EXACTLY — revoke everything, then
-- grant only what each role needs. It also changes the schema-level default so
-- the next migration cannot reintroduce the same hole.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Stop future tables from inheriting write access
-- -----------------------------------------------------------------------------
-- Without this, the next `create table` in `public` is insecure again on the day
-- it is written, and the same review would have to be repeated. New tables get
-- no default table privileges for the client roles; each migration grants what
-- it actually needs.
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- Sequences are not used by this schema (all keys are uuid), but the default
-- grant is the same shape of hazard, so it is closed for consistency.
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Reference content — read-only for everyone with a client role
-- -----------------------------------------------------------------------------
-- Languages, dialects, courses, lessons, sentences and dictionary entries are
-- published content. A browser may read them and must never write them. Content
-- arrives by migration or through the service role.
revoke all on public.languages             from anon, authenticated;
revoke all on public.dialects              from anon, authenticated;
revoke all on public.courses               from anon, authenticated;
revoke all on public.lessons               from anon, authenticated;
revoke all on public.lesson_sentences      from anon, authenticated;
revoke all on public.dictionary_entries    from anon, authenticated;
revoke all on public.languages_public      from anon, authenticated;

grant select on public.languages          to anon, authenticated;
grant select on public.dialects           to anon, authenticated;
grant select on public.courses            to anon, authenticated;
grant select on public.lessons            to anon, authenticated;
grant select on public.lesson_sentences   to anon, authenticated;
grant select on public.dictionary_entries to anon, authenticated;
grant select on public.languages_public   to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. user_roles — read-own only. No write path for any client role.
-- -----------------------------------------------------------------------------
-- This table decides authorisation. A role grant is a privileged operation and
-- happens only through the service role, server-side. `anon` has no business
-- reading it at all.
revoke all on public.user_roles from anon, authenticated;

grant select on public.user_roles to authenticated;

-- -----------------------------------------------------------------------------
-- 4. profiles — read own, update a narrow column list only
-- -----------------------------------------------------------------------------
-- Column-level UPDATE (rather than table-level) means a user cannot rewrite
-- `id`, `created_at`, or add columns to their own row as the schema grows.
revoke all on public.profiles from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, preferred_language, updated_at) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Own-data tables — the user's own rows, never `anon`
-- -----------------------------------------------------------------------------
revoke all on public.conversations          from anon, authenticated;
revoke all on public.conversation_messages  from anon, authenticated;
revoke all on public.lesson_progress        from anon, authenticated;

grant select, insert, update, delete on public.conversations         to authenticated;
grant select, insert, update, delete on public.conversation_messages to authenticated;
grant select, insert, update, delete on public.lesson_progress       to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Trigger functions must not be directly callable
-- -----------------------------------------------------------------------------
-- Postgres grants EXECUTE on new functions to PUBLIC by default. `handle_new_user`
-- is SECURITY DEFINER, so anyone able to call it runs it with the owner's
-- privileges. As a trigger function it is not usefully callable outside a
-- trigger, but leaving a SECURITY DEFINER function executable by PUBLIC is a
-- standing invitation for a future refactor to make it exploitable.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

revoke all on function public.immutable_unaccent(text) from public;
revoke all on function public.wazobia_fold(text) from public;

-- `wazobia_fold` is used by a GENERATED column, evaluated as the writing role,
-- so it must remain executable by the roles that insert dictionary rows. Reads
-- do not need it.
grant execute on function public.wazobia_fold(text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 7. Assert the result, in the migration
-- -----------------------------------------------------------------------------
-- A migration that fixes a privilege bug should prove it fixed it. If any of
-- these are still true, the migration fails and nothing is left half-applied.
do $$
declare
  offender text;
begin
  for offender in
    select format('%s.%s on %s', grantee, privilege_type, table_name)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
      and table_name in (
        'languages', 'dialects', 'courses', 'lessons', 'lesson_sentences',
        'dictionary_entries', 'languages_public', 'user_roles', 'profiles'
      )
  loop
    raise exception 'Privilege hardening failed: % still granted', offender;
  end loop;

  -- `anon` must hold no privilege at all on own-data tables.
  for offender in
    select format('%s.%s on %s', grantee, privilege_type, table_name)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'anon'
      and table_name in ('conversations', 'conversation_messages', 'lesson_progress', 'profiles')
  loop
    raise exception 'Privilege hardening failed: anon still holds %', offender;
  end loop;
end $$;
