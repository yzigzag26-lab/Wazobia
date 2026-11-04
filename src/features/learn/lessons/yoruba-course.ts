import type { Course, CourseModule, Lesson, VocabularyEntry } from '../types'

/**
 * Yorùbá beginner course.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Content status: written for WAZOBIA, `unreviewed`.
 *
 * The teaching points here are deliberately conservative — greetings, the
 * pronoun set, tone as meaning, noun-class-free simple sentences — because they
 * are the areas where an error would teach a learner something wrong. A native
 * speaker must review tone and register before launch.
 *
 * Tone marks are written on every example sentence. They are not decoration: in
 * `ọkọ` (husband) / `ọkọ̀` (vehicle) / `ọ̀kọ̀` (spear) the marks are the word.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const UNREVIEWED = { provenance: 'original', reviewStatus: 'unreviewed' } as const

const GREETINGS_VOCAB: readonly VocabularyEntry[] = [
  { term: 'Ẹ káàárọ̀', gloss: 'Good morning', partOfSpeech: 'greeting', note: 'Ẹ is the respectful plural/formal “you”.' },
  { term: 'Ẹ káàsán', gloss: 'Good afternoon', partOfSpeech: 'greeting' },
  { term: 'Ẹ káalẹ́', gloss: 'Good evening', partOfSpeech: 'greeting' },
  { term: 'Ẹ káalẹ́', gloss: 'Good night', partOfSpeech: 'greeting', note: 'Same form as the evening greeting.' },
  { term: 'Báwo ni?', gloss: 'How is it? / How are you?', partOfSpeech: 'question' },
  { term: 'Ó dàbọ̀', gloss: 'Goodbye (to someone leaving)', partOfSpeech: 'greeting' },
  { term: 'Ó dàárọ̀', gloss: 'Good night / see you tomorrow', partOfSpeech: 'greeting' },
  { term: 'Ẹ ṣé', gloss: 'Thank you', partOfSpeech: 'expression', note: 'The most common form of thanks.' },
]

const PRONOUN_VOCAB: readonly VocabularyEntry[] = [
  { term: 'Èmi', gloss: 'I / me', partOfSpeech: 'pronoun' },
  { term: 'Ìwọ', gloss: 'you (singular)', partOfSpeech: 'pronoun' },
  { term: 'Òun', gloss: 'he / she / it', partOfSpeech: 'pronoun', note: 'Yorùbá has no gender distinction in pronouns.' },
  { term: 'Àwa', gloss: 'we / us', partOfSpeech: 'pronoun' },
  { term: 'Ẹ̀yin', gloss: 'you (plural / respectful)', partOfSpeech: 'pronoun' },
  { term: 'Àwọn', gloss: 'they / them', partOfSpeech: 'pronoun' },
]

export const YORUBA_MODULES: readonly CourseModule[] = [
  {
    id: 'yo-b-mod-1',
    courseId: 'yo-beginner',
    title: 'Greetings and first contact',
    summary: 'The greetings that open almost every Yorùbá conversation, and when each is used.',
    lessonIds: ['yo-b-1', 'yo-b-2'],
  },
  {
    id: 'yo-b-mod-2',
    courseId: 'yo-beginner',
    title: 'Who is speaking',
    summary: 'Pronouns, and the difference between the singular and respectful forms.',
    lessonIds: ['yo-b-3'],
  },
  {
    id: 'yo-b-mod-3',
    courseId: 'yo-beginner',
    title: 'Tone carries meaning',
    summary: 'Why the marks are part of the word, demonstrated with minimal pairs.',
    lessonIds: ['yo-b-4'],
  },
]

export const YORUBA_LESSONS: readonly Lesson[] = [
  {
    id: 'yo-b-1',
    moduleId: 'yo-b-mod-1',
    title: 'Morning, afternoon and evening',
    summary: 'Three greetings, one for each part of the day.',
    minutes: 6,
    provenance: UNREVIEWED,
    quizIds: ['quiz-yo-greetings'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'Yorùbá greetings are tied to the time of day, and choosing the wrong one is a small but noticeable error. Each greeting below begins with Ẹ — the respectful “you” — which is the safe default with anyone you have not met before.',
      },
      { kind: 'vocabulary', entries: GREETINGS_VOCAB.slice(0, 4) },
      {
        kind: 'grammar',
        title: 'Ẹ is not simply “you”',
        body: 'Ẹ is the plural form of “you” used for one person to show respect — the same instinct as French vous. With close friends and children you may hear the singular forms instead. Using Ẹ with everyone is never rude; using the singular form with an elder can be.',
      },
      {
        kind: 'example',
        target: 'Ẹ káàárọ̀, Bàbá.',
        gloss: 'Good morning, father.',
        note: 'Bàbá is used for a father and, respectfully, for an older man.',
      },
      {
        kind: 'example',
        target: 'Ẹ káàsán, Ọ̀gá.',
        gloss: 'Good afternoon, boss/sir.',
      },
      {
        kind: 'listening',
        prompt: 'Listen to the three greetings in order.',
        lines: [
          { target: 'Ẹ káàárọ̀', gloss: 'Good morning' },
          { target: 'Ẹ káàsán', gloss: 'Good afternoon' },
          { target: 'Ẹ káalẹ́', gloss: 'Good evening' },
        ],
      },
    ],
  },
  {
    id: 'yo-b-2',
    moduleId: 'yo-b-mod-1',
    title: 'Asking how someone is',
    summary: 'Báwo ni?, and the replies that keep a greeting going.',
    minutes: 5,
    provenance: UNREVIEWED,
    quizIds: ['quiz-yo-greetings'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'A greeting in Yorùbá is rarely a single exchange. After the time-of-day greeting comes an enquiry, and the reply is expected even if the answer is brief.',
      },
      {
        kind: 'vocabulary',
        entries: [
          { term: 'Báwo ni?', gloss: 'How is it? / How are you?' },
          { term: 'Dáadáa ni', gloss: 'It is well', note: 'The standard positive reply.' },
          { term: 'Ó ṣe', gloss: 'Thank you / it is done', note: 'Shorter and more casual than Ẹ ṣé.' },
        ],
      },
      {
        kind: 'example',
        target: '— Báwo ni? — Dáadáa ni, ẹ ṣé.',
        gloss: '— How are you? — I am well, thank you.',
        note: 'The dash marks the two speakers.',
      },
      {
        kind: 'grammar',
        title: 'ni marks the statement',
        body: 'Dáadáa ni — literally “well it-is”. The particle ni closes an equative sentence, saying that the thing named is the case. You will meet it constantly.',
      },
    ],
  },
  {
    id: 'yo-b-3',
    moduleId: 'yo-b-mod-2',
    title: 'The pronouns',
    summary: 'Six pronouns, and why there is no “he” or “she”.',
    minutes: 7,
    provenance: UNREVIEWED,
    quizIds: ['quiz-yo-pronouns'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'Òun covers he, she and it. Yorùbá does not mark gender on pronouns, so context or a name does the work that English does with he and she.',
      },
      { kind: 'vocabulary', entries: PRONOUN_VOCAB },
      {
        kind: 'grammar',
        title: 'Two forms of “you”',
        body: 'Ìwọ is one person. Ẹ̀yin is more than one person — and, as with Ẹ in the greetings, a respectful way of addressing a single person. The same split appears across the pronoun set.',
      },
      {
        kind: 'example',
        target: 'Èmi ni Adé.',
        gloss: 'I am Adé.',
        note: 'ni again: “I it-is Adé”.',
      },
      {
        kind: 'example',
        target: 'Àwọn wá.',
        gloss: 'They came.',
      },
      {
        kind: 'vocabulary',
        entries: [{ term: 'wá', gloss: 'come / came', partOfSpeech: 'verb' }],
      },
    ],
  },
  {
    id: 'yo-b-4',
    moduleId: 'yo-b-mod-3',
    title: 'Why the tone marks matter',
    summary: 'Three words that differ only in tone, and what that means for your learning.',
    minutes: 8,
    provenance: UNREVIEWED,
    quizIds: ['quiz-yo-tone'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'Yorùbá is a tonal language. The marks are not accents for decoration: they are written to tell you the pitch, and the pitch is part of the word. Read the three forms below aloud in order — high, mid, low.',
      },
      {
        kind: 'example',
        target: 'ọkọ',
        gloss: 'husband',
        note: 'Mid tone on both syllables.',
      },
      {
        kind: 'example',
        target: 'ọkọ̀',
        gloss: 'vehicle, canoe',
        note: 'Low tone on the second syllable changes the meaning entirely.',
      },
      {
        kind: 'example',
        target: 'ọ̀kọ̀',
        gloss: 'spear',
        note: 'Low tone on both.',
      },
      {
        kind: 'grammar',
        title: 'The sub-dot is a different letter',
        body: 'ẹ, ọ and ṣ are distinct letters, not variants of e, o and s. The dot below changes the sound and therefore the word. This is also why WAZOBIA stores text as UTF-8 and renders it in fonts verified to contain these characters — a font without them shows boxes, and a “cleanup” step that strips them corrupts the language.',
      },
      {
        kind: 'vocabulary',
        entries: [
          { term: 'ọkọ', gloss: 'husband', note: 'Compare: ọkọ̀ vehicle, ọ̀kọ̀ spear.' },
          { term: 'ọkọ̀', gloss: 'vehicle' },
          { term: 'ọ̀kọ̀', gloss: 'spear' },
          { term: 'ilé', gloss: 'house' },
          { term: 'ìlé', gloss: 'home (as a place of belonging)' },
        ],
      },
    ],
  },
]

export const YORUBA_COURSES: readonly Course[] = [
  {
    id: 'yo-beginner',
    language: 'yo',
    level: 'beginner',
    title: 'Yorùbá foundations',
    summary: 'Greetings, pronouns and tone — the three things that make everything else possible.',
    moduleIds: ['yo-b-mod-1', 'yo-b-mod-2', 'yo-b-mod-3'],
  },
]
