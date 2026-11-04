#!/usr/bin/env node
/**
 * One-off loader helper: prints the next pending batch as a JSON payload on
 * stdout so it can be handed to the Supabase connector tool verbatim.
 *
 * Not used by the app. Kept in supabase/import/ as a record of how the data
 * was loaded, because "it appeared in the database" is not provenance.
 *
 * Usage: node supabase/import/next-batch.mjs <dir> <index>
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
const index = Number(process.argv[3] ?? '0')
if (!dir) {
  console.error('usage: next-batch.mjs <dir> <index>')
  process.exit(1)
}

const name = `b${String(index).padStart(3, '0')}.sql`
const path = join(dir, name)
if (!existsSync(path)) {
  console.log(JSON.stringify({ done: true, next: null }))
  process.exit(0)
}

const sql = readFileSync(path, 'utf8')
process.stdout.write(
  JSON.stringify({
    index,
    file: name,
    rows: sql.split("('ig',").length - 1,
    sql,
    next: `b${String(index + 1).padStart(3, '0')}.sql`,
  }),
)
