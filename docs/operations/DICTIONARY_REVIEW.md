# Approving the dictionary

## Why nothing is visible yet

`dictionary_approved_read` (migration `0001`) exposes a row only when
`review_status = 'approved'`. Nothing defaults to approved, and the importers
deliberately never approve their own output. So a freshly imported dictionary
returns zero search results — by design, not a bug.

Approval is a human decision about whether a **meaning** is correct. The
database can check whether a string is well-formed; it cannot check whether a
gloss is true.

## What is actually in the corpus

This matters before approving anything.

| Language | Rows | Well-formed headwords | Notes |
|---|---|---|---|
| Yorùbá (`yo`) | 24 | 23 | from the in-repo course corpus |
| Hausa (`ha`) | 24 | 24 | from the in-repo course corpus |
| Igbo (`ig`) | 1,024 | 10 | from the Igbo API, **verb-stem notation** |

The Igbo number is the one to understand. The source is a lexicographic
dictionary, and 1,014 of its 1,024 headwords carry dictionary notation:

```
-bugha(lị)          leading hyphen (verb stem)
(agwa)ụnò) -ma      parenthetical tone/sense groups
-(chị (àchị)        nested notation
-bà-                trailing hyphen
-;kwakpụsị anya     stray semicolon
 mmili nā-ekwō èkwò leading space
```

These are legitimate dictionary entries. Their folded search keys still work —
`wazobia_fold()` strips all punctuation, so `bugha` finds `-bugha(lị)`. But they
are not what a learner types, and a few (unbalanced parentheses, stray
whitespace) are genuinely malformed.

**Approving all 1,024 in one click publishes that notation to learners.**
That is why the bulk action refuses flagged rows by default.

## How to approve

### 1. You need the `reviewer` role

Check it:

```sql
select role from public.user_roles where user_id = auth.uid();
```

Grant it (run as the project owner in the SQL editor — this bypasses RLS by
design, which is why it is not exposed as an API):

```sql
insert into public.user_roles (user_id, role)
select id, 'reviewer' from auth.users where email = 'you@example.com'
on conflict (user_id, role) do nothing;
```

There is also `claim_bootstrap_reviewer()`, which promotes **only the caller**
and refuses once a reviewer exists. It takes no argument, so it cannot be aimed
at another account.

### 2. Open the review screen

`/app/review` in the running app. It lists pending entries worst-flagged first,
with a plain-language flag per row and Approve / Reject on each.

A `Clean` flag means the *string* is well-formed. It says nothing about whether
the gloss is correct — that is still your call.

### 3. Approve the safe material first

Hausa and Yorùbá are course-corpus proverbs with real glosses. These were the
first 48 rows approved, and they are enough to make search return results in all
three interface states.

The Igbo corpus needs a decision you have to make, not one the code can make:

- **Approve the clean ones** (10 rows) — safe, small.
- **Approve verb-stem notation too?** Defensible: it is a real dictionary, the
  search fold works, and a learner can still find the meaning. But the headword
  displayed will be `-bugha(lị)`, not `bugha`.
- **Rewrite the notation first?** Better product. Needs a transformation nobody
  has written yet, and a reviewer per batch.

## API, if you prefer the terminal

Both endpoints require a bearer token AND the reviewer role. A learner calling
them gets `403` from Postgres, not from the UI.

```bash
TOKEN=<access_token>

# Read the queue
curl -s "$BASE/api/v1/dictionary/review?language=ig&limit=50" \
  -H "authorization: Bearer $TOKEN"

# Approve one entry
curl -s -X POST "$BASE/api/v1/dictionary/review" \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"entry_id":"<uuid>","decision":"approved"}'

# Bulk approve, clean rows only (the default — flagged rows are refused
# and reported back in skipped_reasons)
curl -s -X POST "$BASE/api/v1/dictionary/review" \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"mode":"bulk","language":"ha","decision":"approved"}'
```

The bulk response tells you what it refused:

```json
{ "reviewed": 47, "skipped": 3,
  "skipped_reasons": ["foo -> unbalanced parentheses", "..."] }
```

## Safety properties, and where they live

| Property | Enforced by |
|---|---|
| Only reviewers can approve | `wazobia_is_reviewer()` raise, in Postgres |
| No approval without a gloss | `review_dictionary_entry()` raises `NO_GLOSS` |
| Bulk approval skips flagged rows | `p_only_clean` defaults to `true` |
| No "approve everything" button | `p_only_clean = false` must be sent explicitly |
| Unreviewed rows stay private | RLS policy `dictionary_approved_read` |
| Reviewer cannot be self-granted | `claim_bootstrap_reviewer()` takes no user id |

The last two are the ones worth not weakening. Row Level Security is the only
control a client cannot talk its way past.

## Current state

Approved: **48** (Hausa 24, Yorùbá 24). Pending: **1,024** (all Igbo).

Search returns those 48 today. The remaining 1,024 are waiting on a decision
about verb-stem notation, not on code.
