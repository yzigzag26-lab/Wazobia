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
| `SUPABASE_JWT_SECRET` | **JWT secret** (not the anon key) | Supabase → Settings → API → JWT Settings |
| `GROQ_API_KEY` | optional | console.groq.com |
| `GEMINI_API_KEY` | optional | aistudio.google.com |

Notes that matter:

- **The `VITE_` pair is public by design.** Vite inlines those two values into
  the browser bundle. That is safe: the anon key is the credential Supabase
  hands to browsers, and its power is bounded by Row Level Security.
- **`SUPABASE_JWT_SECRET` is the one that makes the API protected work.** Without
  it `/translate`, `/ai/chat` and `/users/me` answer `503` rather than running
  unprotected. That refusal is deliberate.
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
translate call means the deployment is not protected** — almost always because
`SUPABASE_JWT_SECRET` is missing from that environment.

## Local development

```bash
cp .env.example .env      # then fill in the two VITE_ values
npm install
npm run dev               # http://localhost:5173
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
