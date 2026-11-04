import { ModuleScaffold } from '@/components/layout/ModuleScaffold'

export default function ResearchPage() {
  return (
    <ModuleScaffold
      destinationId="research"
      phase="V3 — Research and commercial"
      lead="A governed dataset catalogue, benchmark results and a request workflow for researchers and institutions — built only once provenance and licence metadata are trustworthy."
      capabilities={[
        {
          heading: 'Catalogue',
          items: [
            'Datasets with methodology, language and dialect coverage, counts, licence, quality reports and available formats.',
            'Versioned dataset assets, each linked to provenance, licence and consent eligibility.',
            'Public resources and commercial dataset assets are visibly separate: public visibility never implies commercial reuse rights.',
          ],
        },
        {
          heading: 'Benchmarks',
          items: [
            'Evaluation runs per language pair and direction, with versioned evaluation sets so results stay reproducible.',
            'Model and provider configurations recorded alongside results.',
          ],
        },
        {
          heading: 'Requests and delivery',
          items: [
            'Sample requests, custom collection requests and licensing enquiries.',
            'Approved delivery constrained to a specific dataset version, licence and permitted purpose.',
          ],
        },
      ]}
      contracts={[
        { method: 'GET', path: '/api/v1/research/datasets', purpose: 'List datasets visible to the caller.' },
        { method: 'POST', path: '/api/v1/research/requests', purpose: 'Submit a sample or custom collection request.' },
      ]}
    />
  )
}
