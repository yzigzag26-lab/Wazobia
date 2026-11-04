import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { StudyLanguage } from '../types'

/**
 * Read Aloud engine, built on the browser's SpeechSynthesis API.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LIMITATION THIS FILE EXISTS TO HANDLE
 *
 * WAZOBIA has **no approved Yorùbá, Hausa or Igbo TTS voice**. Blueprint §8.4 and
 * §16.2 both flag this: the speech providers evaluated did not cover the three
 * launch languages, and a voice is not available to the platform today.
 *
 * What the browser offers instead is whatever the operating system happens to
 * have installed. So this hook:
 *
 *   1. Enumerates the installed voices.
 *   2. Looks for one whose language tag matches Yorùbá / Hausa / Igbo.
 *   3. If — and only if — a matching voice exists, uses it.
 *   4. If not, **refuses to speak** and reports `unavailable`. It does not
 *      substitute an English voice, because an English voice reading Yorùbá
 *      would mispronounce every tone and teach the learner the wrong thing.
 *
 * That refusal is surfaced in the UI as a plain explanation, not an error
 * dialog, and the interface stays ready for a real TTS integration: swapping in
 * a provider means replacing `speak()` and keeping this hook's shape.
 *
 * This is playback only. It is not speech recognition, not pronunciation
 * scoring, and it makes no claim about the quality of any voice.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** BCP-47 candidates per language. `ng` is included because some OS voice packs
 *  tag Nigerian languages that way rather than with a language-only code. */
const LANGUAGE_TAGS: Record<StudyLanguage, readonly string[]> = {
  yo: ['yo', 'yo-NG'],
  ha: ['ha', 'ha-NG', 'ha-NG-ne'],
  ig: ['ig', 'ig-NG'],
}

export type SpeechStatus =
  /** No matching voice installed — nothing will be spoken. */
  | 'unavailable'
  /** A matching voice exists; playback is possible. */
  | 'ready'
  /** Speaking right now. */
  | 'speaking'
  /** Paused mid-utterance. */
  | 'paused'
  /** The API is missing entirely (old browser, or SSR). */
  | 'unsupported'

export interface UseSpeechResult {
  readonly status: SpeechStatus
  /** Name of the matching voice, for display. `null` when none matched. */
  readonly voiceName: string | null
  /** Index of the line currently being spoken, or -1. */
  readonly activeIndex: number
  readonly rate: number
  readonly setRate: (rate: number) => void
  /** Whether the browser exposes the API at all. */
  readonly supported: boolean
  play: (fromIndex?: number) => void
  pause: () => void
  resume: () => void
  restart: () => void
  next: () => void
  previous: () => void
  /** Speaks one specific line immediately. */
  speakOne: (index: number) => void
  stop: () => void
}

interface Options {
  readonly language: StudyLanguage
  readonly lines: readonly { readonly text: string }[]
}

