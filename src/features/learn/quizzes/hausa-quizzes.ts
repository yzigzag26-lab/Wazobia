import type { Quiz } from '../types'

/**
 * Hausa quizzes. Every question is answerable from the lesson named in
 * `lessonId`. Content written for WAZOBIA, `unreviewed`.
 */

const UNREVIEWED = { provenance: 'original', reviewStatus: 'unreviewed' } as const

export const HAUSA_QUIZZES: readonly Quiz[] = [
  {
    id: 'quiz-ha-greetings',
    language: 'ha',
    level: 'beginner',
    title: 'Greetings and Sannu',
    instructions: 'Four questions on Hausa greetings and the many jobs of Sannu.',
    lessonId: 'ha-b-1',
    provenance: UNREVIEWED,
    questions: [
      {
        id: 'ha-g-1',
        kind: 'multiple-choice',
        prompt: 'What does Ina kwana? ask literally?',
        choices: [
          { id: 'a', label: 'How was the night’s sleep?' },
          { id: 'b', label: 'Where are you going?' },
          { id: 'c', label: 'What is your name?' },
          { id: 'd', label: 'Have you eaten?' },
        ],
        answer: ['a'],
        explanation:
          'kwana is “to spend the night”, so Ina kwana? is literally “how was the sleeping?” — the morning greeting.',
      },
      {
        id: 'ha-g-2',
        kind: 'matching',
        prompt: 'Match each greeting to its use.',
        answer: ['good morning', 'good afternoon', 'see you later'],
        pairs: [
          { left: 'Ina kwana?', right: 'good morning' },
          { left: 'Ina wuni?', right: 'good afternoon' },
          { left: 'Sai anjima', right: 'see you later' },
        ],
        explanation: 'Sai plus a time word forms the farewells: Sai gobe is “see you tomorrow”.',
      },
      {
        id: 'ha-g-3',
        kind: 'multiple-choice',
        prompt: 'What is the standard reply to Ina kwana?',
        choices: [
          { id: 'a', label: 'Sai gobe' },
          { id: 'b', label: 'Lafiya lau' },
          { id: 'c', label: 'Ina wuni' },
          { id: 'd', label: 'Yauwa' },
        ],
        answer: ['b'],
        explanation: 'Lafiya lau — “health, completely” — is the expected reply, often followed by na gode.',
      },
      {
        id: 'ha-g-4',
        kind: 'multiple-choice',
        prompt: 'Which of these is NOT a job Sannu does?',
        choices: [
          { id: 'a', label: 'Greeting someone' },
          { id: 'b', label: 'Saying sorry for a hardship' },
          { id: 'c', label: 'Congratulating someone on work' },
          { id: 'd', label: 'Asking a question' },
        ],
        answer: ['d'],
        explanation:
          'Sannu greets, sympathises and congratulates. It is not a question word — Ina is the question word.',
      },
      {
        id: 'ha-g-5',
        kind: 'ordering',
        prompt: 'Arrange this short greeting exchange in the order it happens.',
        sequence: ['Ina kwana?', 'Lafiya lau', 'Na gode'],
        answer: ['0', '1', '2'],
        explanation:
          'The greeting comes first, then the reply, then thanks. Reversing them would be answering a question nobody asked.',
      },
    ],
  },
  {
    id: 'quiz-ha-pronouns',
    language: 'ha',
    level: 'beginner',
    title: 'Pronouns and noun gender',
    instructions: 'Four questions on pronouns and gender agreement.',
    lessonId: 'ha-b-3',
    provenance: UNREVIEWED,
    questions: [
      {
        id: 'ha-p-1',
        kind: 'multiple-choice',
        prompt: 'Which pronoun addresses one woman or girl?',
        choices: [
          { id: 'a', label: 'Kai' },
          { id: 'b', label: 'Ke' },
          { id: 'c', label: 'Ku' },
          { id: 'd', label: 'Su' },
        ],
        answer: ['b'],
        explanation: 'Ke is the feminine singular “you”; Kai is the masculine one. Ku is plural.',
      },
      {
        id: 'ha-p-2',
        kind: 'matching',
        prompt: 'Match each pronoun to its meaning.',
        answer: ['I / me', 'he', 'they'],
        pairs: [
          { left: 'Ni', right: 'I / me' },
          { left: 'Shi', right: 'he' },
          { left: 'Su', right: 'they' },
        ],
        explanation: 'Hausa distinguishes Shi (he) from Ita (she) — unlike Yorùbá and Igbo.',
      },
      {
        id: 'ha-p-3',
        kind: 'sentence-completion',
        prompt: 'Complete: “Ita yarinya ____.” (She is a girl.)',
        choices: [
          { id: 'a', label: 'ne' },
          { id: 'b', label: 'ce' },
          { id: 'c', label: 'bụ' },
          { id: 'd', label: 'ni' },
        ],
        answer: ['b'],
        explanation: 'ce is the feminine copula; ne is the masculine one. yarinya is feminine.',
      },
      {
        id: 'ha-p-4',
        kind: 'grammar',
        prompt: 'Every Hausa noun is:',
        choices: [
          { id: 'a', label: 'Plural or singular only' },
          { id: 'b', label: 'Masculine or feminine' },
          { id: 'c', label: 'Formal or informal' },
          { id: 'd', label: 'Long or short' },
        ],
        answer: ['b'],
        explanation:
          'Gender affects the copula and the agreement around the noun, so it is learned with the word.',
      },
    ],
  },
  {
    id: 'quiz-ha-hooked',
    language: 'ha',
    level: 'beginner',
    title: 'The hooked letters',
    instructions: 'Three questions on ɓ, ɗ and ƙ.',
    lessonId: 'ha-b-4',
    provenance: UNREVIEWED,
    questions: [
      {
        id: 'ha-h-1',
        kind: 'multiple-choice',
        prompt: 'What are ɓ, ɗ and ƙ?',
        choices: [
          { id: 'a', label: 'Accents on b, d and k' },
          { id: 'b', label: 'Separate letters of the Hausa alphabet' },
          { id: 'c', label: 'Typing errors' },
          { id: 'd', label: 'Optional marks' },
        ],
        answer: ['b'],
        explanation:
          'They represent implosive and ejective sounds not found in English. Replacing them with b, d or k changes the word.',
      },
      {
        id: 'ha-h-2',
        kind: 'multiple-choice',
        prompt: 'Which word means “one”?',
        choices: [
          { id: 'a', label: 'ɗaya' },
          { id: 'b', label: 'ƙasa' },
          { id: 'c', label: 'ƙarfi' },
          { id: 'd', label: 'ɓera' },
        ],
        answer: ['a'],
        explanation: 'ɗaya is “one”. ƙasa is ground, ƙarfi is strength, ɓera is mouse.',
      },
      {
        id: 'ha-h-3',
        kind: 'multiple-choice',
        prompt: 'Why does WAZOBIA give the exact hooked character rather than an approximation?',
        choices: [
          { id: 'a', label: 'Because approximations are harder to type' },
          { id: 'b', label: 'Because the hook distinguishes real words' },
          { id: 'c', label: 'For decoration' },
          { id: 'd', label: 'Because English fonts are unavailable' },
        ],
        answer: ['b'],
        explanation:
          'Choosing different letters changes the meaning. Many fonts omit these characters entirely, which is why the font is self-hosted and verified.',
      },
    ],
  },
]
