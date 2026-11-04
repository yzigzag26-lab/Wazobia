/**
 * Request identifiers.
 *
 * Every response carries one, on both paths, and it is surfaced to users so a
 * support conversation can start with "the reference on your screen". It is
 * never derived from anything user-controlled, so it cannot be used to inject
 * content into a log line or a response.
 */

/**
 * Generate a request id: `req_` + a UUIDv4 with dashes removed.
 *
 * `globalThis.crypto.randomUUID` is available in Node 19+ and in every edge
 * runtime, so there is no dependency and no fallback that could silently produce
 * a weaker id. `Math.random` is deliberately NOT used — request ids end up in
 * user-visible text and in logs, and predictable ids invite enumeration.
 */
export function createRequestId(): string {
  return `req_${globalThis.crypto.randomUUID().replaceAll('-', '')}`
}

/**
 * Accept a caller-supplied id only if it looks like one of ours.
 *
 * Vercel and proxies commonly attach a request id header. Reusing it makes
 * platform logs correlate with ours, but the value arrives from outside the
 * process, so it is validated against a narrow pattern before being echoed into
 * a response body. Anything unexpected is discarded in favour of a fresh id.
 */
const VALID_ID = /^[A-Za-z0-9_-]{8,128}$/

export function resolveRequestId(header: string | null | undefined): string {
  if (typeof header === 'string' && VALID_ID.test(header)) return header
  return createRequestId()
}