export function useSpeech({ language, lines }: Options): UseSpeechResult {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const [voices, setVoices] = useState<readonly SpeechSynthesisVoice[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [rate, setRate] = useState(1)
  const [paused, setPaused] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  /**
   * Mirrors of state for the utterance callbacks.
   *
   * `speakAt` must read the *current* lines/rate/index when an utterance ends,
   * but re-creating the callback on every change would restart the chain. They
   * are synced in effects rather than written during render, which is both a
   * React Compiler rule and the correct place for a side effect.
   */
  const linesRef = useRef(lines)
  const rateRef = useRef(rate)
  const indexRef = useRef(-1)
  /**
   * Latest `speakAt`, for the auto-advance chain. An utterance's `end` handler
   * needs to start the next line, and calling through a ref avoids the callback
   * referring to itself while it is being defined (React Compiler rule) and
   * avoids stale closures.
   */
  const speakRef = useRef<(index: number) => void>(() => {})

  useEffect(() => {
    linesRef.current = lines
  }, [lines])

  useEffect(() => {
    rateRef.current = rate
  }, [rate])

  /* Voice list loads asynchronously in Chrome; `voiceschanged` is the signal. */
  useEffect(() => {
    if (!supported) return
    const synth = window.speechSynthesis

    const read = () => setVoices(synth.getVoices())
    read()
    synth.addEventListener('voiceschanged', read)
    return () => synth.removeEventListener('voiceschanged', read)
  }, [supported])

  const matchedVoice = useMemo(() => {
    const wanted = LANGUAGE_TAGS[language]
    const exact = voices.find((voice) => {
      const tag = voice.lang.toLowerCase()
      return wanted.some((candidate) => tag === candidate.toLowerCase())
    })
    if (exact) return exact
    // Prefix match (e.g. "yo-NG" installed when we asked for "yo").
    return voices.find((voice) => {
      const tag = voice.lang.toLowerCase()
      return wanted.some((candidate) => tag.startsWith(`${candidate.toLowerCase()}-`))
    })
  }, [voices, language])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
    setActiveIndex(-1)
    indexRef.current = -1
  }, [supported])

  /**
   * Speaks the line at `index` and chains to the next one on `end`.
   * Chaining manually (rather than queueing every utterance up front) is what
   * makes pause/resume, skip and per-line highlight controllable.
   */
  const speakAt = useCallback(
    (index: number) => {
      if (!supported || !matchedVoice) return
      const line = linesRef.current[index]
      if (!line) {
        setSpeaking(false)
        setActiveIndex(-1)
        indexRef.current = -1
        return
      }

      const synth = window.speechSynthesis
      synth.cancel()

      const utterance = new SpeechSynthesisUtterance(line.text)
      utterance.voice = matchedVoice
      utterance.lang = matchedVoice.lang
      utterance.rate = rateRef.current

      utterance.addEventListener(
        'end',
        () => {
          const nextIndex = indexRef.current + 1
          if (nextIndex < linesRef.current.length) {
            indexRef.current = nextIndex
            setActiveIndex(nextIndex)
            speakRef.current(nextIndex)
          } else {
            setSpeaking(false)
            setActiveIndex(-1)
            indexRef.current = -1
          }
        },
        { once: true },
      )

      utterance.addEventListener(
        'error',
        () => {
          setSpeaking(false)
          setPaused(false)
        },
        { once: true },
      )

      indexRef.current = index
      setActiveIndex(index)
      setSpeaking(true)
      setPaused(false)
      synth.speak(utterance)
    },
    [matchedVoice, supported],
  )

  useEffect(() => {
    speakRef.current = speakAt
  }, [speakAt])

  /* Stop speech when the component unmounts. */
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const play = useCallback(
    (fromIndex?: number) => {
      const start = fromIndex ?? (indexRef.current >= 0 ? indexRef.current : 0)
      speakAt(start)
    },
    [speakAt],
  )

  const pause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
    setPaused(true)
  }, [supported])

  const resume = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.resume()
    setPaused(false)
  }, [supported])

  const restart = useCallback(() => {
    speakAt(0)
  }, [speakAt])

  const next = useCallback(() => {
    const nextIndex = Math.min(indexRef.current + 1, linesRef.current.length - 1)
    if (nextIndex >= 0) speakAt(nextIndex)
  }, [speakAt])

  const previous = useCallback(() => {
    const prevIndex = Math.max(indexRef.current - 1, 0)
    speakAt(prevIndex)
  }, [speakAt])

  const speakOne = useCallback(
    (index: number) => {
      speakAt(index)
    },
    [speakAt],
  )

  const status: SpeechStatus = !supported
    ? 'unsupported'
    : !matchedVoice
      ? 'unavailable'
      : speaking && paused
        ? 'paused'
        : speaking
          ? 'speaking'
          : 'ready'

  return {
    status,
    voiceName: matchedVoice?.name ?? null,
    activeIndex,
    rate,
    setRate,
    supported,
    play,
    pause,
    resume,
    restart,
    next,
    previous,
    speakOne,
    stop,
  }
}

/** The language name shown in the "no voice" explanation. */
export const STUDY_LANGUAGE_NAMES: Record<StudyLanguage, string> = {
  yo: 'Yorùbá',
  ha: 'Hausa',
  ig: 'Igbo',
}
