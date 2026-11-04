import type { Story } from './types'

/**
 * Hausa stories for the WAZOBIA Learn reader.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PROVENANCE — read before editing
 *
 * All four are `origin: 'original'`: written for WAZOBIA as teaching material.
 * The trickster story uses Ɗanƙo, the Hausa trickster figure (a spider in the
 * wider West African family of Anansi-type tales), but the plot is WAZOBIA's and
 * the entry is labelled an adaptation rather than a collected tale.
 *
 * Orthography uses Boko with the hooked letters ɓ ɗ ƙ. Those are letters, not
 * accents: replacing ƙ with k changes the word.
 *
 * Nothing is `reviewed`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const UNREVIEWED_ORIGINAL = {
  provenance: 'original',
  reviewStatus: 'unreviewed',
} as const

export const HAUSA_STORIES: readonly Story[] = [
  {
    id: 'ha-danko-da-kwado',
    language: 'ha',
    category: 'folktale',
    title: 'Ɗanƙo da Kwadọ',
    englishTitle: 'Ɗanƙo and the Calabash',
    summary:
      'Ɗanƙo borrows a calabash and returns it full of holes — a trickster tale about a clever plan that outlives its usefulness.',
    minutes: 3,
    paragraphs: [
      {
        target: 'A wani gari, Ɗanƙo ya zauna tare da mutane.',
        english: 'In a certain town, Ɗanƙo lived among people.',
      },
      {
        target: 'Ya roƙi maƙwabcinsa kwadọ, ya ce zai aro shi kaɗan.',
        english: 'He asked his neighbour for a calabash, saying he would borrow it briefly.',
      },
      {
        target: 'Maƙwabcin ya ba shi kwadọ ɗinsa.',
        english: 'The neighbour gave him his calabash.',
      },
      {
        target: 'Ɗanƙo ya ɗauke shi, ya kai shi gidansa.',
        english: 'Ɗanƙo took it, and carried it to his house.',
      },
      {
        target: 'Bayan kwana biyu, maƙwabcin ya zo ya nemi kwadọ ɗinsa.',
        english: 'After two days, the neighbour came to ask for his calabash.',
      },
      {
        target: 'Ɗanƙo ya ce, “Kwadọ? Wane kwadọ?”',
        english: 'Ɗanƙo said, “Calabash? Which calabash?”',
      },
      {
        target: 'Maƙwabcin ya yi shiru, ya koma gida.',
        english: 'The neighbour kept quiet, and went home.',
      },
      {
        target: 'Amma ya san inda Ɗanƙo ya ajiye kwadọ ɗin.',
        english: 'But he knew where Ɗanƙo had put the calabash.',
      },
      {
        target: 'Washegari, ya kawo wata kwadọ, ya ajiye ta a fili.',
        english: 'The next day, he brought another calabash and set it out in the open.',
      },
      {
        target: 'Ɗanƙo ya ga ta, ya ce, “Wannan ba ta da rami, ba za ta iya aiki ba.”',
        english:
          'Ɗanƙo saw it and said, “This one has no holes, so it cannot work.”',
      },
      {
        target: 'Sai maƙwabcin ya ce, “To, ka nuna mini wadda take da rami.”',
        english: 'Then the neighbour said, “Well, show me the one that has holes.”',
      },
      {
        target: 'Ɗanƙo ya kawo kwadọn, ya nuna ta.',
        english: 'Ɗanƙo brought the calabash and showed it.',
      },
    ],
    vocabulary: [
      { term: 'Ɗanƙo', gloss: 'the trickster figure of Hausa tales', partOfSpeech: 'proper noun' },
      { term: 'kwadọ', gloss: 'calabash (dried gourd used as a vessel)', partOfSpeech: 'noun' },
      { term: 'maƙwabci', gloss: 'neighbour', partOfSpeech: 'noun' },
      { term: 'rami', gloss: 'hole', partOfSpeech: 'noun' },
      { term: 'ajiya', gloss: 'kept, stored', partOfSpeech: 'verb' },
      { term: 'filin', gloss: 'open ground, yard', partOfSpeech: 'noun' },
    ],
    expressions: [
      {
        expression: 'Ya yi shiru',
        gloss: 'He kept quiet',
        note: '“Shiru” is silence as an action. “Shiru ba shi da laifi” — silence has no fault — makes the same point as a proverb.',
      },
      {
        expression: 'Bayan kwana biyu',
        gloss: 'After two days',
        note: '“kwana” is both “to spend the night” and the unit “day”; time in Hausa is counted in nights.',
      },
    ],
    culturalContext:
      'Ɗanƙo is the trickster of Hausa narrative — a spider in many tellings, and in the wider West African family that includes Anansi and Àjàpá. Trickster tales are performed for entertainment and are expected to end with the trickster caught by his own cleverness. The calabash is a household vessel cut from a dried gourd, used for water, food and storage, so borrowing one is an ordinary, everyday request.',
    moral: 'A lie needs a second lie to hold it up, and the second is harder.',
    attribution: { origin: 'adaptation', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: ['quiz-ha-stories-1'],
  },
  {
    id: 'ha-malami-da-yaro',
    language: 'ha',
    category: 'wisdom',
    title: 'Malami da Yaro',
    englishTitle: 'The Teacher and the Boy',
    summary:
      'A boy who cannot answer a question learns that knowing where to look is part of knowing.',
    minutes: 3,
    paragraphs: [
      {
        target: 'Wani malami yana koyar da yara a makaranta.',
        english: 'A teacher was teaching children at a school.',
      },
      {
        target: 'Ya tambayi wani yaro, “Ina ruwa yake zuwa?”',
        english: 'He asked a boy, “Where does water go?”',
      },
      {
        target: 'Yaron ya yi shiru.',
        english: 'The boy was silent.',
      },
      {
        target: 'Malami ya ce, “Ka duba, ka gani.”',
        english: 'The teacher said, “Look, and see.”',
      },
      {
        target: 'Yaron ya duba kogin da ke kusa.',
        english: 'The boy looked at the river nearby.',
      },
      {
        target: 'Ya ga ruwa yana gudu zuwa wani wuri.',
        english: 'He saw the water running to a certain place.',
      },
      {
        target: 'Ya bi ruwan, har ya ga wani babban ruwa.',
        english: 'He followed the water, until he saw a great water.',
      },
      {
        target: 'Ya koma, ya gaya wa malami abin da ya gani.',
        english: 'He returned, and told the teacher what he had seen.',
      },
      {
        target: 'Malami ya ce, “Yanzu ka sani.”',
        english: 'The teacher said, “Now you know.”',
      },
    ],
    vocabulary: [
      { term: 'malami', gloss: 'teacher', partOfSpeech: 'noun' },
      { term: 'yaro', gloss: 'boy', partOfSpeech: 'noun' },
      { term: 'makaranta', gloss: 'school', partOfSpeech: 'noun' },
      { term: 'ruwa', gloss: 'water', partOfSpeech: 'noun' },
      { term: 'kogi', gloss: 'river', partOfSpeech: 'noun' },
      { term: 'duba', gloss: 'look, examine', partOfSpeech: 'verb' },
    ],
    expressions: [
      {
        expression: 'Ka duba, ka gani',
        gloss: 'Look, and see',
        note: 'The pairing matters: “duba” is to direct the eyes, “gani” is to perceive. One does not guarantee the other.',
      },
      {
        expression: 'Yanzu ka sani',
        gloss: 'Now you know',
        note: '“sani” is knowledge from experience or acquaintance, not book knowledge.',
      },
    ],
    culturalContext:
      'Traditional Hausa teaching (ilmi) runs through both Quranic schooling and craft apprenticeship, and both are built on demonstration followed by imitation rather than on explanation alone — which is why “Ilimi gishirin duniya ne”, knowledge is the salt of the world, is a commonplace. A teacher who says “look and see” is using the method the culture expects.',
    moral: 'The answer was never far away; only unlooked for.',
    attribution: { origin: 'original', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: ['quiz-ha-stories-2'],
  },
  {
    id: 'ha-maciji-da-runduna',
    language: 'ha',
    category: 'moral',
    title: 'Maciji da Runduna',
    englishTitle: 'The Snake and the Ants',
    summary:
      'A snake dismisses small creatures, and small creatures carry away what it was guarding.',
    minutes: 2,
    paragraphs: [
      {
        target: 'Wani maciji yana ajiye ƙwai a cikin daji.',
        english: 'A snake was keeping eggs in the bush.',
      },
      {
        target: 'Runduna ta zo, tana neman abinci.',
        english: 'A column of ants came, looking for food.',
      },
      {
        target: 'Macijin ya yi dariya, ya ce, “Ku ba za ku iya komai ba.”',
        english: 'The snake laughed and said, “You cannot do anything.”',
      },
      {
        target: 'Runduna ba ta ce komai ba.',
        english: 'The ants said nothing.',
      },
      {
        target: 'Suka haɗa kai, suka ɗauki abin da suke so.',
        english: 'They joined together, and carried off what they wanted.',
      },
      {
        target: 'Macijin ya yi fushi, amma ba ya iya hana su.',
        english: 'The snake was angry, but could not stop them.',
      },
      {
        target: 'Ƙananan mutane da yawa, sun fi babba ɗaya ƙarfi.',
        english: 'Many small ones are stronger than one big one.',
      },
    ],
    vocabulary: [
      { term: 'maciji', gloss: 'snake', partOfSpeech: 'noun' },
      { term: 'runduna', gloss: 'column of ants, army', partOfSpeech: 'noun' },
      { term: 'ƙwai', gloss: 'eggs', partOfSpeech: 'noun' },
      { term: 'daji', gloss: 'bush, forest', partOfSpeech: 'noun' },
      { term: 'haɗa kai', gloss: 'join together, unite', partOfSpeech: 'verb phrase' },
      { term: 'ƙarfi', gloss: 'strength', partOfSpeech: 'noun' },
    ],
    expressions: [
      {
        expression: 'haɗa kai',
        gloss: 'to join heads / to unite',
        note: 'The standard expression for collective action; literally “join the head”.',
      },
    ],
    culturalContext:
      'Ants, and the discipline of the column they travel in, are a natural reference for collective strength — the same observation behind the proverb “Hannu ɗaya ba ya ɗaukar kaya”, one hand does not lift a load. The story also plays on the Hausa naming of an ant column as “runduna”, a word otherwise used for an army.',
    moral: 'Greatness that discounts the small has miscalculated.',
    attribution: { origin: 'original', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: [],
  },
  {
    id: 'ha-kasuwa-ta-safe',
    language: 'ha',
    category: 'everyday',
    title: 'Kasuwa ta Safe',
    englishTitle: 'The Morning Market',
    summary:
      'A girl learns why her grandmother leaves for the market before the sun, and what that habit buys.',
    minutes: 3,
    paragraphs: [
      {
        target: 'Wata kaka tana tafiya kasuwa da sassafe.',
        english: 'A grandmother goes to the market very early.',
      },
      {
        target: 'Jikarta ta tambaye ta, “Don me za ki tafi da wuri?”',
        english: 'Her granddaughter asked her, “Why do you go so early?”',
      },
      {
        target: 'Kaka ta ce, “Da wuri, ka fi samun abu mai kyau.”',
        english: 'The grandmother said, “Early, you get the better thing.”',
      },
      {
        target: 'Jikarta ta tafi tare da ita washegari.',
        english: 'The granddaughter went with her the next day.',
      },
      {
        target: 'Suna isa kasuwa, haske yana fitowa.',
        english: 'As they reached the market, the light was coming out.',
      },
      {
        target: 'Kayan suna da kyau, mutane kuma ba su yi yawa ba.',
        english: 'The goods were good, and there were not many people.',
      },
      {
        target: 'Kaka ta zaɓi abin da take so, ba tare da gaggawa ba.',
        english: 'The grandmother chose what she wanted, without hurrying.',
      },
      {
        target: 'Jikarta ta ce, “Na gani.”',
        english: 'The granddaughter said, “I have seen.”',
      },
      {
        target: 'Kaka ta ce, “Sannu ba ta hana zuwa ba.”',
        english: 'The grandmother said, “Going slowly does not prevent arriving.”',
      },
    ],
    vocabulary: [
      { term: 'kaka', gloss: 'grandmother (paternal)', partOfSpeech: 'noun' },
      { term: 'jika', gloss: 'grandchild', partOfSpeech: 'noun' },
      { term: 'kasuwa', gloss: 'market', partOfSpeech: 'noun' },
      { term: 'sassafe', gloss: 'very early morning', partOfSpeech: 'adverb' },
      { term: 'zaɓi', gloss: 'choose, select', partOfSpeech: 'verb' },
      { term: 'gaggawa', gloss: 'haste, rushing', partOfSpeech: 'noun' },
    ],
    expressions: [
      {
        expression: 'da wuri',
        gloss: 'early',
        note: 'Literally “with place/position”; appearing early is having a favourable position.',
      },
      {
        expression: 'Na gani',
        gloss: 'I have seen / I understand',
        note: 'Commonly used to mean comprehension, not only sight — the same pairing of seeing and knowing as the teacher story.',
      },
    ],
    culturalContext:
      'The market is a daily institution of Hausa town life, and it runs on an early start: the best produce and the least crowding come before the heat. Going to market is also social — it is where news travels — so a grandmother bringing a grandchild is passing on both a practical habit and a place in the community.',
    moral: 'Being early is a form of patience, not a form of haste.',
    attribution: { origin: 'original', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: ['quiz-ha-stories-3'],
  },
] as const
