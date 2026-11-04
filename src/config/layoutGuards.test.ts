/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Layout guards for the phone-width requirement.
 *
 * There is no browser in this environment, so horizontal overflow cannot be
 * observed directly. These guards instead reject the two things that *cause* it
 * on a 320–360px screen, which is reliable where eyeballing a screenshot is not:
 *
 *  1. A fixed width wider than the content column, used outside a scroll
 *     container. This is what pushes the whole document sideways.
 *  2. A grid that declares more columns than can fit without a breakpoint.
 *
 * Tables and code blocks are allowed to be wide **if** their wrapper can scroll,
 * because a table that scrolls inside its own box does not move the page.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (full.endsWith('.tsx') && !full.includes('.test.')) out.push(full)
  }
  return out
}

const FILES = walk(join(ROOT, 'features')).concat(walk(join(ROOT, 'pages')))

describe('phone layout', () => {
  it('has no fixed width wider than 360px outside a scroll container', () => {
    const offenders: string[] = []

    for (const file of FILES) {
      const content = readFileSync(file, 'utf8')

      // Split on JSX expressions so a width can be judged by the element's own
      // class list; this is approximate but catches the common case.
      for (const match of content.matchAll(/(?:min-)?w-\[(\d{3,})px\]/g)) {
        const pixels = Number(match[1])
        if (pixels <= 360) continue

        const lineStart = content.lastIndexOf('\n', match.index ?? 0)
        const lineEnd = content.indexOf('\n', match.index ?? 0)
        const line = content.slice(lineStart, lineEnd)

        // Allowed: max-width constraints, and anything explicitly in a scroller.
        if (/max-w-\[/.test(line)) continue
        if (/overflow-x-auto|overflow-auto/.test(line)) continue

        // A wide table is permitted when its wrapper scrolls — checked by
        // looking back a few lines for the scroll utility.
        const context = content.slice(Math.max(0, (match.index ?? 0) - 400), match.index ?? 0)
        if (/overflow-x-auto/.test(context)) continue

        offenders.push(`${file.replace(ROOT, '')}: ${line.trim().slice(0, 100)}`)
      }
    }

    expect(offenders, `These would push the page sideways on a phone:\n${offenders.join('\n')}`).toEqual([])
  })

  it('never declares three or more grid columns without a phone breakpoint', () => {
    const offenders: string[] = []

    for (const file of FILES) {
      const content = readFileSync(file, 'utf8')
      // An unprefixed `grid-cols-N` for N >= 3 applies at every width.
      for (const match of content.matchAll(/(?<![:a-z-])grid-cols-([3-9]|1[0-2])\b/g)) {
        const lineStart = content.lastIndexOf('\n', match.index ?? 0)
        const lineEnd = content.indexOf('\n', match.index ?? 0)
        const line = content.slice(lineStart, lineEnd)

        // A grid that is hidden on phones cannot overflow them. The containing
        // aside can be several hundred characters above the grid, so look back far
        // enough to find it. "It looks fine on my phone" is not an exemption.
        const context = content.slice(Math.max(0, (match.index ?? 0) - 2000), match.index ?? 0)
        const classAttrs = [...context.matchAll(/className="([^"]*)"/g)].map((m) => m[1] ?? '')
        const hiddenOnPhone = classAttrs.some(
          (value) => /(^|\s)hidden(\s|$)/.test(value) && /(^|\s)(sm|md|lg):block/.test(value),
        )
        if (hiddenOnPhone) continue

        offenders.push(`${file.replace(ROOT, '')}: ${line.trim().slice(0, 100)}`)
      }
    }

    expect(offenders, `Unprefixed multi-column grids overflow on phones:\n${offenders.join('\n')}`).toEqual([])
  })

  it('gives every wide table a horizontally scrollable wrapper', () => {
    const pages = walk(join(ROOT, 'features'))
    for (const file of pages) {
      const content = readFileSync(file, 'utf8')
      if (!/<table/.test(content)) continue
      expect(
        content,
        `${file.replace(ROOT, '')} renders a table without an overflow-x-auto wrapper`,
      ).toMatch(/overflow-x-auto[\s\S]{0,200}<table/)
    }
  })
})
