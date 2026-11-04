import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconBack, IconChevronRight, IconInfo, IconQuiz } from '@/components/ui/icons'
import { NotFoundInline } from '../components/NotFoundInline'
import { ReadAloudPlayer } from '../readAloud/ReadAloudPlayer'
import { HighlightedLines } from '../readAloud/HighlightedLines'
import { storyLines } from '../readAloud/speakable'
import { useSpeech } from '../readAloud/useSpeech'
import { usePersistentState } from '@/hooks/usePersistentState'
import { findStory } from './index'
import { STORY_CATEGORY_LABELS, STORY_ORIGIN_LABELS } from './types'
import { STUDY_LANGUAGE_LABELS } from '../language'
import { findQuizzes } from '../quizzes'
import { cn } from '@/utils/cn'
import type { Story } from './types'

/**
 * Story reader.
 *
 * Everything the brief asks a story page to carry, in reading order:
 *
 *   title · language · provenance → text with translation → vocabulary →
 *   expressions → cultural context → moral → comprehension questions
 *
 * Read Aloud sits above the text and reads the target-language paragraphs only.
 * The English translation is never spoken in a Yorùbá/Hausa/Igbo voice.
 *
 * Reading progress is per story, stored on this device. It is a scroll-position
 * heuristic, and it says so — it does not claim to know whether the learner
 * actually read anything.
 */

const STORY_PROGRESS_KEY = 'story-progress.v1'

function isProgressMap(value: unknown): value is Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.values(value as Record<string, unknown>).every(
    (entry) => typeof entry === 'number' && entry >= 0 && entry <= 1,
  )
}

export default function StoryPage() {
  const { storyId = '' } = useParams()
  const story = findStory(storyId)
  const [progress, setProgress] = usePersistentState<Record<string, number>>(
    STORY_PROGRESS_KEY,
    {},
    isProgressMap,
  )

  if (!story) {
    return (
      <NotFoundInline
        title="Story not found"
        description="No story has this id in the current collection."
        backTo="/app/learn/stories"
        backLabel="All stories"
      />
    )
  }

  const percent = progress[story.id] ?? 0

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-[0.75rem] text-ink-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/app/learn/stories" className="hover:text-ink-900">
              African Stories
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink-800">
            {STORY_CATEGORY_LABELS[story.category]}
          </li>
        </ol>
      </nav>

      <header className="border-b border-paper-200 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{STUDY_LANGUAGE_LABELS[story.language]}</Badge>
          <Badge tone="info">{STORY_CATEGORY_LABELS[story.category]}</Badge>
          <Badge tone={story.attribution.origin === 'original' ? 'neutral' : 'approved'}>
            {STORY_ORIGIN_LABELS[story.attribution.origin]}
          </Badge>
          {percent > 0 ? <Badge tone="neutral">{Math.round(percent * 100)}% read</Badge> : null}
        </div>

        <h1
          lang={story.language}
          className="mt-3 font-serif text-[1.75rem] leading-[1.35] text-ink-900 sm:text-[2rem]"
        >
          {story.title}
        </h1>
        <p className="mt-1 text-[0.9375rem] italic text-ink-500">{story.englishTitle}</p>
        <p className="mt-3 max-w-[64ch] text-[0.9375rem] leading-7 text-ink-600">
          {story.summary}
        </p>
        <p className="mt-2 text-[0.75rem] text-ink-400">
          {story.minutes} min read · {story.paragraphs.length} paragraphs
        </p>
      </header>

      <StoryBody
        story={story}
        onProgress={(fraction) => {
          // Only ever move the recorded progress forward — scrolling back up to
          // re-read a line should not erase that the story was read.
          if (fraction > percent) setProgress({ ...progress, [story.id]: fraction })
        }}
      />

      <AttributionBlock story={story} />

      <ComprehensionLinks story={story} />

      <Link to="/app/learn/stories">
        <Button variant="ghost" leadingIcon={<IconBack width={14} height={14} />}>
          All stories
        </Button>
      </Link>
    </div>
  )
}

