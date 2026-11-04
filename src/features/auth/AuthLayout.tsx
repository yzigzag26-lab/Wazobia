import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { WazobiaLogo } from '@/components/brand/WazobiaLogo'
import { brand } from '@/config/brand'

export interface AuthLayoutProps {
  readonly title: string
  readonly subtitle: string
  readonly children: ReactNode
  /** Alternate action shown under the form, e.g. "Already have an account?" */
  readonly footer: ReactNode
}

/**
 * Shared shell for sign-up and login.
 *
 * Split layout on desktop: the form column is quiet and focused, the brand panel
 * carries the official lockup. On mobile the panel collapses to a compact header
 * so the form is never pushed below the fold.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-paper-50">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ------------------------------------------------------- form column */}
        <div className="flex flex-col px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          <Link
            to="/"
            className="inline-flex w-fit items-center"
            aria-label="WAZOBIA — home"
          >
            <WazobiaLogo variant="emblem" height={42} priority decorative />
          </Link>

          <div className="flex flex-1 items-center py-10">
            <div className="w-full max-w-[27rem]">
              <h1 className="text-display text-[1.875rem] text-ink-900 sm:text-[2.125rem]">{title}</h1>
              <p className="mt-2.5 text-[0.9375rem] leading-7 text-ink-600">{subtitle}</p>
              <div className="mt-8">{children}</div>
            </div>
          </div>

          <div className="text-sm text-ink-600">{footer}</div>
        </div>

        {/* ------------------------------------------------------ brand panel */}
        <aside className="on-brand relative hidden overflow-hidden border-l border-paper-200 bg-forest-900 lg:block">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 78% 18%, #f5c518 0, transparent 42%), radial-gradient(circle at 18% 82%, #8ed13a 0, transparent 46%)',
            }}
          />
          <div className="relative flex h-full flex-col justify-evenly gap-10 p-12 xl:p-16">
            <div>
              <p className="text-eyebrow text-gold-500">{brand.positioning}</p>
              <p className="text-display mt-4 max-w-[20ch] text-[2.125rem] text-paper-50">
                Africa speaks. Let&rsquo;s understand every voice.
              </p>
            </div>

            {/* The official lockup, presented on its own light plate because the
                supplied artwork has a baked-in white background. */}
            <div className="rounded-[var(--radius-lg)] bg-white p-6">
              <WazobiaLogo variant="lockup" height={230} className="mx-auto w-full max-w-[340px]" />
            </div>

            <div>
              <dl className="grid grid-cols-3 gap-4 border-t border-forest-700 pt-6">
                {[
                  ['Yorùbá', 'yo'],
                  ['Hausa', 'ha'],
                  ['Igbo', 'ig'],
                ].map(([name, code]) => (
                  <div key={code}>
                    <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-gold-500">
                      Target
                    </dt>
                    <dd lang={code} className="mt-1 font-serif text-[0.9375rem] text-paper-50">
                      {name}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-xs leading-5 text-white/60">
                English is available throughout as a bridge language.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
