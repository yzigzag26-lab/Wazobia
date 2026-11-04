# WAZOBIA — Frontend

The African Language Ecosystem. **Learn. Understand. Translate.**
Yorùbá · Hausa · Igbo, with English as a bridge language.

> **Phase 1 of N — Public entry, authentication UI and guest access.**
> Landing page, sign-up, login, guest sessions and the application shell are complete.
> **No backend exists yet.** Every data surface states that honestly; nothing is simulated.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19 + Vite 8 |
| Language | TypeScript 7 — `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Styling | Tailwind CSS 4 (CSS-first tokens in `src/index.css`) |
| Routing | React Router 7 (code-split per destination) |
| Server state | TanStack Query 5 (explicit retry policy, no fake fallbacks) |
| Accessible primitives | Radix Dialog / Dropdown / Tooltip — behaviour only, never styled kits |
| Auth client | Supabase JS (browser anon key only) |
| Tests | Vitest + Testing Library + jsdom |
| Lint | oxlint (`npm run lint` — 0 warnings, 0 errors) |
| CI | GitHub Actions: typecheck → lint → test → build, plus a client-bundle secret scan |

---

## Getting started

```bash
npm install
cp .env.example .env.local     # optional until Supabase is provisioned
npm run dev                    # http://localhost:5173
```

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run verify` | Type-check → lint → tests → production build (run before every commit) |
| `npm run verify:ci` | The same, starting from `npm ci` — reproduces CI locally |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | oxlint |
| `npm run test` | Vitest (single run) |

Tooling rules, the lint configuration and the CI gate are documented in
[`docs/architecture/engineering-standards.md`](docs/architecture/engineering-standards.md).
The most recent full audit — what was verified, what was fixed, what is still open — is
[`docs/architecture/repository-inspection-2026-11-04.md`](docs/architecture/repository-inspection-2026-11-04.md).

---

## Routes

| Route | Page | Notes |
|---|---|---|
| `/` | Landing page | Hero, 4 learning pillars, languages, how it works, preservation, CTA, footer |
| `/signup` | Registration | Full validation, no backend call, honest notice on submit |
| `/login` | Login | Validation, remember-me, recovery notice, no fake auth |
| `/onboarding` | Ten-question questionnaire, one per page | Skippable, local only, full a11y — see `docs/product/onboarding.md` |
| `/app` | Application entry | Works instantly for guests |
| `/app/learn` | Learn hub | Exactly four pillars: Lessons, Quizzes, Proverb Cards, African Stories |
| `/app/learn/lessons` | Course catalogue | Language → Course → Module → Lesson, with progress |
| `/app/learn/quizzes` | Quiz bank | 9 quizzes; every answer explained |
| `/app/learn/proverbs` | Proverb cards | 72 proverbs (24 per language), filterable by theme |
| `/app/learn/stories` | African stories | 12 stories with translation, vocabulary and context |
| `/app/dictionary` | Dictionary | Awaiting backend |
| `/app/ai` | WAZOBIA AI | Awaiting backend |
| `/app/translate` | Translate | Awaiting backend |
| `/app/profile` | Profile | Details, language, learning preferences |
| `/app/profile/settings/*` | Settings | Appearance, security, preferences, notifications, privacy |

## What exists today

- **Application shell** — persistent collapsible sidebar on desktop, five-item bottom bar on phone,
  one shared content column and token set. Same product, two affordances.
- **Five destinations** — WAZOBIA Learn, WAZOBIA Dictionary, WAZOBIA AI, WAZOBIA Translate, Profile.
  Each states its real status (`available` / `in development`) and, where relevant, the backend
  contracts it needs. Speak, Community, Preserve and Research have been removed.
- **WAZOBIA Learn** — the four learning pillars with real content: 12 lessons across three beginner
  courses, 9 quizzes with an explanation on every question, 72 proverb cards, 12 stories. Progress
  is device-local and the UI says so.
- **Read Aloud** — browser speech synthesis with a language-voice check. It refuses to speak
  Yorùbá, Hausa or Igbo with an English voice and explains why instead; see
  [`docs/product/read-aloud.md`](docs/product/read-aloud.md).
- **Theme** — **light by default**, with dark and follow-the-device selectable in Profile → Settings
  → Appearance. An unset preference never resolves from the OS, so a dark-mode device does not
  silently get a dark app. Driven entirely by CSS custom properties, and the palette is
  contrast-checked in *both* themes (`src/config/themeContrast.test.ts` reads the real stylesheet and
  asserts 195 foreground/background pairs), with every token verified to have a dark value
  (`src/config/themeTokens.test.ts`).
