/**
 * `GET /api/v1/health` — Vercel serverless entry point.
 *
 * PUBLIC ON PURPOSE. It reports whether this deployment can verify a user's
 * token, so it must be reachable without one — that is what makes it useful
 * when sign-in is broken.
 *
 * Everything returned is already public: the project URL ships in the browser
 * bundle, and the anon key does too. No secret, no key material, and no token
 * is ever included. See `api/_lib/health/handler.ts` for the reasoning.
 */

import { createHealthHandler } from '../_lib/health/handler.js'
import { readServerConfig } from '../_lib/config.js'
import { toHttpRequest, send, type PlatformRequest, type PlatformResponse } from '../_lib/platform.js'

export default async function handler(
  request: PlatformRequest,
  response: PlatformResponse,
): Promise<void> {
  const httpRequest = toHttpRequest(request)

  const handle = createHealthHandler({
    config: readServerConfig(),
    // Vercel exposes the commit SHA per deployment. It is what tells a user
    // whether the tab they are looking at is running current code — the exact
    // confusion caused by two bundles in one console.
    version: process.env['VERCEL_GIT_COMMIT_SHA'] ?? undefined,
  })

  send(response, await handle(httpRequest))
}
