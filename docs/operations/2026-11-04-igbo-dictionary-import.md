# Dictionary import — Igbo, 2026-11-04

Record of what was actually loaded, because "the rows appeared" is not provenance.

## Source

| | |
|---|---|
| Lexicon | Igbo API — `nkowaokwu/igbo_api` |
| File | `src/dictionaries/ig-en/ig-en.json` |
| Licence | **Apache-2.0** (verified in `LICENSE.md` of the source repo) |
| Upstream docs | https://docs.igboapi.com/essentials/word_classes |
| Extract date | 2026-11-04 |

Every imported row carries `source_name`, `source_url` and `source_license`, so a
single row can always be traced back without consulting this file.

## What was parsed

| Measure | Count |
|---|---|
| Headwords in the source file | 8,223 |
| Records carrying at least one definition | 8,138 |
| Rows dropped — no definition at all | 85 |
| Rows dropped — punctuation only | 2 |
| Rows dropped — duplicate `(headword, part of speech)` | 1 |
| **Rows eligible to load** | **8,135** |
| …of which headword has no space or bracket, gloss ≤ 300 chars ("core") | 2,156 |
| …of which are multi-word phrases, affixes or long encyclopaedic glosses | 5,979 |

`ig-en_normalized_expanded.json` in the same source directory was **rejected**. It is
a reverse-mapped index (`ọria` → `aals, dreggy, gregor, outstretched`) and is useless
as a dictionary. `ig-en_expanded.json` is byte-identical to `ig-en.json`.

## Loaded so far

**1,000 of 8,135 rows**, all `review_status = 'pending'`, all with the Apache-2.0
provenance recorded.

The composition of what landed is the important part, and it is **not** a good
dictionary yet:

| | |
|---|---|
| Rows whose headword begins with `-` or `(` — verb affixes and phrasal forms | **946** |
| Rows whose headword is a standalone word | **54** |

The source is sorted alphabetically, so the first third of the alphabet is almost
entirely the affix block (`-ba`, `-bè`, `-chị`, `-gbà`, …). 946 of 1,000 rows being
affixes is why this load should not be called a working dictionary.

## Not yet loaded

**7,135 rows** remain. The generated SQL is reproducible from the importer and is
gitignored (1.4 MB), so it must be regenerated rather than pulled from Git:

```
node supabase/import/igbo-api.mjs --in ig-en.json --out supabase/import/out/ig-bo.sql
```

The output is idempotent (`on conflict do nothing`), so it is safe to re-run in full
over what is already loaded. Any client with a database connection can then finish it:

```
psql "$DATABASE_URL" -f supabase/import/out/ig-bo.sql
```

## Known defects inherited from the source

These were **not** repaired, because the canonical spelling is the data and an
importer must not silently correct it:

- 20 headwords carry leading or trailing whitespace (`'adà '`, `' mmili nā-ekwō èkwò'`).
- 11 headwords have unbalanced brackets, e.g. `'( -gbọ 1.'`, `'mmeē)'`.
- 6 headwords are punctuation or a bare vowel letter: `` ` ``, `Ị`, `Ọ`, `Ụ`, `Ŋ`.
- Some glosses embed raw text artefacts (`C`, `#`) where the source lost a
  special character, e.g. `-gba enu#`.

These are recorded so a reviewer can find them, not fixed.

## Review state

Nothing here is public. The `dictionary_approved_read` policy on
`public.dictionary_entries` only returns `review_status = 'approved'` rows, and no row
has been approved. Approving is a human decision and is deliberately not automated.
