import type { Proverb } from './types'

/**
 * Hausa proverb cards (karin magana).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT — what this data does and does not claim
 *
 * `karin magana` covers both proverbs and fixed idiomatic comparisons; this set
 * is restricted to sayings that carry a teaching, which is what make them
 * proverb cards rather than idioms.
 *
 * Orthography uses the standard Boko conventions, including the hooked letters
 * ɓ ɗ ƙ, and does not use the ʼy / ƴ hook where a plain apostrophe is the more
 * common rendering — consistency inside the set matters more than either
 * convention alone, and a reviewer should settle it.
 *
 * Every entry is `unreviewed`. No native-speaker review or dialect survey has
 * been carried out, and nothing here claims otherwise.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const UNREVIEWED = {
  provenance: 'documented-traditional',
  reviewStatus: 'unreviewed',
} as const

export const HAUSA_PROVERBS: readonly Proverb[] = [
  {
    id: 'ha-01',
    language: 'ha',
    original: 'Komai nisan jifa, ƙasa zai dawo.',
    literal: 'However far a stone is thrown, it returns to the ground.',
    meaning:
      'Nothing escapes its nature or its end. However far a thing is carried, it comes back to what it is.',
    context:
      'Said of people who rise far from their origins, and of plans that ignore the obvious end of things.',
    theme: 'wisdom',
    visual: 'farm',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-02',
    language: 'ha',
    original: 'In ka ga gemun wani ya yi fari, to ka tsufa.',
    literal: 'If you see another man’s beard turn white, then you have grown old.',
    meaning:
      'You measure your own passage of time by other people’s changes. Age arrives while you are watching someone else.',
    context: 'Said with wry humour on meeting someone after many years.',
    theme: 'wisdom',
    visual: 'moon',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-03',
    language: 'ha',
    original: 'Kome nisan dare, gari zai waye.',
    literal: 'However long the night, the town will dawn.',
    meaning:
      'No hardship lasts forever. The end of a hard period is as certain as morning.',
    context: 'Spoken as consolation during illness, mourning or a long difficulty.',
    theme: 'patience',
    visual: 'moon',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-04',
    language: 'ha',
    original: 'Sannu ba ta hana zuwa ba.',
    literal: 'Going slowly does not prevent arriving.',
    meaning:
      'Steady work reaches the destination. Speed is not a condition of success.',
    context: 'Encouragement to a learner or a worker who is progressing slowly but steadily.',
    theme: 'patience',
    visual: 'path',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-05',
    language: 'ha',
    original: 'Ruwa ba ya tsami banza.',
    literal: 'Water does not become sour for nothing.',
    meaning:
      'A change has a cause. If something has gone wrong, something made it go wrong.',
    context: 'Used when a relationship or an arrangement has cooled and the reason must be found.',
    theme: 'wisdom',
    visual: 'river',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-06',
    language: 'ha',
    original: 'Duk wanda ya yi nisa, ya ga abin da ba a gani.',
    literal: 'Whoever travels far sees what is not otherwise seen.',
    meaning:
      'Travel and exposure teach what staying home cannot. Experience widens judgement.',
    context: 'Said in praise of travel and of learning from outside one’s own place.',
    theme: 'wisdom',
    visual: 'path',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-07',
    language: 'ha',
    original: 'Hannu ɗaya ba ya ɗaukar kaya.',
    literal: 'One hand does not lift a load.',
    meaning:
      'Cooperation is required for anything heavy. Individual effort has a ceiling.',
    context: 'The standard appeal for collective work, from harvest to community projects.',
    theme: 'community',
    visual: 'basket',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-08',
    language: 'ha',
    original: 'Kowa ya yi gaggawa, ya faɗi a rami.',
    literal: 'Whoever hurries falls into a hole.',
    meaning:
      'Haste creates the very problems it is trying to avoid. Speed without care is a hazard.',
    context: 'A warning to the impatient, especially in negotiation or travel.',
    theme: 'caution',
    visual: 'path',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-09',
    language: 'ha',
    original: 'Ilimi gishirin duniya ne.',
    literal: 'Knowledge is the salt of the world.',
    meaning:
      'As salt makes food worth eating, knowledge makes life worth living. Learning is a staple, not a luxury.',
    context: 'A common encouragement to schooling, often said by teachers and parents.',
    theme: 'effort',
    visual: 'market',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-10',
    language: 'ha',
    original: 'Komai girman doki, an haife shi ne a kan ƙasa.',
    literal: 'However great a horse, it was born on the ground.',
    meaning:
      'No one begins above others. Greatness is arrived at, not innate.',
    context: 'Said to check arrogance in someone who has risen in status.',
    theme: 'humility',
    visual: 'compound',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-11',
    language: 'ha',
    original: 'Kare ya fi kaza sani a gidan mai su.',
    literal: 'The dog knows the house of its owner better than the hen does.',
    meaning:
      'Familiarity, not proximity, produces knowledge. Being present is not the same as understanding.',
    context: 'Used when an outsider claims to know a household or a matter better than those close to it.',
    theme: 'wisdom',
    visual: 'compound',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-12',
    language: 'ha',
    original: 'Ido ba ya gani, baki ya kan faɗa.',
    literal: 'The eye does not see it, yet the mouth will say it.',
    meaning:
      'People speak confidently about what they have not examined. Untested certainty is everywhere.',
    context: 'A caution against repeating a claim whose source has not been checked.',
    theme: 'caution',
    visual: 'market',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-13',
    language: 'ha',
    original: 'Yaro mai son zama, ya kan yi wa kansa hidima.',
    literal: 'The boy who wants to become something serves himself.',
    meaning:
      'Ambition shows itself in self-discipline. Whoever wants to rise does the unglamorous work first.',
    context: 'Said approvingly of a hardworking young person.',
    theme: 'effort',
    visual: 'farm',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-14',
    language: 'ha',
    original: 'Gaskiya ta fi kwabo.',
    literal: 'Truth is worth more than a penny.',
    meaning:
      'Honesty outranks any immediate gain. Its value is not measured in what it can be sold for.',
    context:
      'One of the most frequently used Hausa sayings, invoked in disputes and when refusing a dishonest advantage.',
    theme: 'character',
    visual: 'hand',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-15',
    language: 'ha',
    original: 'Wanda ba ya ji, ba ya jin daɗi.',
    literal: 'Whoever does not listen does not enjoy.',
    meaning:
      'Refusing counsel costs a person their comfort. The one who will not hear ends up suffering what they were warned about.',
    context: 'Said to a person ignoring advice, often a younger relative.',
    theme: 'caution',
    visual: 'child',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-16',
    language: 'ha',
    original: 'Shiru ba shi da laifi.',
    literal: 'Silence has no fault.',
    meaning:
      'Holding your tongue is rarely wrong. Much trouble is created by speech, not by restraint.',
    context: 'Said to someone about to speak in anger, or being drawn into a quarrel.',
    theme: 'patience',
    visual: 'market',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-17',
    language: 'ha',
    original: 'Abin da ya fi ƙarfin mutum, shi ne ya fi shi.',
    literal: 'What exceeds a person’s strength is what is beyond him.',
    meaning:
      'Know your limit and do not pretend otherwise. Acknowledging a limit is part of competence.',
    context: 'Said to encourage delegation rather than a brave but doomed attempt.',
    theme: 'humility',
    visual: 'basket',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-18',
    language: 'ha',
    original: 'Kome nisan tafiya, gida yana da daɗi.',
    literal: 'However far the journey, home has sweetness.',
    meaning:
      'Travel is worthwhile and return is a comfort. Distance does not cancel belonging.',
    context: 'Greeting and farewell formula for travellers and for those living away.',
    theme: 'family',
    visual: 'compound',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-19',
    language: 'ha',
    original: 'Garin da ba ka da sani, kada ka yi fari.',
    literal: 'In a town where you know no one, do not become conspicuous.',
    meaning:
      'Learn the ground before drawing attention on it. Discretion is the traveller’s protection.',
    context: 'Advice to someone moving to a new place or entering an unfamiliar group.',
    theme: 'caution',
    visual: 'market',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-20',
    language: 'ha',
    original: 'Ba a san mai yin kuka ba, sai an ji ta.',
    literal: 'The one who weeps is not known until the cry is heard.',
    meaning:
      'Feeling is invisible until it is expressed. Do not assume someone is untroubled because they are quiet.',
    context: 'Used when a person’s difficulty becomes clear only after it has become serious.',
    theme: 'character',
    visual: 'child',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-21',
    language: 'ha',
    original: 'Gaba da gaba, an fi gani.',
    literal: 'Going together, one sees further.',
    meaning:
      'Two people looking forward see more than one does alone. Counsel improves judgement.',
    context: 'Said when inviting someone with experience to join a decision.',
    theme: 'community',
    visual: 'tree',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-22',
    language: 'ha',
    original: 'Baka da yawa, kai kaɗai.',
    literal: 'Many bows, but only one head.',
    meaning:
      'However many options there are, you have only one life to risk on them. Choose with care.',
    context: 'A saying about the seriousness of decisions, heard in counsel before a risk.',
    theme: 'caution',
    visual: 'tree',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-23',
    language: 'ha',
    original: 'Ƙoƙari ba ya ɓarna.',
    literal: 'Effort is not spoiled.',
    meaning:
      'Work done honestly is never wasted, even when the outcome disappoints. The attempt carries value.',
    context: 'Encouragement after a failure, and praise for sustained effort.',
    theme: 'effort',
    visual: 'farm',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
  {
    id: 'ha-24',
    language: 'ha',
    original: 'Tsoro ne ya fi ƙarfin mutum.',
    literal: 'It is fear that is stronger than a person.',
    meaning:
      'What defeats people is more often fear than the obstacle itself. Naming the fear reduces it.',
    context: 'Said to someone hesitating before a task they are capable of.',
    theme: 'character',
    visual: 'hand',
    provenance: { ...UNREVIEWED, source: 'Hausa karin magana, collected sayings (common form)' },
  },
] as const
