# WAZOBIA — Frontend ↔ Backend API Contract

**Status:** §2.1 implemented and serving from the database. Every other endpoint is
contracted, and its schema exists, but no handler is written yet — those surfaces
still render the frontend's honest *not connected* state.

| Endpoint | Handler | Schema |
|---|---|---|
| §2.1 `GET /languages` | ✅ `api/v1/languages.ts` | ✅ `languages`, `dialects` |
| §2.2 `GET`/`PATCH /users/me` | — | ✅ `profiles`, `user_roles` |
| §2.3 `POST /ai/chat` | — | ✅ `conversations`, `conversation_messages` |
| §2.4 `POST /translate` | — | n/a (stateless) |
| §2.5 `GET /dictionary/search` | — | ✅ `dictionary_entries` |
| §2.6 `GET /courses`, `/lessons/:id`, `POST /progress` | — | ✅ `courses`, `lessons`, `lesson_sentences`, `lesson_progress` |

**Base path:** `/api/v1`
**Transport:** HTTPS, JSON (`application/json`). Media uploads use signed storage targets.
**Source of truth for types:** `src/services/contracts/`

This document is the agreement the frontend has been built against. Nothing in the UI simulates a
response: until these endpoints exist and respond correctly, each surface shows an explicit
*not connected* state.

---

## 1. Envelopes

Every response — success or failure — is one of these two shapes.

**Success**

```json
{
  "success": true,
  "data": { },
  "request_id": "req_01H..."
}
```

**Failure**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The language code is not supported.",
    "details": { "field": "language" },
    "request_id": "req_01H..."
  }
}
```

Rules the frontend depends on:

- `success` is always present and boolean.
- `request_id` is present on every response and is surfaced to users for support.
- `error.code` comes from a **closed set** (below). An unknown code degrades to `INTERNAL_ERROR`.
- `error.message` is safe to show to a user. No stack traces, no provider names, no personal data.
- Lists are paginated with an explicit maximum page size.
- No response ever contains a provider key, a service-role credential, or another user's data.

**Error codes** (`ApiErrorCode` in `src/services/contracts/envelope.ts`)

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Malformed or invalid request |
| `UNAUTHENTICATED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Authenticated but not permitted |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | State conflict |
| `PAYLOAD_TOO_LARGE` | 413 | Upload or body too large |
| `SEMANTIC_ERROR` | 422 | Well-formed but semantically invalid |
| `RATE_LIMITED` | 429 | Quota exceeded |
| `PROVIDER_UNAVAILABLE` | 502 / 503 / 504 | Upstream AI/TTS/ASR failure |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

---

## 2. Endpoints

### 2.1 `GET /api/v1/languages`

Returns enabled languages and their metadata. **The frontend needs this to replace its static
catalogue** (`src/config/languages.ts`) and to populate dialect selectors.

```json
{
  "success": true,
  "data": {
    "languages": [
      {
        "code": "yo",
        "native_name": "Yorùbá",
        "english_name": "Yoruba",
        "role": "target",
        "direction": "ltr",
        "enabled": true,
        "dialect_count": 0
      }
    ]
  },
  "request_id": "req_..."
}
```

**Critical requirement:** `native_name` must be returned **with full orthography** — `Yorùbá`, not
`Yoruba`. Tone marks are data, not presentation. The frontend will not add or repair diacritics.

Auth: not required. Cacheable (`Cache-Control: public, max-age=3600`).

**Implemented.** `api/v1/languages.ts` → `api/_lib/languages/handler.ts`. Reads the
`languages_public` view over PostgREST using the **anon** key, not the service-role key:
this endpoint serves public catalogue data, so it deliberately does not hold a credential
that bypasses Row Level Security. Disabled languages are excluded by the view itself, not
by the caller.

Error behaviour: `INTERNAL_ERROR` (500, `no-store`) if the database is unreachable or the
deployment is missing configuration. It never returns an empty list to signal failure —
an empty list would render as "no languages available", which is a lie.

