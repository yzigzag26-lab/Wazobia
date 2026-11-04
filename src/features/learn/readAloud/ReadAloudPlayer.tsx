import { Button } from '@/components/ui/Button'
import {
  IconBack,
  IconChevronRight,
  IconInfo,
  IconPause,
  IconPlay,
  IconRestart,
  IconSpeaker,
} from '@/components/ui/icons'
import { cn } from '@/utils/cn'
import type { StudyLanguage } from '../types'
import { useSpeech, STUDY_LANGUAGE_NAMES } from './useSpeech'
import type { SpeakableLine } from './speakable'

export interface ReadAloudPlayerProps {
  readonly language: StudyLanguage
  readonly lines: readonly SpeakableLine[]
  /** Plural noun for the counter, e.g. "sentences" / "paragraphs". */
  readonly unitLabel?: string
  readonly className?: string
}

const RATES = [0.75, 1, 1.25, 1.5] as const

/**
 * Read Aloud control strip.
 *
 * A compact player that sits under the lesson or story it reads. Controls:
 * play/pause, restart, previous/next line, speed, and a progress counter.
 *
 * When no voice exists for the language it renders an explanation instead of
 * disabled-to-death controls, because a greyed-out button tells the learner
 * nothing. The explanation names the language and says plainly that WAZOBIA has
 * no approved voice for it yet.
 */
export function ReadAloudPlayer({
  language,
  lines,
  unitLabel = 'lines',
  className,
}: ReadAloudPlayerProps) {
  const speech = useSpeech({ language, lines })
  const languageName = STUDY_LANGUAGE_NAMES[language]
  const total = lines.length

  if (total === 0) return null

  if (speech.status === 'unavailable' || speech.status === 'unsupported') {
    return (
      <div
        className={cn(
          'rounded-[var(--radius-md)] border border-paper-300 bg-paper-100 px-4 py-3.5',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <IconInfo width={17} height={17} className="mt-0.5 shrink-0 text-gold-700" />
          <div className="min-w-0">
            <p className="text-[0.8125rem] font-semibold text-ink-900">
              {speech.status === 'unsupported'
                ? 'Read Aloud is not available in this browser'
                : `No approved ${languageName} voice on this device`}
            </p>
            <p className="mt-1 text-[0.8125rem] leading-6 text-ink-600">
              {speech.status === 'unsupported'
                ? 'This browser does not provide speech synthesis. The lesson text is unaffected — you can read it below.'
                : `WAZOBIA has not validated a ${languageName} voice yet. Reading this text with an English voice would mispronounce the tone marks and teach you the wrong pronunciation, so nothing is played. When an approved ${languageName} voice is integrated, this control will use it.`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isSpeaking = speech.status === 'speaking'
  const isPaused = speech.status === 'paused'
  const position = speech.activeIndex >= 0 ? speech.activeIndex + 1 : 0

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-paper-300 bg-white px-4 py-3',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-500">
          <IconSpeaker width={15} height={15} />
          Read aloud
        </span>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={speech.previous}
            disabled={speech.activeIndex <= 0}
            aria-label={`Previous ${unitLabel}`}
          >
            <IconBack width={15} height={15} />
          </Button>

          {isSpeaking ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={speech.pause}
              leadingIcon={<IconPause width={14} height={14} />}
            >
              Pause
            </Button>
          ) : isPaused ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={speech.resume}
              leadingIcon={<IconPlay width={14} height={14} />}
            >
              Resume
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => speech.play()}
              leadingIcon={<IconPlay width={14} height={14} />}
            >
              Play
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={speech.next}
            disabled={speech.activeIndex >= total - 1}
            aria-label={`Next ${unitLabel}`}
          >
            <IconChevronRight width={15} height={15} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={speech.restart}
            aria-label="Restart from the beginning"
          >
            <IconRestart width={15} height={15} />
          </Button>
        </div>

        <label className="flex items-center gap-1.5 text-[0.75rem] text-ink-500">
          <span className="sr-only">Playback speed</span>
          <select
            value={speech.rate}
            onChange={(event) => speech.setRate(Number(event.target.value))}
            className="rounded-[var(--radius-sm)] border border-paper-300 bg-white px-1.5 py-1 text-[0.75rem] text-ink-800"
          >
            {RATES.map((rateOption) => (
              <option key={rateOption} value={rateOption}>
                {rateOption}×
              </option>
            ))}
          </select>
        </label>

        <span className="ml-auto font-mono text-[0.6875rem] tabular-nums text-ink-400">
          {position > 0 ? `${position} / ${total}` : `${total} ${unitLabel}`}
        </span>
      </div>

      <p className="mt-2 text-[0.6875rem] leading-5 text-ink-400">
        Using the device voice “{speech.voiceName}”. WAZOBIA has not yet validated a
        {' '}
        {languageName} voice, so pronunciation is only as good as the voice installed here.
      </p>
    </div>
  )
}
