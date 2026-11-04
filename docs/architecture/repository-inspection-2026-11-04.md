# Repository inspection — 2026-11-04

Scope: full read of the repository against `HANDOVER.md` and the blueprint PDF, plus every claim in
the handover re-run rather than trusted. This file records what was found and what was fixed, so the
next session does not repeat the audit.

---

## 1. Summary

The handover is accurate. The frontend is genuinely working: typecheck clean, tests green, build
fast, 14 routes serving, honest "not connected" states throughout, and no faked authentication
anywhere. Nothing needed rebuilding.

What the handover flagged as the critical gap was real and is now fixed: **the dotfiles it said were
missing were missing.** `.oxlintrc.json`, `.gitignore`, `.env.example` and
`.github/workflows/ci.yml` existed on no branch. Their absence had three live consequences, all
confirmed:

| Consequence | Evidence |
|---|---|
| `npm run lint` was broken | oxlint fell back to default rules over `node_modules`: **21,803 warnings, 6 errors**. `npm run verify` could not pass |
| CI had never run | No `.github/workflows/` on `main` or on any branch |
| `node_modules/` and `dist/` were untracked but visible | `git status` listed both; a `git add .` would have committed them |

Everything below was found while restoring those files.

## 2. Defects found and fixed

### 2.1 Lint tooling (the root cause of most of the rest)

Restored `.oxlintrc.json` so the owner's documented constraints are **enforced**, not just
described: `no-non-null-assertion`, `only-export-components`, `no-explicit-any`, `no-console`,
`exhaustive-deps`, and the `jsx-a11y` plugin, which had never been running at all.

Fixing the resulting 0-error/0-warning state surfaced real code, not just config:

| Finding | File | Resolution |
|---|---|---|
| `role="status"` on a `<p>` where `<output>` is the correct element | `QuestionControl.tsx` | Replaced with `<output>`. `output` carries the `status` role implicitly plus form-result semantics. Behaviour asserted in new tests |
| `picture()` parameters shadowed the component props `height` and `className` | `WazobiaLogo.tsx` | Renamed to `intrinsicWidth` / `intrinsicHeight` / `imageClassName` |
| `focusHeading()` captured nothing from its parent and did not move focus | `OnboardingWizard.tsx` | Hoisted to module scope and renamed `scrollToTop()` — it scrolls, `useEffect` owns focus |
| Redundant `pathname` effect dependency | `MarketingLayout.tsx` | Removed. `hash` is the actual trigger; a plain navigation clears it, which fires the effect |
| `pathname` dependency required by intent, not data flow | `AppShell.tsx` | **Kept**, with a scoped suppression and a written reason. The shell does not remount between destinations, so removing it would strand screen-reader focus on a stale nav item |
| `.sort()` on arrays in assertions | `auth/validation.test.ts`, `onboarding/validation.test.ts` | `toSorted()` |

Result: `npm run lint` → **0 warnings, 0 errors** across 225 rules, matching the handover's target.

Two oxlint behaviours worth knowing, discovered the hard way — both are now in
`docs/architecture/engineering-standards.md`:

- **Disable directives must be line comments.** `/* oxlint-disable rule */` in a block comment is
  silently ignored. This cost several cycles before it was isolated.
- `--next-line` does not work for `react-hooks/exhaustive-effect-dependencies`; use a
  `disable`/`enable` pair around the hook.

### 2.2 Stale lockfile — `npm ci` installed two packages nothing imports

The committed `package-lock.json` was pinned at version `0.0.0` and still carried
`@fontsource-variable/fraunces` and `@fontsource-variable/inter`. Those were deliberately removed
from `package.json` because `@fontsource` subsets drop `ẹ ọ ị ụ ṣ` — the exact defect the
self-hosted fonts exist to prevent (`HANDOVER.md` §6).

`npm ci` did **not** fail; it happily installed both as ghost dependencies. CI would have "passed"
against a dependency set that does not match `package.json`. Regenerated; both are gone.

### 2.3 A design token that was documented but never emitted

`src/config/tokens.ts` documents `space.gutter: 'clamp(1rem, 4vw, 2.5rem)'`, and
`AppShell.tsx` consumes `px-[var(--gutter,1rem)]`. `--gutter` was **never declared** in
`index.css`, so the app content column silently used the 1rem fallback on every screen size. The
token is now emitted. This was invisible by inspection and only showed up by grepping the built CSS.