- **Two green ramps, on purpose** — `forest-*` is text/icon colour and inverts with the theme;
  `brand-*` is the ground under white type and stays dark in both. One ramp cannot do both jobs, and
  a guard fails if a class string tries. `white` is the raised surface (near-black in dark mode) while
  `on-brand` is literal white. See `docs/design/brand.md`.
- **Language configuration** — `src/config/languages.ts` is the only place a language is defined.
  `yo`, `ha`, `ig` are first-class; `en` is the bridge. Adding a language is a data change.
- **Design tokens** — forest, gold, lime and ember on warm paper, derived from the official logo
  (`src/index.css` + `src/config/tokens.ts`, documented in `docs/design/brand.md`). No gradients,
  no glass, no purple, no glow. Gold and lime are surface-only and never text.
- **Typography with verified Unicode** — see `docs/design/typography.md`. `ẹ ọ ị ụ ṣ ɓ ɗ ƙ` and
  Yorùbá tone marks render from a font proven to contain them.
- **Typed API boundary** — one `apiRequest` client, the blueprint's error envelope, a closed error
  code set, per-endpoint contracts in `src/services/contracts/`.
- **Honest states** — loading, empty, error and *not connected* are all designed, not afterthoughts.
- **Official brand identity** — the supplied logo in three cropped variants (lockup / mark / wordmark),
  palette derived from it, single replacement point (`src/config/brand.ts`). See `docs/design/brand.md`.
- **Guest access** — local guest session, visible indicator, account prompt and clean exit. See
  `docs/architecture/guest-access.md`.
- **Auth forms** — accessible labelled fields, live password rules, mismatch and required-field
  validation, honest "not available yet" outcomes.
- **Onboarding questionnaire** — ten questions, one per page, typed `UserOnboardingProfile` model,
  skippable, with an isolated service seam for future `POST /api/v1/onboarding`. Answers are kept in
  `localStorage` only; nothing is transmitted and the UI never implies otherwise.
- **Configurable catalogues** — countries and onboarding languages are data files, not hard-coded
  options.

## What does **not** exist yet — deliberately

Real authentication, AI, translation, dictionary data, a Record button and community posting.
Registration and login validate fully and then stop, because there is no auth service to call.
Building the rest before the consent model, moderation tooling and validated voices exist would mean
shipping inert or dishonest UI. See `docs/api/api-contract.md` for what the backend must provide.

---

## Structure

```
src/
├── components/
│   ├── brand/        WazobiaLogo — the single logo render point
│   ├── layout/       Sidebar, MobileNav, DestinationCard, ModuleScaffold
│   └── ui/           Button, Badge, Spinner, StateMessage, PageHeader, icons
├── config/           env, tokens, brand, languages, destinations (+ registry)
├── features/         ai · translate · learn · speak · dictionary · community · preserve · research
├── hooks/            useMediaQuery, usePersistentState, useSession, useLanguagePreference
├── layouts/          AppShell, MarketingLayout, MobileHeader
├── lib/              supabase (browser client), queryClient
├── pages/            LandingPage, AppEntryPage, SignUpPage, LoginPage, OnboardingPage,
│                     NotFoundPage, RouteErrorPage
├── services/         client.ts (the only fetch boundary), api.ts, guestSession, onboarding, contracts/
├── stores/           session, languagePreference  (*Context.ts + *.tsx + hooks/, kept split
│                     so each file exports components only — see HANDOVER.md §6)
├── test/             setup, unicode guards
├── types/            shared types (onboarding)
└── utils/            cn
api/                  Vercel server functions — placeholder, owned by the backend
docs/                 api/ · architecture/ · design/ · product/
```

Feature code never calls `fetch` directly and never hard-codes a language.

---

## Adding a destination later

1. Add the record to `src/config/destinationRegistry.tsx` (one place).
2. Add the route in `src/router.tsx`.
3. Build the feature in `src/features/<name>/`.
4. Flip `status` to `available` only when the contract responds.

Navigation on both devices updates automatically.

---

## Security rules enforced here

- Only `VITE_*` public values reach the browser. `GROQ_API_KEY`, `GEMINI_API_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, TTS/ASR keys are **server-side only** and absent from `.env.example`
  values.
- `src/config/env.ts` logs a loud error if a `service_role` JWT is ever supplied as the anon key.
- The frontend never makes an authorization decision; it hides what the server has already refused.

---

## Next frontend task (needs approval)

**Phase 1 — Public entry and language catalogue:** wire `GET /api/v1/languages` through TanStack
Query, replace the static catalogue with live records, and build the landing page's language
selection against real data — including the loading, empty and unavailable states that a real
network needs.
