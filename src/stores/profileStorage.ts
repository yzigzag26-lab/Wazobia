/**
 * The complete list of browser storage keys this application writes.
 *
 * Kept in one module so the Privacy settings page can *enumerate* what is
 * stored rather than describing it from memory. A page that promises "we only
 * store X" is worth nothing if the list is maintained by hand in a different
 * file from the code that writes the keys.
 *
 * Only `localStorage` is used. No cookies, no IndexedDB, no server.
 */
export interface StorageEntry {
  /** The literal key, including the `wazobia.` prefix. */
  readonly key: string
  readonly label: string
}

export const PROFILE_STORAGE_KEYS: readonly StorageEntry[] = [
  { key: 'wazobia.profile.v1', label: 'Your name, username and email' },
  { key: 'wazobia.primary-language.v1', label: 'The language you chose to study' },
  { key: 'wazobia.onboarding-draft.v1', label: 'Your onboarding answers' },
  { key: 'wazobia.community-invite.v1', label: 'Whether you answered the WhatsApp invitation' },
  { key: 'wazobia.theme', label: 'Your appearance preference' },
  { key: 'wazobia.sidebar-collapsed', label: 'Whether the sidebar is collapsed' },
  { key: 'wazobia.lesson-progress.v1', label: 'Lessons you have marked complete' },
  { key: 'wazobia.study-streak.v1', label: 'The last day you studied, and your streak' },
  { key: 'wazobia.story-progress.v1', label: 'How far you have read each story' },
  { key: 'wazobia.quiz-results.v1', label: 'Your last quiz result for each quiz' },
] as const
