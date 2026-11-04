import { ModuleScaffold } from '@/components/layout/ModuleScaffold'

export default function AiPage() {
  return (
    <ModuleScaffold
      destinationId="ai"
      phase="V1 — Language intelligence"
      lead="A public assistant for African languages, culture, grammar and meaning — one coherent WAZOBIA experience, grounded in reviewed platform resources wherever they exist."
      capabilities={[
        {
          heading: 'Asking and understanding',
          items: [
            'Conversation with language-aware responses across Yorùbá, Hausa, Igbo and English.',
            'Explanations of grammar, meaning, culture and usage, with retrieval of reviewed WAZOBIA resources when relevant.',
            'Unsupported dialect, historical or cultural claims are qualified rather than answered with invented certainty.',
          ],
        },
        {
          heading: 'Trust and provenance',
          items: [
            'Every answer carries an explicit answer type — AI-generated, reviewed resource, or mixed — so generated text is never presented as verified fact.',
            'Sources are shown with their review status when the answer draws on platform content.',
            'Feedback and correction controls feed the human review loop.',
          ],
        },
        {
          heading: 'Conversation',
          items: [
            'Saved conversation history for signed-in accounts, with copy and feedback controls.',
            'Per-user rate limits and provider budgets enforced server-side, never in the browser.',
          ],
        },
      ]}
      contracts={[
        {
          method: 'POST',
          path: '/api/v1/ai/chat',
          purpose: 'Central orchestration: intent, retrieval, provider routing and provenance labelling.',
        },
        {
          method: 'GET',
          path: '/api/v1/users/me',
          purpose: 'Conversation ownership and saved history for signed-in accounts.',
        },
      ]}
    />
  )
}
