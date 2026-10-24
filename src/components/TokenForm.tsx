import { useState } from 'react'
import type { FormEvent } from 'react'
import { useSettings } from '../store'

// Used on paper surfaces, so every colour here is ink based.
export function TokenForm({ onDone }: { onDone?: () => void }) {
  const token = useSettings((s) => s.token)
  const setToken = useSettings((s) => s.setToken)
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    const v = value.trim()
    if (v) setToken(v)
    setValue('')
    onDone?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-ink">
      <label htmlFor="gh-token" className="block text-sm font-semibold">
        GitHub token (optional)
      </label>
      <input
        id="gh-token"
        type="password"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={token ? 'A token is saved in this browser' : 'github_pat_...'}
        className="field !h-11 !border-ink/30 !bg-white/70 !text-base"
      />
      <p className="text-xs leading-relaxed text-ink-soft">
        A token with no permissions lifts the limit from 60 to 5,000 requests an hour. It stays in this browser and is sent only to
        GitHub.{' '}
        <a
          className="font-medium text-string underline underline-offset-2"
          href="https://github.com/settings/personal-access-tokens/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          Create one
        </a>
      </p>
      <div className="flex gap-2">
        <button type="submit" className="btn ink small">
          Save token
        </button>
        {token && (
          <button
            type="button"
            className="btn line small"
            onClick={() => {
              setToken(null)
              onDone?.()
            }}
          >
            Remove
          </button>
        )}
      </div>
    </form>
  )
}
