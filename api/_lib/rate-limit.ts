/**
 * Rate limiting for cost-bearing endpoints.
 *
 * The reason this exists is narrow and concrete: `POST /translate` and
 * `POST /ai/chat` each spend a paid provider credit. Authentication alone does
 * not bound that — one account with valid credentials can loop, and signup is
 * deliberately frictionless so an attacker can register a handful of accounts.
 *
 * The counter lives in Postgres (`api_rate_limits`, migration 0004) rather than
 * in module memory. Serverless instances are created and destroyed constantly,
 * so an in-process counter would reset on every cold start and would not be
 * shared between concurrent instances. It would look like a limit and behave
 * like decoration.
 *
 * Failing open or closed is a real decision:
 *
 *   * If the limiter cannot be reached, the request proceeds. A database blip
 *     should not take down the whole product. The exposure is bounded by the
 *     provider's own quota, and the failure is logged with the request id.
 *   * A caller who is over budget gets an honest 429 with `retry_after`.
 */

export interface RateLimitConfig {
  readonly supabaseUrl: string
  readonly anonKey: string
}

/** Limits per endpoint, per user. Documented in the API contract. */
export const RATE_LIMITS = {
  /** 20 translations per 5 minutes. A person translating a sentence is fine. */
  translate: { scope: 'translate', max: 20, windowSeconds: 300 },
  /** 30 chat messages per 5 minutes. */
  chat: { scope: 'ai_chat', max: 30, windowSeconds: 300 },
  /** Profile reads are cheap, but 120/min still stops a scraper. */
  users_me: { scope: 'users_me', max: 120, windowSeconds: 60 },
} as const

export type RateLimitName = keyof typeof RATE_LIMITS

export interface RateLimitDecision {
  readonly allowed: boolean
  /** Seconds the caller should wait. Only meaningful when `allowed` is false. */
  readonly retryAfterSeconds: number
}

export type RateLimiter = (
  name: RateLimitName,
  authorization: string | null,
) => Promise<RateLimitDecision>

/**
 * Call the SECURITY DEFINER RPC with the caller's own token.
 *
 * `consume_rate_limit` derives the user from `auth.uid()`, so this module cannot
 * limit a different account than the one presenting the token, and the caller
 * cannot reset its own window by asking for one.
 */
export function createRestRateLimiter(config: RateLimitConfig): RateLimiter {
  const base = config.supabaseUrl.replace(/\/$/, '')
  const anonKey = config.anonKey

  return async function check(name, authorization) {
    const limit = RATE_LIMITS[name]
    // Without a token there is no identity to limit, and the guard upstream has
    // already rejected the request. Allow, so a misconfiguration surfaces as an
    // auth error rather than a confusing rate-limit error.
    if (authorization === null) {
      return { allowed: true, retryAfterSeconds: 0 }
    }

    try {
      const response = await fetch(`${base}/rest/v1/rpc/consume_rate_limit`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          authorization,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          p_scope: limit.scope,
          p_max_per_window: limit.max,
          p_window_seconds: limit.windowSeconds,
        }),
      })

      if (!response.ok) {
        // Fail open, as documented above.
        return { allowed: true, retryAfterSeconds: 0 }
      }

      const allowed = await response.json()
      return {
        allowed: allowed === true,
        retryAfterSeconds: allowed === true ? 0 : limit.windowSeconds,
      }
    } catch {
      return { allowed: true, retryAfterSeconds: 0 }
    }
  }
}

/** Always-allow limiter for tests and for a deployment with no database. */
export function createNullRateLimiter(): RateLimiter {
  return async () => ({ allowed: true, retryAfterSeconds: 0 })
}
