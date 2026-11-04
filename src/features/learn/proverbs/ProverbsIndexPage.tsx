import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { IconChevronRight } from '@/components/ui/icons'
import { ComingSoon, LanguageNotSelected } from '../components/LanguageState'
import { STUDY_LANGUAGE_LABELS, isStudyLanguage } from '../language'
import { PROVERB_THEME_LABELS, proverbsFor } from './index'
import { ProverbIllustration } from './ProverbIllustration'
import type { ProverbTheme } from './types'

/**
 * Proverb Cards index.
 *
 * A wall of cards, filtered by theme. The filter is a tablist rather than a
 * `<select>` because there are only nine themes and the counts matter: seeing
 * "Nature 3" tells the learner there is something there before they click.
 *
 * Each card shows the proverb, its meaning, and the illustration chosen by the
 * proverb's own `visual` field — the image is part of the content, not
 * decoration applied to a layout.
 */
export default function ProverbsIndexPage() {
  const { primaryLanguage } = useProfile()
  const [theme, setTheme] = useState<ProverbTheme | 'all'>('all')

  if (!primaryLanguage || !isStudyLanguage(primaryLanguage)) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={<span>Learn · Proverb Cards</span>}
          title="Proverb Cards"
          description="Sayings in their own words, with what they mean and when they are used."
        />
        {primaryLanguage ? (
          <ComingSoon languageName={STUDY_LANGUAGE_LABELS[primaryLanguage]} />
        ) : (
          <LanguageNotSelected />
        )}
      </div>
    )
  }

  const proverbs = proverbsFor(primaryLanguage)
  const themes = [...new Set(proverbs.map((proverb) => proverb.theme))]
  const visible = theme === 'all' ? proverbs : proverbs.filter((item) => item.theme === theme)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<span>Learn · Proverb Cards</span>}
        title={`${STUDY_LANGUAGE_LABELS[primaryLanguage]} proverbs`}
        description={`${proverbs.length} collected sayings. Each card gives the original, a literal rendering, what it means, how it is used, and the theme it belongs to.`}
        actions={<Badge tone="neutral">{proverbs.length} cards</Badge>}
      />

      <Tabs
        label="Filter by theme"
        active={theme}
        onChange={setTheme}
        items={[
          { id: 'all' as const, label: `All ${proverbs.length}` },
          ...themes.map((item) => ({
            id: item,
            label: `${PROVERB_THEME_LABELS[item]} ${proverbs.filter((p) => p.theme === item).length}`,
          })),
        ]}
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {visible.map((proverb) => (
          <li key={proverb.id}>
            <Link
              to={`/app/learn/proverbs/${proverb.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white transition-colors hover:border-forest-400"
            >
              <div className="flex items-center justify-center border-b border-paper-200 bg-paper-100 px-4 py-3">
                <ProverbIllustration visual={proverb.visual} className="h-[76px] w-auto" />
              </div>

              <div className="flex flex-1 flex-col p-4">
                <p
                  lang={primaryLanguage}
                  className="font-serif text-[1.0625rem] leading-7 text-ink-900"
                >
                  {proverb.original}
                </p>
                <p className="mt-1.5 flex-1 text-[0.875rem] leading-6 text-ink-600">
                  {proverb.meaning}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-paper-200 pt-2.5">
                  <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-400">
                    {PROVERB_THEME_LABELS[proverb.theme]}
                  </span>
                  <IconChevronRight
                    width={14}
                    height={14}
                    className="text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-forest-700"
                  />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <p className="text-[0.875rem] text-ink-500">No cards in this theme yet.</p>
      ) : null}

      <p className="max-w-[62ch] text-[0.75rem] leading-5 text-ink-400">
        These are widely recorded sayings in common form. They have not yet been checked by a
        native-speaker reviewer, and no single published collection is cited for each one; the
        card states exactly that rather than inventing a source.
      </p>
    </div>
  )
}
