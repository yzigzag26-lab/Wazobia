import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReadAloudPlayer } from './ReadAloudPlayer'
import { lessonLines, storyLines } from './speakable'
import { findLesson } from '../lessons'
import { findStory } from '../stories'

/**
 * Read Aloud behaviour.
 *
 * The critical assertions are about *refusal*, not playback. A player that
 * happily reads Yorùbá with an English voice is worse than one that does
 * nothing, because it teaches wrong pronunciation silently. These tests pin
 * that down:
 *
 *  1. With no SpeechSynthesis API at all → says so, offers no play button.
 *  2. With the API present but no yo/ha/ig voice → refuses, explains, and
 *     **never constructs an utterance**.
 *  3. With a matching voice → speaks with that voice and the right `lang`.
 */

interface FakeVoice {
  readonly name: string
  readonly lang: string
}

const ENGLISH_VOICE: FakeVoice = { name: 'English (Nigeria)', lang: 'en-NG' }
const YORUBA_VOICE: FakeVoice = { name: 'Yorùbá', lang: 'yo-NG' }

/** Minimal SpeechSynthesis stub. Records every utterance that is created. */
function installSpeech(voices: readonly FakeVoice[]) {
  const spoken: { text: string; lang: string; voice: string | undefined }[] = []

  class FakeUtterance {
    text: string
    lang = ''
    rate = 1
    voice: FakeVoice | null = null
    constructor(text: string) {
      this.text = text
    }
    addEventListener() {
      /* The player chains on 'end'; tests do not auto-advance. */
    }
  }

  const synthesis = {
    getVoices: () => voices.map((voice) => ({ ...voice, default: false, localService: true })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    speak: (utterance: FakeUtterance) => {
      spoken.push({
        text: utterance.text,
        lang: utterance.lang,
        voice: utterance.voice?.name,
      })
    },
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  }

  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    configurable: true,
    value: synthesis,
  })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    writable: true,
    configurable: true,
    value: FakeUtterance,
  })
  // jsdom cannot fire `voiceschanged`; the player reads voices on mount anyway.
  void vi

  return { spoken, synthesis }
}

const LINES = [{ id: 'l1', text: 'Báwo ni?', kind: 'paragraph' as const }]

describe('Read Aloud', () => {
  beforeEach(() => {
    // Remove either stub left by a previous test.
    Reflect.deleteProperty(window, 'speechSynthesis')
    Reflect.deleteProperty(window, 'SpeechSynthesisUtterance')
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'speechSynthesis')
    Reflect.deleteProperty(window, 'SpeechSynthesisUtterance')
  })

  it('says the browser cannot synthesise speech when the API is missing', () => {
    render(<ReadAloudPlayer language="yo" lines={LINES} />)
    expect(screen.getByText(/not available in this browser/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^play$/i })).not.toBeInTheDocument()
  })

  it('refuses to read Yorùbá with an English-only voice, and explains why', () => {
    const { spoken } = installSpeech([ENGLISH_VOICE])

    render(<ReadAloudPlayer language="yo" lines={LINES} />)

    expect(screen.getByText(/no approved Yorùbá voice/i)).toBeInTheDocument()
    expect(screen.getByText(/would mispronounce the tone marks/i)).toBeInTheDocument()
    // The decisive assertion: nothing was ever sent to the synthesiser.
    expect(spoken).toEqual([])
    expect(screen.queryByRole('button', { name: /^play$/i })).not.toBeInTheDocument()
  })

  it('refuses for Hausa and Igbo too, rather than falling back to English', () => {
    for (const language of ['ha', 'ig'] as const) {
      const { spoken } = installSpeech([ENGLISH_VOICE])
      const { unmount } = render(<ReadAloudPlayer language={language} lines={LINES} />)

      expect(screen.getByText(/no approved .* voice/i)).toBeInTheDocument()
      // `spoken` is appended to inside the synthesiser stub, so an empty array is
      // proof that nothing reached `speak()`.
      expect(spoken).toEqual([])

      unmount()
    }
  })

  it('plays with the matching voice when one is installed', async () => {
    const { spoken } = installSpeech([ENGLISH_VOICE, YORUBA_VOICE])
    const user = userEvent.setup()

    render(<ReadAloudPlayer language="yo" lines={LINES} />)

    const play = screen.getByRole('button', { name: /^play$/i })
    await user.click(play)

    expect(spoken).toHaveLength(1)
    expect(spoken[0]?.text).toBe('Báwo ni?')
    expect(spoken[0]?.lang).toBe('yo-NG')
    expect(spoken[0]?.voice).toBe('Yorùbá')
  })

  it('does not read English glosses aloud', () => {
    const { spoken } = installSpeech([YORUBA_VOICE])
    render(
      <ReadAloudPlayer
        language="yo"
        lines={[{ id: 'l1', text: 'Ẹ káàárọ̀', kind: 'vocabulary', gloss: 'Good morning' }]}
      />,
    )
    // Only the target-language term is queued; the gloss is for the eye.
    expect(spoken).toEqual([])
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument()
  })
})

describe('speakable extraction', () => {
  it('reads lesson content and never the lesson title or navigation', () => {
    const lesson = findLesson('yo-b-1')
    expect(lesson).toBeDefined()
    if (!lesson) return

    const lines = lessonLines(lesson)
    expect(lines.length).toBeGreaterThan(0)

    const joined = lines.map((line) => line.text).join(' ')
    expect(joined).not.toContain(lesson.title)
    expect(joined).not.toContain(lesson.summary)
    expect(joined).not.toMatch(/Next|Previous|Mark as complete|Breadcrumb/i)
  })

  it('gives every line a unique id', () => {
    const lesson = findLesson('yo-b-1')
    if (!lesson) return
    const ids = lessonLines(lesson).map((line) => line.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('extracts story paragraphs, not metadata', () => {
    const story = findStory('yo-ijapa-ati-egbin')
    expect(story).toBeDefined()
    if (!story) return

    const lines = storyLines(story)
    expect(lines).toHaveLength(story.paragraphs.length)
    expect(lines[0]?.text).toBe(story.paragraphs[0]?.target)
    expect(lines.map((line) => line.text).join(' ')).not.toContain(story.englishTitle)
  })
})
