# Deploying WAZOBIA

## There is no separate backend folder to deploy

This is the question that comes up first, so it is answered first.

WAZOBIA is **one deployment**, not two. The backend is the `api/` directory
inside this same repository. Vercel builds the Vite frontend and the API
functions from one commit and serves them from one domain:

```
https://<your-project>.vercel.app/          → the React app   (dist/)
https://<your-project>.vercel.app/api/v1/*  → the functions   (api/)
```

Nothing is copied to a second host, and the browser never calls a different
origin in production — it calls `/api/v1/*` relatively, on the same domain. That
is why `VITE_API_ORIGIN` is left empty for production.

```
api/                        ← THIS is the backend
├── v1/                     ← one file per route; Vercel maps file path → URL
│   ├── languages.ts        → GET  /api/v1/languages
│   ├── translate.ts        → POST /api/v1/translate
│   ├── users/me.ts         → GET  /api/v1/users/me
│   ├── ai/chat.ts          → POST /api/v1/ai/chat
│   └── dictionary/search.ts→ GET  /api/v1/dictionary/search
├── _lib/                   ← all real logic, testable without a server
│   ├── auth/               ← token verification, guards, profile lookup
│   ├── rate-limit.ts       ← per-user budgets for paid endpoints
│   ├── ai/                 ← provider clients, chat handler
│   ├── translate/          ← translation handler
│   └── …
└── tsconfig.json           ← separate compilation unit: no DOM lib, so server
                              code cannot accidentally use `window`
```

`vercel.json` at the repository root is what tells Vercel both halves exist:
`framework: vite`, `outputDirectory: dist`, and a 30-second `maxDuration` for
`api/**/*.ts`. You do not configure anything in the Vercel dashboard for the
functions beyond the environment variables below.

**Deploy command:** connect the repository, leave the build settings alone
(`vercel.json` supplies them), and press Deploy. Or from a terminal:

```bash
npx vercel --prod
```

---

## Step 1 — Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**, for both
**Production** and **Preview**.

| Name | Value | Where to get it |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | the **anon** `public` key | Supabase → Settings → API |
| `SUPABASE_URL` | same URL as above | as above |
| `SUPABASE_ANON_KEY` | same anon key | as above |
| `SUPABASE_JWT_SECRET` | **only for legacy HS256 projects** — leave unset otherwise | Supabase → Settings → JWT Keys |
| `GROQ_API_KEY` | optional | console.groq.com |
| `GEMINI_API_KEY` | optional | aistudio.google.com |

Notes that matter:

- **The `VITE_` pair is public by design.** Vite inlines those two values into
  the browser bundle. That is safe: the anon key is the credential Supabase
  hands to browsers, and its power is bounded by Row Level Security.
- **Token verification works two ways, and which one you need is a project
  setting.** Modern Supabase projects sign access tokens with **ES256**, a
  P-256 key pair whose public half is published at
  `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`. Legacy projects
  sign with **HS256** using a shared secret. The API supports both:
  - ES256 needs only `SUPABASE_URL` — the JWKS URL is derived from it, keys are
    fetched, cached for five minutes, and refetched once on rotate. **You do
    not set `SUPABASE_JWT_SECRET` for an ES256 project; there is no secret.**
  - HS256 needs `SUPABASE_JWT_SECRET`.
  Setting a secret on an ES256 project does not break anything, but it does not
  help either: it cannot verify an ES256 signature.
- **`GET /api/v1/health` tells you which scheme is live and whether it works.**
  Call it first when sign-in appears broken; see *Diagnosing sign-in* below.
- **Never** put the *service-role* key in a `VITE_` variable. `src/config/env.ts`
  detects it and blocks requests if you do.
- `GROQ_API_KEY` and `GEMINI_API_KEY` are both optional. With neither set, the
  translate and chat endpoints return `503 PROVIDER_UNAVAILABLE` and produce **no
  invented text** — an honest failure rather than a fake answer.

After changing any `VITE_` value you **must redeploy**. Vite substitutes them at
build time; a runtime environment change does not reach an already-built bundle.
This is the single most common cause of "sign-in is not configured" on a
deployed build.

## Step 2 — Database

Migrations live in `supabase/migrations/` and are applied in filename order:

| File | Contents |
|---|---|
| `0001_core_schema.sql` | tables, RLS policies, grants, launch catalogue, signup trigger |
| `0002_security_hardening.sql` | policy tightening |
| `0003_dictionary_provenance.sql` | source columns, uniqueness, review queue view |
| `0004_auth_protection.sql` | `api_rate_limits`, `consume_rate_limit()`, write-path revokes |

Apply with the Supabase CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

or paste each file into the Supabase SQL editor in order. They are idempotent —
`if not exists`, `create or replace` and `drop … if exists` throughout — so
re-running is safe.

## Step 3 — Auth settings

In **Supabase → Authentication → Providers → Email**:

- Email provider: **enabled**
- **Confirm email: OFF** ← required. This is what makes sign-in work straight
  after signup with no verification link.

This mirrors `mailer_autoconfirm: true`. If it is ever turned back on, signup
still succeeds but returns no session, and the app reports that honestly instead
of pretending the user is signed in.

## Step 4 — Verify the deployment

