import { Compass, WarningCircle, WifiSlash } from '@phosphor-icons/react'
import { GhError } from '../lib/github'
import { fmtTime } from '../lib/format'
import { TokenForm } from './TokenForm'

export function ErrorPanel({ error, subject, onRetry }: { error: unknown; subject: string; onRetry?: () => void }) {
  const kind = error instanceof GhError ? error.kind : 'other'
  const resetAt = error instanceof GhError ? error.resetAt : null

  let title = 'Something went wrong'
  let body = error instanceof Error ? error.message : 'Please try again.'
  let icon = <WarningCircle size={44} weight="duotone" className="text-accent" />

  if (kind === 'not_found') {
    title = `We could not find ${subject}`
    body = 'Check the spelling, or try another GitHub name. Only public projects can be read.'
    icon = <Compass size={44} weight="duotone" className="text-accent" />
  } else if (kind === 'rate_limited') {
    title = 'GitHub is limiting this network'
    body = `Free access allows 60 requests an hour per network.${resetAt ? ` It resets at ${fmtTime(resetAt)}.` : ''} Add a token to keep going now.`
  } else if (kind === 'network') {
    title = 'No connection to GitHub'
    body = 'Check your internet and try again.'
    icon = <WifiSlash size={44} weight="duotone" className="text-accent" />
  }

  return (
    <div className="panel mx-auto max-w-xl space-y-4 p-6" role="alert">
      <div className="flex items-start gap-4">
        {icon}
        <div>
          <h2 className="!text-[40px]">{title}</h2>
          <p className="mt-2 text-mist">{body}</p>
        </div>
      </div>
      {kind === 'rate_limited' && <TokenForm />}
      {onRetry && (
        <button type="button" className="btn ghost small" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
