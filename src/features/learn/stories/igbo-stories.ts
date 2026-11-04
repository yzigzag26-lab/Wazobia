import type { Story } from './types'

/**
 * Igbo stories for the WAZOBIA Learn reader.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PROVENANCE — read before editing
 *
 * Every story below is `origin: 'original'`: written for WAZOBIA as language-
 * teaching material. None is presented as a recorded traditional tale, and no
 * source is attributed, because none was used.
 *
 * The folktale-shaped one (`ig-mbe-na-mbekwu`) deliberately borrows only the
 * *motif* of the tortoise trickster, which is genuinely widespread across Igbo
 * and wider West African storytelling. The plot here is ours. It is labelled an
 * adaptation rather than a documented tale precisely so nobody mistakes it for a
 * collected version.
 *
 * Nothing here is `reviewed`. A native speaker must review tone, orthography and
 * register before any of it is presented as reliable teaching material, and the
 * UI says so.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const UNREVIEWED_ORIGINAL = {
  provenance: 'original',
  reviewStatus: 'unreviewed',
} as const

export const IGBO_STORIES: readonly Story[] = [
  {
    id: 'ig-mbe-na-mbekwu',
    language: 'ig',
    category: 'folktale',
    title: 'Mbe na Mbekwu',
    englishTitle: 'The Tortoise and the Snail',
    summary:
      'A tortoise borrows a shell and will not give it back — a short tale about cleverness that costs the clever one dear.',
    minutes: 3,
    paragraphs: [
      {
        target: 'N’otu oge, Mbe na Mbekwu bụ ezigbo enyi.',
        english: 'At one time, Tortoise and Snail were good friends.',
      },
      {
        target: 'Mbekwu nwere ụlọ siri ike nke ọ na-ebu n’azụ ya.',
        english: 'Snail had a strong house that he carried on his back.',
      },
      {
        target: 'Mbe enweghị ụlọ ọ bụla, ya mere o jụrụ Mbekwu ka ya gbazie ya nke ọma.',
        english:
          'Tortoise had no house at all, so he asked Snail to lend him his for a little while.',
      },
      {
        target: 'Mbekwu kwetara, n’ihi na ha bụ enyi.',
        english: 'Snail agreed, because they were friends.',
      },
      {
        target: 'Mbe banyere n’ụlọ ahụ, ma ọ chọghịzi ịpụ.',
        english: 'Tortoise entered that house, and did not want to leave it again.',
      },
      {
        target: 'Mgbe Mbekwu rịọrọ ụlọ ya, Mbe sịrị, “Ụlọ a bụ nke m ugbu a.”',
        english:
          'When Snail asked for his house, Tortoise said, “This house is mine now.”',
      },
      {
        target: 'Mbekwu were nwayọọ gaa n’ihu, n’ihi na ọ maara ihe ọ ga-eme.',
        english: 'Snail went forward gently, because he knew what he would do.',
      },
      {
        target: 'O chere otu afọ, ruo mgbe Mbe toro oke, n’ụlọ ahụ adịghịzi ya.',
        english:
          'He waited a year, until Tortoise had grown large, and that house no longer fitted him.',
      },
      {
        target: 'Mgbe ahụ, Mbe pụtara, ma ọ pụghịzịkwa ịlaghachi.',
        english: 'Then Tortoise came out, and could not go back in.',
      },
      {
        target: 'Ụlọ Mbekwu laghachiri na ya, na-enweghị ọgụ ọ bụla.',
        english: 'Snail’s house returned to him, without a single quarrel.',
      },
    ],
    vocabulary: [
      { term: 'Mbe', gloss: 'tortoise', partOfSpeech: 'noun' },
      { term: 'Mbekwu', gloss: 'snail', partOfSpeech: 'noun' },
      { term: 'enyi', gloss: 'friend', partOfSpeech: 'noun' },
      { term: 'ụlọ', gloss: 'house, home', partOfSpeech: 'noun' },
      { term: 'nwayọọ', gloss: 'gently, slowly', partOfSpeech: 'adverb' },
      { term: 'afọ', gloss: 'year (also: stomach, depending on context)', partOfSpeech: 'noun' },
    ],
    expressions: [
      {
        expression: 'N’otu oge',
        gloss: 'At one time / once upon a time',
        note: 'The standard story-opening formula. Literally “in one time”.',
      },
      {
        expression: 'were nwayọọ',
        gloss: 'took it gently',
        note: '“With gentleness”. Frequently the marker of a character who is about to win by patience rather than force.',
      },
    ],
    culturalContext:
      'The tortoise (Mbe) is the trickster of Igbo folktale, in the same family as Àjàpá in Yorùbá and Ɗanƙo in Hausa. Trickster tales are told to children partly for amusement and partly as a rehearsal of social situations. This particular plot is written for WAZOBIA rather than collected, but it uses that established character in the way the tradition does.',
    moral:
      'Cleverness that takes what belongs to another eventually runs out of room. Patience needs no argument.',
    attribution: {
      origin: 'adaptation',
      author: 'WAZOBIA editorial',
    },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: ['quiz-ig-stories-1'],
  },
  {
    id: 'ig-ubi-na-mmiri',
    language: 'ig',
    category: 'everyday',
    title: 'Ubi na Mmiri',
    englishTitle: 'The Farm and the Rain',
    summary:
      'A farmer waits for rain and learns the difference between waiting for help and preparing for it.',
    minutes: 3,
    paragraphs: [
      {
        target: 'Onye ọrụ ugbo aha ya bụ Nnamdi nwere ubi ọhụrụ.',
        english: 'A farmer named Nnamdi had a new farm.',
      },
      {
        target: 'Ọ kpọrọ mmiri, ma mmiri aghị abịa.',
        english: 'He called on the rain, but the rain did not come.',
      },
      {
        target: 'Ụbọchị ọ bụla, ọ na-ele anya n’igwe, na-eche mmiri.',
        english: 'Every day, he looked at the sky, waiting for rain.',
      },
      {
        target: 'Nna ya gwara ya, “Mmiri abịaghị, ma ụwa adịghị akwụsị.”',
        english:
          'His father told him, “The rain has not come, but the world has not stopped.”',
      },
      {
        target: 'Ya mere ọ malitere ịkọ ala ahụ n’aka ya.',
        english: 'So he started to clear that land with his own hands.',
      },
      {
        target: 'O siri ike, ma ọ dara mma karịa ichere.',
        english: 'It was hard, but it was better than waiting.',
      },
      {
        target: 'Mgbe mmiri bịara, ala ahụ dịla njikere.',
        english: 'By the time the rain came, the ground was already ready.',
      },
      {
        target: 'Ndị agbata obi ya bịara ịhụ ihe ọ kụrụ.',
        english: 'His neighbours came to see what he had planted.',
      },
      {
        target: 'Onye ọ bụla chọrọ ịmụta ihe o mere.',
        english: 'Everyone wanted to learn what he had done.',
      },
    ],
    vocabulary: [
      { term: 'ubi', gloss: 'farm', partOfSpeech: 'noun' },
      { term: 'mmiri', gloss: 'water, rain', partOfSpeech: 'noun' },
      { term: 'onye ọrụ ugbo', gloss: 'farmer', partOfSpeech: 'noun phrase' },
      { term: 'ala', gloss: 'land, ground', partOfSpeech: 'noun' },
      { term: 'agbata obi', gloss: 'neighbour', partOfSpeech: 'noun phrase' },
      { term: 'njikere', gloss: 'readiness, prepared state', partOfSpeech: 'noun' },
    ],
    expressions: [
      {
        expression: 'Ụwa adịghị akwụsị',
        gloss: 'The world does not stop',
        note: 'Said when someone is waiting for conditions to improve before acting.',
      },
      {
        expression: 'dịla njikere',
        gloss: 'was already ready',
        note: 'The -la suffix here marks a state completed before the moment being described.',
      },
    ],
    culturalContext:
      'Farming language is woven through everyday Igbo speech — “aka aja aja” (a hand red with soil) is an approving description of hard work, because agricultural labour is the reference point for effort itself. Rain-fed farming also means the planting calendar is set by the rains, which is the tension this story turns on.',
    moral:
      'Waiting for help is not the same as being ready for it.',
    attribution: { origin: 'original', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: ['quiz-ig-stories-2'],
  },
  {
    id: 'ig-nwa-na-oche',
    language: 'ig',
    category: 'wisdom',
    title: 'Nwa na Oche',
    englishTitle: 'The Child and the Stool',
    summary:
      'A child insists on a stool too big for them, and learns what a seat is actually for.',
    minutes: 2,
    paragraphs: [
      {
        target: 'Nwatakịrị nwanyị nọ n’ụlọ nna ya.',
        english: 'A young girl was in her father’s house.',
      },
      {
        target: 'Ọ hụrụ oche dị elu, ma ọ chọrọ ịnọdụ na ya.',
        english: 'She saw a high stool, and she wanted to sit on it.',
      },
      {
        target: 'Nne ya gwara ya, “Oche ahụ abụghị nke gị.”',
        english: 'Her mother told her, “That stool is not yours.”',
      },
      {
        target: 'Nwa ahụ sịrị, “M ga-anọdụ na ya.”',
        english: 'The child said, “I will sit on it.”',
      },
      {
        target: 'O rịgoro, n’ihi na o siri ike.',
        english: 'She struggled up, because it was hard.',
      },
      {
        target: 'Ọ nọdụrụ ala, ma ụkwụ ya adịghị eru ala.',
        english: 'She sat, but her feet did not reach the ground.',
      },
      {
        target: 'Mgbe nne ya lere ya anya, ọ naghị ekwu okwu.',
        english: 'When her mother looked at her, she did not say a word.',
      },
      {
        target: 'Nwa ahụ rịturu, ma laghachikwuru oche nta ya.',
        english: 'The child came down, and went back to her small stool.',
      },
      {
        target: 'Oche kwesịrị onye ya, ka ọ na-adị mma.',
        english: 'A stool that suits its person is what is good.',
      },
    ],
    vocabulary: [
      { term: 'oche', gloss: 'stool, seat', partOfSpeech: 'noun' },
      { term: 'nwa', gloss: 'child', partOfSpeech: 'noun' },
      { term: 'ụkwụ', gloss: 'leg, foot', partOfSpeech: 'noun' },
      { term: 'nne', gloss: 'mother', partOfSpeech: 'noun' },
      { term: 'rịgoro', gloss: 'climbed up', partOfSpeech: 'verb' },
      { term: 'kwesịrị', gloss: 'suits, is fitting for', partOfSpeech: 'verb' },
    ],
    expressions: [
      {
        expression: 'Oche kwesịrị onye ya',
        gloss: 'A stool that fits its person',
        note: 'Used more generally for a role that suits the person holding it.',
      },
    ],
    culturalContext:
      'Carved wooden stools are household objects as well as marks of standing: which stool a person may sit on is a small, visible way status is expressed in a compound. The story uses that everyday object rather than explaining it.',
    moral: 'A place that suits you is worth more than a higher one that does not.',
    attribution: { origin: 'original', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: ['quiz-ig-stories-3'],
  },
  {
    id: 'ig-ọkụkọ-na-ụtụtụ',
    language: 'ig',
    category: 'nature',
    title: 'Ọkụkọ na Ụtụtụ',
    englishTitle: 'The Hen and the Morning',
    summary:
      'A hen decides the morning belongs to her. A short tale about claiming credit for a thing you did not make.',
    minutes: 2,
    paragraphs: [
      {
        target: 'Ọkụkọ na-eto n’ụtụtụ ọ bụla.',
        english: 'The hen crows every morning.',
      },
      {
        target: 'O chere na ya na-akpọta ụtụtụ.',
        english: 'She thought that she was the one bringing the morning.',
      },
      {
        target: 'O gwara ewu, “Ọ bụ m na-eme ka chi ọ bọọ.”',
        english: 'She told the goat, “It is I who makes it dawn.”',
      },
      {
        target: 'Ewu jụrụ ya, “Gịnị ga-eme ma i kwughị ihe ọ bụla?”',
        english: 'The goat asked her, “What would happen if you said nothing at all?”',
      },
      {
        target: 'N’abalị ahụ, ọkụkọ ahụ kwụsịrị ikwu okwu.',
        english: 'That night, the hen stopped making a sound.',
      },
      {
        target: 'Ụtụtụ bịara.',
        english: 'The morning came.',
      },
      {
        target: 'Ọkụkọ ghọtara na ọ bụghị ya na-akpọta ya.',
        english: 'The hen understood that she was not the one bringing it.',
      },
      {
        target: 'Ma ọ ka na-eto n’ụtụtụ, n’ihi na ọ na-atọ ya ụtọ.',
        english: 'But she still crows in the morning, because she enjoys it.',
      },
    ],
    vocabulary: [
      { term: 'ọkụkọ', gloss: 'chicken, hen', partOfSpeech: 'noun' },
      { term: 'ụtụtụ', gloss: 'morning', partOfSpeech: 'noun' },
      { term: 'egwu', gloss: 'goat', partOfSpeech: 'noun' },
      { term: 'abalị', gloss: 'night', partOfSpeech: 'noun' },
      { term: 'ghọtara', gloss: 'understood', partOfSpeech: 'verb' },
    ],
    expressions: [
      {
        expression: 'chi ọ bọọ',
        gloss: 'for it to dawn',
        note: '“Chi” is day/dawn here; the same word also carries the sense of personal destiny, which is why the phrase is a common pun.',
      },
    ],
    culturalContext:
      'Chickens are part of nearly every household, so animal behaviour is a natural source of proverb imagery — the same habit of observation that produces sayings like “the dog knows its owner’s house”. Naming an animal’s self-importance is a gentle way of naming a person’s.',
    moral: 'Do not mistake your part in a thing for the thing itself.',
    attribution: { origin: 'original', author: 'WAZOBIA editorial' },
    provenance: UNREVIEWED_ORIGINAL,
    comprehensionQuizIds: [],
  },
] as const
