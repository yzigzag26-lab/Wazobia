import type { Quiz } from '../types'

/**
 * Yorùbá quizzes.
 *
 * Every question is answerable from the lesson it names in `lessonId` — a quiz
 * that tests material the learner has not been shown is a defect, not a
 * challenge. Explanations always say *why*, because a score without a reason
 * teaches nothing.
 *
 * Content is written for WAZOBIA and `unreviewed`.
 */

const UNREVIEWED = { provenance: 'original', reviewStatus: 'unreviewed' } as const

export const YORUBA_QUIZZES: readonly Quiz[] = [
  {
    id: 'quiz-yo-greetings',
    language: 'yo',
    level: 'beginner',
    title: 'Greetings by time of day',
    instructions: 'Five questions on the greetings from lessons 1 and 2.',
    lessonId: 'yo-b-1',
    provenance: UNREVIEWED,
    questions: [
      {
        id: 'yo-g-1',
        kind: 'multiple-choice',
        prompt: 'Which greeting is used in the morning?',
        choices: [
          { id: 'a', label: 'Ẹ káàsán' },
          { id: 'b', label: 'Ẹ káàárọ̀' },
          { id: 'c', label: 'Ẹ káalẹ́' },
          { id: 'd', label: 'Ó dàbọ̀' },
        ],
        answer: ['b'],
        explanation:
          'Ẹ káàárọ̀ is the morning greeting. Ẹ káàsán is afternoon, Ẹ káalẹ́ is evening, and Ó dàbọ̀ is a farewell.',
      },
      {
        id: 'yo-g-2',
        kind: 'matching',
        prompt: 'Match each greeting to its time of day.',
        answer: ['morning', 'afternoon', 'evening'],
        pairs: [
          { left: 'Ẹ káàárọ̀', right: 'morning' },
          { left: 'Ẹ káàsán', right: 'afternoon' },
          { left: 'Ẹ káalẹ́', right: 'evening' },
        ],
        explanation:
          'The pattern is regular: àárọ̀ is dawn, ọ̀sán is afternoon, and alẹ́ covers evening and night.',
      },
      {
        id: 'yo-g-3',
        kind: 'multiple-choice',
        prompt: 'What is the standard positive reply to “Báwo ni?”',
        choices: [
          { id: 'a', label: 'Ó dàárọ̀' },
          { id: 'b', label: 'Dáadáa ni' },
          { id: 'c', label: 'Ẹ káàsán' },
          { id: 'd', label: 'Bàbá' },
        ],
        answer: ['b'],
        explanation: 'Dáadáa ni — “it is well”. Literally “well it-is”, with ni closing the statement.',
      },
      {
        id: 'yo-g-4',
        kind: 'sentence-completion',
        prompt: 'Complete the reply: “Báwo ni? — ____ ni, ẹ ṣé.”',
        choices: [
          { id: 'a', label: 'Dáadáa' },
          { id: 'b', label: 'Ẹ káàárọ̀' },
          { id: 'c', label: 'ilé' },
          { id: 'd', label: 'ọ̀nà' },
        ],
        answer: ['a'],
        explanation: 'Dáadáa ni — “it is well”. The second half, ẹ ṣé, is “thank you”.',
      },
      {
        id: 'yo-g-5',
        kind: 'multiple-choice',
        prompt: 'Why does each greeting begin with Ẹ?',
        choices: [
          { id: 'a', label: 'It marks the past tense' },
          { id: 'b', label: 'It is the respectful form of “you”' },
          { id: 'c', label: 'It means “good”' },
          { id: 'd', label: 'It is required before every sentence' },
        ],
        answer: ['b'],
        explanation:
          'Ẹ is the plural/respectful “you”, used even for one person. It is never rude to use it; using the singular form with an elder can be.',
      },
    ],
  },
  {
    id: 'quiz-yo-pronouns',
    language: 'yo',
    level: 'beginner',
    title: 'Pronouns and the copula',
    instructions: 'Four questions on the pronoun set and on ni.',
    lessonId: 'yo-b-3',
    provenance: UNREVIEWED,
    questions: [
      {
        id: 'yo-p-1',
        kind: 'multiple-choice',
        prompt: 'Which pronoun covers both “he” and “she”?',
        choices: [
          { id: 'a', label: 'Ìwọ' },
          { id: 'b', label: 'Òun' },
          { id: 'c', label: 'Àwa' },
          { id: 'd', label: 'Ẹ̀yin' },
        ],
        answer: ['b'],
        explanation: 'Òun covers he, she and it — Yorùbá does not mark gender on pronouns.',
      },
      {
        id: 'yo-p-2',
        kind: 'matching',
        prompt: 'Match each pronoun to its meaning.',
        answer: ['we', 'they', 'you (respectful)'],
        pairs: [
          { left: 'Àwa', right: 'we' },
          { left: 'Àwọn', right: 'they' },
          { left: 'Ẹ̀yin', right: 'you (respectful)' },
        ],
        explanation:
          'Ẹ̀yin is plural “you” and also the respectful form for one person — the same split as Ẹ in the greetings.',
      },
      {
        id: 'yo-p-3',
        kind: 'translation',
        prompt: 'Translate into English: “Èmi ni Adé.”',
        choices: [
          { id: 'a', label: 'Adé is coming' },
          { id: 'b', label: 'I am Adé' },
          { id: 'c', label: 'Adé is my name?' },
          { id: 'd', label: 'They are Adé' },
        ],
        answer: ['b'],
        explanation: 'Èmi is “I”, ni is the copula, so “I am Adé” — literally “I it-is Adé”.',
      },
      {
        id: 'yo-p-4',
        kind: 'grammar',
        prompt: 'What does ni do in “Dáadáa ni”?',
        choices: [
          { id: 'a', label: 'Marks a question' },
          { id: 'b', label: 'Marks a past action' },
          { id: 'c', label: 'Closes an equative statement (“is”)' },
          { id: 'd', label: 'Marks the plural' },
        ],
        answer: ['c'],
        explanation: 'ni asserts that the thing named is the case — “well it-is”. It is not a question marker.',
      },
    ],
  },
  {
    id: 'quiz-yo-tone',
    language: 'yo',
    level: 'beginner',
    title: 'Tone and letters',
    instructions: 'Four questions on tone and the sub-dot.',
    lessonId: 'yo-b-4',
    provenance: UNREVIEWED,
    questions: [
      {
        id: 'yo-t-1',
        kind: 'multiple-choice',
        prompt: 'Which of these means “vehicle” or “canoe”?',
        target: 'ọkọ, ọkọ̀, ọ̀kọ̀',
        choices: [
          { id: 'a', label: 'ọkọ' },
          { id: 'b', label: 'ọkọ̀' },
          { id: 'c', label: 'ọ̀kọ̀' },
          { id: 'd', label: 'All three mean the same' },
        ],
        answer: ['b'],
        explanation:
          'ọkọ is husband, ọkọ̀ is vehicle/canoe, ọ̀kọ̀ is spear. They differ only in tone.',
      },
      {
        id: 'yo-t-2',
        kind: 'multiple-choice',
        prompt: 'What are ẹ, ọ and ṣ?',
        choices: [
          { id: 'a', label: 'Accents on e, o and s' },
          { id: 'b', label: 'Distinct letters, not variants' },
          { id: 'c', label: 'Optional decorations' },
          { id: 'd', label: 'Marks used only in poetry' },
        ],
        answer: ['b'],
        explanation:
          'The sub-dot marks a different sound and therefore a different letter. Stripping it corrupts the word.',
      },
      {
        id: 'yo-t-3',
        kind: 'sentence-completion',
        prompt: 'Fill the gap with the correct form of “house”: “Mo lọ sí ____.”  (I went to the house.)',
        choices: [
          { id: 'a', label: 'ile' },
          { id: 'b', label: 'ilé' },
          { id: 'c', label: 'ìlé' },
          { id: 'd', label: 'ilẹ' },
        ],
        answer: ['b'],
        explanation: 'ilé is “house”, with the high tone on the final syllable. ilẹ means the ground.',
      },
      {
        id: 'yo-t-4',
        kind: 'multiple-choice',
        prompt: 'Why does WAZOBIA self-host its fonts rather than using a standard web font?',
        choices: [
          { id: 'a', label: 'To look more distinctive' },
          { id: 'b', label: 'Because many fonts omit ẹ ọ ị ụ ṣ, which corrupts text' },
          { id: 'c', label: 'To reduce page size' },
          { id: 'd', label: 'Because Google Fonts is unavailable' },
        ],
        answer: ['b'],
        explanation:
          'A font that drops the sub-dot letters or tone marks silently breaks the language, so the platform ships a font verified to contain them.',
      },
      {
        // Ordering: the greeting sequence is the one thing a beginner needs in
        // the right order, so it is tested as a sequence rather than as facts.
        id: 'yo-t-5',
        kind: 'ordering',
        prompt: 'Put the greetings in the order you would hear them in one day.',
        sequence: ['Ẹ káàárọ̀', 'Ẹ káàsán', 'Ẹ káalẹ́'],
        answer: ['0', '1', '2'],
        explanation:
          'Dawn to afternoon to evening: àárọ̀, ọ̀sán, alẹ́. The greeting changes with the clock, so getting the order right is the first step to choosing the right one.',
      },
      {
        // Listening: the prompt names what to listen for. Playback needs a
        // validated voice, which the Read Aloud section discloses it does not
        // have yet — the line is still readable and answerable as text.
        id: 'yo-t-6',
        kind: 'listening',
        prompt: 'Which greeting would you expect to hear at dawn?',
        target: 'Ẹ káàárọ̀',
        choices: [
          { id: 'a', label: 'Ẹ káàsán' },
          { id: 'b', label: 'Ẹ káàárọ̀' },
          { id: 'c', label: 'Ẹ káalẹ́' },
          { id: 'd', label: 'Ó dàbọ̀' },
        ],
        answer: ['b'],
        explanation:
          'àárọ̀ is dawn. The line above is the form to listen for once a validated Yorùbá voice is available; today it is shown as text.',
      },
    ],
  },
]
