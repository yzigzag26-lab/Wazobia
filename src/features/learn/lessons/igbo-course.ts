import type { Course, CourseModule, Lesson, VocabularyEntry } from '../types'

/**
 * Igbo beginner course.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Content status: written for WAZOBIA, `unreviewed`.
 *
 * Focus: greetings, the pronoun set, the dotted vowels, and tone. Igbo is tonal
 * and the dotted vowels ị ọ ụ are distinct letters — both points are taught
 * explicitly because neither has an English equivalent to fall back on.
 *
 * Igbo also uses vowel harmony and a syllabic nasal (ṅ) that many fonts drop;
 * the platform's self-hosted font is verified to contain them.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const UNREVIEWED = { provenance: 'original', reviewStatus: 'unreviewed' } as const

const GREETING_VOCAB: readonly VocabularyEntry[] = [
  { term: 'Ndeewo', gloss: 'Greetings (respectful, to a group or an elder)', partOfSpeech: 'greeting' },
  { term: 'Ụtụtụ ọma', gloss: 'Good morning', partOfSpeech: 'greeting' },
  { term: 'Ehihie ọma', gloss: 'Good afternoon', partOfSpeech: 'greeting' },
  { term: 'Mgbede ọma', gloss: 'Good evening', partOfSpeech: 'greeting' },
  { term: 'Kedu?', gloss: 'How are you? (literally: how is it?)', partOfSpeech: 'question' },
  { term: 'Ọ dị mma', gloss: 'It is well / fine', partOfSpeech: 'expression' },
  { term: 'Daalụ', gloss: 'Thank you', partOfSpeech: 'expression' },
  { term: 'Ka ọ dị', gloss: 'Goodbye (leave it so)', partOfSpeech: 'farewell' },
]

const PRONOUN_VOCAB: readonly VocabularyEntry[] = [
  { term: 'Mụ', gloss: 'I / me', partOfSpeech: 'pronoun' },
  { term: 'Gị', gloss: 'you (singular)', partOfSpeech: 'pronoun' },
  { term: 'Ọ', gloss: 'he / she / it', partOfSpeech: 'pronoun', note: 'Igbo does not mark gender in pronouns.' },
  { term: 'Anyị', gloss: 'we / us', partOfSpeech: 'pronoun' },
  { term: 'Ụnụ', gloss: 'you (plural)', partOfSpeech: 'pronoun' },
  { term: 'Ha', gloss: 'they / them', partOfSpeech: 'pronoun' },
]

export const IGBO_MODULES: readonly CourseModule[] = [
  {
    id: 'ig-b-mod-1',
    courseId: 'ig-beginner',
    title: 'Greetings and courtesy',
    summary: 'Kedu, Ndeewo, and the replies expected in return.',
    lessonIds: ['ig-b-1', 'ig-b-2'],
  },
  {
    id: 'ig-b-mod-2',
    courseId: 'ig-beginner',
    title: 'Pronouns',
    summary: 'Who is speaking, singular and plural.',
    lessonIds: ['ig-b-3'],
  },
  {
    id: 'ig-b-mod-3',
    courseId: 'ig-beginner',
    title: 'Dotted vowels and tone',
    summary: 'Ị, ọ and ụ are letters; tone is part of the word.',
    lessonIds: ['ig-b-4'],
  },
]

export const IGBO_LESSONS: readonly Lesson[] = [
  {
    id: 'ig-b-1',
    moduleId: 'ig-b-mod-1',
    title: 'Kedu? — the first exchange',
    summary: 'The question everyone starts with, and how to answer it.',
    minutes: 6,
    provenance: UNREVIEWED,
    quizIds: ['quiz-ig-greetings'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'Kedu? is the core Igbo greeting. It literally asks “how is it?”, and the usual answer is Ọ dị mma — it is well. A greeting is normally followed by a second question, so do not stop at the first reply.',
      },
      { kind: 'vocabulary', entries: GREETING_VOCAB.slice(4, 8) },
      {
        kind: 'example',
        target: '— Kedu? — Ọ dị mma. Gịnị ka ị na-eme?',
        gloss: '— How are you? — I am well. What are you doing?',
        note: 'A typical three-turn opening.',
      },
      {
        kind: 'grammar',
        title: 'The “na-” continuous',
        body: 'ị na-eme — “you are doing”. The prefix na- marks an action in progress. You will see it constantly: na-agba ọsọ (running), na-acha (becoming).',
      },
      {
        kind: 'listening',
        prompt: 'Listen to the greeting exchange.',
        lines: [
          { target: 'Kedu?', gloss: 'How are you?' },
          { target: 'Ọ dị mma', gloss: 'I am well' },
          { target: 'Daalụ', gloss: 'Thank you' },
        ],
      },
    ],
  },
  {
    id: 'ig-b-2',
    moduleId: 'ig-b-mod-1',
    title: 'Ndeewo and the respectful register',
    summary: 'Greeting an elder or a group, and why it is a different word.',
    minutes: 5,
    provenance: UNREVIEWED,
    quizIds: ['quiz-ig-greetings'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'Ndeewo is a greeting of respect, used for a group or for an elder. It is not interchangeable with Kedu for a single friend: the choice signals who you understand yourself to be addressing.',
      },
      {
        kind: 'example',
        target: 'Ndeewo, ndị ọbịa.',
        gloss: 'Welcome, guests.',
        note: 'ndị ọbịa — guests, visitors. Welcoming visitors is a formal act.',
      },
      {
        kind: 'example',
        target: 'Ndeewo, nna m.',
        gloss: 'Greetings, my father.',
      },
      {
        kind: 'grammar',
        title: 'm marks possession',
        body: 'nna m — “father my”. The possessive follows the noun: ụlọ m (my house), aha m (my name).',
      },
      {
        kind: 'vocabulary',
        entries: [
          { term: 'nna', gloss: 'father' },
          { term: 'nne', gloss: 'mother' },
          { term: 'aha', gloss: 'name' },
          { term: 'ndị ọbịa', gloss: 'guests, visitors' },
        ],
      },
    ],
  },
  {
    id: 'ig-b-3',
    moduleId: 'ig-b-mod-2',
    title: 'The pronouns',
    summary: 'Six pronouns, and no gender distinction.',
    minutes: 6,
    provenance: UNREVIEWED,
    quizIds: ['quiz-ig-pronouns'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'Ọ covers he, she and it, exactly as Òun does in Yorùbá. Igbo also has distinct singular and plural “you” — gị and ụnụ — and the plural doubles as the respectful form for one person.',
      },
      { kind: 'vocabulary', entries: PRONOUN_VOCAB },
      {
        kind: 'example',
        target: 'Aha m bụ Ada.',
        gloss: 'My name is Ada.',
        note: 'bụ is the copula: “is”.',
      },
      {
        kind: 'example',
        target: 'Anyị bụ ụmụ akwụkwọ.',
        gloss: 'We are students.',
      },
      {
        kind: 'vocabulary',
        entries: [
          { term: 'bụ', gloss: 'is / are (copula)' },
          { term: 'ụmụ akwụkwọ', gloss: 'students (literally: children of the book)' },
        ],
      },
    ],
  },
  {
    id: 'ig-b-4',
    moduleId: 'ig-b-mod-3',
    title: 'Dotted vowels and tone',
    summary: 'Ị, ọ and ụ are separate letters — and tone changes the word.',
    minutes: 8,
    provenance: UNREVIEWED,
    quizIds: ['quiz-ig-vowels'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'Igbo writes ị, ọ and ụ with a dot below. These are distinct letters with distinct sounds, not versions of i, o and u. Alongside them, tone distinguishes words that otherwise look identical.',
      },
      {
        kind: 'example',
        target: 'ọkụ',
        gloss: 'fire',
        note: 'High tone on the second syllable.',
      },
      {
        kind: 'example',
        target: 'ọkụ̀',
        gloss: 'a call, summons',
        note: 'The low tone on the second syllable makes it another word.',
      },
      {
        kind: 'example',
        target: 'akwụkwọ',
        gloss: 'book, paper',
        note: 'Note the ụ in the second syllable.',
      },
      {
        kind: 'grammar',
        title: 'Vowel harmony',
        body: 'Igbo vowels fall into two sets — a, ọ, ụ and e, i, o — and words normally keep to one set. This is why you will see ọ and o alternate in related forms rather than mix freely.',
      },
      {
        kind: 'vocabulary',
        entries: [
          { term: 'ọkụ', gloss: 'fire' },
          { term: 'akwụkwọ', gloss: 'book, paper' },
          { term: 'ụlọ', gloss: 'house' },
          { term: 'ịhụnanya', gloss: 'love' },
        ],
      },
    ],
  },
]

export const IGBO_COURSES: readonly Course[] = [
  {
    id: 'ig-beginner',
    language: 'ig',
    level: 'beginner',
    title: 'Igbo foundations',
    summary: 'Greetings, pronouns, and the dotted vowels that change the word.',
    moduleIds: ['ig-b-mod-1', 'ig-b-mod-2', 'ig-b-mod-3'],
  },
]
