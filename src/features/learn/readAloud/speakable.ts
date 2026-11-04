import type { Lesson } from '../types'
import type { Story } from '../stories/types'

/**
 * Extraction of *readable* content from a lesson or story.
 *
 * This is the boundary that keeps Read Aloud honest: it decides what counts as
 * "the content" and excludes everything else. Navigation labels, buttons, the
 * page title, badges and the illustration are never in here, because they are
 * not part of what the learner is studying.
 *
 * The output is a flat, ordered list of sentences so the player can highlight
 * and replay one at a time. Language is carried alongside because the voice
 * choice depends on it, and a wrong-language voice must never be used silently.
 */

export interface SpeakableLine {
  /** Stable across renders — used as a React key and to find the active line. */
  readonly id: string
  /** The text to speak, in the source language. */
  readonly text: string
  /** What the line is, so the UI can label it (e.g. "Example 2"). */
  readonly kind: 'paragraph' | 'example' | 'grammar' | 'vocabulary' | 'listening'
  /** Optional English gloss, shown but never spoken. */
  readonly gloss?: string
}

/** Splits on sentence enders that are safe for these languages. */
function splitSentences(text: string): readonly string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

export function lessonLines(lesson: Lesson): readonly SpeakableLine[] {
  const lines: SpeakableLine[] = []
  let index = 0

  for (const block of lesson.blocks) {
    if (block.kind === 'paragraph') {
      for (const sentence of splitSentences(block.text)) {
        index += 1
        lines.push({ id: `l${index}`, text: sentence, kind: 'paragraph' })
      }
    } else if (block.kind === 'example') {
      index += 1
      // Only the target-language form is spoken. The gloss is English, and
      // reading it aloud in a Yorùbá voice would be nonsense.
      lines.push({ id: `l${index}`, text: block.target, kind: 'example', gloss: block.gloss })
    } else if (block.kind === 'grammar') {
      for (const sentence of splitSentences(block.body)) {
        index += 1
        lines.push({ id: `l${index}`, text: sentence, kind: 'grammar' })
      }
    } else if (block.kind === 'vocabulary') {
      // Vocabulary terms are pronounced one at a time — that is the point of
      // hearing them. The English gloss is not spoken.
      for (const entry of block.entries) {
        index += 1
        lines.push({ id: `l${index}`, text: entry.term, kind: 'vocabulary', gloss: entry.gloss })
      }
    } else if (block.kind === 'listening') {
      for (const line of block.lines) {
        index += 1
        lines.push({ id: `l${index}`, text: line.target, kind: 'listening', gloss: line.gloss })
      }
    }
  }

  return lines
}

export function storyLines(story: Story): readonly SpeakableLine[] {
  return story.paragraphs.map((paragraph, index) => ({
    id: `s${index + 1}`,
    text: paragraph.target,
    kind: 'paragraph' as const,
    ...(paragraph.english ? { gloss: paragraph.english } : {}),
  }))
}