---

### 2.2 `GET` / `PATCH /api/v1/users/me`

Auth: **required** (Bearer session token). The subject is always the token's
`sub`; there is no id parameter, so one caller cannot address another's profile.

**GET**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "display_name": "Zigzag Y",
    "username": "zigzag",
    "preferred_language": "yo",
    "email": "user@example.com",
    "roles": ["learner", "reviewer"],
    "created_at": "ISO-8601"
  },
  "request_id": "req_..."
}
```

- `username` is `null` when the account has never chosen one. It is **not**
  coerced to an empty string: "no handle" and "empty handle" are different
  states, and the UI renders them differently.
- `email` comes from the verified session token. `profiles` deliberately has no
  email column, so there is no second copy to fall out of sync.

**PATCH** — update your own details.

```json
{ "display_name": "Adaeze Okonkwo", "username": "ada.okonkwo", "preferred_language": "ig" }
```

Every field is optional; only what is sent is written. `username: null` clears
the handle. Unknown keys are **rejected with 400**, not ignored — silently
dropping a field a client believed it sent produces "I changed it and nothing
happened" bugs.

| Field | Rule |
|---|---|
| `display_name` | 1–80 characters after trimming |
| `username` | `^[a-z0-9_.]{3,24}$`, unique case-insensitively; `null` clears it |
| `preferred_language` | a `languages.code`, or `null` |

Errors: `400 VALIDATION_ERROR` (with `details.fields[]` naming each field),
`409 CONFLICT` (username taken), `422 SEMANTIC_ERROR` (a database constraint the
API does not model), `404 NOT_FOUND` (no profile row matched), `429 RATE_LIMITED`.

Returns the **stored** profile, so the client renders what the server holds
rather than echoing its own input back as if it were saved.

Errors: `UNAUTHENTICATED`, `FORBIDDEN`.
Note: `roles` is informational for UI only. **Authorization is enforced server-side** — hiding a
control in the frontend is not an access control (blueprint §3).

---

### 2.3 `POST /api/v1/ai/chat`

Auth: required for saved history. Anonymous use, if enabled, needs its own rate limits and privacy
policy.

**Request**

```json
{ "message": "What does E kaaro mean?", "language": "yo", "conversation_id": null }
```

Validation: trim; reject empty; max length (proposed 4,000 chars); `language` ∈ supported codes;
`conversation_id` ownership verified.

**Response**

```json
{
  "success": true,
  "data": {
    "response": "…",
    "language": "yo",
    "conversation_id": "uuid",
    "answer_type": "ai_generated",
    "sources": [
      { "type": "dictionary_entry", "id": "uuid", "review_status": "approved" }
    ]
  },
  "request_id": "req_..."
}
```

**`answer_type` must be truthful** — `ai_generated`, `reviewed_resource` or `mixed`. The UI renders
this as a visible provenance label and will not present `ai_generated` content as verified. Do not
return a numeric confidence score unless it has been calibrated and documented.

Errors: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `RATE_LIMITED`,
`PROVIDER_UNAVAILABLE`.

---

### 2.4 `POST /api/v1/translate`

**Request**

```json
{ "text": "Good morning", "source_language": "en", "target_language": "yo", "register": "neutral" }
```

`source_language` may be `"auto"`; the response reports what was detected, or `null` when
confidence was inadequate.

**Response**

```json
{
  "success": true,
  "data": {
    "translation": "Ẹ káàrọ̀",
    "source_language": "en",
    "target_language": "yo",
    "alternatives": [
      { "text": "…", "register": "formal", "note": "…" }
    ],
    "review_status": "ai_suggestion"
  },
  "request_id": "req_..."
}
```

`review_status` is `ai_suggestion` or `reviewed`. The frontend labels drafts as suggestions until a
human reviewer approves them (blueprint §7.5).

---

### 2.5 `GET /api/v1/dictionary/search?q=&language=&page=`

Auth: not required for approved public entries.

```json
{
  "success": true,
  "data": {
    "query": "ẹ káàrọ̀",
    "results": [
      { "id": "uuid", "headword": "ẹ káàrọ̀", "language": "yo", "part_of_speech": "greeting", "review_status": "approved", "gloss": "good morning" }
    ],
    "total": 1, "page": 1, "page_size": 20
  },
  "request_id": "req_..."
}
```

**Search requirements** (blueprint §9.7): matching must be tolerant of tone marks, diacritics and
alternate orthography, but the returned `headword` must preserve canonical spelling exactly. Never
silently normalise stored text.

---

### 2.6 `GET /api/v1/courses` · `GET /api/v1/lessons/:id` · `POST /api/v1/progress`

`/courses` → `{ courses: [{ id, title, language, level, lesson_count, description }] }`

`/lessons/:id` →

```json
{
  "success": true,
  "data": {
    "id": "uuid", "course_id": "uuid", "title": "…", "language": "yo",
    "sentences": [{ "id": "uuid", "text": "…", "translation": "…", "start_ms": 0 }],
    "read_aloud_available": true
  },
  "request_id": "req_..."
}
```

`start_ms` is **nullable on purpose**. Sentence highlighting is only offered when timing metadata is
reliable; when a provider cannot supply it, the frontend falls back to a simpler playback mode
rather than faking synchronisation (blueprint §8.2).

`read_aloud_available: false` is a first-class state: the UI discloses that no approved voice exists
for that language instead of mispronouncing content.

`/progress` → `{ recorded: true }`; auth required; idempotent per learner + lesson.

---

### 2.7 `POST /api/v1/onboarding` — *not implemented*

Required by `src/services/onboarding.ts` when `ONBOARDING_REMOTE_ENABLED` is turned on. The
questionnaire currently stores answers locally only and makes no network call.

**Auth:** required for account-linked answers. Anonymous/guest submissions, if enabled later, need a
separate policy — a guest session is not an identity.

**Request:** the `UserOnboardingProfile` object exactly as typed in `src/types/onboarding.ts`.

```json
{
  "countryOfOrigin": "NG",
  "currentCountry": "GB",
  "knownLanguages": ["yo", "en"],
  "languageRelationship": "heritage_speaker",
  "targetLanguages": ["ig"],
  "proficiencyLevel": "beginner",
  "learningGoals": ["conversation", "culture_heritage"],
  "joiningReason": "preserve_heritage",
  "discoverySource": "friend_family",
  "preferredLearningFrequency": "few_times_week"
}
```

**Validation the server must repeat:** country codes against the ISO list (plus `prefer_not_to_say`),
language ids against the language catalogue, enum membership for every union field, and the
eight-language cap. Keys are camelCase to match the frontend type; the server may map to snake_case
columns internally.

**Success:** `{ "success": true, "data": { "request_id": "req_…" }, "request_id": "req_…" }`

**Errors:** `VALIDATION_ERROR`, `UNAUTHENTICATED`, `CONFLICT` (profile already completed),
`RATE_LIMITED`.

### 2.8 Not yet contracted (planned, needed before those phases)

| Endpoint | Phase |
|---|---|
| `POST /api/v1/speech/recordings`, `POST /api/v1/speech/transcribe` | Speak |
| `GET/POST /api/v1/community/posts` | Community |
| `POST /api/v1/contributions` | Community / Preserve |
| `GET /api/v1/research/datasets`, `POST /api/v1/research/requests` | Research |

These are deliberately left unbuilt in the frontend. Recording and contribution surfaces require the
consent model and private storage policy to exist first — an inert record button is worse than none.

---

## 3. What the frontend guarantees in return

- All calls go through `src/services/client.ts`; no feature calls `fetch` directly.
- Only the Supabase **anon** key and a user session ever reach the browser.
- No provider keys, no service-role keys, no privileged operations from the client.
- Every failure maps to a typed error and a specific UI state (loading / empty / error / unavailable).
- Nothing invents a successful response.
