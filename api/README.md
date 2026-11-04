# api/

Vercel server-side functions (blueprint §13). This directory is the entire
server surface of WAZOBIA: the browser calls `/api/v1/*` and never talks to a
provider or a privileged database operation directly.

## Status

| Endpoint | Contract | Auth | State |
|---|---|---|---|
| `GET /api/v1/languages` | §2.1 | public | **Implemented** |
| `GET /api/v1/users/me` | §2.2 | **required** | **Implemented** |
| `POST /api/v1/ai/chat` | §2.3 | **required** + rate limited | **Implemented** |
| `POST /api/v1/translate` | §2.4 | **required** + rate limited | **Implemented** |
| `GET /api/v1/dictionary/search` | §2.5 | public | **Implemented** |
| `GET /api/v1/courses`, `GET /api/v1/lessons/:id` | §2.6 | — | Schema ready, handler not written |
| `POST /api/v1/progress` | §2.6 | — | Schema ready, handler not written |

"Required" means the endpoint calls `protect()` from `_lib/auth/guard.ts` and
answers `401` without a valid bearer token. Both paid endpoints also consult
`_lib/rate-limit.ts` before spending a provider credit.

If `SUPABASE_JWT_SECRET` is absent, the three protected endpoints answer `503`
rather than running unprotected — an endpoint that cannot identify a caller must
not spend money on their behalf.

The contract these must satisfy is `docs/api/api-contract.md`. The database is
`supabase/migrations/`.

## Layout

```
api/
├── _lib/                     # everything testable — no platform types
│   ├── envelope.ts           # success/error envelopes, error codes, HTTP status map
│   ├── request-id.ts         # correlation ids, validated before being echoed
│   ├── http.ts               # runtime-agnostic HttpRequest / HttpResponse
│   ├── contract.test.ts      # proves this dir agrees with src/services/contracts
│   └── languages/
│       ├── handler.ts        # the endpoint's behaviour
│       ├── repository.ts     # data access (interface + PostgREST + in-memory)
│       └── handler.test.ts   # 17 tests, no server required
└── v1/
    ├── languages.ts
    ├── translate.ts
    ├── dictionary/search.ts
    ├── ai/chat.ts
    └── users/me.ts
```

Deployment is covered in `docs/operations/DEPLOYMENT.md`. In short: there is no
separate backend to deploy — Vercel builds `dist/` and `api/` from one commit and
serves both on one domain.

The split is deliberate. `_lib` code is a pure function of its inputs, so it is
tested directly with plain objects. `v1/*.ts` only translates between the
platform's request/response objects and the `HttpRequest`/`HttpResponse` pair,
and wires dependencies in — there is nothing in it worth mocking a socket for.

## Rules this directory follows

**Never importable from `src/`.** The server and the browser bundle are separate
compilation units with different `lib` settings (`api/tsconfig.json` has no
`DOM`, so touching `window` is a compile error).

**Prefer the least powerful credential.** `GET /languages` reads through
PostgREST with the **anon** key, not the service-role key. It serves public
catalogue data, so it has no business holding a credential that bypasses Row
Level Security — reading as anon means the request is subject to the same
policies a browser would be. It also avoids opening direct Postgres connections
from a serverless function, which is how connection limits get exhausted.

The service-role key is reserved for operations that genuinely cannot be done
by a user: granting roles, publishing content, writing review decisions.

**Errors never leak.** A caught exception is never put in a response body — a
database error can carry table names, column names and row values. The
`request_id` is the link between what the user saw and the server-side detail.

**No fabricated responses.** When configuration is missing the function returns
`INTERNAL_ERROR`, not an empty list. An empty list renders as "no languages
available", which is a lie; a 500 renders as the honest failure state the
frontend already implements.

## Environment

Server-only. None of these may ever be prefixed `VITE_`, and
`docs/architecture/engineering-standards.md` CI step 6 scans `dist/` for them.

| Variable | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | all endpoints | Project URL, no trailing slash |
| `SUPABASE_ANON_KEY` | public reads | Public by design; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | privileged writes only | **Not used by any current endpoint** |
| `GROQ_API_KEY` / `GEMINI_API_KEY` | AI endpoints | Not yet wired |
| `TTS_PROVIDER_API_KEY` / `ASR_PROVIDER_API_KEY` | speech | Not yet wired |

Missing configuration is a startup condition, not a crash: the endpoint reports
`INTERNAL_ERROR` and the frontend shows its "not connected" state.
