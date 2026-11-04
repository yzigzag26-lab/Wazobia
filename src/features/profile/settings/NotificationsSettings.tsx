import { useState } from 'react'
import { usePersistentState } from '@/hooks/usePersistentState'
import { Badge } from '@/components/ui/Badge'
import { IconBell } from '@/components/ui/icons'
import { cn } from '@/utils/cn'

/**
 * Notifications.
 *
 * The switches work — they store a preference — and the page is explicit that
 * the preference cannot yet produce a message, because no mail is sent. That is
 * the difference between a settings screen and a lie: the toggle does exactly
 * what it says it does (records what you want), and the copy says what that
 * currently amounts to (nothing, yet).
 */

interface NotificationPrefs {
  readonly productUpdates: boolean
  readonly newContent: boolean
  readonly community: boolean
}

const DEFAULTS: NotificationPrefs = { productUpdates: false, newContent: false, community: false }

function isPrefs(value: unknown): value is NotificationPrefs {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<NotificationPrefs>
  return (
    typeof candidate.productUpdates === 'boolean' &&
    typeof candidate.newContent === 'boolean' &&
    typeof candidate.community === 'boolean'
  )
}

const ROWS: readonly {
  readonly id: keyof NotificationPrefs
  readonly label: string
  readonly description: string
}[] = [
  {
    id: 'productUpdates',
    label: 'Product updates',
    description: 'Occasional notes when a new destination or feature ships.',
  },
  {
    id: 'newContent',
    label: 'New lessons and stories',
    description: 'When a course, story or proverb collection is added in your language.',
  },
  {
    id: 'community',
    label: 'Community news',
    description: 'Events and language projects from the WAZOBIA community.',
  },
]

export default function NotificationsSettings() {
  const [prefs, setPrefs] = usePersistentState<NotificationPrefs>(
    'notification-preferences.v1',
    DEFAULTS,
    isPrefs,
  )
  const [saved, setSaved] = useState(false)

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="notifications-heading"
        className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="notifications-heading" className="text-[0.9375rem] font-semibold text-ink-900">
              Email notifications
            </h2>
            <p className="mt-1 max-w-[58ch] text-[0.8125rem] leading-6 text-ink-600">
              WAZOBIA does not send email yet — there is no mail service connected. These choices
              are recorded in this browser and will be honoured when email exists.
            </p>
          </div>
          <Badge tone="pending" withDot>
            Not sending yet
          </Badge>
        </div>

        <ul className="mt-4 divide-y divide-paper-200">
          {ROWS.map((row) => {
            const enabled = prefs[row.id]
            return (
              <li key={row.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-[0.875rem] font-medium text-ink-900">{row.label}</p>
                  <p className="mt-0.5 text-[0.75rem] leading-5 text-ink-500">{row.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={row.label}
                  onClick={() => {
                    setPrefs({ ...prefs, [row.id]: !enabled })
                    setSaved(true)
                  }}
                  className={cn(
                    'relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors duration-150',
                    enabled
                      ? 'border-forest-700 bg-forest-700'
                      : 'border-paper-300 bg-paper-200 hover:border-ink-400',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-0.5 size-3.5 rounded-full bg-white shadow-sm transition-[left] duration-150',
                      enabled ? 'left-[1.125rem]' : 'left-0.5',
                    )}
                  />
                </button>
              </li>
            )
          })}
        </ul>

        {saved ? (
          <output className="mt-3 block text-[0.75rem] text-ink-400">
            Preference saved in this browser. No email will be sent.
          </output>
        ) : null}
      </section>

      <p className="flex items-start gap-2 rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 px-4 py-3 text-[0.75rem] leading-5 text-ink-500">
        <IconBell width={14} height={14} className="mt-0.5 shrink-0" />
        We do not add you to a mailing list by default. Every option above starts switched off.
      </p>
    </div>
  )
}
