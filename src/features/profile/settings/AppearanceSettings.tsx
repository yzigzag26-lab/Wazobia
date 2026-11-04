import { useTheme } from '@/hooks/useTheme'
import { IconCheck, IconMonitor, IconMoon, IconSun } from '@/components/ui/icons'
import { cn } from '@/utils/cn'
import type { ThemePreference } from '@/stores/themeContext'

/**
 * Appearance.
 *
 * The only place in the product where the theme can be changed. Deliberately not
 * duplicated in the header or the sidebar: one control, one source of truth, and
 * a learner who wants it knows exactly where to look.
 *
 * Three options, as specified — light, dark, system. "System" is the default and
 * follows `prefers-color-scheme`, updating live if the OS changes while the app
 * is open.
 */

const OPTIONS: readonly {
  readonly id: ThemePreference
  readonly label: string
  readonly description: string
  readonly icon: React.ReactNode
}[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Paper background, dark text.',
    icon: <IconSun width={19} height={19} />,
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Low-light palette for evening reading.',
    icon: <IconMoon width={19} height={19} />,
  },
  {
    id: 'system',
    label: 'System',
    description: 'Follow this device’s setting, and change with it.',
    icon: <IconMonitor width={19} height={19} />,
  },
]

export default function AppearanceSettings() {
  const { preference, resolved, setPreference } = useTheme()

  return (
    <section
      aria-labelledby="appearance-heading"
      className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6"
    >
      <h2 id="appearance-heading" className="text-[0.9375rem] font-semibold text-ink-900">
        Appearance
      </h2>
      <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
        Both themes use the same layout and the same content. The palette is checked against
        contrast ratios in both, so text stays legible either way.
      </p>

      <fieldset className="mt-4">
        <legend className="sr-only">Colour theme</legend>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {OPTIONS.map((option) => {
            const checked = preference === option.id
            return (
              <label
                key={option.id}
                className={cn(
                  'flex cursor-pointer flex-col gap-2 rounded-[var(--radius-md)] border p-3.5',
                  'transition-colors duration-100',
                  checked
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-paper-300 bg-white hover:border-ink-400',
                )}
              >
                {/*
                  The input needs its own accessible name. The label text lives in
                  sibling spans, so without `aria-label` the radio announces only
                  "radio button" — which is how this bug was caught.
                */}
                <span className="flex items-center justify-between gap-2">
                  <span
                    aria-hidden="true"
                    className={checked ? 'text-forest-800' : 'text-ink-500'}
                  >
                    {option.icon}
                  </span>
                  <input
                    type="radio"
                    name="theme-preference"
                    value={option.id}
                    checked={checked}
                    onChange={() => setPreference(option.id)}
                    aria-label={option.label}
                    aria-describedby={`theme-${option.id}-description`}
                    className="size-4 accent-[var(--color-forest-700)]"
                  />
                </span>
                <span aria-hidden="true" className="text-[0.875rem] font-medium text-ink-900">
                  {option.label}
                </span>
                <span
                  id={`theme-${option.id}-description`}
                  className="text-[0.75rem] leading-5 text-ink-500"
                >
                  {option.description}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <p className="mt-4 flex items-center gap-1.5 text-[0.75rem] text-ink-400">
        <IconCheck width={13} height={13} />
        Currently showing the{' '}
        <span className="font-medium text-ink-600">{resolved}</span> theme
        {preference === 'system' ? ' (from this device)' : ''}. Saved in this browser.
      </p>
    </section>
  )
}