```bash
BASE=https://<your-project>.vercel.app

# Public endpoint — should be 200 with a language list
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/v1/languages"

# Protected endpoint, no token — MUST be 401, not 200
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/v1/translate" \
  -H 'content-type: application/json' -d '{"text":"hello","target_language":"yo"}'

# Protected endpoint with a real token — 200 (or 503 if no AI key is set)
curl -s "$BASE/api/v1/users/me" -H "authorization: Bearer <access_token>"
```

The second check is the important one. **A `200` on the unauthenticated
translate call means the deployment is not protected** — no verification
material is configured at all.

## Required environment variables, in one place

Set these in **Vercel → Settings → Environment Variables** for Production and
Preview, then redeploy. That is the whole list the API needs:

| Name | Required | Value |
|---|---|---|
| `SUPABASE_URL` | **yes** | `https://bxifjhhgmomiacehngyj.supabase.co` |
| `SUPABASE_ANON_KEY` | **yes** | the anon `public` key |
| `VITE_SUPABASE_URL` | yes, for the browser | same as `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | yes, for the browser | same anon key |
| `SUPABASE_JWT_SECRET` | **no** — only for legacy HS256 projects | *leave unset* |

**`SUPABASE_JWT_SECRET` is not needed and does not help.** This project signs
access tokens with ES256, which an HMAC secret cannot verify. Setting it is what
made a live deployment report `scheme: "hs256"` and `status: "ok"` while rejecting
every real token.

`SUPABASE_URL` is now **derived from `SUPABASE_ANON_KEY`** when it is not set
explicitly, because an anon key is a JWT carrying the project reference as
`ref`. So configuring the key alone is sufficient — the URL is recovered. The
common aliases `NEXT_PUBLIC_SUPABASE_*` and `PUBLIC_SUPABASE_*` are also read.
An explicit `SUPABASE_URL` always wins.

## Diagnosing sign-in

**Start here. Do not read the JavaScript console first.**

```bash
curl -s "$BASE/api/v1/health" | jq
```

The `status` field is the answer:

| `status` | Meaning | Fix |
|---|---|---|
| `ok` | A real token can be verified | Look elsewhere — the client is at fault |
| `degraded`, `scheme: "unverified"` | No secret and the JWKS was unreachable | Check the project URL and that the project is not paused |
| `degraded`, summary mentions the anon key | Tokens verify but profile lookups cannot run | Set `SUPABASE_ANON_KEY` |
| `down` | Nothing can verify a token | Set `SUPABASE_URL`, or `SUPABASE_JWT_SECRET` for an HS256 project |

`checks.jwks` reports whether the key set was actually fetched, and
`checks.jwks_key_count` how many usable keys it carried. Both are public facts;
no key material is ever returned.

`problems` is the actionable list — one sentence per thing to fix, naming the
variable. `resolved_from` names the variable that supplied each value, which is
how a spelling mismatch becomes obvious.

**A secret with no project URL is `degraded`, never `ok`.** That combination
cannot confirm which signing algorithm the project uses, so claiming readiness
would be a guess. This rule exists because the opposite was true during a real
outage.

### The failure this replaces

A deployment reported "sign-in loads but never takes me to the dashboard". The
browser showed `401` on `/api/v1/users/me` while Supabase happily issued tokens.
The cause: the verifier accepted `HS256` only, and the project signs `ES256`, so
**every genuine token was rejected**. The client then treated that `401` as a
dead session, cleared it, and redirected to `/login` — producing an unescapable
loop.

Symptoms worth recognising, because each has one cause:

- **`400` on `/auth/v1/token`** — wrong password. Nothing to do with the API.
  Supabase returns `400`, not `401`, for bad credentials.
- **`401` on `/api/v1/...` immediately after a successful sign-in** — the server
  cannot verify the token. Check `/api/v1/health`.
- **Bounced back to `/login` after landing** — the client destroying a valid
  session on that `401`. Fixed: a `401` from our own API no longer signs the
  user out; it surfaces a banner instead.
- **`404` on a deep link such as `/login`** — missing SPA fallback. `vercel.json`
  rewrites everything except `/api/*` to `/index.html`.

## Local development

```bash
npm install
npm run dev               # http://localhost:5173
```

`.env.development` is committed and supplies the two public Supabase values, so
a fresh checkout signs in without extra setup. You only need a local `.env` to
override them, and `.env` remains gitignored.

```bash
# Optional: start from a template if you want different values
cp .env.example .env
```

`vite dev` serves the React app only. The `api/` functions do **not** run under
`vite dev`; to exercise them locally, set `VITE_API_ORIGIN` to a running backend
origin and Vite will proxy `/api` there. The normal way to test the API is
`npx vercel dev`, which runs both halves together.

## What is not deployed yet

- **Password reset** needs an SMTP sender configured in Supabase. Until then the
  login screen says so instead of promising an email it cannot send.
- **Courses, lessons, progress, onboarding persistence and speech** (§2.6–§2.8)
  are not implemented as endpoints. The lesson content that exists is
  client-side data, not a served API.
- **The dictionary returns no rows** until entries are approved.
  `dictionary_approved_read` requires `review_status = 'approved'` and the 1,072
  imported rows are all `pending`. That is moderation work, not a deployment
  fault.
