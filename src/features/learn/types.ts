import type { LanguageCode } from '@/config/languages'

/**
 * Domain models for the four WAZOBIA Learn experiences.
 *
 * Kept in one file so the hierarchy is readable in a single screen:
 *
 *   Language → Course → Module → Lesson → Content block
 *
 * These are *content* types, not API types. When `GET /api/v1/courses` exists,
 * the server's payload should map onto these shapes so no component changes.
 *
 * Every language-specific field is a `LanguageCode`, never a display string, so
 * nothing here can accidentally hard-code "Yoruba".
 */

/** The three launch languages a learner can actually study. */
export type StudyLanguage = Extract<LanguageCode, 'yo' | 'ha' | 'ig'>

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced'

/**
 * How a piece of content came to exist. This is the honesty axis of the whole
 * module: adapted and newly-authored material must always be labelled, so a
 * learner never mistakes it for a documented traditional source.
 */
export type Provenance =
  /** Widely documented in published collections. `source` names the collection. */
  | 'documented-traditional'
  /** Based on a traditional story, reshaped for learners. Not the original text. */
  | 'adaptation'
  /**
   * Written for WAZOBIA as teaching material. No traditional origin is claimed,
   * and no source is attributed. This is the label that keeps original teaching
   * content from being mistaken for collected cultural material.
   */
  | 'original'

/**
 * Review state. Nothing in this build is `reviewed`, because no native-speaker
 * review has taken place. The UI renders this, so it must stay accurate.
 */
export type ReviewStatus = 'unreviewed' | 'in-review' | 'reviewed'

export interface ContentProvenance {
  readonly provenance: Provenance
  readonly reviewStatus: ReviewStatus
  /** Named source when the item is documented. Never invented. */
  readonly source?: string
  /** Region or dialect note, when the source provides one. */
  readonly region?: string
}

/* ------------------------------------------------------------------- lessons */

/** A block of lesson content. The union is deliberately small and closed. */
export type LessonBlock =
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'vocabulary'; readonly entries: readonly VocabularyEntry[] }
  | {
      readonly kind: 'example'
      readonly target: string
      readonly gloss: string
      readonly note?: string
    }
  | { readonly kind: 'grammar'; readonly title: string; readonly body: string }
  | {
      readonly kind: 'listening'
      /** Shown only when an approved voice exists. See `ReadAloudButton`. */
      readonly prompt: string
      readonly lines: readonly { readonly target: string; readonly gloss: string }[]
    }

export interface VocabularyEntry {
  /** Target-language form, in full orthography with tone marks. */
  readonly term: string
  readonly gloss: string
  /** Part of speech as used in this lesson. Plain English, not an enum, because
   *  the grammars differ across the three languages. */
  readonly partOfSpeech?: string
  readonly note?: string
}

export interface Lesson {
  readonly id: string
  readonly moduleId: string
  readonly title: string
  /** One line, shown in lists. */
  readonly summary: string
  /** Rough time to work through, in minutes. Authored, not measured. */
  readonly minutes: number
  readonly blocks: readonly LessonBlock[]
  /** Ids of quizzes that assess this lesson. */
  readonly quizIds: readonly string[]
  /** Provenance applies to the lesson's linguistic content. */
  readonly provenance: ContentProvenance
}

export interface CourseModule {
  readonly id: string
  readonly courseId: string
  readonly title: string
  readonly summary: string
  readonly lessonIds: readonly string[]
}

export interface Course {
  readonly id: string
  readonly language: StudyLanguage
  readonly level: ProficiencyLevel
  readonly title: string
  readonly summary: string
  readonly moduleIds: readonly string[]
}

/* ------------------------------------------------------------------- quizzes */

export type QuizKind =
  | 'multiple-choice'
  | 'matching'
  | 'sentence-completion'
  | 'translation'
  | 'listening'
  | 'grammar'
  | 'ordering'
  /** Recognising a word's meaning — the workhorse of early vocabulary practice. */
  | 'vocabulary'

export interface QuizChoice {
  readonly id: string
  readonly label: string
}

export interface QuizQuestion {
  readonly id: string
  readonly kind: QuizKind
  /** What the learner is asked. In English — the bridge language. */
  readonly prompt: string
  /**
   * The target-language material under test, when the question is about a
   * specific form. Rendered in the serif face with a `lang` attribute.
   */
  readonly target?: string
  /**
   * Choices for selectable questions. `matching` and `ordering` use
   * `pairs` / `sequence` instead.
   */
  readonly choices?: readonly QuizChoice[]
  /** Correct choice id(s). A single id for most kinds. */
  readonly answer: readonly string[]
  /** Shown after answering, always. Explains why, not just what. */
  readonly explanation: string
  /** Matching questions: left form → right gloss. */
  readonly pairs?: readonly { readonly left: string; readonly right: string }[]
  /** Ordering questions: the correct sequence, presented shuffled to the learner. */
  readonly sequence?: readonly string[]
}

export interface Quiz {
  readonly id: string
  readonly language: StudyLanguage
  readonly level: ProficiencyLevel
  readonly title: string
  readonly instructions: string
  /** The lesson this quiz reinforces, where one exists. */
  readonly lessonId?: string
  readonly questions: readonly QuizQuestion[]
  readonly provenance: ContentProvenance
}

/** A finished attempt. Stored in memory only; no account exists to save it to. */
export interface QuizResult {
  readonly quizId: string
  readonly correct: number
  readonly total: number
  /** Question ids answered incorrectly, for the review screen. */
  readonly incorrectQuestionIds: readonly string[]
}
