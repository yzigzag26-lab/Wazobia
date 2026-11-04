import type { Story } from './types'

/**
 * Yorùbá stories for the WAZOBIA Learn reader.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PROVENANCE — read before editing
 *
 * All four are `origin: 'original'`: written for WAZOBIA as teaching material.
 * The tortoise story uses Àjàpá/Ìjàpá, the trickster of Yorùbá narrative, but the
 * plot is ours and the entry is labelled an adaptation for that reason.
 *
 * Tone marks are written in full throughout, including in the target text inside
 * vocabulary entries. Removing them to make the data "cleaner" destroys meaning:
 * `ọkọ` (husband), `ọkọ̀` (vehicle) and `ọ̀kọ̀` (spear) are different words.
 *
 * Nothing is `reviewed`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const UNREVIEWED_ORIGINAL = {
  provenance: 'original',
  reviewStatus: 'unreviewed',
} as const

export const YORUBA_STORIES: readonly Story[] = [
  {
    id: 'yo-ijapa-ati-egbin',
    language: 'yo',
    category: 'folktale',
    title: 'Ìjàpá àti Ẹgbìn',
    englishTitle: 'The Tortoise and the Snail',
    summary:
      'Ìjàpá admires a shell he cannot carry, and learns what a home is for.',
    minutes: 3,
    paragraphs: [
      {
        target: 'Ní ìgbà kan, Ìjàpá àti Ẹgbìn jẹ́ ọ̀rẹ́ tímọ́tímọ́.',
        english: 'At one time, Tortoise and Snail were close friends.',
      },
      {
        target: 'Ẹgbìn ní ilé tí ó ṣinṣin, tí ó sì ń gbé e lórí.',
        english: 'Snail had a house that was firm, and carried it on his head.',
      },
      {
        target: 'Ìjàpá kò ní ilé rárá.',
        english: 'Tortoise had no house at all.',
      },
      {
        target: 'Ó ní kí Ẹgbìn yá a ní ilé rẹ̀ fún ìgbà díẹ̀.',
        english: 'He asked Snail to lend him his house for a short while.',
      },
      {
        target: 'Ẹgbìn gbà, nítorí pé wọ́n jẹ́ ọ̀rẹ́.',
        english: 'Snail agreed, because they were friends.',
      },
      {
        target: 'Ìjàpá wọ inú ilé náà, kò sì fẹ́ jáde mọ́.',
        english: 'Tortoise went inside that house, and did not want to come out again.',
      },
      {
        target: 'Nígbà tí Ẹgbìn béèrè ilé rẹ̀, Ìjàpá sọ pé, “Ilé yìí ti èmi ni báyìí.”',
        english:
          'When Snail asked for his house, Tortoise said, “This house is mine now.”',
      },
      {
        target: 'Ẹgbìn kò ṣe ariwo. Ó dúró ní jẹ́jẹ́.',
        english: 'Snail did not make a noise. He waited quietly.',
      },
      {
        target: 'Ó dúró títí tí Ìjàpá fi tóbi, ilé náà kò sì tún wọ̀ ọ́ mọ́.',
        english:
          'He waited until Tortoise grew large, and the house no longer fitted him.',
      },
      {
        target: 'Ìjàpá jáde, ilé sì padà sọ́dọ̀ Ẹgbìn.',
        english: 'Tortoise came out, and the house returned to Snail.',
      },
    ],
    vocabulary: [
      { term: 'Ìjàpá', gloss: 'tortoise', partOfSpeech: 'noun' },
      { term: 'Ẹgbìn', gloss: 'snail', partOfSpeech: 'noun' },
      { term: 'ọ̀rẹ́', gloss: 'friend', partOfSpeech: 'noun' },
      { term: 'ilé', gloss: 'house, home', partOfSpeech: 'noun' },
      { term: 'jẹ́jẹ́', gloss: 'quietly, gently', partOfSpeech: 'adverb' },
      { term: 'padà', gloss: 'return, go back', partOfSpeech: 'verb' },
    ],
    expressions: [
      {
        expression: 'Ní ìgbà kan',
        gloss: 'At one time / once',
        note: 'The story-opening formula. Literally “in one time”.',
      },
      {
        expression: 'Ó dúró ní jẹ́jẹ́',
        gloss: 'He waited quietly',
        note: '“Ní jẹ́jẹ́” marks restraint as a deliberate choice, not passivity.',
      },
    ],
    culturalContext:
      'Ìjàpá (also Àjàpá) is the trickster tortoise of Yorùbá narrative: clever, greedy, and almost always the author of his own loss. Trickster tales are told to children for entertainment and for rehearsal of social judgement, and the audience is expected to enjoy the trick even while disapproving of it. This plot is written by WAZOBIA rather than collected, using that established character.',
    moral: 'What is taken by cleverness is lost the moment the cleverness stops working.',
    attribution: { origin: 'adaptation', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: ['quiz-yo-stories-1'],
  },
  {
    id: 'yo-agbẹ̀-ati-ọmọ',
    language: 'yo',
    category: 'moral',
    title: 'Agbẹ̀ àti Ọmọ Rẹ̀',
    englishTitle: 'The Farmer and His Child',
    summary:
      'A farmer teaches his child that the work done in secret is the work that shows in public.',
    minutes: 3,
    paragraphs: [
      {
        target: 'Agbẹ̀ kan ní oko tuntun.',
        english: 'A farmer had a new farm.',
      },
      {
        target: 'Ọmọ rẹ̀ kò fẹ́ ṣiṣẹ́ ní oko.',
        english: 'His child did not want to work on the farm.',
      },
      {
        target: 'Agbẹ̀ ní, “Wá pẹ̀lú mi, kí o wo bí ó ṣe ń ṣe.”',
        english: 'The farmer said, “Come with me, and see how it is done.”',
      },
      {
        target: 'Wọ́n lọ ní àárọ̀, kí oòrùn tó yọ.',
        english: 'They went at dawn, before the sun rose.',
      },
      {
        target: 'Ọmọ náà rí bí bàbá rẹ̀ ṣe ń ṣiṣẹ́ ní ìdákẹ́jẹ́.',
        english: 'The child saw how his father worked in silence.',
      },
      {
        target: 'Ní ọ̀sán, àwọn ará ìlú wá wo oko.',
        english: 'In the afternoon, the people of the town came to see the farm.',
      },
      {
        target: 'Wọ́n yìn oko náà.',
        english: 'They praised that farm.',
      },
      {
        target: 'Ọmọ náà sọ pé, “Èmi kò ṣe é.”',
        english: 'The child said, “I did not do it.”',
      },
      {
        target: 'Bàbá rẹ̀ sọ pé, “Ṣùgbọ́n o ti kọ́ bí a ṣe ń ṣe é.”',
        english: 'His father said, “But you have learned how it is done.”',
      },
      {
        target: 'Ọjọ́ kejì, ọmọ náà bẹ̀rẹ̀ iṣẹ́ ní àárọ̀.',
        english: 'The next day, the child began to work at dawn.',
      },
    ],
    vocabulary: [
      { term: 'agbẹ̀', gloss: 'farmer', partOfSpeech: 'noun' },
      { term: 'oko', gloss: 'farm', partOfSpeech: 'noun' },
      { term: 'ìdákẹ́jẹ́', gloss: 'silence, quietness', partOfSpeech: 'noun' },
      { term: 'àárọ̀', gloss: 'dawn, early morning', partOfSpeech: 'noun' },
      { term: 'ọ̀sán', gloss: 'afternoon', partOfSpeech: 'noun' },
      { term: 'yìn', gloss: 'praised', partOfSpeech: 'verb' },
    ],
    expressions: [
      {
        expression: 'ní ìdákẹ́jẹ́',
        gloss: 'in silence',
        note: 'The -kẹ́jẹ́ element carries the sense of doing something without display.',
      },
      {
        expression: 'Ṣùgbọ́n o ti kọ́',
        gloss: 'But you have learned',
        note: '“ti” marks an action completed with present relevance, unlike a plain past.',
      },
    ],
    culturalContext:
      'Yorùbá farming life sets the calendar of the compound: work begins at first light, before the heat, and neighbours judge a farm by its state rather than by the promises of its owner. Proverbs about trees, soil and harvest come from this rhythm — the same observation that produces “it is the tree that bears fruit that stones are thrown at”.',
    moral: 'Watching work closely is itself a form of work.',
    attribution: { origin: 'original', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: ['quiz-yo-stories-2'],
  },
  {
    id: 'yo-ìyá-ati-ọmọ',
    language: 'yo',
    category: 'everyday',
    title: 'Ìyá àti Ọmọ',
    englishTitle: 'The Mother and the Child',
    summary:
      'A child wants to run before learning the road, and a mother answers with a proverb.',
    minutes: 2,
    paragraphs: [
      {
        target: 'Ọmọdé kan fẹ́ sáré lọ sí ọjà.',
        english: 'A child wanted to run to the market.',
      },
      {
        target: 'Ìyá rẹ̀ ní, “Ọ̀nà kò tí ì yé ọ.”',
        english: 'His mother said, “The road is not yet clear to you.”',
      },
      {
        target: 'Ọmọ náà sọ pé, “Mo mọ̀ ọ́n.”',
        english: 'The child said, “I know it.”',
      },
      {
        target: 'Ìyá rẹ̀ ní, “Bí ọmọdé kò bá mọ̀wé, ó mọ ọ̀nà ilé rẹ̀.”',
        english:
          'His mother said, “Even if a child has no learning, he knows the way to his own house.”',
      },
      {
        target: 'Ọmọ náà dúró.',
        english: 'The child stopped.',
      },
      {
        target: 'Ìyá rẹ̀ ní, “Ọ̀nà ilé ni o mọ̀. Ọ̀nà ọjà ni kò yé ọ.”',
        english:
          'His mother said, “The way home is what you know. The way to the market is what is not clear to you.”',
      },
      {
        target: 'Ní ọjọ́ mìíràn, wọ́n lọ sí ọjà pẹ̀lú ara wọn.',
        english: 'On another day, they went to the market together.',
      },
    ],
    vocabulary: [
      { term: 'ìyá', gloss: 'mother', partOfSpeech: 'noun' },
      { term: 'ọmọdé', gloss: 'child, young person', partOfSpeech: 'noun' },
      { term: 'ọjà', gloss: 'market', partOfSpeech: 'noun' },
      { term: 'ọ̀nà', gloss: 'road, way', partOfSpeech: 'noun' },
      { term: 'sáré', gloss: 'run', partOfSpeech: 'verb' },
      { term: 'yé', gloss: 'be clear to, be understood by', partOfSpeech: 'verb' },
    ],
    expressions: [
      {
        expression: 'Ọ̀nà kò tí ì yé ọ',
        gloss: 'The road is not yet clear to you',
        note: '“yé” is the same verb used for a matter being understandable; a road that “yé” you is one you have come to know.',
      },
    ],
    culturalContext:
      'The market (ọjà) is the social centre of Yorùbá town life and, for a child, the first place beyond the compound that must be learned. This story deliberately works a real proverb into dialogue rather than placing it on a card, which is how proverbs actually function in speech: as a reply that ends an argument.',
    moral: 'Knowing one road is not the same as knowing all of them.',
    attribution: { origin: 'original', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: ['quiz-yo-stories-3'],
  },
  {
    id: 'yo-ẹyẹ-ati-òwú',
    language: 'yo',
    category: 'nature',
    title: 'Ẹyẹ àti Òwú',
    englishTitle: 'The Bird and the Cotton',
    summary:
      'A small bird takes one thread at a time, and the nest is finished before the boasting bird begins.',
    minutes: 2,
    paragraphs: [
      {
        target: 'Ẹyẹ kékeré kan ń kó òwú fún ìtẹ́ rẹ̀.',
        english: 'A small bird was gathering cotton for its nest.',
      },
      {
        target: 'Ẹyẹ ńlá kan wò ó, ó sì rẹ́rìn-ín.',
        english: 'A large bird watched it, and laughed.',
      },
      {
        target: 'Ẹyẹ ńlá ní, “Ìwọ kò lè ṣe é.”',
        english: 'The large bird said, “You cannot do it.”',
      },
      {
        target: 'Ẹyẹ kékeré kò dáhùn.',
        english: 'The small bird did not answer.',
      },
      {
        target: 'Ó kó òwú díẹ̀, ó tún kó òwú díẹ̀.',
        english: 'It gathered a little cotton, and then a little more.',
      },
      {
        target: 'Ní ọ̀sẹ̀ kan, ìtẹ́ náà ti parí.',
        english: 'In one week, the nest was finished.',
      },
      {
        target: 'Ẹyẹ ńlá kò tí ì bẹ̀rẹ̀ tirẹ̀.',
        english: 'The large bird had not begun its own.',
      },
    ],
    vocabulary: [
      { term: 'ẹyẹ', gloss: 'bird', partOfSpeech: 'noun' },
      { term: 'òwú', gloss: 'cotton', partOfSpeech: 'noun' },
      { term: 'ìtẹ́', gloss: 'nest', partOfSpeech: 'noun' },
      { term: 'kékeré', gloss: 'small', partOfSpeech: 'adjective' },
      { term: 'ńlá', gloss: 'large, big', partOfSpeech: 'adjective' },
      { term: 'parí', gloss: 'finished, came to an end', partOfSpeech: 'verb' },
    ],
    expressions: [
      {
        expression: 'kò lè ṣe é',
        gloss: 'cannot do it',
        note: '“lè” is the ability modal; “ṣe é” is “do it” with the object fused onto the verb.',
      },
    ],
    culturalContext:
      'Weaving, dyeing and cotton work sit alongside farming in the everyday craft life of many Yorùbá towns, which is why cloth, thread and pattern recur in proverb imagery (“the masquerade’s cloth”, “a hand red with soil”). The story draws on everyday craft rather than ceremonial imagery.',
    moral: 'Small work, repeated, finishes what boasting cannot start.',
    attribution: { origin: 'original', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: [],
  },
] as const
