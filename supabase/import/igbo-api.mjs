#!/usr/bin/env node
/**
 * Igbo dictionary importer.
 *
 * Source : nkowaokwu/igbo_api — src/dictionaries/ig-en/ig-en.json
 * Licence: Apache-2.0
 * Docs   : https://docs.igboapi.com/essentials/word_classes
 *
 * Emits idempotent SQL for `public.dictionary_entries`.
 *
 * Design rules (see supabase/import/README.md):
 *   - The headword is copied exactly. Nothing is normalised or "repaired".
 *   - Every row lands as `pending`. An importer never publishes.
 *   - Rows with no usable definition are skipped and counted, never invented.
 *   - Output is deterministic, so a diff between two runs is meaningful.
 *
 * Usage:
 *   node supabase/import/igbo-api.mjs --in /path/ig-en.json --out supabase/import/out/ig.sql
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const SOURCE_NAME = 'Igbo API (nkowaokwu/igbo_api)'
const SOURCE_URL = 'https://github.com/nkowaokwu/igbo_api'
const SOURCE_LICENSE = 'Apache-2.0'

/**
 * The IgboNLP word-class tagset used by the Igbo API. Labels are taken from the
 * project's own documentation; unmapped codes fall back to the raw code rather
 * than being guessed at, so an unknown class stays visibly unknown.
 */
const WORD_CLASS = {
  ADJ: 'adjective',
  ADV: 'adverb',
  AV: 'active verb',
  MV: 'medial verb',
  PV: 'passive verb',
  CJN: 'conjunction',
  DEM: 'demonstrative',
  NM: 'name',
  NNC: 'noun',
  ND: 'nominal modifier',
  NNP: 'proper noun',
  CD: 'number',
  PREP: 'preposition',
  PRN: 'pronoun',
  FW: 'foreign word',
  QTF: 'quantifier',
  WH: 'interrogative',
  INTJ: 'interjection',
  ISUF: 'inflectional suffix',
  ESUF: 'extensional suffix',
  SYM: 'punctuation',
}

/** Characters that can never be a headword. Copied literally, never trimmed. */
const PUNCTUATION_ONLY = /^[^\p{L}\p{N}]+$/u

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i]
    const value = argv[i + 1]
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Bad argument near "${key ?? ''}"`)
    }
    args[key.slice(2)] = value
  }
  return args
}

function sqlText(value) {
  // Single quotes are doubled for SQL. No other transformation: the string that
  // goes in is the string that comes back out.
  return `'${String(value).replaceAll("'", "''")}'`
}

