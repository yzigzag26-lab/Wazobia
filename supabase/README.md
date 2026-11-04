# supabase/

Database schema, migrations and policies for WAZOBIA.

**Project:** `ZYPHER-CORE` — ref `bxifjhhgmomiacehngyj`, region `eu-central-1`.

## Migrations

Migrations are plain, ordered SQL. They are written to be reviewable and
re-runnable: every `create` is `if not exists`, every `create or replace` is
idempotent, and policies are dropped before being recreated. That means a failed
run can be re-applied without a partial-state repair.

| File | Adds |
|---|---|
| `0001_core_schema.sql` | languages, dialects, profiles, user_roles, courses, lessons, lesson_sentences, lesson_progress, dictionary_entries, conversations, conversation_messages, the `languages_public` view, RLS policies, and the launch language seed |
| `0002_security_hardening.sql` | **Required.** Revokes Supabase's inherited `ALL` grants, re-grants exactly what each role needs, closes the schema default, and asserts the result |

**Apply both, in order.** 0001 alone leaves every table writable by `anon`.

## The inherited-grant trap (why 0002 exists)

Supabase configures `public` with:

```sql
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
```

Every table `0001` created therefore already carried `INSERT`/`UPDATE`/`DELETE`
for both client roles. Its `grant select` statements were **additive** and
removed nothing. Probing the live database showed:

```
has_table_privilege('anon', 'public.user_roles', 'insert')  ->  true
```

RLS still blocked the *rows*, so nothing was readable that should not have been
— but the privilege layer was wide open, and one future `create policy ... for
all` would have converted a latent grant into a live escalation.

This is worth internalising: **reading a migration cannot catch it, because the
defect is in an inherited default, not in the file.** Only a privilege probe on
the running database finds it. `0002` now revokes, re-grants, changes the schema
default so future tables are not born writable, and raises an exception if any
offending grant survives. `api/_lib/contract.test.ts` asserts those statements
are still present.

### Applying

Through the Supabase dashboard SQL editor, or:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_core_schema.sql
```

## Rules

**Every table has RLS enabled.** There is no table readable by `anon` or
`authenticated` without a policy. `api/_lib/contract.test.ts` reads this
directory and fails if a future migration creates a table without it.

**Clients never write reference content.** Languages, dialects, courses, lessons,
sentences and dictionary entries have a `SELECT` policy and no write policy at
all, so with RLS on, every client write is denied. Content arrives by migration
or through the service role.

**`user_roles` is not client-writable in any direction except read-own.** A role
decides authorization. If a client could write this table it could grant itself
`admin`. There is deliberately no INSERT/UPDATE/DELETE policy and no write grant.

**Only approved dictionary entries are public.** `review_status` is enforced in
the policy, not in application code, so an unreviewed suggestion cannot leak by
a handler forgetting a filter.

**Stored text is never normalised.** Canonical orthography (`Yorùbá`) is data.
Search tolerance is achieved with a separate *generated* column
(`search_key`) folded by `wazobia_fold()`, so the displayed headword is always
the canonical spelling. The migration aborts if the seed loses a tone mark.

## Why `wazobia_fold()` exists

Yorùbá has letters that look like accented Latin but are distinct: `ẹ ọ ṣ`.
A learner typing `ekaaro` on a phone keyboard must still find `ẹ káàrọ̀`.
`unaccent()` folds the diacritics, but it is only `STABLE` (it reads a dictionary
table at runtime), which disqualifies it from generated columns and expression
indexes. `immutable_unaccent()` wraps it as `IMMUTABLE` — safe here because the
unaccent dictionary is fixed for the life of the database — and `wazobia_fold()`
then lowercases and strips non-alphanumerics. A trigram GIN index on the folded
key gives tolerant matching without ever touching the stored headword.
