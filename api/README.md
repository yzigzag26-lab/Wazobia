# api/

Vercel server-side functions live here (blueprint §13).

**Not part of the frontend phase.** This directory is a documented placeholder so the deployment
convention is unambiguous and the frontend never grows backend logic.

The browser calls `/api/v1/*`; the contracts those routes must satisfy are in
`docs/api/api-contract.md`.

Server-side only — never importable from `src/`:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `TTS_PROVIDER_API_KEY`
- `ASR_PROVIDER_API_KEY`

Responsibilities that belong here and nowhere else: authentication and session verification,
authorisation checks, request validation, rate limiting, AI orchestration and provider adapters,
and any privileged database operation.
