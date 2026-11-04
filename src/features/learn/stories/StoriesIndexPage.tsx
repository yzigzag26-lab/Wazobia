import { Link, useSearchParams } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { IconStory } from '@/components/ui/icons'
import { ComingSoon, LanguageNotSelected } from '../components/LanguageState'
import { STUDY_LANGUAGE_LABELS, isStudyLanguage } from '../language'
import { storiesFor } from './index'
import { STORY_CATEGORY_LABELS, STORY_ORIGIN_LABELS } from './types'
import type { StoryCategory } from './types'

/**
 * African Stories index.
 *
 * Filtered by category, defaulting to the learner's onboarding language — the
 * same source the rest of Learn uses, so nothing asks twice. The filter lives in
 * the URL so a category view can be linked and reloaded.
 *
 * Each card states its origin. That badge is the point of the screen as much as
 * the title is: a reader is entitled to know whether they are reading a
 * collected tale or something written for the app.
 */
export default function StoriesIndexPage() {
  const { primaryLanguage } = useProfile()
  const [params, setParams] = useSearchParams()
  const active = (params.get('category') ?? 'all') as StoryCategory | 'all'

  if (!primaryLanguage || !isStudyLanguage(primaryLanguage)) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={<span>Learn · African Stories</span>}
          title="African Stories"
          description="Read, listen and understand — with vocabulary and cultural context."
        />
        {primaryLanguage ? (
          <ComingSoon languageName={STUDY_LANGUAGE_LABELS[primaryLanguage]} />
        ) : (
          <LanguageNotSelected />
        )}
      </div>
    )
  }

  const stories = storiesFor(primaryLanguage)
  const categories = [...new Set(stories.map((story) => story.category))]
  const visible = active === 'all' ? stories : stories.filter((story) => story.category === active)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<span>Learn · African Stories</span>}
        title={`${STUDY_LANGUAGE_LABELS[primaryLanguage]} stories`}
        description="Short stories with the original text, an English translation, the vocabulary worth keeping, and the context you need to read them properly."
        actions={<Badge tone="neutral">{stories.length} stories</Badge>}
      />

      <Tabs
        label="Filter by category"
        active={active}
        onChange={(next) => {
          if (next === 'all') setParams({})
          else setParams({ category: next })
        }}
        items={[
          { id: 'all' as const, label: 'All' },
          ...categories.map((category) => ({
            id: category,
            label: STORY_CATEGORY_LABELS[category],
          })),
        ]}
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {visible.map((story) => (
          <li key={story.id}>
            <Link
              to={`/app/learn/stories/${story.id}`}
              className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 transition-colors hover:border-forest-400"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 text-forest-800">
                  <IconStory width={20} height={20} />
                </span>
                <Badge tone={story.attribution.origin === 'original' ? 'neutral' : 'info'}>
                  {STORY_ORIGIN_LABELS[story.attribution.origin]}
                </Badge>
              </div>

              <h2
                lang={primaryLanguage}
                className="mt-3 font-serif text-[1.125rem] leading-7 text-ink-900"
              >
                {story.title}
              </h2>
              <p className="text-[0.8125rem] italic leading-5 text-ink-500">
                {story.englishTitle}
              </p>
              <p className="mt-2 flex-1 text-[0.875rem] leading-6 text-ink-600">{story.summary}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-paper-200 pt-2.5 text-[0.6875rem] text-ink-400">
                <span className="font-medium uppercase tracking-[0.08em]">
                  {STORY_CATEGORY_LABELS[story.category]}
                </span>
                <span aria-hidden="true">·</span>
                <span>{story.minutes} min read</span>
                <span aria-hidden="true">·</span>
                <span>{story.vocabulary.length} words</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <p className="text-[0.875rem] text-ink-500">No stories in this category yet.</p>
      ) : null}
    </div>
  )
}