### 2.4 Documentation drift

| File | Claim | Reality |
|---|---|---|
| `README.md` | Palette is "laterite, indigo, palm and clay" | Those colours exist nowhere. The palette is forest / gold / lime / ember, derived from the logo |
| `README.md` | Onboarding is "three steps" | Ten questions, one per page |
| `README.md` | Structure tree lists 2 hooks, 6 features | 4 hooks, 15 feature folders; `layouts/`, `stores/` lists incomplete |
| `src/router.tsx` | `/onboarding` is a "three-step questionnaire" | Same |
| `src/config/destinationRegistry.tsx` | Navigation surfaces include a "command/search palette" | No such component exists. Reworded as a forward-looking note so it cannot read as a claim |
| `README.md` | `cp .env.example .env.local` | The file did not exist on any branch. Now does |

Deliberately **not** changed: `docs/design/brand.md` and the palette contrast ratios. Every ratio in
that table was recomputed from the hex values and is correct (forest-900 15.90:1, forest-700 10.80:1,
gold-500 1.56:1, lime-400 1.77:1, white-on-ember 4.86:1). Logo sizes in §"where the emblem is used"
match every `WazobiaLogo` call site.

## 3. Verified, not assumed

Everything in this table was executed in this session.

| Check | Result |
|---|---|
| `npm install` from lockfile | 212 packages, 0 vulnerabilities |
| `npm run typecheck` | clean |
| `npm run lint` | 0 warnings, 0 errors |
| `npm run test` | **81 tests, 9 files**, all passing (was 75/8; +6 new) |
| `npm run build` | clean, ~430 ms, 415 kB main chunk / 130 kB gzip |
| `npm run verify` | all four in sequence, green |
| **Clean-clone CI rehearsal** | `git clone` → `npm ci` → typecheck → lint → test → build → bundle secret scan: **all green** |
| Bundle secret scan | No server-only variable name appears in `dist/` |
| Dev server, all 14 routes | `/`, `/signup`, `/login`, `/onboarding`, `/app`, all 8 destinations, catch-all → HTTP 200 |
| `.gitignore` effective | `git check-ignore` confirms `node_modules/`, `dist/` |

Not verified, and therefore not claimed: **browser interaction testing.** Playwright is not a saved
dependency (as the handover states) and its browser download is blocked in this sandbox
(`cdn.playwright.dev` is unreachable). The 6 new tests cover the changed markup through jsdom, which
proves the DOM and ARIA contract but not layout, overflow or real speech output. The handover's
browser-verified claims for earlier phases have not been re-run here.

## 4. Still open — needs the owner's decision

These are untouched because each changes product or brand behaviour, not tooling.

1. **Non-square icons.** `icon-512.png` (512×421), `apple-touch-icon.png` (180×148) and
   `favicon-32.png` (32×26) are cropped straight from the emblem, so installers letterbox them.
   Padding to a square transparent canvas is a one-command fix but **alters brand assets** — the
   handover says ask first.
2. **No PWA manifest.** Icons suitable for it exist. `index.html` references only favicon and
   apple-touch-icon.
3. **No vector logo.** The emblem is a matted raster and softens above ~200 px. Unchanged; a real
   SVG source is a design deliverable, not an engineering one.
4. **Fake commit history.** `main` still has a single "Add files via upload" commit. This branch now
   carries the real work; whether to force-push `main` from it is the owner's call.
5. **Module pages are scaffolds** — correct and honest per the handover, listed so it is not mistaken
   for unfinished work.
6. **Playwright as a real dependency.** If browser verification becomes routine, add it properly with
   the reasoning recorded — currently every session has to reinstall it ad hoc.

## 5. Constraints honoured while working

- No authentication, registration or login success was faked; no backend was added.
- No onboarding answer is claimed to be saved to an account. `ONBOARDING_REMOTE_ENABLED` is still
  `false` and `submit()` still makes no network call.
- No invented statistics, users or testimonials were introduced.
- The app shell was not restructured. Every code change is local to the defect it fixes.
- Only `VITE_`-prefixed public values reach the bundle; the service-role guard in `env.ts` is intact
  and now also backed by a CI check.
- No new runtime dependency was added.
