import { useCallback } from 'react'
import { usePersistentState } from '@/hooks/usePersistentState'
import type { QuizResult } from '../types'

/**
 * Quiz attempt history, per device.
 *
 * Deliberately minimal: the last result per quiz, so an index page can say "best
 * score" honestly and a retry starts from a clean slate. It is not a gradebook —
 * there is no account to attach one to.
 */

const STORAGE_KEY = 'quiz-results.v1'

interface StoredResult extends QuizResult {
  /** ISO timestamp; the quiz itself only needs the score. */
  readonly at: string
}

type ResultMap = Record<string, StoredResult>

function isResultMap(value: unknown): value is ResultMap {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.values(value as Record<string, unknown>).every((entry) => {
    if (typeof entry !== 'object' || entry === null) return false
    const candidate = entry as Partial<StoredResult>
    return (
      typeof candidate.quizId === 'string' &&
      typeof candidate.correct === 'number' &&
      typeof candidate.total === 'number'
    )
  })
}

export function useQuizAttempts() {
  const [results, setResults] = usePersistentState<ResultMap>(STORAGE_KEY, {}, isResultMap)

  const record = useCallback(
    (result: QuizResult) => {
      setResults({
        ...results,
        [result.quizId]: { ...result, at: new Date().toISOString() },
      })
    },
    [results, setResults],
  )

  const bestFor = useCallback(
    (quizId: string) => {
      const entry = results[quizId]
      if (!entry || entry.total === 0) return null
      return { correct: entry.correct, total: entry.total, fraction: entry.correct / entry.total }
    },
    [results],
  )

  return { results, record, bestFor }
}
