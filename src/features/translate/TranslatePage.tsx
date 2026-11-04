import { ModuleScaffold } from '@/components/layout/ModuleScaffold'

export default function TranslatePage() {
  return (
    <ModuleScaffold
      destinationId="translate"
      phase="V1 — Public language platform"
      lead="Translate between Yorùbá, Hausa, Igbo and English with the context that makes meaning: register, idiom, dialect and alternatives."
      capabilities={[
        {
          heading: 'Translation',
          items: [
            'Source and target selection across all four languages, with automatic detection only when confidence is adequate.',
            'Alternative translations with formal, informal and neutral register, plus notes on idiom and usage.',
            'Dialect and code-switching metadata where it is reliable — never implying universal coverage.',
          ],
        },
        {
          heading: 'Quality and honesty',
          items: [
            'Every draft is labelled as an AI suggestion until a human reviewer approves it.',
            'User correction and translation-quality feedback are first-class, not an afterthought.',
            'Quality is tracked per language pair and direction — Yorùbá → English separately from English → Yorùbá.',
          ],
        },
        {
          heading: 'Working with results',
          items: [
            'Pronunciation support, saved history, copy and share.',
            'Offline-free, low-bandwidth-friendly interface suitable for low-cost Android devices.',
          ],
        },
      ]}
      contracts={[
        {
          method: 'POST',
          path: '/api/v1/translate',
          purpose: 'Translation drafts, alternatives, register and review status.',
        },
        {
          method: 'GET',
          path: '/api/v1/languages',
          purpose: 'Enabled language pairs and dialect metadata for the selectors.',
        },
      ]}
    />
  )
}
