/**
 * The answer control for each onboarding question.
 *
 * Kept separate from `questions.ts` because this file exports components only,
 * which React Fast Refresh requires to hot-update a file in place.
 */

import { COUNTRIES, PREFER_NOT_TO_SAY } from '@/config/countries'
import {
  DISCOVERY_SOURCES,
  JOINING_REASONS,
  LANGUAGE_RELATIONSHIPS,
  LEARNING_FREQUENCIES,
  LEARNING_GOALS,
  ONBOARDING_LANGUAGES,
  PROFICIENCY_LEVELS,
  languageLabel,
  type DiscoverySource,
  type JoiningReason,
  type LanguageRelationship,
  type LearningFrequency,
  type LearningGoal,
  type ProficiencyLevel,
} from '@/config/onboarding'
import type { QuestionProps } from '@/features/onboarding/questions'
import { CheckboxGrid, OptionCards, SelectField } from './components/OptionCards'

const COUNTRY_GROUPS = [
  {
    label: 'Africa',
    options: COUNTRIES.filter((country) => country.region === 'africa').map((country) => ({
      value: country.code,
      label: country.name,
    })),
  },
  {
    label: 'Elsewhere',
    options: COUNTRIES.filter((country) => country.region === 'other').map((country) => ({
      value: country.code,
      label: country.name,
    })),
  },
  {
    label: '',
    options: [{ value: PREFER_NOT_TO_SAY, label: 'Prefer not to say' }],
  },
]

const LANGUAGE_OPTIONS = ONBOARDING_LANGUAGES.map((language) => ({
  id: language.id,
  label: languageLabel(language),
}))

/** "Not yet on WAZOBIA" badge for languages outside the launch set. */
function unavailableBadge(id: string): string | null {
  const language = ONBOARDING_LANGUAGES.find((item) => item.id === id)
  return language && !language.available ? 'Not yet on WAZOBIA' : null
}

export interface QuestionControlProps extends QuestionProps {
  readonly questionId: string
}

/** Renders the input(s) for the current question. */
export function QuestionControl({ questionId, profile, error, update, toggleInArray }: QuestionControlProps) {
  switch (questionId) {
    case 'countryOfOrigin':
      return (
        <SelectField
          id="countryOfOrigin"
          label="Country of origin"
          placeholder="Select a country"
          value={profile.countryOfOrigin}
          onChange={(value) => update('countryOfOrigin', value)}
          groups={COUNTRY_GROUPS}
          error={error}
          optional
        />
      )

    case 'currentCountry':
      return (
        <SelectField
          id="currentCountry"
          label="Country of residence"
          placeholder="Select a country"
          value={profile.currentCountry}
          onChange={(value) => update('currentCountry', value)}
          groups={COUNTRY_GROUPS}
          error={error}
          optional
        />
      )

    case 'knownLanguages':
      return (
        <CheckboxGrid
          legend="Languages you know"
          options={LANGUAGE_OPTIONS}
          values={profile.knownLanguages}
          onToggle={(id) => toggleInArray('knownLanguages', id)}
          columns={3}
          error={error}
          badgeFor={unavailableBadge}
        />
      )

    case 'languageRelationship':
      return (
        <OptionCards<LanguageRelationship>
          legend="Your relationship with African languages"
          name="languageRelationship"
          options={LANGUAGE_RELATIONSHIPS}
          value={profile.languageRelationship}
          onChange={(value) => update('languageRelationship', value)}
          columns={1}
        />
      )

    case 'targetLanguages': {
      const unavailable = profile.targetLanguages.filter((id) => unavailableBadge(id)).length
      return (
        <div className="space-y-4">
          <CheckboxGrid
            legend="Languages you want to learn"
            options={LANGUAGE_OPTIONS}
            values={profile.targetLanguages}
            onToggle={(id) => toggleInArray('targetLanguages', id)}
            columns={3}
            error={error}
            badgeFor={unavailableBadge}
          />
          {unavailable > 0 ? (
            <p
              role="status"
              className="rounded-[var(--radius-sm)] border border-gold-300 bg-gold-100 px-3.5 py-2.5 text-[0.75rem] leading-5 text-gold-700"
            >
              {unavailable === 1
                ? 'One of your choices is not available on WAZOBIA yet.'
                : `${unavailable} of your choices are not available on WAZOBIA yet.`}{' '}
              Your interest is recorded so the platform can prioritise it, but no lessons exist for
              those languages today.
            </p>
          ) : null}
        </div>
      )
    }

    case 'proficiencyLevel':
      return (
        <OptionCards<ProficiencyLevel>
          legend="Current proficiency"
          name="proficiencyLevel"
          options={PROFICIENCY_LEVELS}
          value={profile.proficiencyLevel}
          onChange={(value) => update('proficiencyLevel', value)}
          columns={1}
        />
      )

    case 'learningGoals':
      return (
        <CheckboxGrid<LearningGoal>
          legend="Learning goals"
          options={LEARNING_GOALS}
          values={profile.learningGoals}
          onToggle={(id) => toggleInArray('learningGoals', id)}
          columns={2}
        />
      )

    case 'joiningReason':
      return (
        <OptionCards<JoiningReason>
          legend="Main reason for joining"
          name="joiningReason"
          options={JOINING_REASONS}
          value={profile.joiningReason}
          onChange={(value) => update('joiningReason', value)}
          columns={1}
        />
      )

    case 'discoverySource':
      return (
        <OptionCards<DiscoverySource>
          legend="How you discovered WAZOBIA"
          name="discoverySource"
          options={DISCOVERY_SOURCES}
          value={profile.discoverySource}
          onChange={(value) => update('discoverySource', value)}
          columns={1}
        />
      )

    case 'preferredLearningFrequency':
      return (
        <OptionCards<LearningFrequency>
          legend="Preferred learning frequency"
          name="preferredLearningFrequency"
          options={LEARNING_FREQUENCIES}
          value={profile.preferredLearningFrequency}
          onChange={(value) => update('preferredLearningFrequency', value)}
          columns={1}
        />
      )

    default:
      return null
  }
}
