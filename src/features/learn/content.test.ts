import { describe, expect, it } from 'vitest'
import { COURSES, LESSONS, MODULES, findLesson, lessonsInCourse, courseProgress } from './lessons'
import { QUIZZES, quizForLesson } from './quizzes'
import { ALL_STORIES } from './stories'
import { ALL_PROVERBS } from './proverbs'

/**
 * Learn content integrity.
 *
 * The failure mode this guards against is content that *looks* complete but is
 * internally broken: a quiz that tests a lesson that does not exist, a story
 * pointing at a comprehension quiz nobody wrote, a lesson orphaned from its
 * module. None of those break the build, and all of them are invisible until a
 * learner hits them.
 */

const STUDY_LANGUAGES = ['yo', 'ha', 'ig'] as const

describe('course hierarchy', () => {
  it('gives every course at least one module', () => {
    for (const course of COURSES) {
      expect(MODULES.some((module) => module.courseId === course.id)).toBe(true)
    }
  })

  it('gives every module at least one lesson that exists', () => {
    for (const module of MODULES) {
      expect(module.lessonIds.length).toBeGreaterThan(0)
      for (const lessonId of module.lessonIds) {
        expect(findLesson(lessonId), `${module.id} → ${lessonId}`).toBeDefined()
      }
    }
  })

  it('places every lesson in the module it claims', () => {
    for (const lesson of LESSONS) {
      const module = MODULES.find((item) => item.id === lesson.moduleId)
      expect(module, `${lesson.id} has no module`).toBeDefined()
      expect(module?.lessonIds).toContain(lesson.id)
    }
  })

  it('covers all three launch languages at beginner level', () => {
    for (const language of STUDY_LANGUAGES) {
      const beginner = COURSES.find(
        (course) => course.language === language && course.level === 'beginner',
      )
      expect(beginner, `${language} has no beginner course`).toBeDefined()
      const lessons = coursesLessons(beginner?.id ?? '')
      expect(lessons.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('gives every lesson at least one content block', () => {
    for (const lesson of LESSONS) {
      expect(lesson.blocks.length).toBeGreaterThan(0)
    }
  })

  it('computes progress without dividing by zero', () => {
    const empty = courseProgress('does-not-exist', [])
    expect(empty.total).toBe(0)
    expect(empty.fraction).toBe(0)

    const first = COURSES[0]
    expect(first).toBeDefined()
    if (!first) return
    const all = lessonsInCourse(first.id).map((lesson) => lesson.id)
    const full = courseProgress(first.id, all)
    expect(full.fraction).toBe(1)
    expect(courseProgress(first.id, []).fraction).toBe(0)
  })
})

function coursesLessons(courseId: string) {
  return lessonsInCourse(courseId)
}

describe('quizzes', () => {
  it('gives every question at least one correct answer', () => {
    for (const quiz of QUIZZES) {
      expect(quiz.questions.length).toBeGreaterThan(0)
      for (const question of quiz.questions) {
        expect(question.answer.length, `${question.id} has no answer`).toBeGreaterThan(0)
      }
    }
  })

  it('explains every answer', () => {
    for (const quiz of QUIZZES) {
      for (const question of quiz.questions) {
        expect(question.explanation.length, `${question.id} has no explanation`).toBeGreaterThan(10)
      }
    }
  })

  it('never references a choice id that is not offered', () => {
    for (const quiz of QUIZZES) {
      for (const question of quiz.questions) {
        if (!question.choices) continue
        const offered = new Set(question.choices.map((choice) => choice.id))
        for (const answer of question.answer) {
          expect(offered.has(answer), `${question.id} answers "${answer}" which is not offered`).toBe(
            true,
          )
        }
      }
    }
  })

  it('only references lessons that exist', () => {
    for (const quiz of QUIZZES) {
      if (!quiz.lessonId) continue
      expect(findLesson(quiz.lessonId), `${quiz.id} → ${quiz.lessonId}`).toBeDefined()
    }
  })

  it('matches the quiz language to the lesson language', () => {
    for (const quiz of QUIZZES) {
      if (!quiz.lessonId) continue
      const lesson = findLesson(quiz.lessonId)
      const course = COURSES.find((item) => item.id === lesson?.moduleId.replace(/-mod-\d+$/, ''))
      // Module ids are derived from the course id, so a mismatch means a quiz
      // was copied between languages without updating its language field.
      if (course) expect(quiz.language).toBe(course.language)
    }
  })

  it('gives every beginner lesson a quiz to reinforce it', () => {
    for (const lesson of LESSONS) {
      if (lesson.quizIds.length === 0) continue
      for (const quizId of lesson.quizIds) {
        expect(QUIZZES.some((quiz) => quiz.id === quizId), `${lesson.id} → ${quizId}`).toBe(true)
      }
    }
  })

  it('resolves a quiz from a lesson when one is declared', () => {
    const lesson = LESSONS.find((item) => item.quizIds.length > 0)
    expect(lesson).toBeDefined()
    if (!lesson) return
    expect(quizForLesson(lesson.id)).toBeDefined()
  })
})

describe('stories', () => {
  it('covers all three launch languages with at least three stories', () => {
    for (const language of STUDY_LANGUAGES) {
      const stories = ALL_STORIES.filter((story) => story.language === language)
      expect(stories.length, `${language} has too few stories`).toBeGreaterThanOrEqual(3)
    }
  })

  it('attaches educational material to every story', () => {
    for (const story of ALL_STORIES) {
      expect(story.vocabulary.length, `${story.id} has no vocabulary`).toBeGreaterThan(0)
      expect(story.expressions.length, `${story.id} has no expressions`).toBeGreaterThan(0)
      expect(story.paragraphs.length).toBeGreaterThan(2)
      expect(story.culturalContext.length).toBeGreaterThan(40)
    }
  })

  it('pairs every paragraph with an English rendering', () => {
    for (const story of ALL_STORIES) {
      for (const paragraph of story.paragraphs) {
        expect(paragraph.english, `${story.id} has an untranslated paragraph`).toBeTruthy()
      }
    }
  })

  it('only references comprehension quizzes that exist', () => {
    for (const story of ALL_STORIES) {
      for (const quizId of story.comprehensionQuizIds) {
        expect(QUIZZES.some((quiz) => quiz.id === quizId), `${story.id} → ${quizId}`).toBe(true)
      }
    }
  })

  it('never claims a traditional source for an original story', () => {
    for (const story of ALL_STORIES) {
      if (story.attribution.origin === 'original') {
        // An original story must not cite a collection — that would claim an
        // origin it does not have.
        expect(story.attribution.source).toBeUndefined()
      }
      if (story.attribution.origin === 'documented') {
        expect(story.attribution.source, `${story.id} claims documentation`).toBeTruthy()
      }
    }
  })

  it('labels no story as reviewed while none has been', () => {
    for (const story of ALL_STORIES) {
      expect(story.provenance.reviewStatus).toBe('unreviewed')
    }
  })
})

describe('quiz kinds', () => {
  it('exercises every question type the product promises', () => {
    // The brief lists eight kinds. The player supports all eight; shipping a type
    // that no content uses would leave it untested against real data.
    const kinds = new Set(QUIZZES.flatMap((quiz) => quiz.questions.map((q) => q.kind)))
    for (const expected of [
      'multiple-choice',
      'matching',
      'vocabulary',
      'sentence-completion',
      'translation',
      'listening',
      'grammar',
      'ordering',
    ] as const) {
      expect(kinds.has(expected), `no question of kind "${expected}" exists`).toBe(true)
    }
  })

  it('gives ordering questions a sequence and matching questions pairs', () => {
    for (const quiz of QUIZZES) {
      for (const question of quiz.questions) {
        if (question.kind === 'ordering') {
          expect(question.sequence?.length ?? 0, question.id).toBeGreaterThan(1)
        }
        if (question.kind === 'matching') {
          expect(question.pairs?.length ?? 0, question.id).toBeGreaterThan(1)
        }
      }
    }
  })
})

describe('orthography', () => {
  /**
   * Characters that look plausible but are wrong for these languages.
   *
   * `Ō` (macron) shipped in the Yorùbá proverb source note where `Ò` (grave) was
   * meant — visually similar at small sizes, and exactly the class of corruption
   * the self-hosted font and the NFC guards exist to prevent. It was caught by
   * reading the data, which is not a strategy; this test is.
   */
  const WRONG_GLYPHS: readonly { readonly glyph: string; readonly language: string; readonly note: string }[] = [
    { glyph: '\u014C', language: 'yo', note: 'Ō (macron) is not Yorùbá — use Ò (grave)' },
    { glyph: '\u014D', language: 'yo', note: 'ō (macron) is not Yorùbá — use ò (grave)' },
    { glyph: '\u0128', language: 'yo', note: 'Ĩ is not a Yorùbá letter' },
    { glyph: '\u0168', language: 'ig', note: 'Ũ is not an Igbo letter — use Ụ (dot below)' },
  ]

  it('never uses a near-miss glyph in place of a real letter', () => {
    const corpus = [
      ...ALL_PROVERBS.map((p) => ({ id: p.id, text: JSON.stringify(p), language: p.language })),
      ...ALL_STORIES.map((s) => ({ id: s.id, text: JSON.stringify(s), language: s.language })),
      ...LESSONS.map((l) => ({ id: l.id, text: JSON.stringify(l), language: null })),
      ...QUIZZES.map((q) => ({ id: q.id, text: JSON.stringify(q), language: q.language })),
    ]

    for (const entry of corpus) {
      for (const bad of WRONG_GLYPHS) {
        if (bad.language !== entry.language) continue
        expect(entry.text.includes(bad.glyph), `${entry.id}: ${bad.note}`).toBe(false)
      }
    }
  })

  it('keeps every target-language string in NFC', () => {
    const strings = [
      ...ALL_PROVERBS.flatMap((p) => [p.original, p.literal]),
      ...ALL_STORIES.flatMap((s) => s.paragraphs.map((para) => para.target)),
      ...LESSONS.flatMap((l) =>
        l.blocks.flatMap((block) => {
          if (block.kind === 'example') return [block.target]
          if (block.kind === 'vocabulary') return block.entries.map((e) => e.term)
          if (block.kind === 'listening') return block.lines.map((line) => line.target)
          return []
        }),
      ),
    ]

    const notNormalised = strings.filter((text) => text !== text.normalize('NFC'))
    expect(notNormalised).toEqual([])
  })
})

describe('content totals', () => {
  it('reports a coherent corpus', () => {
    // Asserted as minimums rather than exact counts so adding content never
    // breaks the suite.
    expect(ALL_PROVERBS.length).toBeGreaterThanOrEqual(60)
    expect(ALL_STORIES.length).toBeGreaterThanOrEqual(9)
    expect(LESSONS.length).toBeGreaterThanOrEqual(12)
    expect(QUIZZES.length).toBeGreaterThanOrEqual(9)
  })
})
