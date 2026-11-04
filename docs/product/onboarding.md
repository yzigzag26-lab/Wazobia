# Registration onboarding questionnaire

**Route:** `/onboarding` · **Status:** frontend-only, no backend.

## Journey

```
Landing → Sign Up → Account Details → Onboarding Questionnaire → WAZOBIA App
                                             │
                                             └── Skip for now → /app
```

Onboarding sits **outside** the application shell — no sidebar, no bottom bar, no distractions. It is
reachable with or without a session, so a guest can complete it, and it is skippable at any point
from the top-right link, the footer button on question 1, or by navigating away.

## One question per page

Each of the ten questions gets **its own screen**. Nothing is stacked or scrolled past: one heading,
one answer control, one Continue button. The three groups from the specification survive as *progress
metadata*, not as batching — the header reads `Question 3 of 10` on the left and `Background · Step 1
of 3` on the right, above a ten-segment bar.

Why it is built this way:

- **Attention.** A screen with one question cannot be half-skipped; the reader answers or skips
  deliberately.
- **Phones.** Long multi-question pages push the primary button below the fold and make multi-select
  grids scroll inside a scroll. One question fits comfortably at 360 px.
- **Recoverability.** "Previous" always means *one question back*, so correcting an answer one screen
  ago is a single tap, not a scroll hunt.

The registry is `QUESTIONS` in `src/features/onboarding/questions.ts` — id, group, title, optional
subtitle and footnote. Answer controls are chosen per question in `QuestionControl.tsx`. The wizard
owns the whole typed profile, so moving between pages never loses an edit.

## Questions

| Group | Question | Control | Field |
|---|---|---|---|
| 1 | Country of origin | Grouped dropdown | `countryOfOrigin` |
| 1 | Country of residence | Grouped dropdown | `currentCountry` |
| 1 | Languages already spoken/understood | Multi-select grid | `knownLanguages` |
| 1 | Relationship with African languages | Radio cards | `languageRelationship` |
| 2 | African languages to learn | Multi-select grid | `targetLanguages` |
| 2 | Current proficiency | Radio cards | `proficiencyLevel` |
| 2 | Learning goals | Multi-select grid | `learningGoals` |
| 3 | Main reason for joining | Radio cards (1 col) | `joiningReason` |
| 3 | How you discovered WAZOBIA | Radio cards | `discoverySource` |
| 3 | Preferred learning frequency | Radio cards | `preferredLearningFrequency` |

Every question is optional. "Prefer not to say" exists for country and relationship, stored as an
explicit sentinel (`prefer_not_to_say`) so *declined* and *unanswered* stay distinguishable.

## Answer catalogue

The option sets in `src/config/onboarding.ts` are **approved product copy**. They were drafted here
and adopted as final by the project owner, so nothing on these screens is placeholder text.

**To revise the wording later:** edit only the option arrays in `src/config/onboarding.ts`.
No component, validation, type or test change is required, because:

- every screen renders from those records, and
- every stored value is the option `id`, not its label.

So rewording an option never migrates data. Dropping an option is safe too: validation reports the
unknown id instead of silently accepting it, and the reader simply re-picks.

## Data model

`src/types/onboarding.ts` → `UserOnboardingProfile`

```ts
interface UserOnboardingProfile {
  countryOfOrigin: string | null            // ISO 3166-1 alpha-2, or prefer_not_to_say
  currentCountry: string | null
  knownLanguages: string[]                  // ids from ONBOARDING_LANGUAGES
  languageRelationship: LanguageRelationship | null
  targetLanguages: string[]
  proficiencyLevel: ProficiencyLevel | null
  learningGoals: LearningGoal[]
  joiningReason: JoiningReason | null
  discoverySource: DiscoverySource | null
  preferredLearningFrequency: LearningFrequency | null
}
```

Union types are declared next to their option lists in `src/config/onboarding.ts`, so a stored value
can never drift from a rendered option.

## Privacy choices

- **Country only.** No city, postcode, street or precise location is collected anywhere.
- **No precise location APIs** are used — no geolocation, no IP geolocation.
- Demographic questions are all optional and all have an opt-out.
- The first step states plainly that country is the most specific location asked for.

## Storage and honesty

`src/services/onboarding.ts` is the isolated seam:

| Method | Behaviour today |
|---|---|
| `saveDraft` | writes to `localStorage` (`wazobia.onboarding-draft.v1`) |
| `readDraft` | restores an in-progress draft; corrupted data is discarded |
| `submit` | returns `{ persistedRemotely: false, storedLocally, requestId: null }` |
| `isRemoteEnabled` | `false` |

**`submit` never calls the network** — a unit test asserts `fetch` is not invoked. The completion
screen says the answers are held in this browser only and are not attached to an account.

To integrate later: set `ONBOARDING_REMOTE_ENABLED = true` and implement
`POST /api/v1/onboarding` (contract documented in `docs/api/api-contract.md`). Local storage then
becomes a pre-submission cache. No screen changes are needed.

## Accessibility

- Each question is a `<fieldset>` with a `<legend>`; the question is announced with its options.
- Radios and checkboxes are real inputs inside `<label>` cards — clicking anywhere on the card
  selects, and native keyboard behaviour (arrow keys within a radio group, space to toggle a
  checkbox) is preserved rather than reimplemented.
- Errors use `role="alert"` and are linked with `aria-describedby`.
- Progress is announced in text, not colour: `Question 3 of 10` plus `Background · Step 1 of 3`, with
  each segment's state in a screen-reader-only label.
- Moving to a new question scrolls to the top and re-triggers the rise-in animation, so attention lands
  on the new heading rather than the bottom of the previous answer.
- One `<h1>` per page — the question itself — so heading navigation reads as a list of questions.
- Non-Latin scripts: languages are tagged with a `script` marker. Ge'ez (Amharic) has no glyphs in
  the subsetted UI fonts, so it displays as "Amharic" rather than missing-glyph boxes.

## Verified behaviour

Interaction tests (Playwright, desktop + mobile):

- single-select by clicking a whole card, and moving the selection between cards
- keyboard arrow-key navigation inside a radio group
- multi-select check, uncheck and re-check
- Continue → Previous → Continue with **all** answers preserved across every page
- exactly one `<h1>`, one `<legend>`/`<select>` and one question title per screen (asserted on all 10)
- Skip exits to `/app` immediately
- Finish shows the honest completion state; "Review my answers" returns with data intact
- Sign Up → "Continue to onboarding" reaches `/onboarding`
- Guest reaches `/app` without onboarding
- no horizontal overflow at 360 / 390 / 768 / 1024 / 1440 px

Unit tests: blank questionnaire produces no errors, invalid country and language ids are rejected,
the eight-language cap holds, per-question answered state and the ten-question registry order are correct, drafts round-trip, corrupted drafts
are ignored, and `submit` performs no network call.