/* ------------------------------------------------------------------ body */

function StoryBody({
  story,
  onProgress,
}: {
  readonly story: Story
  readonly onProgress: (fraction: number) => void
}) {
  const [showTranslation, setShowTranslation] = useState(true)
  const lines = storyLines(story)

  return (
    <div className="space-y-6">
      <ReadAloudPlayer language={story.language} lines={lines} unitLabel="paragraphs" />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={showTranslation ? 'secondary' : 'ghost'}
          onClick={() => setShowTranslation((value) => !value)}
          aria-pressed={showTranslation}
        >
          {showTranslation ? 'Hide English translation' : 'Show English translation'}
        </Button>
      </div>

      <div className="space-y-5">
        {story.paragraphs.map((paragraph) => (
          <div key={paragraph.target} className="space-y-1.5">
            <p lang={story.language} className="font-serif text-[1.0625rem] leading-8 text-ink-900">
              {paragraph.target}
            </p>
            {showTranslation && paragraph.english ? (
              <p className="text-[0.875rem] leading-6 text-ink-500">{paragraph.english}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 p-4">
        <p className="text-[0.75rem] leading-5 text-ink-500">
          Finished reading? Mark it so it shows on the story list. Reading progress is kept in
          this browser.
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-2.5"
          onClick={() => onProgress(1)}
        >
          Mark as read
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <section aria-labelledby="vocab-heading">
          <h2 id="vocab-heading" className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Vocabulary
          </h2>
          <ul className="mt-2 space-y-1.5">
            {story.vocabulary.map((entry) => (
              <li key={entry.term} className="text-[0.875rem] leading-6">
                <span lang={story.language} className="font-serif text-ink-900">
                  {entry.term}
                </span>
                <span className="text-ink-500"> — {entry.gloss}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="expr-heading">
          <h2 id="expr-heading" className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Expressions
          </h2>
          <ul className="mt-2 space-y-2.5">
            {story.expressions.map((entry) => (
              <li key={entry.expression} className="text-[0.875rem] leading-6">
                <span lang={story.language} className="font-serif text-ink-900">
                  {entry.expression}
                </span>
                <span className="block text-[0.8125rem] leading-5 text-ink-600">
                  {entry.gloss}
                </span>
                <span className="block text-[0.75rem] leading-5 text-ink-400">{entry.note}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="context-heading">
        <h2
          id="context-heading"
          className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400"
        >
          Cultural context
        </h2>
        <p className="mt-2 max-w-[64ch] text-[0.9375rem] leading-7 text-ink-700">
          {story.culturalContext}
        </p>
      </section>

      {story.moral ? (
        <section
          aria-labelledby="moral-heading"
          className="rounded-[var(--radius-md)] border-l-2 border-gold-500 bg-gold-100 px-4 py-3.5"
        >
          <h2
            id="moral-heading"
            className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-500"
          >
            The moral
          </h2>
          <p lang={story.language} className="mt-1.5 font-serif text-[1rem] leading-7 text-ink-900">
            {story.moral}
          </p>
        </section>
      ) : null}

      <StoryListenPanel story={story} lines={lines} />
    </div>
  )
}

/** Line-by-line playback with the sentence highlight. Collapsed by default. */
function StoryListenPanel({
  story,
  lines,
}: {
  readonly story: Story
  readonly lines: ReturnType<typeof storyLines>
}) {
  const [open, setOpen] = useState(false)
  const speech = useSpeech({ language: story.language, lines })

  const unavailable = speech.status === 'unavailable' || speech.status === 'unsupported'

  return (
    <div className="rounded-[var(--radius-md)] border border-paper-300 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2 px-4 py-3 text-left',
          'text-[0.8125rem] font-medium text-ink-800 hover:bg-paper-100',
          open && 'border-b border-paper-200',
        )}
      >
        <IconInfo width={15} height={15} className="text-ink-400" />
        Read a paragraph at a time
        <IconChevronRight
          width={14}
          height={14}
          className={cn('ml-auto text-ink-400 transition-transform', open && 'rotate-90')}
        />
      </button>

      {open ? (
        <div className="px-3 py-3 sm:px-4">
          {unavailable ? (
            <p className="px-2 pb-2 text-[0.8125rem] leading-6 text-ink-500">
              Playback needs a {STUDY_LANGUAGE_LABELS[story.language]} voice, which this device
              does not have. The paragraphs below are the same text, in order.
            </p>
          ) : (
            <p className="px-2 pb-2 text-[0.75rem] text-ink-400">
              Select a paragraph to hear it again.
            </p>
          )}
          <HighlightedLines
            language={story.language}
            lines={lines}
            activeIndex={speech.activeIndex}
            onSpeakLine={(index) => speech.speakOne(index)}
            enabled={!unavailable}
          />
        </div>
      ) : null}
    </div>
  )
}

/* ----------------------------------------------------------- attribution */

/**
 * Where this story came from.
 *
 * For an original story this block says, in as many words, that no traditional
 * origin is claimed. That sentence is the difference between teaching material
 * and cultural misrepresentation, so it is not optional.
 */
function AttributionBlock({ story }: { readonly story: Story }) {
  const { attribution } = story

  const statement =
    attribution.origin === 'documented'
      ? 'This is a traditional tale that appears in published collections. The source is named below.'
      : attribution.origin === 'adaptation'
        ? 'This is a traditional tale reshaped for learners. It is not a verbatim text of the original.'
        : 'This story was written for WAZOBIA as teaching material. It does not claim a traditional origin, and no traditional source is attributed to it.'

  return (
    <section
      aria-labelledby="attribution-heading"
      className="rounded-[var(--radius-md)] border border-paper-300 bg-paper-50 p-4"
    >
      <h2
        id="attribution-heading"
        className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-500"
      >
        <IconInfo width={13} height={13} />
        Attribution and review
      </h2>
      <p className="mt-2 max-w-[64ch] text-[0.8125rem] leading-6 text-ink-700">{statement}</p>
      <dl className="mt-2.5 space-y-1 text-[0.8125rem] leading-5">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-ink-500">Verification:</dt>
          <dd className="text-ink-800">
            {story.provenance.reviewStatus === 'reviewed'
              ? 'Checked by a native-speaker reviewer'
              : 'Not yet reviewed by a native speaker'}
          </dd>
        </div>
        {attribution.source ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-500">Source:</dt>
            <dd className="text-ink-800">{attribution.source}</dd>
          </div>
        ) : null}
        {attribution.author ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-500">Author:</dt>
            <dd className="text-ink-800">{attribution.author}</dd>
          </div>
        ) : null}
        {attribution.region ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-500">Region:</dt>
            <dd className="text-ink-800">{attribution.region}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}

/* --------------------------------------------------------- comprehension */

function ComprehensionLinks({ story }: { readonly story: Story }) {
  const quizzes = findQuizzes(story.comprehensionQuizIds)
  if (quizzes.length === 0) return null

  return (
    <section aria-labelledby="comprehension-heading">
      <h2
        id="comprehension-heading"
        className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-400"
      >
        Comprehension
      </h2>
      <ul className="mt-2 space-y-2">
        {quizzes.map((quiz) => (
          <li key={quiz.id}>
            <Link
              to={`/app/learn/quizzes/${quiz.id}`}
              className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-paper-300 bg-white px-4 py-3 transition-colors hover:border-forest-400"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-paper-300 bg-paper-100 text-forest-800">
                <IconQuiz width={17} height={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.875rem] font-medium text-ink-900">
                  {quiz.title}
                </span>
                <span className="block text-[0.75rem] text-ink-500">
                  {quiz.questions.length} questions on this story
                </span>
              </span>
              <IconChevronRight
                width={15}
                height={15}
                className="shrink-0 text-ink-400 group-hover:text-forest-700"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