function cleanDefinitions(record) {
  const seen = new Set()
  const out = []
  for (const raw of record.definitions ?? []) {
    if (typeof raw !== 'string') continue
    const value = raw.trim()
    if (value.length === 0) continue
    if (seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

function main() {
  const args = parseArgs(process.argv)
  if (!args.in || !args.out) {
    console.error('Usage: node supabase/import/igbo-api.mjs --in <ig-en.json> --out <file.sql>')
    process.exit(1)
  }

  const dictionary = JSON.parse(readFileSync(args.in, 'utf8'))

  const rows = []
  const stats = {
    headwords: 0,
    skippedNoDefinition: 0,
    skippedPunctuation: 0,
    multiSense: 0,
    withExamples: 0,
    unknownWordClass: new Set(),
    skippedDuplicateInSource: 0,
  }

  // Sorting the keys makes the output stable across runs and across Node
  // versions, which is what allows the generated SQL to be diffed.
  for (const headword of Object.keys(dictionary).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const records = dictionary[headword]
    if (!Array.isArray(records)) continue
    stats.headwords += 1

    for (const record of records) {
      const word = record.word ?? headword
      const definitions = cleanDefinitions(record)

      if (PUNCTUATION_ONLY.test(word)) {
        stats.skippedPunctuation += 1
        continue
      }
      if (definitions.length === 0) {
        // No definition and no gloss means there is nothing to show a learner.
        // Dropping it is honest; inventing a gloss would not be.
        stats.skippedNoDefinition += 1
        continue
      }

      const code = record.wordClass ?? ''
      let partOfSpeech = null
      if (code) {
        if (WORD_CLASS[code]) {
          partOfSpeech = WORD_CLASS[code]
        } else {
          partOfSpeech = code
          stats.unknownWordClass.add(code)
        }
      }

      const gloss = definitions.join('; ')
      if (definitions.length > 1) stats.multiSense += 1
      if ((record.examples ?? []).length > 0) stats.withExamples += 1

      rows.push({ word, partOfSpeech, gloss })
    }
  }

  // Deduplicate before anything is written. `on conflict do nothing` cannot
  // rescue a duplicate that occurs *within* a single INSERT statement, so this
  // has to happen here rather than being left to the database. Sorting is stable
  // and input order is already deterministic, so the surviving row is the first
  // occurrence in sorted-key order.
  const seen = new Set()
  const deduped = []
  for (const row of rows) {
    const key = `${row.word}\u0000${row.partOfSpeech ?? ''}`
    if (seen.has(key)) {
      stats.skippedDuplicateInSource += 1
      continue
    }
    seen.add(key)
    deduped.push(row)
  }

  const header = `-- Generated by supabase/import/igbo-api.mjs. Do not edit by hand.
--
-- Source : ${SOURCE_NAME}
-- URL    : ${SOURCE_URL}
-- Licence: ${SOURCE_LICENSE}
--
-- Every row is inserted as 'pending'. Nothing here is published: the public
-- read policy on public.dictionary_entries only returns 'approved' rows.
--
-- Re-running this file is safe. The conflict target matches
-- dictionary_entries_identity_idx (migration 0003).
--
-- Headwords read                     : ${stats.headwords}
-- Rows emitted                       : ${deduped.length}
-- Skipped (no definition)            : ${stats.skippedNoDefinition}
-- Skipped (punctuation only)         : ${stats.skippedPunctuation}
-- Dropped (duplicate inside source)  : ${stats.skippedDuplicateInSource}
-- Rows with >1 sense                 : ${stats.multiSense}
-- Rows with examples in source       : ${stats.withExamples}

-- Each INSERT is a separate statement on purpose. Wrapping all of them in one
-- transaction would let a single bad row roll back the entire import.
`

  const chunks = [header]
  const BATCH = 200

  for (let i = 0; i < deduped.length; i += BATCH) {
    const batch = deduped.slice(i, i + BATCH)
    const values = batch
      .map(
        (row) =>
          `  ('ig', ${sqlText(row.word)}, ${row.partOfSpeech ? sqlText(row.partOfSpeech) : 'null'}, ` +
          `${sqlText(row.gloss)}, 'pending', ${sqlText(SOURCE_NAME)}, ${sqlText(SOURCE_URL)}, ${sqlText(SOURCE_LICENSE)})`,
      )
      .join(',\n')
    chunks.push(
      'insert into public.dictionary_entries\n' +
        '  (language_code, headword, part_of_speech, gloss, review_status, source_name, source_url, source_license)\n' +
        'values\n' +
        values +
        '\non conflict (language_code, headword, part_of_speech) do nothing;\n',
    )
  }

  chunks.push('')
  mkdirSync(dirname(args.out), { recursive: true })
  writeFileSync(args.out, chunks.join('\n'), 'utf8')

  const report = {
    output: args.out,
    headwords: stats.headwords,
    rows: deduped.length,
    skippedNoDefinition: stats.skippedNoDefinition,
    skippedPunctuation: stats.skippedPunctuation,
    multiSense: stats.multiSense,
    withExamples: stats.withExamples,
    unknownWordClass: [...stats.unknownWordClass],
  }
  console.log(JSON.stringify(report, null, 2))
}

main()
