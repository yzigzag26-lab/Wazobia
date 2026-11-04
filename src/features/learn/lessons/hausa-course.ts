import type { Course, CourseModule, Lesson, VocabularyEntry } from '../types'

/**
 * Hausa beginner course.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Content status: written for WAZOBIA, `unreviewed`.
 *
 * Focus areas chosen because they are foundational and low-risk to teach:
 * greetings and the respectful register, the pronoun set, and grammatical
 * gender — Hausa nouns are masculine or feminine and the agreement shows up
 * immediately, so a learner needs it early.
 *
 * Hooked letters (ɓ ɗ ƙ) are letters, not accents: `ɓera` (mouse) and `bera`
 * are different words. They are preserved throughout.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const UNREVIEWED = { provenance: 'original', reviewStatus: 'unreviewed' } as const

const GREETING_VOCAB: readonly VocabularyEntry[] = [
  { term: 'Sannu', gloss: 'Hello / sorry / well done', partOfSpeech: 'greeting', note: 'The most versatile Hausa greeting; it also carries sympathy or congratulation depending on tone of voice and context.' },
  { term: 'Ina kwana?', gloss: 'Good morning (literally: how was the sleeping?)', partOfSpeech: 'greeting' },
  { term: 'Ina wuni?', gloss: 'Good afternoon (how is the day going?)', partOfSpeech: 'greeting' },
  { term: 'Ina yini?', gloss: 'Good afternoon / how is your day?', partOfSpeech: 'greeting' },
  { term: 'Sai anjima', gloss: 'See you later', partOfSpeech: 'farewell' },
  { term: 'Sai gobe', gloss: 'See you tomorrow', partOfSpeech: 'farewell' },
  { term: 'Na gode', gloss: 'Thank you', partOfSpeech: 'expression' },
  { term: 'Yauwa', gloss: 'Well then / alright / good', partOfSpeech: 'expression' },
]

const PRONOUN_VOCAB: readonly VocabularyEntry[] = [
  { term: 'Ni', gloss: 'I / me', partOfSpeech: 'pronoun' },
  { term: 'Kai', gloss: 'you (masculine singular)', partOfSpeech: 'pronoun' },
  { term: 'Ke', gloss: 'you (feminine singular)', partOfSpeech: 'pronoun' },
  { term: 'Shi', gloss: 'he / him', partOfSpeech: 'pronoun' },
  { term: 'Ita', gloss: 'she / her', partOfSpeech: 'pronoun' },
  { term: 'Mu', gloss: 'we / us', partOfSpeech: 'pronoun' },
  { term: 'Ku', gloss: 'you (plural)', partOfSpeech: 'pronoun' },
  { term: 'Su', gloss: 'they / them', partOfSpeech: 'pronoun' },
]

export const HAUSA_MODULES: readonly CourseModule[] = [
  {
    id: 'ha-b-mod-1',
    courseId: 'ha-beginner',
    title: 'Greetings and respect',
    summary: 'The greetings that open a Hausa conversation, and the register that goes with them.',
    lessonIds: ['ha-b-1', 'ha-b-2'],
  },
  {
    id: 'ha-b-mod-2',
    courseId: 'ha-beginner',
    title: 'Pronouns and gender',
    summary: 'Who is speaking, and why Hausa separates masculine from feminine.',
    lessonIds: ['ha-b-3'],
  },
  {
    id: 'ha-b-mod-3',
    courseId: 'ha-beginner',
    title: 'The hooked letters',
    summary: 'Ɓ, ɗ and ƙ — three letters that change the word.',
    lessonIds: ['ha-b-4'],
  },
]

export const HAUSA_LESSONS: readonly Lesson[] = [
  {
    id: 'ha-b-1',
    moduleId: 'ha-b-mod-1',
    title: 'Ina kwana? — greeting by time of day',
    summary: 'Morning, afternoon and evening greetings, and the replies that follow.',
    minutes: 6,
    provenance: UNREVIEWED,
    quizIds: ['quiz-ha-greetings'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'Hausa greetings are questions. Ina kwana? asks literally how the night passed; the expected reply confirms it went well. Answering with a bare “hello” is not wrong, but it is thin — the exchange is supposed to run for several turns.',
      },
      { kind: 'vocabulary', entries: GREETING_VOCAB.slice(0, 4) },
      {
        kind: 'example',
        target: '— Ina kwana? — Lafiya lau.',
        gloss: '— Good morning. — Very well (health and soundness).',
        note: 'Lafiya lau is the standard reply and literally means “health, completely”.',
      },
      {
        kind: 'grammar',
        title: 'Ina asks where or how',
        body: 'Ina is a question word: “where?” in Ina zuwa? (where are you going?) and “how?” in the greetings. Context decides, which is why the fixed greetings are worth learning as whole phrases.',
      },
      {
        kind: 'vocabulary',
        entries: [
          { term: 'Lafiya lau', gloss: 'Very well / in good health' },
          { term: 'Lafiya lau, na gode', gloss: 'Very well, thank you' },
        ],
      },
      {
        kind: 'listening',
        prompt: 'Listen to the greeting sequence.',
        lines: [
          { target: 'Ina kwana?', gloss: 'Good morning' },
          { target: 'Lafiya lau, na gode', gloss: 'Very well, thank you' },
          { target: 'Sai anjima', gloss: 'See you later' },
        ],
      },
    ],
  },
  {
    id: 'ha-b-2',
    moduleId: 'ha-b-mod-1',
    title: 'Sannu and its many jobs',
    summary: 'One word that greets, sympathises and congratulates.',
    minutes: 5,
    provenance: UNREVIEWED,
    quizIds: ['quiz-ha-greetings'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'Sannu is the word visitors learn first and understand last. It greets, but it also says “sorry” for a hardship, and “well done” for work. Which one you mean is carried by the situation and by the voice.',
      },
      {
        kind: 'example',
        target: 'Sannu da aiki.',
        gloss: 'Well done with the work.',
        note: 'da aiki — “with work”. Said on meeting someone who is working.',
      },
      {
        kind: 'example',
        target: 'Sannu da wahala.',
        gloss: 'Sorry for the trouble / sorry for the hardship.',
      },
      {
        kind: 'example',
        target: 'Sannu, yaya gida?',
        gloss: 'Hello, how is the household?',
        note: 'yaya — how. Asking after the household is part of a normal greeting, not an extra.',
      },
      {
        kind: 'grammar',
        title: 'da marks the thing you are greeting',
        body: 'Sannu da + noun says what the sympathy or congratulation is for: da aiki (work), da wahala (hardship), da hanya (the journey). Learning the pattern is more useful than memorising each whole phrase.',
      },
    ],
  },
  {
    id: 'ha-b-3',
    moduleId: 'ha-b-mod-2',
    title: 'Pronouns, and the gender split',
    summary: 'Eight pronouns, with a masculine and feminine “you” and “he/she”.',
    minutes: 7,
    provenance: UNREVIEWED,
    quizIds: ['quiz-ha-pronouns'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'Unlike Yorùbá, Hausa distinguishes gender — in pronouns and in noun agreement. Kai addresses a man or boy, Ke a woman or girl; Shi is he, Ita is she. Choosing the wrong one is a real error, not a stylistic one.',
      },
      { kind: 'vocabulary', entries: PRONOUN_VOCAB },
      {
        kind: 'grammar',
        title: 'Nouns carry gender too',
        body: 'Every Hausa noun is masculine or feminine, and it affects the words around it. Yaro (boy) is masculine; yarinya (girl) is feminine. You will learn each noun with its gender, the way you learn its meaning.',
      },
      {
        kind: 'example',
        target: 'Shi yaro ne.',
        gloss: 'He is a boy.',
        note: 'ne is the masculine copula; ce is the feminine one.',
      },
      {
        kind: 'example',
        target: 'Ita yarinya ce.',
        gloss: 'She is a girl.',
      },
    ],
  },
  {
    id: 'ha-b-4',
    moduleId: 'ha-b-mod-3',
    title: 'Ɓ, ɗ and ƙ',
    summary: 'Three hooked letters that carry meaning, not decoration.',
    minutes: 8,
    provenance: UNREVIEWED,
    quizIds: ['quiz-ha-hooked'],
    blocks: [
      {
        kind: 'paragraph',
        text: 'The hooked letters ɓ, ɗ and ƙ are separate letters of the Hausa alphabet. They represent implosive and ejective sounds that do not exist in English, and swapping them for b, d and k changes the word rather than the accent.',
      },
      {
        kind: 'vocabulary',
        entries: [
          { term: 'ɓera', gloss: 'mouse' },
          { term: 'bera', gloss: '(form without the hook — a different word)' },
          { term: 'ɗaya', gloss: 'one' },
          { term: 'ƙasa', gloss: 'ground, country' },
          { term: 'ƙarfi', gloss: 'strength' },
          { term: 'ɓarna', gloss: 'spoiling, damage' },
        ],
      },
      {
        kind: 'grammar',
        title: 'Why WAZOBIA renders these in a verified font',
        body: 'Many web fonts omit ɓ ɗ ƙ entirely. A page that falls back mid-word shows boxes, so the platform self-hosts a font that is tested to contain them. This is also why the app gives you the exact character rather than an approximation.',
      },
      {
        kind: 'listening',
        prompt: 'Listen to the hooked consonants.',
        lines: [
          { target: 'ɓera', gloss: 'mouse' },
          { target: 'ɗaya', gloss: 'one' },
          { target: 'ƙasa', gloss: 'ground' },
        ],
      },
    ],
  },
]

export const HAUSA_COURSES: readonly Course[] = [
  {
    id: 'ha-beginner',
    language: 'ha',
    level: 'beginner',
    title: 'Hausa foundations',
    summary: 'Greetings, pronouns and gender, and the hooked letters.',
    moduleIds: ['ha-b-mod-1', 'ha-b-mod-2', 'ha-b-mod-3'],
  },
]
