# Engineering standards

What the toolchain enforces, and why. Blueprint §13.1 sets the intent; this file records how it is
actually applied in this repository, because several of the owner's constraints are easy to undo by
accident.

Run everything at once:

```bash
npm run verify      # typecheck → lint → test → build
npm run verify:ci   # the same, from a clean `npm ci` — what CI runs
```

---

## 1. TypeScript

Configured in `tsconfig.app.json`. These are not defaults and must not be relaxed:

| Option | Why |
|---|---|
| `strict` | Blueprint §13.1: no untyped API boundaries |
| `noUncheckedIndexedAccess` | `array[i]` is `T \| undefined`. This is why `questionAt()` exists and why `!` is never needed |
| `exactOptionalPropertyTypes` | Optional props must be declared `?: T \| undefined`. Assigning `undefined` to `?: T` is an error |
| `noUnusedLocals` / `noUnusedParameters` | Dead parameters hide intent changes |
| `verbatimModuleSyntax` | Type-only imports are explicit, so no runtime import is emitted for a type |

`baseUrl` does not exist in TypeScript 7. The `@/*` alias is declared with bare `paths`.

## 2. Linting — `.oxlintrc.json`

The config file is the source of truth and carries rationale inline. The rules that matter most
encode decisions from `HANDOVER.md` §5–§6:

| Rule | Severity | Reason |
|---|---|---|
| `react/only-export-components` | error | A file that exports a component *and* anything else breaks Fast Refresh. This is why `stores/{session,languagePreference}` are split into `*Context.ts` + `*.tsx` + `hooks/use*.ts` |
| `typescript/no-non-null-assertion` | error | The owner treats `!` as a defect. Use an accessor that throws with a message (`questionAt`) |
| `typescript/no-explicit-any` | error | Tests may opt out; application code may not |
| `no-console` | error | Nothing debug-shaped ships. One intentional diagnostic in `config/env.ts` carries a scoped disable |
| `no-eval`, `no-new-func`, `no-script-url`, `no-debugger` | error | Non-negotiable in a product that serves minors |
| `react-hooks/exhaustive-deps` | error | A stale effect silently stops running. When a dependency is required by *intent* rather than by data flow, suppress it on that one hook with a written reason — see `AppShell` |

### Disable directives

Use a **line comment**. Block-comment directives are not honoured.

```ts
// oxlint-disable-next-line no-console
console.error('…')
```

Every suppression must state why. A disable without a reason is treated as a defect in review.

File-level exemptions currently in force — each is deliberate, and none weakens a rule globally:

| File | Rule | Why |
|---|---|---|
| `src/router.tsx` | `react/only-export-components` | The module exports route descriptions and a router, not components. The only components it could export are lazy wrappers, which Fast Refresh does not track |

Test files (`src/**/*.test.*`, `src/test/**`) may use `any` and non-null assertions: malformed input
is the fixture.

## 3. Testing

Vitest + Testing Library + jsdom. `src/test/setup.ts` clears `localStorage` and unmounts between
tests and stubs `matchMedia`, which jsdom does not implement.

Assertions should describe user-visible behaviour, not implementation. When a change is about the
*semantics* of the markup — an ARIA role, an element swap — add an assertion that pins the semantic
down, not one that pins the class name.

A test is only worth having if it fails when the behaviour is broken. Verify that by breaking it
once.

## 4. Continuous integration — `.github/workflows/ci.yml`

Runs on every push and pull request to `main`:

1. `npm ci` — fails on a lockfile that disagrees with `package.json`. Never `npm install` in CI; it
   silently repairs the lockfile instead of catching the drift.
2. `npm run typecheck`
3. `npm run lint`
4. `npm run test`
5. `npm run build`
6. A scan of `dist/` that fails the build if the name of any server-only variable
   (`SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, TTS/ASR keys) appears in a client
   bundle.

Before this phase the workflow file had never been uploaded, so none of the above had run. Treat a
green run on a real pull request as the only evidence that CI works.

## 5. Committing

- `npm run verify` must pass, with lint at **0 warnings and 0 errors**. Do not raise a threshold to
  get green.
- No reported failure is "not a defect". Find the cause or say plainly that it is unresolved.
- Never claim a check passed without running it. Say what you ran and what it printed.
- Generated output (`dist/`, `coverage/`, `node_modules/`) is never committed.

## 6. Security invariants

| Invariant | Enforced by |
|---|---|
| Only `VITE_*` values reach the browser | `src/config/env.ts`; reviewed on every change |
| A `service_role` key in the anon slot is caught | `assertNoServiceRoleKeyInBrowser()` in `env.ts` — logs loudly outside production |
| Server-only key names never appear in a bundle | CI step 6 above |
| Guest access never creates a Supabase user | `src/services/guestSession.ts` makes no network call; a test asserts `fetch` is not called |
| Onboarding never claims remote persistence | `ONBOARDING_REMOTE_ENABLED = false`; a test asserts `fetch` is not called on submit |
| The frontend never makes an authorization decision | No page reads a role to permit an action; visibility is not authorization |

## 7. Adding a dependency

State the benefit before installing. The stack is fixed by `HANDOVER.md` §2: React 19, Vite 8,
TypeScript 7, Tailwind 4, React Router 7, TanStack Query 5, Radix primitives, `oxlint`, Vitest.

Two examples of why this matters:

- `@fontsource` was removed because it silently drops `ẹ ọ ị ụ ṣ`, which breaks Yorùbá and Igbo at
  mid-word. The fonts are self-hosted and glyph-verified instead. Do not reintroduce.
- Playwright was installed ad hoc (`--no-save`) for browser verification and is still not a saved
  dependency. If browser tests become routine, add it as a `devDependency` with the reasoning
  recorded here.
