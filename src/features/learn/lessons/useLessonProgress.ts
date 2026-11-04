import { useCallback, useMemo } from 'react'
import { usePersistentState } from '@/hooks/usePersistentState'

/**
 * Lesson completion, stored on this device.
 *
 * Deliberately *not* in a React context. It is a flat list of lesson ids under
 * one storage key; nothing distant needs to subscribe to it, and the only two
 * readers (course page, lesson page) never render at the same time because they
 * are separate routes. A provider here would be state machinery in search of a
 * problem, which the brief rules out.
 */

const STORAGE_KEY = 'lesson-progress.v1'

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export interface LessonProgress {
  readonly completedLessonIds: readonly string[]
  readonly isComplete: (lessonId: string) => boolean
  readonly markComplete: (lessonId: string) => void
  readonly markIncomplete: (lessonId: string) => void
  readonly completedCount: number
}

export function useLessonProgress(): LessonProgress {
  const [ids, setIds] = usePersistentState<string[]>(STORAGE_KEY, [], isStringArray)
  const { recordActivity } = useStudyStreak()

  const markComplete = useCallback(
    (lessonId: string) => {
      if (ids.includes(lessonId)) return
      setIds([...ids, lessonId])
      recordActivity()
    },
    [ids, setIds, recordActivity],
  )

  const markIncomplete = useCallback(
    (lessonId: string) => {
      setIds(ids.filter((id) => id !== lessonId))
    },
    [ids, setIds],
  )

  return useMemo(
    () => ({
      completedLessonIds: ids,
      isComplete: (lessonId: string) => ids.includes(lessonId),
      markComplete,
      markIncomplete,
      completedCount: ids.length,
    }),
    [ids, markComplete, markIncomplete],
  )
}

/**
 * A study streak, counted from the last day a lesson was completed.
 *
 * A real count of real completions on this device — not a gamified fiction. It
 * does not survive cleared storage, and it is not synced anywhere. Every surface
 * that shows it says so.
 */
const STREAK_KEY = 'study-streak.v1'

interface StreakRecord {
  readonly lastActiveDay: string
  readonly days: number
}

function isStreakRecord(value: unknown): value is StreakRecord {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<StreakRecord>
  return typeof candidate.lastActiveDay === 'string' && typeof candidate.days === 'number'
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function dayBefore(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  parsed.setUTCDate(parsed.getUTCDate() - 1)
  return parsed.toISOString().slice(0, 10)
}

export function useStudyStreak() {
  // `null` is a valid "never studied" state and must survive the guard.
  const [record, setRecord] = usePersistentState<StreakRecord | null>(
    STREAK_KEY,
    null,
    (value): value is StreakRecord | null => value === null || isStreakRecord(value),
  )

  const recordActivity = useCallback(() => {
    const now = today()
    if (!record) {
      setRecord({ lastActiveDay: now, days: 1 })
      return
    }
    if (record.lastActiveDay === now) return
    const consecutive = record.lastActiveDay === dayBefore(now)
    setRecord({ lastActiveDay: now, days: consecutive ? record.days + 1 : 1 })
  }, [record, setRecord])

  /**
   * A streak broken by a missed day reads as 0 rather than as the stale count —
   * the number on screen must mean what it says.
   */
  const currentDays = useMemo(() => {
    if (!record) return 0
    const now = today()
    if (record.lastActiveDay === now || record.lastActiveDay === dayBefore(now)) return record.days
    return 0
  }, [record])

  return { currentDays, recordActivity }
}

export const PROGRESS_STORAGE_KEYS = { lessons: `wazobia.${STORAGE_KEY}` } as const

/** Resets device-local learning state. Used by "delete my data" in Settings. */
export function clearLearningProgress(): void {
  try {
    window.localStorage.removeItem(`wazobia.${STORAGE_KEY}`)
    window.localStorage.removeItem(`wazobia.${STREAK_KEY}`)
  } catch {
    /* Nothing to do if storage is unavailable. */
  }
}
