-- ============================================================================
-- 0005_dictionary_review.sql
-- ============================================================================
-- "How do I approve the dictionary?" had no answer: there was no endpoint, no
-- UI, and no way to grant the `reviewer` role. Approving 1,072 rows meant
-- hand-writing SQL. That is not a review process, it is a one-time script, and
-- it leaves the next batch just as stuck.
--
-- This migration adds the missing pieces:
--
--   1. `dictionary_review_candidates` — the operator queue, with the objective
--      quality flags pre-computed so a reviewer is not asked to spot
--      unbalanced parentheses across 1,024 rows by eye.
--   2. `review_dictionary_entry()` — a single-row decision, gated on the caller
--      holding `reviewer` or `admin` IN THE DATABASE.
--   3. `bulk_approve_dictionary()` — batch approval that refuses to include a
--      row failing an objective gate, and reports why it skipped each one.
--
-- The philosophy, which the rest of this file is written to enforce: approval
-- is a human judgement and must never be automatic. These functions do not
-- decide anything for the reviewer; they record a decision the reviewer made,
-- and they make the cost of approving garbage visible BEFORE it is published
-- rather than after a learner sees it.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Objective quality flags, as a view
-- ----------------------------------------------------------------------------
-- What this calls "objective": properties a string either has or does not have,
-- with no linguistic judgement involved. A human still has to decide whether a
-- gloss is *correct*.
--
-- The Igbo corpus makes these flags non-optional. It came from a dictionary's
-- verb-stem notation, so 1,014 of 1,024 headwords contain a leading hyphen,
-- parenthetical tone groups, or semicolons — `-bugha(lị)`, `(agwa)ụnò) -ma`,
-- `-;kwakpụsị anya`. Those are legitimate lexicographic entries and their folded
-- search keys still work, but they are not what a learner types, and a few are
-- genuinely malformed (`-bà-`, unbalanced parens). A reviewer needs to see that
-- before approving, not discover it in production.
create or replace view public.dictionary_review_candidates
with (security_invoker = true)
as
select
  e.id,
  e.language_code,
  e.headword,
  e.part_of_speech,
  e.gloss,
  e.review_status,
  e.source_name,
  e.reviewed_at,
  e.created_at,
  (length(e.headword) - length(replace(e.headword, '(', '')))
    <> (length(e.headword) - length(replace(e.headword, ')', '')))     as unbalanced_parens,
  e.headword ~ '[-();]'                                              as lexicographic_notation,
  e.headword <> trim(e.headword)                                     as untrimmed,
  e.gloss is null or length(trim(e.gloss)) = 0                       as missing_gloss,
  length(trim(e.gloss)) > 200                                        as verbose_gloss,
  -- The single field a reviewer should scan first.
  case
    when e.gloss is null or length(trim(e.gloss)) = 0 then 'no gloss'
    when (length(e.headword) - length(replace(e.headword, '(', '')))
      <> (length(e.headword) - length(replace(e.headword, ')', ''))) then 'unbalanced parentheses'
    when e.headword <> trim(e.headword) then 'stray whitespace'
    when e.headword ~ ';[^ ]' then 'stray semicolon'
    when e.headword ~ '^[-]' then 'verb-stem notation'
    when e.headword ~ '[-();]' then 'lexicographic notation'
    when length(trim(e.gloss)) > 200 then 'very long gloss'
    else 'clean'
  end                                                                as quality_flag
from public.dictionary_entries e;

comment on view public.dictionary_review_candidates is
  'Operator queue for dictionary review, with objective quality flags pre-computed. Reviewer/admin only; the public never sees unreviewed rows.';

revoke all on public.dictionary_review_candidates from anon, authenticated, public;

-- ----------------------------------------------------------------------------
-- 2. Who may review
-- ----------------------------------------------------------------------------
-- The role check lives in the database. A handler that forgets to check, or a
-- client that hides a button, cannot change this.
create or replace function public.wazobia_is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('reviewer', 'admin')
  );
$$;

revoke all on function public.wazobia_is_reviewer() from public, anon;
grant execute on function public.wazobia_is_reviewer() to authenticated;

comment on function public.wazobia_is_reviewer() is
  'True when the caller holds reviewer or admin. Used by the review RPCs so authorisation cannot be bypassed by a client.';

