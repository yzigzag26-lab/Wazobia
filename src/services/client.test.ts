import { afterEach, describe, expect, it, vi } from 'vitest'
import { WazobiaApiError, apiRequest } from './client'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

function stubFetch(response: Response | Error): void {
  globalThis.fetch = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  ) as unknown as typeof fetch
}

describe('apiRequest', () => {
  it('unwraps a successful envelope', async () => {
    stubFetch(
      new Response(
        JSON.stringify({ success: true, data: { ok: 'yes' }, request_id: 'req_1' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(apiRequest<{ ok: string }>('/ping')).resolves.toEqual({ ok: 'yes' })
  })

  it('surfaces the documented error envelope with its code and request id', async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The language code is not supported.',
            details: { field: 'language' },
            request_id: 'req_2',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const error = await apiRequest('/translate', { method: 'POST', body: {} }).catch(
      (thrown: unknown) => thrown,
    )

    expect(error).toBeInstanceOf(WazobiaApiError)
    const apiError = error as WazobiaApiError
    expect(apiError.code).toBe('VALIDATION_ERROR')
    expect(apiError.status).toBe(400)
    expect(apiError.requestId).toBe('req_2')
    expect(apiError.message).toBe('The language code is not supported.')
  })

  it('reports a missing endpoint honestly instead of faking a success', async () => {
    stubFetch(new Response('<html>not found</html>', { status: 404 }))

    const error = (await apiRequest('/ai/chat', { method: 'POST', body: {} }).catch(
      (thrown: unknown) => thrown,
    )) as WazobiaApiError

    expect(error.code).toBe('UNEXPECTED_RESPONSE')
    expect(error.isUnavailable).toBe(false)
  })

  it('maps a connection failure to an unavailable state', async () => {
    stubFetch(new TypeError('Failed to fetch'))

    const error = (await apiRequest('/languages').catch((thrown: unknown) => thrown)) as WazobiaApiError

    expect(error).toBeInstanceOf(WazobiaApiError)
    expect(error.isUnavailable).toBe(true)
  })

  it('never sends an Authorization header without a token', async () => {
    const spy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, data: null, request_id: 'r' }), { status: 200 }),
      ),
    )
    globalThis.fetch = spy as unknown as typeof fetch

    await apiRequest('/languages')

    const call = spy.mock.calls[0] as unknown as [string, RequestInit]
    const headers = call[1].headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })
})
