import { env, isSupabaseConfigured } from '@/config/env'
import { AUTH_STORAGE_KEY } from '@/services/authClient'

/**
 * Sign-in diagnostics.
 *
 * This exists because "sign-in doesn't work" took several rounds to resolve,
 * and every round was guesswork: the form showed one sentence and nothing
 * about *why*. A user reporting the problem and a maintainer reading the report
 * both need the same four facts, and none of them are secret:
 *
 *   - is the project URL configured, and does it look like a Supabase URL
 *   - is an anon key present, and how long is it (a service-role key has a
 *     different length and `env.ts` already refuses it)
 *   - is there a stored session, and has it expired
 *   - which origin the browser is on
 *
 * It renders NOTHING when the project is correctly configured and there is no
 * stale session — a healthy sign-in page stays clean. It appears only when
 * something is actually wrong, which is also when someone needs it.
 *
 * Deliberately absent: the anon key itself, any token, and any password. The
 * key is technically public, but printing it invites it into screenshots and
 * support tickets for no benefit.
 */

function readStoredSessionState(): 'none' | 'valid' | 'expired' | 'corrupt' {
  if (typeof globalThis.localStorage === 'undefined') return 'none'
  const raw = globalThis.localStorage.getItem(AUTH_STORAGE_KEY)
  if (raw === null) return 'none'

  try {
    const parsed = JSON.parse(raw) as { expiresAt?: unknown }
    if (typeof parsed.expiresAt !== 'number') return 'corrupt'
    return parsed.expiresAt - 60_000 <= Date.now() ? 'expired' : 'valid'
  } catch {
    return 'corrupt'
  }
}

export function AuthDiagnostics() {
  const sessionState = readStoredSessionState()
  const keyPresent = Boolean(env.supabaseAnonKey)
  const urlPresent = Boolean(env.supabaseUrl)

  const healthy = isSupabaseConfigured && sessionState !== 'corrupt'
  if (healthy) return null

  const rows: { label: string; value: string; ok: boolean }[] = [
    {
      label: 'Project URL',
      value: urlPresent ? (env.supabaseUrl ?? '') : 'missing (VITE_SUPABASE_URL)',
      ok: urlPresent,
    },
    {
      label: 'Anon key',
      value: keyPresent
        ? `present (${String(env.supabaseAnonKey?.length ?? 0)} chars)`
        : 'missing (VITE_SUPABASE_ANON_KEY)',
      ok: keyPresent,
    },
    {
      label: 'Stored session',
      value:
        sessionState === 'corrupt'
          ? 'unreadable — will be discarded'
          : sessionState,
      ok: sessionState !== 'corrupt',
    },
    {
      label: 'Origin',
      value: globalThis.location?.origin ?? 'unknown',
      ok: true,
    },
  ]

  return (
    <details className="rounded-[var(--radius-md)] border border-gold-600 bg-gold-100 px-4 py-3 text-left">
      <summary className="cursor-pointer text-[0.8125rem] font-medium text-forest-900">
        Sign-in configuration looks wrong — show details
      </summary>

      <dl className="mt-3 grid gap-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-2 text-xs">
            <dt className="w-[7.5rem] shrink-0 font-medium text-forest-900">{row.label}</dt>
            <dd className={row.ok ? 'break-all text-forest-800' : 'break-all font-semibold text-ember-700'}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 border-t border-gold-500 pt-2 text-xs leading-5 text-forest-800">
        These values come from <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
        <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>. Vite inlines them at build
        time, so a local <code className="font-mono">.env</code> change needs the dev server
        restarted, and a Vercel change needs a redeploy.
      </p>
    </details>
  )
}
