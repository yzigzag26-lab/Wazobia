# Dictionary importers

These scripts turn an externally published lexicon into SQL that can be applied to
`public.dictionary_entries`. They are **build-time tools**, not part of `api/` and not
part of the Vite bundle — nothing here ships to a browser or to a Vercel function.

```
node supabase/import/igbo-api.mjs --in <ig-en.json> --out supabase/import/out/ig-bo.sql
```

**One importer exists: `igbo-api.mjs`, for Igbo.** There is no Yorùbá or Hausa importer
yet. When one is written it should follow the same four rules below and record its own
provenance; the table in this file must not claim it before it exists.

## The source

| Source | Languages | Licence | File |
|---|---|---|---|
| `igbo-api.mjs` | Igbo (`ig`) | Apache-2.0 | `ig-en.json` from `nkowaokwu/igbo_api` |

Fetch the source with the GitHub contents API, which returns the raw file:

```
curl -H "Accept: application/vnd.github.raw" \
  "https://api.github.com/repos/nkowaokwu/igbo_api/contents/src/dictionaries/ig-en/ig-en.json" \
  -o ig-en.json
```

Use `ig-en.json`. Do **not** use `ig-en_normalized_expanded.json` from the same
directory: it is a reverse-mapped English index and produces nonsense headwords.

## Rules these importers follow

1. **The headword is copied byte for byte.** No normalisation, no trim, no "repair" of
   tone marks or dot-below letters. The canonical spelling is the data.
2. **Nothing is auto-approved.** Every imported row lands as `review_status = 'pending'`.
   An importer must never be able to publish content on its own.
3. **Empty entries are dropped.** A headword with no definition is not a dictionary
   entry, whatever file it came from.
4. **Provenance is recorded on every row** — `source_name`, `source_url`,
   `source_license` — not only in a comment block, so a single row can be traced
   without consulting any document.

Two further rules learned the hard way:

5. **Never wrap the whole import in one transaction.** One malformed row would roll back
   thousands of good ones. Each `INSERT` is independent and idempotent, so a failed run
   can simply be retried.
6. **Deduplicate in JavaScript, not in SQL.** `on conflict do nothing` cannot rescue a
   duplicate *within a single `INSERT`*. The importer deduplicates
   `(headword, part_of_speech)` before writing.

## Applying the output

The generated file is plain SQL using `on conflict (language_code, headword,
part_of_speech) do nothing` against the unique index created in
`migrations/0003_dictionary_provenance.sql`, so it is safe to re-run in full.

```
psql "$DATABASE_URL" -f supabase/import/out/ig-bo.sql
```

Or paste it into the Supabase SQL editor, one `INSERT` statement at a time.

`supabase/import/next-batch.mjs` prints one already-split batch as JSON on stdout, for
loading through a client that caps request size. It does not split files itself; point
it at a directory of `b000.sql`, `b001.sql`, … files:

```
node supabase/import/next-batch.mjs /tmp/batches 0
```

## Status

`out/ig-bo.sql` holds 8,135 rows. The load is **partial** — see
`docs/operations/2026-11-04-igbo-dictionary-import.md` for exactly what is in the
database and what is not.
