import { StateMessage } from '@/components/ui/StateMessage'
import { IconInfo } from '@/components/ui/icons'
import { ModuleScaffold } from '@/components/layout/ModuleScaffold'

export default function SpeakPage() {
  return (
    <ModuleScaffold
      destinationId="speak"
      phase="V1 — Recording and playback"
      lead="Listen to reference pronunciation, record your own and hear them side by side. Pronunciation evaluation arrives only when it has been validated per language."
      capabilities={[
        {
          heading: 'Practising',
          items: [
            'Reference pronunciation with replay and side-by-side comparison of your own recording.',
            'Listening comprehension and guided pronunciation practice.',
            'Microphone permission is requested only when a recording task starts — never on page load.',
          ],
        },
        {
          heading: 'Consent and privacy',
          items: [
            'Before recording, the interface explains purpose, retention, visibility and whether audio is used for model improvement.',
            'Recordings are private by default, played back through short-lived authorised URLs, and deletable.',
            'Recording consent, publication consent and AI-training consent are separate decisions — never one bundled checkbox.',
          ],
        },
        {
          heading: 'Validation before claims',
          items: [
            'Automatic speech recognition and pronunciation scoring are not surfaced until each language and dialect passes its own evaluation.',
            'A generic transcription confidence score is never presented as a pronunciation grade.',
          ],
        },
      ]}
      contracts={[
        { method: 'POST', path: '/api/v1/speech/recordings', purpose: 'Create recording metadata and issue an authorised upload target.' },
        { method: 'POST', path: '/api/v1/speech/transcribe', purpose: 'Transcription and, later, validated pronunciation evaluation.' },
      ]}
    >
      <StateMessage
        className="mt-8"
        tone="waiting"
        icon={<IconInfo width={18} height={18} />}
        title="No recording interface is offered yet — by design"
        description="A recording button would be an inert control: the consent model, private storage policy and deletion path must exist before WAZOBIA asks anyone to speak into it. This is a governance requirement, not a missing component."
      />
    </ModuleScaffold>
  )
}
