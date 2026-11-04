import { describe, expect, it } from 'vitest'
import { isQuestionAnswered, validateQuestion } from './validation'
import { QUESTIONS, TOTAL_QUESTIONS, findQuestionIndex } from './questions'
import { createEmptyOnboardingProfile } from '@/types/onboarding'

describe('onboarding validation', () => {
  const blank = createEmptyOnboardingProfile()

  it('never errors on a completely blank questionnaire', () => {
    for (const question of QUESTIONS) {
      expect(validateQuestion(question.id, blank)).toBeUndefined()
    }
  })

  it('accepts valid country codes and the declined sentinel', () => {
    expect(validateQuestion('countryOfOrigin', { ...blank, countryOfOrigin: 'NG' })).toBeUndefined()
    expect(validateQuestion('currentCountry', { ...blank, currentCountry: 'GB' })).toBeUndefined()
    expect(
      validateQuestion('countryOfOrigin', { ...blank, countryOfOrigin: 'prefer_not_to_say' }),
    ).toBeUndefined()
  })

  it('rejects country values that are not in the list', () => {
    expect(validateQuestion('countryOfOrigin', { ...blank, countryOfOrigin: 'ZZ' })).toBeDefined()
    expect(validateQuestion('currentCountry', { ...blank, currentCountry: 'Atlantis' })).toBeDefined()
  })

  it('rejects language ids outside the catalogue', () => {
    expect(validateQuestion('knownLanguages', { ...blank, knownLanguages: ['yo', 'klingon'] })).toBeDefined()
    expect(validateQuestion('targetLanguages', { ...blank, targetLanguages: ['nope'] })).toBeDefined()
  })

  it('accepts known catalogue languages', () => {
    expect(validateQuestion('targetLanguages', { ...blank, targetLanguages: ['sw', 'yo'] })).toBeUndefined()
  })

  it('caps target languages at eight', () => {
    const nine = ['yo', 'ha', 'ig', 'sw', 'am', 'zu', 'xh', 'so', 'tw']
    expect(validateQuestion('targetLanguages', { ...blank, targetLanguages: nine })).toMatch(/up to 8/i)
  })

  it('treats each question independently', () => {
    expect(isQuestionAnswered('countryOfOrigin', blank)).toBe(false)
    expect(isQuestionAnswered('countryOfOrigin', { ...blank, countryOfOrigin: 'NG' })).toBe(true)
    // A country answer must not make a different question look answered.
    expect(isQuestionAnswered('currentCountry', { ...blank, countryOfOrigin: 'NG' })).toBe(false)
    expect(isQuestionAnswered('knownLanguages', { ...blank, knownLanguages: ['yo'] })).toBe(true)
    expect(isQuestionAnswered('targetLanguages', { ...blank, targetLanguages: ['yo'] })).toBe(true)
    expect(isQuestionAnswered('discoverySource', { ...blank, discoverySource: 'search_engine' })).toBe(true)
  })

  it('counts a declined country as answered', () => {
    expect(isQuestionAnswered('countryOfOrigin', { ...blank, countryOfOrigin: 'prefer_not_to_say' })).toBe(
      true,
    )
  })
})

describe('question registry', () => {
  it('exposes exactly the ten specified questions, one per page', () => {
    expect(TOTAL_QUESTIONS).toBe(10)
    expect(QUESTIONS.map((q) => q.id)).toEqual([
      'countryOfOrigin',
      'currentCountry',
      'knownLanguages',
      'languageRelationship',
      'targetLanguages',
      'proficiencyLevel',
      'learningGoals',
      'joiningReason',
      'discoverySource',
      'preferredLearningFrequency',
    ])
  })

  it('keeps the three specification groups in order', () => {
    const steps = QUESTIONS.map((q) => q.step)
    expect(steps.filter((s) => s === 1)).toHaveLength(4)
    expect(steps.filter((s) => s === 2)).toHaveLength(3)
    expect(steps.filter((s) => s === 3)).toHaveLength(3)
    // Groups must be contiguous: never step 3 before step 2.
    expect(steps).toEqual(steps.toSorted((a, b) => a - b))
  })

  it('addresses every question with a unique id and a title', () => {
    const ids = QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const question of QUESTIONS) expect(question.title.length).toBeGreaterThan(0)
  })

  it('resolves question indexes for navigation', () => {
    expect(findQuestionIndex('countryOfOrigin')).toBe(0)
    expect(findQuestionIndex('preferredLearningFrequency')).toBe(9)
  })
})
