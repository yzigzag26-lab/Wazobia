#!/usr/bin/env node
/**
 * Seed importer: the in-repo TypeScript corpus -> SQL for
 * `public.dictionary_entries`.
 *
 * The Yorùbá, Hausa and Igbo starter vocabulary already lives in
 * `src/features/learn/lessons/*-course.ts` and the proverb collections in
 * `src/features/learn/proverbs/*.ts`. That content is hand-written, has tone
 * marks in full orthography, and carries an explicit review status. Rather than
 * source a second, unreviewed corpus from elsewhere, this script imports what
 * is already in the repository and says so in each row's provenance.
 *
 * It reads the TypeScript directly via Node's type stripping, so there is no
 * second copy of the data to drift: edit the lesson file, re-run this script.
 *
 *   node supabase/import/seed-course.mjs --out supabase/import/out/seed.sql
 *
 * Rules, same as the Igbo importer:
 *
 *   1. The headword is copied byte for byte. No normalisation, no trim. Tone
 *      marks and dotted letters are the word, not decoration.
 *   2. Nothing is auto-approved. Rows land as `pending` even though the source
 *      marks some content `reviewed` — a lesson being reviewed for teaching is
 *      not the same as a dictionary entry being signed off.
 *   3. Provenance is recorded per row.
 *   4. Dedupe in JS, because `on conflict` cannot rescue a duplicate inside one
 *      INSERT.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const args = process.argv.slice(2)
const outIndex = args.indexOf('--out')
const outPath = outIndex >= 0 ? args[outIndex + 1] : 'supabase/import/out/seed.sql'

if (outPath === undefined) {
  console.error('usage: seed-course.mjs --out <file.sql>')
  process.exit(1)
}

// The barrels in `src/` use extensionless specifiers, which Node's ESM resolver
// will not follow. Import the concrete modules instead; this is the same data.
const lessonModules = await Promise.all([
  import('../../src/features/learn/lessons/yoruba-course.ts'),
  import('../../src/features/learn/lessons/hausa-course.ts'),
  import('../../src/features/learn/lessons/igbo-course.ts'),
])
const LESSONS = [
  ...lessonModules[0].YORUBA_LESSONS,
  ...lessonModules[1].HAUSA_LESSONS,
  ...lessonModules[2].IGBO_LESSONS,
]

const proverbModules = await Promise.all([
  import('../../src/features/learn/proverbs/yoruba.ts'),
  import('../../src/features/learn/proverbs/hausa.ts'),
  import('../../src/features/learn/proverbs/igbo.ts'),
])
const PROVERBS_BY_LANGUAGE = {
  yo: proverbModules[0].YORUBA_PROVERBS,
  ha: proverbModules[1].HAUSA_PROVERBS,
  ig: proverbModules[2].IGBO_PROVERBS,
}

/** `StudyLanguage` values map onto the `languages.code` rows already seeded. */
const LANGUAGES = ['yo', 'ha', 'ig']

const SOURCE_NAME = 'WAZOBIA course seed (src/features/learn)'
const SOURCE_URL = 'https://github.com/yzigzag26-lab/Wazobia'

/**
 * A lesson's `partOfSpeech` is free text chosen for teaching, so it is mapped
 * onto a small closed set. `null` is kept rather than guessed: an entry whose
 * word class is genuinely unknown must not be labelled "noun".
 */
const PART_OF_SPEECH = new Map([
  ['greeting', 'greeting'],
  ['expression', 'expression'],
  ['question', 'question'],
  ['pronoun', 'pronoun'],
  ['noun', 'noun'],
  ['verb', 'verb'],
  ['adjective', 'adjective'],
  ['adverb', 'adverb'],
  ['numeral', 'numeral'],
  ['number', 'numeral'],
  ['conjunction', 'conjunction'],
  ['preposition', 'preposition'],
  ['interjection', 'interjection'],
  ['phrase', 'phrase'],
])

/** @type {{lang: string, headword: string, pos: string|null, gloss: string, note: string|null}[]} */
const rows = []
/** Headwords seen per language, for the "one row per headword" check below. */
const seen = new Set()

function push(lang, headword, pos, gloss, note) {
  if (typeof headword !== 'string' || headword.trim() === '') return
  if (typeof gloss !== 'string' || gloss.trim() === '') return
  const key = `${lang}\u0000${headword}`
  if (seen.has(key)) return
  seen.add(key)
  const mapped = pos === undefined || pos === null ? null : (PART_OF_SPEECH.get(pos) ?? 'phrase')
  // There is no `notes` column. The teaching note is genuinely part of what the
  // word means to a learner, so it joins the gloss rather than being dropped or
  // forcing a schema change for 72 rows. It is appended, never substituted, so
  // the primary gloss stays first and readable.
  const full = note ? `${gloss} — ${note}` : gloss
  rows.push({ lang, headword, pos: mapped, gloss: full })
}

for (const language of LANGUAGES) {
  for (const lesson of LESSONS.filter((l) => l.language === language)) {
    for (const block of lesson.blocks) {
      if (block.kind === 'vocabulary') {
        for (const entry of block.entries) {
          push(language, entry.term, entry.partOfSpeech, entry.gloss, entry.note)
        }
      }
    }
  }
}

// Proverbs are dictionary entries too, and they are the part of the corpus with
// the most careful provenance. Their gloss is the literal reading; the teaching
// goes into the note so neither is lost.
for (const language of LANGUAGES) {
  for (const proverb of PROVERBS_BY_LANGUAGE[language]) {
    push(language, proverb.original, 'proverb', proverb.literal, proverb.meaning)
  }
}

const byLanguage = Object.fromEntries(
  LANGUAGES.map((l) => [l, rows.filter((r) => r.lang === l).length]),
)

/** Single-quote escaping only — nothing else is transformed. */
const q = (value) => `'${String(value).replaceAll("'", "''")}'`
const sqlText = (value) => (value === null ? 'null::text' : q(value))

const values = rows
  .map(
    (r) =>
      `(${q(r.lang)}, ${q(r.headword)}, ${sqlText(r.pos)}, ${q(r.gloss)})`,
  )
  .join(',\n')

const sql = `-- Generated by supabase/import/seed-course.mjs — do not edit by hand.
-- Source: the in-repo course corpus. ${rows.length} rows across ${
  Object.keys(byLanguage).length
} languages.
-- ${JSON.stringify(byLanguage)}
insert into public.dictionary_entries
  (language_code, headword, part_of_speech, gloss, review_status,
   source_name, source_url, source_license)
select t.l, t.h, t.p, t.g, 'pending',
       ${q(SOURCE_NAME)}, ${q(SOURCE_URL)}, 'CC-BY-SA-4.0'
from (values
${values}
) as t(l, h, p, g)
on conflict (language_code, headword, part_of_speech) do nothing;
`

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, sql, 'utf8')
console.log(
  `wrote ${outPath}: ${rows.length} rows ${JSON.stringify(byLanguage)}`,
)
