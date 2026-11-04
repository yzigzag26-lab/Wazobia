# 2026-11-04 — `public.memories` purge (ZYPHER-CORE)

**Scope:** remove every row from the pre-existing `public.memories` table left by
ZYPHER-CORE's earlier use, so the WAZOBIA schema stands alone in that project.

**Not affected:** WAZOBIA tables (`languages`, `dialects`, `courses`, `lessons`,
`lesson_sentences`, `dictionary_entries`, `profiles`, `user_roles`,
`conversations`, `conversation_messages`, `lesson_progress`).


Project: ZYPHER-CORE (bxifjhhgmomiacehngyj), Postgres 17.6
Table: public.memories
Columns: id uuid, category text, memory_key text, memory_value text,
         importance smallint, source text, created_at/updated_at/deleted_at timestamptz

Row counts at capture time:
  total              12
  live (deleted_at IS NULL)      3
  already soft-deleted           9
  oldest created_at   2026-09-20 23:04:26 UTC
  newest created_at   2026-09-22 22:20:19 UTC

Breakdown (no content captured):
  category=preference source=user   8 rows (3 live)
  category=preference source=test   3 rows (0 live)
  category=test       source=test   1 row  (0 live)

## Purge executed

DELETE FROM public.memories  →  12 rows removed (3 live + 9 soft-deleted)
Verified after:  total_remaining = 0, live_remaining = 0

WAZOBIA data untouched: languages 4 (Yorùbá, Hausa, Igbo, English),
languages_public 4, dialects/courses/lessons/dictionary_entries all 0.

## Leftover ZYPHER objects found

| Object | Type | Action |
|---|---|---|
| public.memories | table (empty, 4 indexes) | left in place — say the word to drop |
| public.update_memory_timestamp() | trigger fn on memories_updated_at | left in place — say the word to drop |
| public.rls_auto_enable() | backs the `ensure_rls` EVENT trigger | LEFT — Supabase-managed, not safe to remove |
| storage.buckets / objects / vector_indexes | 0 rows | nothing to purge |

Confirmed gone: no memory data anywhere in the database,
no storage objects, no vector indexes, no buckets.
