import { ModuleScaffold } from '@/components/layout/ModuleScaffold'

export default function CommunityPage() {
  return (
    <ModuleScaffold
      destinationId="community"
      phase="V1 — After moderation is operational"
      lead="Moderated discussion, language exchange and Q&A where speakers correct and enrich the platform — public and moderated first, never unrestricted messaging."
      capabilities={[
        {
          heading: 'Interaction',
          items: [
            'Public, moderated threads: language exchange, questions, structured practice and contribution workflows.',
            'Contributor profiles, reputation, voting and correction history.',
            'No unrestricted direct messaging in the first release — contact between users is restricted by design, because the platform may be used by minors.',
          ],
        },
        {
          heading: 'Safety',
          items: [
            'Reporting, anti-spam controls, escalation paths and transparent moderation decisions.',
            'AI may triage reports and recommend actions; consequential decisions remain human.',
            'Posting is only enabled once reporting and moderation are operational.',
          ],
        },
      ]}
      contracts={[
        { method: 'GET', path: '/api/v1/community/posts', purpose: 'List permitted community posts.' },
        { method: 'POST', path: '/api/v1/community/posts', purpose: 'Create a moderated community post.' },
        { method: 'POST', path: '/api/v1/contributions', purpose: 'Submit a linguistic or cultural contribution for review.' },
      ]}
    />
  )
}
