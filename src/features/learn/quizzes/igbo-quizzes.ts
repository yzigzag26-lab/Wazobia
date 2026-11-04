import type { Quiz } from '../types'

/**
 * Igbo quizzes. Every question is answerable from the lesson named in
 * `lessonId`. Content written for WAZOBIA, `unreviewed`.
 */

const UNREVIEWED = { provenance: 'original', reviewStatus: 'unreviewed' } as const

export const IGBO_QUIZZES: readonly Quiz[] = [
  {
    id: 'quiz-ig-greetings',
    language: 'ig',
    level: 'beginner',
    title: 'Greetings and respect',
    instructions: 'Four questions on Kedu, Ndeewo and their replies.',
    lessonId: 'ig-b-1',
    provenance: UNREVIEWED,
    questions: [
      {
        id: 'ig-g-1',
        kind: 'multiple-choice',
        prompt: 'What does Kedu? mean literally?',
        choices: [
          { id: 'a', label: 'How is it?' },
          { id: 'b', label: 'Where are you going?' },
          { id: 'c', label: 'Good morning' },
          { id: 'd', label: 'Thank you' },
        ],
        answer: ['a'],
        explanation: 'Kedu? literally asks “how is it?” — the core Igbo greeting.',
      },
      {
        id: 'ig-g-2',
        kind: 'sentence-completion',
        prompt: 'Complete the reply: “Kedu? — ____.” (I am well.)',
        choices: [
          { id: 'a', label: 'Daalụ' },
          { id: 'b', label: 'Ọ dị mma' },
          { id: 'c', label: 'Ka ọ dị' },
          { id: 'd', label: 'Ndeewo' },
        ],
        answer: ['b'],
        explanation: 'Ọ dị mma — “it is well” — is the standard reply.',
      },
      {
        id: 'ig-g-3',
        kind: 'multiple-choice',
        prompt: 'When is Ndeewo the better greeting?',
        choices: [
          { id: 'a', label: 'With a close friend' },
          { id: 'b', label: 'With a group or an elder' },
          { id: 'c', label: 'Only at night' },
          { id: 'd', label: 'Only when leaving' },
        ],
        answer: ['b'],
        explanation:
          'Ndeewo is the respectful greeting, used for a group or an elder — not interchangeable with Kedu for one friend.',
      },
      {
        id: 'ig-g-4',
        kind: 'matching',
        prompt: 'Match each word to its meaning.',
        answer: ['father', 'mother', 'name'],
        pairs: [
          { left: 'nna', right: 'father' },
          { left: 'nne', right: 'mother' },
          { left: 'aha', right: 'name' },
        ],
        explanation: 'The possessive follows the noun: nna m — “my father”, aha m — “my name”.',
      },
    ],
  },
  {
    id: 'quiz-ig-pronouns',
    language: 'ig',
    level: 'beginner',
    title: 'Pronouns and the copula',
    instructions: 'Three questions on pronouns and bụ.',
    lessonId: 'ig-b-3',
    provenance: UNREVIEWED,
    questions: [
      {
        id: 'ig-p-1',
        kind: 'multiple-choice',
        prompt: 'Which pronoun covers he, she and it?',
        choices: [
          { id: 'a', label: 'Gị' },
          { id: 'b', label: 'Ọ' },
          { id: 'c', label: 'Anyị' },
          { id: 'd', label: 'Ha' },
        ],
        answer: ['b'],
        explanation: 'Ọ covers all three — Igbo does not mark gender on pronouns.',
      },
      {
        id: 'ig-p-2',
        kind: 'multiple-choice',
        prompt: 'Which is the plural “you”?',
        choices: [
          { id: 'a', label: 'Gị' },
          { id: 'b', label: 'Ụnụ' },
          { id: 'c', label: 'Ha' },
          { id: 'd', label: 'Mụ' },
        ],
        answer: ['b'],
        explanation: 'Ụnụ is plural “you”. Like Ẹ̀yin in Yorùbá, it also serves as the respectful form for one person.',
      },
      {
        id: 'ig-p-3',
        kind: 'translation',
        prompt: 'Translate: “Aha m bụ Ada.”',
        choices: [
          { id: 'a', label: 'Ada is my mother' },
          { id: 'b', label: 'My name is Ada' },
          { id: 'c', label: 'I am going to Ada' },
          { id: 'd', label: 'Ada has a name' },
        ],
        answer: ['b'],
        explanation: 'aha m = my name, bụ = is. “My name is Ada.”',
      },
    ],
  },
  {
    id: 'quiz-ig-vowels',
    language: 'ig',
    level: 'beginner',
    title: 'Dotted vowels and tone',
    instructions: 'Three questions on ị, ọ, ụ and tone.',
    lessonId: 'ig-b-4',
    provenance: UNREVIEWED,
    questions: [
      {
        id: 'ig-v-1',
        kind: 'multiple-choice',
        prompt: 'What are ị, ọ and ụ?',
        choices: [
          { id: 'a', label: 'Accented i, o and u' },
          { id: 'b', label: 'Distinct letters with distinct sounds' },
          { id: 'c', label: 'Typing errors' },
          { id: 'd', label: 'Marks used only in names' },
        ],
        answer: ['b'],
        explanation:
          'The dot marks a different vowel sound, so these are separate letters — not decorative accents.',
      },
      {
        id: 'ig-v-2',
        kind: 'multiple-choice',
        prompt: 'Which word means “fire”?',
        target: 'ọkụ / ọkụ̀',
        choices: [
          { id: 'a', label: 'ọkụ' },
          { id: 'b', label: 'ọkụ̀' },
          { id: 'c', label: 'Both mean fire' },
          { id: 'd', label: 'Neither' },
        ],
        answer: ['a'],
        explanation: 'ọkụ is fire; ọkụ̀ (low tone on the second syllable) is a call or summons.',
      },
      {
        id: 'ig-v-3',
        kind: 'grammar',
        prompt: 'What is vowel harmony in Igbo?',
        choices: [
          { id: 'a', label: 'Vowels must be sung' },
          { id: 'b', label: 'Vowels fall into two sets and words keep to one set' },
          { id: 'c', label: 'All vowels sound the same' },
          { id: 'd', label: 'Vowels are dropped at the end of words' },
        ],
        answer: ['b'],
        explanation:
          'The sets are a, ọ, ụ and e, i, o. Words normally keep to one set, which is why related forms alternate rather than mix.',
      },
      {
        id: 'ig-v-4',
        kind: 'ordering',
        prompt: 'Arrange the greeting exchange in the order it happens.',
        sequence: ['Kedu?', 'Ọ dị mma', 'Daalụ'],
        answer: ['0', '1', '2'],
        explanation:
          'Question, reply, thanks. The reply alone is not an exchange — the greeting has to come first.',
      },
    ],
  },
]