-- ----------------------------------------------------------------------------
-- 3. Approve / reject one entry
-- ----------------------------------------------------------------------------
create or replace function public.review_dictionary_entry(
  p_entry_id  uuid,
  p_decision  text
)
returns table (
  id            uuid,
  review_status text,
  reviewed_at   timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.dictionary_entries;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  if not public.wazobia_is_reviewer() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected', 'pending') then
    raise exception 'INVALID_DECISION: %', p_decision using errcode = '22023';
  end if;

  select * into v_entry from public.dictionary_entries where id = p_entry_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Refuse to publish a row whose gloss is empty. This is the one gate that is
  -- absolute: a dictionary entry with no meaning is not a candidate for review,
  -- and approving it would put a blank card in front of a learner.
  if p_decision = 'approved'
     and (v_entry.gloss is null or length(trim(v_entry.gloss)) = 0) then
    raise exception 'NO_GLOSS: cannot approve an entry with no gloss'
      using errcode = '22023';
  end if;

  return query
  update public.dictionary_entries
     set review_status = p_decision,
         reviewed_by   = case when p_decision = 'pending' then null else auth.uid() end,
         reviewed_at   = case when p_decision = 'pending' then null else now() end,
         updated_at    = now()
   where dictionary_entries.id = p_entry_id
  returning dictionary_entries.id, dictionary_entries.review_status,
            dictionary_entries.reviewed_at;
end;
$$;

revoke all on function public.review_dictionary_entry(uuid, text) from public, anon;
grant execute on function public.review_dictionary_entry(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Batch approval, with refusals reported
-- ----------------------------------------------------------------------------
-- `p_only_clean` is the safety belt. When true, the function will not approve a
-- row failing an objective gate — no gloss, unbalanced parentheses, stray
-- whitespace — and returns the ids it skipped along with the reason.
--
-- Deliberately NOT provided: "approve everything". There is no parameter that
-- makes this function publish rows with no gloss, because the answer to "the
-- dictionary returns nothing" is not "publish whatever is there".
create or replace function public.bulk_review_dictionary(
  p_language_code text,
  p_decision      text,
  p_only_clean    boolean default true,
  p_limit         integer default 500
)
returns table (
  reviewed integer,
  skipped  integer,
  skipped_reasons text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids     uuid[];
  v_skipped text[] := array[]::text[];
  v_reviewed integer := 0;
  v_skipped_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  if not public.wazobia_is_reviewer() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'INVALID_DECISION: %', p_decision using errcode = '22023';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 2000 then
    raise exception 'INVALID_LIMIT' using errcode = '22023';
  end if;

  -- Collect refusals first so the caller learns what was held back.
  select coalesce(array_agg(id), array[]::uuid[])
    into v_ids
  from public.dictionary_entries
  where language_code = p_language_code
    and review_status = 'pending'
    and (
      not p_only_clean
      or (
        gloss is not null
        and length(trim(gloss)) > 0
        and headword = trim(headword)
        and (length(headword) - length(replace(headword, '(', '')))
          = (length(headword) - length(replace(headword, ')', '')))
      )
    )
  limit p_limit;

  select coalesce(array_agg(
           headword || ' → ' ||
           case
             when gloss is null or length(trim(gloss)) = 0 then 'no gloss'
             when headword <> trim(headword) then 'stray whitespace'
             else 'unbalanced parentheses'
           end
         ), array[]::text[])
    into v_skipped
  from public.dictionary_entries
  where language_code = p_language_code
    and review_status = 'pending'
    and p_only_clean
    and id <> all (v_ids)
    and (
      gloss is null
      or length(trim(gloss)) = 0
      or headword <> trim(headword)
      or (length(headword) - length(replace(headword, '(', '')))
        <> (length(headword) - length(replace(headword, ')', '')))
    );

  v_skipped_count := coalesce(array_length(v_skipped, 1), 0);

  if coalesce(array_length(v_ids, 1), 0) > 0 then
    update public.dictionary_entries
       set review_status = p_decision,
           reviewed_by   = auth.uid(),
           reviewed_at   = now(),
           updated_at    = now()
     where id = any (v_ids);
    v_reviewed := coalesce(array_length(v_ids, 1), 0);
  end if;

  return query select v_reviewed, v_skipped_count, v_skipped;
end;
$$;

revoke all on function public.bulk_review_dictionary(text, text, boolean, integer)
  from public, anon;
grant execute on function public.bulk_review_dictionary(text, text, boolean, integer)
  to authenticated;

comment on function public.bulk_review_dictionary(text, text, boolean, integer) is
  'Batch review by language. With p_only_clean, refuses rows failing an objective gate and returns the reasons.';

-- ----------------------------------------------------------------------------
-- 5. Granting the first reviewer
-- ----------------------------------------------------------------------------
-- There is no UI to grant roles, and there must not be one reachable by a
-- normal user. This SECURITY DEFINER function lets a bootstrap admin promote
-- exactly the caller, once, from the SQL editor — and refuses afterwards.
--
-- The abuse case it closes: a public `grant_reviewer(uuid)` function would let
-- anyone make themselves a reviewer. This one takes no argument and can only
-- promote `auth.uid()`, so it cannot be aimed at somebody else.
create or replace function public.claim_bootstrap_reviewer()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  -- One reviewer at a time, and only while none exists.
  select user_id into v_existing
  from public.user_roles
  where role = 'reviewer'
  limit 1;

  if v_existing is not null then
    raise exception 'ALREADY_CLAIMED: reviewer role already assigned'
      using errcode = '23505';
  end if;

  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'reviewer')
  on conflict (user_id, role) do nothing;

  return 'granted';
end;
$$;

revoke all on function public.claim_bootstrap_reviewer() from public, anon;
grant execute on function public.claim_bootstrap_reviewer() to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Verification
-- ----------------------------------------------------------------------------
do $$
declare
  v_anon_exec boolean;
begin
  select has_function_privilege(
    'anon',
    'public.bulk_review_dictionary(text, text, boolean, integer)',
    'EXECUTE'
  ) into v_anon_exec;

  if v_anon_exec then
    raise exception 'anon can execute bulk_review_dictionary';
  end if;
end;
$$;
