import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { IconWhatsApp } from '@/components/ui/icons'
import { WHATSAPP_COMMUNITY_URL } from './whatsapp'

/**
 * The one-time WhatsApp community invitation.
 *
 * Rules this component enforces in code, not in a comment:
 *
 *  - **One time.** It is shown only while the stored outcome is `pending`, and
 *    either answer writes a permanent outcome. It cannot come back.
 *  - **Only after registration + verification + onboarding.** The pending state
 *    is armed in exactly one place: `completeOnboarding()` on the wizard's
 *    completion step. A normal login, a return visit or a guest who skipped the
 *    questionnaire therefore never sees it.
 *  - **Optional.** "Skip for now" carries the same visual weight as joining,
 *    Escape closes it, and it is never a gate in front of the app.
 *  - **Honest.** It does not claim anyone joined; it opens WhatsApp in a new tab
 *    and records that the invitation was answered.
 *
 * Built on the native `<dialog>` element with `showModal()`, which gives focus
 * trapping, Escape handling and inertness of the background for free — all of
 * which a `div[role="dialog"]` has to reimplement, usually with holes.
 */

export interface CommunityInviteModalProps {
  readonly open: boolean
  readonly onJoin: () => void
  readonly onSkip: () => void
}

export function CommunityInviteModal({ open, onJoin, onSkip }: CommunityInviteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      // `showModal` is missing in a few older embedded browsers and in jsdom.
      // Falling back to `open` keeps the dialog visible and usable rather than
      // throwing on the onboarding completion screen.
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')

      // Focus the secondary action: the default action should be a deliberate
      // choice, not something a stray Enter press performs.
      skipRef.current?.focus()
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  /* Native `cancel` fires on Escape; route it through the same skip path. */
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    function handleCancel(event: Event) {
      event.preventDefault()
      onSkip()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onSkip])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="community-invite-title"
      className="m-auto w-[calc(100%-2rem)] max-w-[30rem] rounded-[var(--radius-lg)] border border-paper-300 bg-white p-0 text-ink-900 backdrop:backdrop-blur-[2px] backdrop:bg-[color-mix(in_oklab,var(--color-ink-900)_55%,transparent)]"
    >
      <div className="p-6">
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center rounded-[var(--radius-md)] border border-forest-300 bg-forest-50 text-forest-800"
        >
          <IconWhatsApp width={22} height={22} />
        </span>

        <h2
          id="community-invite-title"
          className="mt-4 text-[1.125rem] font-semibold leading-6 text-ink-900"
        >
          Join the WAZOBIA Community
        </h2>

        <p className="mt-2 text-[0.875rem] leading-6 text-ink-600">
          A WhatsApp group where learners and speakers share phrases, ask questions and talk about
          the languages. It is optional, and you can leave the group whenever you like.
        </p>

        <p className="mt-2 text-[0.75rem] leading-5 text-ink-400">
          This opens WhatsApp in a new tab. WAZOBIA does not see who joins, and none of your
          profile details are shared.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="ghost" fullWidth onClick={onSkip} ref={skipRef}>
            Skip for now
          </Button>
          <a
            href={WHATSAPP_COMMUNITY_URL}
            target="_blank"
            rel="noreferrer noopener"
            onClick={onJoin}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-brand-700 bg-brand-700 px-4 text-sm font-medium text-on-brand transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
          >
            <IconWhatsApp width={16} height={16} />
            Join WhatsApp Community
          </a>
        </div>
      </div>
    </dialog>
  )
}
