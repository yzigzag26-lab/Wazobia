import { ModuleScaffold } from '@/components/layout/ModuleScaffold'

export default function DictionaryPage() {
  return (
    <ModuleScaffold
      destinationId="dictionary"
      phase="V1 — Public language platform"
      lead="A dictionary for Yorùbá, Hausa, Igbo and English that treats tone marks, orthography and dialect variants as data — not decoration."
      capabilities={[
        {
          heading: 'Search and entries',
          items: [
            'Search across the launch languages and the English bridge, tolerant of tone marks, diacritics and alternate orthography without silently corrupting canonical text.',
            'Definitions, grammatical information, examples, pronunciation, related expressions and dialect variants.',
            'Favourites, corrections, source attribution and review status on every entry.',
          ],
        },
        {
          heading: 'Content governance',
          items: [
            'Canonical entries are human-approved; AI may suggest candidates but can never publish one.',
            'Entries carry provenance and review status so learners can tell reviewed content from suggestions.',
            'Dialect labels are linked records, never baked into language names or interface conditionals.',
          ],
        },
        {
          heading: 'Groundwork in this build',
          items: [
            'Tone-mark-safe input handling: search terms are normalised for comparison while the canonical spelling is preserved for display and storage.',
            'Language configuration drives the selectors, so adding a language is a data change.',
          ],
        },
      ]}
      contracts={[
        {
          method: 'GET',
          path: '/api/v1/dictionary/search',
          purpose: 'Search approved dictionary resources with pagination and review status.',
        },
        {
          method: 'GET',
          path: '/api/v1/languages',
          purpose: 'Language and dialect records for filtering.',
        },
      ]}
    />
  )
}
