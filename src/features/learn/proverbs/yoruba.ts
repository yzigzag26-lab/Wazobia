import type { Proverb } from './types'

/**
 * Yorùbá proverb cards.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT — what this data does and does not claim
 *
 * These are traditional Yorùbá proverbs (òwe Yorùbá) that appear in published
 * collections. The wording below is one common form of each; proverbs travel in
 * variants, and no variant is "the" version.
 *
 * Every entry carries `reviewStatus: 'unreviewed'`, and the UI renders that.
 * No native-speaker review, no tonal verification and no dialect survey has
 * been done for this build, and nothing in this file says otherwise.
 *
 * Orthography: tone marks and sub-dots are written in full (ẹ, ọ, ṣ and the
 * acute/grave tones), because in Yorùbá they carry meaning rather than
 * decoration. They are stored as composed characters and must never be
 * normalised away.
 *
 * `source` names the collection an editor can check the form against. It is a
 * starting point for review, not a claim of transcription fidelity.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const UNREVIEWED = {
  provenance: 'documented-traditional',
  reviewStatus: 'unreviewed',
} as const

export const YORUBA_PROVERBS: readonly Proverb[] = [
  {
    id: 'yo-01',
    language: 'yo',
    original: 'Ilé ni à ń wò kí á tó sọ ọmọ lórúkọ.',
    literal: 'It is the house that is examined before a child is named.',
    meaning:
      'Look at the circumstances a thing is born into before you commit to what you call it. A name should answer to reality.',
    context:
      'Used when a family or community is deciding something consequential, and as a caution against naming a thing before understanding it.',
    theme: 'wisdom',
    visual: 'compound',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-02',
    language: 'yo',
    original: 'Bí ọmọdé kò bá mọ̀wé, á mọ ọ̀nà ilé rẹ̀.',
    literal: 'Even if a child has no learning, he knows the way to his own house.',
    meaning:
      'Everyone knows something well — at minimum, their own world. Do not mistake lack of formal education for lack of knowledge.',
    context:
      'Said in defence of a person being dismissed for being unlettered; it redirects respect to lived knowledge.',
    theme: 'humility',
    visual: 'path',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-03',
    language: 'yo',
    original: 'Ẹní bá ní ojú, kò ní ojú àtẹ́lẹwọ̀.',
    literal: 'Whoever has eyes has no eye in the palm of the hand.',
    meaning:
      'What you can see, you cannot carry about in your hand to show. Understanding is not transferable as an object is.',
    context: 'Used when someone asks for proof of something that must be understood rather than demonstrated.',
    theme: 'wisdom',
    visual: 'hand',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-04',
    language: 'yo',
    original: 'Àgbà kì í wà lọ́jà, kí orí ọmọ tuntun wọ́.',
    literal: 'An elder is never in the market while a newborn’s head hangs crooked.',
    meaning:
      'While experienced people are present, a beginner’s mistake should not go uncorrected. Presence carries responsibility.',
    context: 'A reminder to elders and teachers that authority obliges them to intervene.',
    theme: 'community',
    visual: 'market',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-05',
    language: 'yo',
    original: 'Kékeré ni à ń pèé kún, bí ó tóbi tán, ó di igbá.',
    literal: 'It is while small that a thing is filled; when it is large it becomes a calabash.',
    meaning:
      'Character is formed early. By the time a person is grown, what was poured in has set.',
    context: 'Said about upbringing, and about the difficulty of correcting an adult.',
    theme: 'character',
    visual: 'calabash',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-06',
    language: 'yo',
    original: 'Ọ̀rọ̀ tó bá wù ú, ni ọ̀rọ̀ ń gbà.',
    literal: 'It is the word that pleases it that a word answers to.',
    meaning:
      'A conversation follows what the listener is willing to hear. Address the hearer, not only the point.',
    context: 'Used in mediation, where the same message lands or fails depending on how it is framed.',
    theme: 'wisdom',
    visual: 'market',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-07',
    language: 'yo',
    original: 'Bí a bá ní ìwà, a ní ọ̀rọ̀; bí a kò ní ìwà, a kò ní ọ̀rọ̀.',
    literal: 'If we have character, we have a voice; if we have no character, we have no voice.',
    meaning:
      'Standing to speak comes from conduct, not from volume. Character is the licence to be heard.',
    context: 'Said of someone whose opinion carries weight because of how they have behaved.',
    theme: 'character',
    visual: 'compound',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-08',
    language: 'yo',
    original: 'Ọjọ́ kan kì í gbé odò gbé ẹ̀kọ́.',
    literal: 'One day does not carry the river and carry the bank.',
    meaning:
      'Great things are not accomplished in a single day. Anything worth building takes repeated days.',
    context: 'An encouragement during long work, and a rebuke to impatience.',
    theme: 'patience',
    visual: 'river',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-09',
    language: 'yo',
    original: 'Ẹrú ni ẹ̀yà, ẹ̀yà ni ẹrú.',
    literal: 'A burden is a share; a share is a burden.',
    meaning:
      'What is carried together belongs to everyone together. Shared load is shared ownership.',
    context: 'Used when distributing work in a household or a group, to refuse selective duty.',
    theme: 'community',
    visual: 'basket',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-10',
    language: 'yo',
    original: 'Ajá tí ó máa ń sọnù, a máa ń gbọ́ ìró ìpè.',
    literal: 'The dog that will get lost hears the sound of the whistle.',
    meaning:
      'Warning is not always enough; some lessons are only learned by the one who ignores the call.',
    context: 'Said with regret rather than contempt when someone will not take advice.',
    theme: 'caution',
    visual: 'path',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-11',
    language: 'yo',
    original: 'Kò sí eégún tó ń jó, tí a kò ní í fi ojú rí.',
    literal: 'There is no masquerade dancing that we will not see with our eyes.',
    meaning:
      'Nothing stays hidden indefinitely. What is done in the open will eventually be seen and answered for.',
    context: 'A warning about conduct, drawing on the egúngún masquerade tradition where what is concealed still parades in public.',
    theme: 'caution',
    visual: 'cloth',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-12',
    language: 'yo',
    original: 'Ọmọ tí a kò kọ́, ni yóò gbé ilé tí a kọ́ tà.',
    literal: 'The child we did not teach is the one who will sell the house we built.',
    meaning:
      'Unraised children destroy what a generation built. Investment in teaching is the only inheritance that holds.',
    context: 'Spoken in families about schooling and character formation.',
    theme: 'family',
    visual: 'compound',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-13',
    language: 'yo',
    original: 'Bí ojú bá ti rí, ara a tẹ̀ é.',
    literal: 'Once the eye has seen it, the body will follow.',
    meaning:
      'Example teaches more than instruction. What a child watches, they will practise.',
    context: 'Said to adults whose conduct is being observed by the young.',
    theme: 'character',
    visual: 'child',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-14',
    language: 'yo',
    original: 'Ẹní gbé igbá, kò gbé ọ̀rẹ́ rẹ̀.',
    literal: 'Whoever carries the calabash does not carry its companion.',
    meaning:
      'Each person carries their own portion. You cannot carry another’s responsibility for them.',
    context: 'Used to decline an unreasonable request for someone to shoulder another’s load.',
    theme: 'effort',
    visual: 'calabash',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-15',
    language: 'yo',
    original: 'Igi tí ó bá ń so èso, ni à ń fi òkúta sọ.',
    literal: 'It is the tree that bears fruit that stones are thrown at.',
    meaning:
      'Being criticised is often evidence that you are producing something. Expect attention in proportion to output.',
    context: 'Encouragement to someone facing envy over their work.',
    theme: 'effort',
    visual: 'tree',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-16',
    language: 'yo',
    original: 'A kì í fi ojú àná wo ojú ọ̀la.',
    literal: 'One does not look at tomorrow with yesterday’s eyes.',
    meaning:
      'The past cannot be the only lens for what is coming. Situations change and demand fresh judgement.',
    context: 'Said when someone is judged by an outdated impression of them.',
    theme: 'wisdom',
    visual: 'moon',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-17',
    language: 'yo',
    original: 'Ẹjọ́ kì í tán ní àárọ̀.',
    literal: 'A quarrel is not finished at dawn.',
    meaning:
      'Disputes need time. Deciding a matter in the heat of the morning settles the words, not the cause.',
    context: 'Used to counsel delay in a conflict, and to protect relationships from hasty judgement.',
    theme: 'patience',
    visual: 'moon',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-18',
    language: 'yo',
    original: 'Ẹ̀rù ni ojú, ojú ni ẹ̀rù.',
    literal: 'Fear is the eye, and the eye is fear.',
    meaning:
      'What you are afraid of shapes what you notice. Fear edits perception before facts arrive.',
    context: 'Said when someone’s account of an event reveals more about their fear than the event.',
    theme: 'caution',
    visual: 'hand',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-19',
    language: 'yo',
    original: 'Àìlọ́wọ́ kì í jẹ́ kí a pa ẹní tí a ní.',
    literal: 'Having little is not a reason to kill the one you have.',
    meaning:
      'Do not destroy what you already possess because it is not enough. Scarcity is not a licence for waste.',
    context: 'A rebuke to those who discard small resources in frustration.',
    theme: 'humility',
    visual: 'pot',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-20',
    language: 'yo',
    original: 'Ọ̀nà kan kì í wọ ilé méjì.',
    literal: 'One road does not enter two houses.',
    meaning:
      'A single course of action serves one outcome. Splitting commitment between incompatible goals fails both.',
    context: 'Used when advising against divided loyalty or an impossible plan.',
    theme: 'wisdom',
    visual: 'path',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-21',
    language: 'yo',
    original: 'Ẹní bá ń gbé ọ̀rọ̀ ìyá rẹ̀, á gbọ́ tirẹ̀.',
    literal: 'Whoever carries their mother’s words will hear their own.',
    meaning:
      'Heeding inherited counsel is repaid: the one who listened has something to say later.',
    context: 'Said of a young person who respects elders and grows into authority.',
    theme: 'family',
    visual: 'child',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-22',
    language: 'yo',
    original: 'Ojú tí ó bá ti rí ẹjẹ́, kì í tún wo ẹ̀wà.',
    literal: 'The eye that has seen blood does not look again at beauty.',
    meaning:
      'An experience of violence changes what a person can attend to. Witnessing harm leaves its mark.',
    context: 'Said quietly in condolence or after community conflict, about lasting effects.',
    theme: 'character',
    visual: 'fire',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-23',
    language: 'yo',
    original: 'Kì í ṣe ọ̀rọ̀ ni à ń sọ, ìwà ni à ń wò.',
    literal: 'It is not the word that is spoken that is examined, but the conduct.',
    meaning:
      'Conduct is the actual testimony. Words are weighed against what a person does.',
    context: 'Used in character reference before a marriage, a position or a trust.',
    theme: 'character',
    visual: 'hand',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
  {
    id: 'yo-24',
    language: 'yo',
    original: 'Bí a bá ń gbé ìrèké, a ń gbé ìrèké pẹ̀lú ẹ̀rù rẹ̀.',
    literal: 'If we are carrying a deception, we carry its dread along with it.',
    meaning:
      'A lie is baggage. Whoever tells one takes on the work and fear of maintaining it.',
    context: 'A warning given to children and, less gently, to adults.',
    theme: 'caution',
    visual: 'basket',
    provenance: { ...UNREVIEWED, source: 'Òwe Yorùbá, collected sayings (common form)' },
  },
] as const
