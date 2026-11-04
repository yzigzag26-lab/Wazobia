# Guest access

**Status:** implemented frontend-only. No backend involved.

## What it is

A visitor can enter the application immediately without an account. The brief requires this to work
today, before authentication exists, and it must never look like authentication.

## Implementation

| Concern | Where |
|---|---|
| Session model + storage | `src/services/guestSession.ts` |
| React context | `src/stores/session.tsx` |
| Visible indicator in the app | `src/components/layout/GuestBanner.tsx` |
| Entry points | hero (`Continue as guest`), `/signup`, `/login`, `/app`, final CTA |

Storage key: `wazobia.guest-session.v1` in `localStorage`.

Shape:

```json
{
  "kind": "guest",
  "id": "<opaque client-side id>",
  "createdAt": "ISO-8601",
  "isGuest": true,
  "capabilities": ["browse-public", "use-public-tools"]
}
```

## Guarantees

- **No Supabase user is created.** The service never touches the network.
- **Nothing is authenticated.** There is no token and no credential. `isGuest: true` is the only claim.
- **Reads are validated, not trusted.** A stored record that does not match the expected shape — or
  that claims capabilities as a string instead of an array — is discarded and treated as anonymous.
- **Storage failure is survivable.** If `localStorage` throws (private mode, quota), the session
  still works for the current page view.
- **Dismissing the banner does not end the session.** Explicit "Exit guest" does, and it clears storage.
- **Capabilities are an allow-list.** `GUEST_DENIED_CAPABILITIES` names what a guest must never hold
  (`account-data`, `contribution-persistence`, `upload-persistence`, `moderation`, `review`, `admin`),
  and a unit test asserts none are granted.

## What guests cannot do

The banner states this in the UI, and there is no code path that would let it happen:

- no progress, favourites or contributions saved to an account
- no moderation, review or administrative actions
- no access to private account data

## Replacing it with real authentication

`src/stores/session.tsx` already exposes the shape the final system needs — `status`, `session`,
`isGuest`, capabilities, `endSession()`. Swapping it means:

1. Replace `guestSessionService` reads with the Supabase session in `SessionProvider`.
2. Add `authService.register/login` calls behind the existing `handleSubmit` functions — form state,
   validation and error rendering in `SignUpForm`/`LoginForm` are already final.
3. Keep guest mode as a *pre-auth* state if desired; the `capabilities` array absorbs it.

No UI component needs to change.
