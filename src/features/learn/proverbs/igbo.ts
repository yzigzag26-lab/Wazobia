import type { Proverb } from './types'

/**
 * Igbo proverb cards (ìlù).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT — what this data does and does not claim
 *
 * Igbo proverbs are characteristically paired: a saying is often answered by
 * another, and a lone proverb is understood as half a conversation — "ìlù bụ
 * mmanụ e ji eri okwu" (a proverb is the palm oil with which words are eaten).
 * Where a common paired response exists it is recorded in `context`, because
 * presenting one half as a complete statement would misrepresent how the form is
 * used.
 *
 * Orthography uses the dotted vowels ị ọ ụ and ṅ, in the Onwu orthographic
 * convention used in most modern teaching material.
 *
 * Every entry is `unreviewed`. No native-speaker review or dialect survey has
 * been carried out.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const UNREVIEWED = {
  provenance: 'documented-traditional',
  reviewStatus: 'unreviewed',
} as const

export const IGBO_PROVERBS: readonly Proverb[] = [
  {
    id: 'ig-01',
    language: 'ig',
    original: 'Onye hapụrụ ihe ọ na-eme, ya leba anya n’ihe ọ na-abịa.',
    literal: 'Whoever has left what they are doing should look at what is coming.',
    meaning:
      'Attention should follow consequence. What is happening now will not hold still, and the next thing must be considered.',
    context: 'Said to someone over-focused on the immediate at the expense of what it will produce.',
    theme: 'wisdom',
    visual: 'path',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-02',
    language: 'ig',
    original: 'Ọ bụ otu mkpụrụ aka rụta ọtụ ọtụ.',
    literal: 'It is one finger that removes the grub from its sore.',
    meaning:
      'Some work can only be done alone. Being part of a community does not remove individual responsibility.',
    context:
      'Often answered by a proverb about community, producing the customary paired exchange rather than a single verdict.',
    theme: 'character',
    visual: 'hand',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-03',
    language: 'ig',
    original: 'Aka aja aja na-ebute ọnụ mmanụ mmanụ.',
    literal: 'A hand red with soil brings a mouth glossy with oil.',
    meaning:
      'Farm work, and hard work generally, is the direct cause of comfort. Effort pays, and it pays literally.',
    context: 'A farming proverb, said approvingly of anyone doing physical work.',
    theme: 'effort',
    visual: 'farm',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-04',
    language: 'ig',
    original: 'Ilù bụ mmanụ e ji eri okwu.',
    literal: 'A proverb is the palm oil with which words are eaten.',
    meaning:
      'Proverbs make speech digestible. A truth delivered plainly may be refused; delivered as a proverb, it is received.',
    context:
      'The defining statement about the form itself, said when introducing a proverb into a conversation.',
    theme: 'wisdom',
    visual: 'pot',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-05',
    language: 'ig',
    original: 'Nku nku, aka eruo, ọ bụ otu ka a na-agba.',
    literal: 'As it is folded, so it is drummed.',
    meaning:
      'What is set up a certain way must be answered in that way. An arrangement constrains what follows.',
    context: 'Used in negotiation, where terms already accepted shape later demands.',
    theme: 'wisdom',
    visual: 'drum',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-06',
    language: 'ig',
    original: 'Nwata lụọ ọgụ zuru oke, ya too ọla.',
    literal: 'When a child fights a fight and wins it fully, they have grown up.',
    meaning:
      'Competence is demonstrated, not granted by age. A successful undertaking changes how a person is regarded.',
    context: 'Said after a young person handles something beyond their years.',
    theme: 'effort',
    visual: 'child',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-07',
    language: 'ig',
    original: 'Onye na-eche nche anaghị arahụ ụra.',
    literal: 'Whoever is watchful does not sleep.',
    meaning:
      'Vigilance and rest cannot both be fully held. Responsibility to protect something costs comfort.',
    context: 'Acknowledges the cost borne by whoever is guarding a family or a community.',
    theme: 'caution',
    visual: 'moon',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-08',
    language: 'ig',
    original: 'Mmiri dị n’afo azụ, ọ bụ ya mere azụ ji agba ọsọ.',
    literal: 'It is the water in the fish’s belly that makes the fish run.',
    meaning:
      'What drives a person may be internal and invisible. Judge conduct knowing you cannot see its cause.',
    context: 'Said when someone’s urgency or fear seems inexplicable from outside.',
    theme: 'character',
    visual: 'fish',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-09',
    language: 'ig',
    original: 'Ọ dịghị onye na-agba ọsọ n’okpuru osisi, kpuchie anya ya.',
    literal: 'No one runs under a tree with their eyes shut.',
    meaning:
      'Speed in a place of hazard is recklessness. Where risk is present, attention comes before pace.',
    context: 'A warning to the hasty, particularly in negotiation or travel.',
    theme: 'caution',
    visual: 'tree',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-10',
    language: 'ig',
    original: 'Onye kpọrọ ọgụ, ya buru ụzọ chee ya.',
    literal: 'Whoever calls the fight should first think it through.',
    meaning:
      'Initiating a dispute makes you responsible for its consequences. Do not start what you have not weighed.',
    context: 'Said to cool a person insisting on pursuing a quarrel.',
    theme: 'caution',
    visual: 'fire',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-11',
    language: 'ig',
    original: 'Nwa nwa bụ nwa nwa; okwu bụ okwu.',
    literal: 'A child is a child; a word is a word.',
    meaning:
      'Age does not erase accountability. Being young explains a mistake; it does not dissolve it.',
    context: 'Used in adjudication, where excusing a young offender would wrong the injured party.',
    theme: 'character',
    visual: 'child',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-12',
    language: 'ig',
    original: 'Osisi na-amịpụta mkpụrụ ya na-atọ ndị mmadụ ụtọ.',
    literal: 'The tree that yields its fruit sweetly is the one people approach.',
    meaning:
      'Generosity attracts community. A person who gives freely is surrounded rather than avoided.',
    context: 'Said in praise of hospitality, and as an indirect rebuke to a stingy person.',
    theme: 'community',
    visual: 'tree',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-13',
    language: 'ig',
    original: 'Onye wetara ọji, wetara ndụ.',
    literal: 'Whoever brings kola brings life.',
    meaning:
      'The kola nut is the opening of welcome, and hospitality is life. To offer it is to affirm the other person’s presence.',
    context:
      'Ritual language of welcome in many Igbo communities; the kolanut travels before any serious talk.',
    theme: 'community',
    visual: 'calabash',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-14',
    language: 'ig',
    original: 'Onye na-eto eto, na-aka ya azụ.',
    literal: 'Whoever is growing has their hand to their back.',
    meaning:
      'Growth is visible to others before it is visible to the one growing. Others can often see your progress sooner than you can.',
    context: 'Encouragement to someone who cannot perceive their own improvement.',
    theme: 'humility',
    visual: 'child',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-15',
    language: 'ig',
    original: 'Ihe a na-eme n’ọchị, ka a na-eme n’ụka.',
    literal: 'What is done in jest is what is done at the gathering.',
    meaning:
      'Jokes carry real intentions. What a person says in play often reveals what they mean in earnest.',
    context: 'Said after someone’s teasing gives offence or turns out to be true.',
    theme: 'character',
    visual: 'drum',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-16',
    language: 'ig',
    original: 'Onye na-achọ ọtụ, na-achọ ọtụ n’anya.',
    literal: 'Whoever is looking for a grub looks for it carefully with the eye.',
    meaning:
      'Precision requires attention. Finding a small, hidden problem means looking closely rather than widely.',
    context: 'Used when a subtle fault must be located, from a wound to a disagreement.',
    theme: 'patience',
    visual: 'hand',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-17',
    language: 'ig',
    original: 'Ọ bụ otu osisi kpọrọ ọhịa.',
    literal: 'It is one tree that makes a forest feel like a forest.',
    meaning:
      'A single strong presence determines the character of a whole assembly. One person’s stature can carry a group.',
    context: 'Said in recognition of a person whose presence organizes everything around them.',
    theme: 'community',
    visual: 'tree',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-18',
    language: 'ig',
    original: 'Ọjọ na-abịa, anya na-ahụ.',
    literal: 'The day that is coming, the eye sees it.',
    meaning:
      'What is approaching is often already visible to those paying attention. Do not claim to be surprised by what you could see.',
    context: 'Said when a foreseeable outcome arrives and hindsight is offered as surprise.',
    theme: 'wisdom',
    visual: 'moon',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-19',
    language: 'ig',
    original: 'Okwu na-acha ka mmiri, ma ọ bụụrụ onye nwe ya.',
    literal: 'A word looks like water, but it belongs to its owner.',
    meaning:
      'Speech seems free and weightless, yet it is owned by whoever spoke it and will be returned to them.',
    context: 'A caution about careless talk, often among speakers who will meet again.',
    theme: 'caution',
    visual: 'river',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-20',
    language: 'ig',
    original: 'Aka erughi, a na-ele ya anya.',
    literal: 'The hand that cannot reach looks at it.',
    meaning:
      'When effort cannot reach the goal, watching and learning is the honest next step. Wanting without capacity is not a strategy.',
    context: 'Used to advise patience and study where means are lacking.',
    theme: 'humility',
    visual: 'market',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-21',
    language: 'ig',
    original: 'Ụtụtụ anaghị ebido n’abụ.',
    literal: 'The morning does not begin with song.',
    meaning:
      'Real beginnings are quiet and unpromising. The work that matters starts before there is anything to celebrate.',
    context: 'Encouragement during the early, unnoticed stage of a project.',
    theme: 'patience',
    visual: 'farm',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-22',
    language: 'ig',
    original: 'Onye chọrọ ihe ọ na-enweghị, ya akwụọ ụgwọ ume ya.',
    literal: 'Whoever wants what they do not have will pay for it with effort.',
    meaning:
      'Acquisition is priced in work. Nothing wanted is free, and the currency is effort.',
    context: 'Said to a person who wants the result but not the labour.',
    theme: 'effort',
    visual: 'farm',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-23',
    language: 'ig',
    original: 'Ihe kwuru, ihe akwụsịọ.',
    literal: 'A thing that stood, and a thing that stood still beside it.',
    meaning:
      'Change requires action. Two things left standing beside each other will remain exactly that.',
    context: 'Said when a group keeps discussing without moving, or when someone waits for others to act.',
    theme: 'effort',
    visual: 'compound',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
  {
    id: 'ig-24',
    language: 'ig',
    original: 'Ọ bụ nwayọọ ka e ji egbu ọhịa.',
    literal: 'It is gently that the bush is cleared.',
    meaning:
      'Large tasks are completed by steady, careful work, not force. Patience accomplishes what force cannot.',
    context: 'Encouragement to persistence in something long and heavy.',
    theme: 'patience',
    visual: 'farm',
    provenance: { ...UNREVIEWED, source: 'Igbo ìlù, collected sayings (common form)' },
  },
] as const
