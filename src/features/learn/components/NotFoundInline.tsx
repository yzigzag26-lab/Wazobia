import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { IconBack } from '@/components/ui/icons'

export interface NotFoundInlineProps {
  readonly title: string
  readonly description: string
  readonly backTo: string
  readonly backLabel: string
}

/**
 * In-shell "this content does not exist" panel.
 *
 * Rendered *inside* the AppShell rather than as a full-page 404 so a mistyped
 * story id does not throw the learner out of navigation. It names what was
 * missing and gives one way back, rather than apologising generically.
 */
export function NotFoundInline({ title, description, backTo, backLabel }: NotFoundInlineProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-6 sm:p-8">
      <h1 className="text-[1.25rem] font-semibold text-ink-900">{title}</h1>
      <p className="mt-2 max-w-[58ch] text-[0.875rem] leading-6 text-ink-600">{description}</p>
      <div className="mt-5">
        <Link to={backTo}>
          <Button variant="secondary" leadingIcon={<IconBack width={14} height={14} />}>
            {backLabel}
          </Button>
        </Link>
      </div>
    </div>
  )
}
