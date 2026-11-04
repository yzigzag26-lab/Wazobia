-- ---------------------------------------------------------------------------
-- 0003 — Dictionary provenance and import identity
--
-- Why this exists:
--   1. Imported entries must say where they came from. `dictionary_entries`
--      had no provenance columns at all, so a bulk import would have produced
--      thousands of rows nobody could trace to a source or a licence.
--   2. `dictionary_entries` had no uniqueness constraint, so re-running an
--      importer would silently duplicate every row. Imports must be idempotent.
--
-- Both are additive. No existing column is renamed or dropped, and no row is
-- deleted except exact duplicates that the new constraint could not tolerate.
-- ---------------------------------------------------------------------------

-- Provenance: first-class, because "review status on every entry" is only
-- meaningful if the entry also says who published the underlying data.
alter table public.dictionary_entries
  add column if not exists source_name text;

alter table public.dictionary_entries
  add column if not exists source_url text;

alter table public.dictionary_entries
  add column if not exists source_license text;

comment on column public.dictionary_entries.source_name is
  'Name of the lexicon this row was imported from. Never invented; null means hand-authored in-repo content.';
comment on column public.dictionary_entries.source_license is
  'Licence the source data was published under, recorded so redistribution terms stay auditable.';

-- ---------------------------------------------------------------------------
-- Import identity
--
-- One row per (language, headword, part of speech). Homographs that differ only
-- by part of speech stay distinct, which is correct for a dictionary: `bank`
-- the noun and `bank` the verb are different entries.
--
-- `nulls not distinct` matters here. Without it, two rows with a NULL part of
-- speech would not collide and an importer would duplicate them on every run.
-- Requires PostgreSQL 15+; this project is on 17.6.
-- ---------------------------------------------------------------------------

-- Collapse exact duplicates first so the index can be built on a dirty table.
-- On a fresh database this deletes nothing.
with ranked as (
  select
    id,
    row_number() over (
      partition by language_code, headword, coalesce(part_of_speech, '')
      order by created_at, id
    ) as rn
  from public.dictionary_entries
)
delete from public.dictionary_entries d
using ranked r
where d.id = r.id
  and r.rn > 1;

create unique index if not exists dictionary_entries_identity_idx
  on public.dictionary_entries (language_code, headword, part_of_speech)
  nulls not distinct;

-- ---------------------------------------------------------------------------
-- Public read surface
--
-- The table keeps its `approved`-only policy: unreviewed rows are not published.
-- The view below is for the operator, not the public, and is not granted to
-- `anon`. It exists so review progress is one query away instead of a scan.
-- ---------------------------------------------------------------------------
create or replace view public.dictionary_review_queue
with (security_invoker = true)
as
select
  language_code,
  review_status,
  count(*)::integer as entries,
  count(*) filter (where source_name is not null)::integer as with_provenance,
  count(*) filter (where gloss is null or length(trim(gloss)) = 0)::integer as missing_gloss
from public.dictionary_entries
group by language_code, review_status;

comment on view public.dictionary_review_queue is
  'Operator-facing summary of dictionary review state. Not granted to anon; the public only ever sees approved rows.';

-- The trap this whole project already learned once: Supabase sets
-- `alter default privileges in schema public grant all on tables to anon,
-- authenticated`, and in PostgreSQL `ON TABLES` covers views as well. A newly
-- created view is therefore born world-writable unless it is explicitly
-- revoked. Doing that here rather than trusting inheritance.
revoke all on public.dictionary_review_queue from anon, authenticated, public;
