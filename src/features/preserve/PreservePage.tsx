import { ModuleScaffold } from '@/components/layout/ModuleScaffold'

export default function PreservePage() {
  return (
    <ModuleScaffold
      destinationId="preserve"
      phase="V1 — Contributions first"
      lead="Proverbs, folktales, traditional expressions, regional vocabulary and oral storytelling — kept with their original form, context, source and rights."
      capabilities={[
        {
          heading: 'Cultural records',
          items: [
            'Each record retains its original form, translation or meaning, usage, cultural context, region and dialect, source and rights information.',
            'A speaker’s original recording and any transcript are stored as linked but distinct assets.',
            'Community ownership, attribution requests and takedown requests are respected in the interface, not just the database.',
          ],
        },
        {
          heading: 'Contribution workflow',
          items: [
            'Submissions are pending until reviewed; contributors cannot self-approve.',
            'Publication approval and commercial dataset eligibility are separate decisions, decided separately.',
          ],
        },
      ]}
      contracts={[
        { method: 'POST', path: '/api/v1/contributions', purpose: 'Submit cultural records and preservation material with rights metadata.' },
        { method: 'GET', path: '/api/v1/languages', purpose: 'Language and dialect context for each record.' },
      ]}
    />
  )
}
