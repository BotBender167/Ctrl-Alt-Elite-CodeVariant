import { MagnifyingGlass } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { useTitle } from '../hooks/useTitle'
import { EASE_OUT } from '../lib/motion'
import { useSettings } from '../store'

const USER_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
const DEMOS = ['BotBender167', 'octocat'] as const
const SHADOW = '[text-shadow:0_2px_24px_rgb(0_0_0/0.95)]'

// Hero entrance. Purpose: order. The title lands first, then the promise, then the one thing to do,
// timed to arrive as the video settles into the graveyard.
function Rise({ delay, children, className = '' }: { delay: number; children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(20px)' }}
      animate={{ opacity: 1, transform: reduce ? 'none' : 'translateY(0px)' }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  useTitle()
  const navigate = useNavigate()
  const setLastUser = useSettings((s) => s.setLastUser)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function go(raw: string): void {
    const user = raw.trim().replace(/^@/, '')
    if (!USER_RE.test(user)) {
      setError('Use a valid GitHub username: letters, numbers and single hyphens.')
      return
    }
    setError('')
    setLastUser(user)
    navigate(`/u/${user}`)
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    go(name)
  }

  return (
    <Page className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-5 pb-16 pt-20 text-center">
      <div className={`w-full max-w-3xl ${SHADOW}`}>
        <Rise delay={0.3}>
          <h1 className="text-[clamp(46px,8.4vw,112px)] uppercase leading-[0.98] tracking-tight text-cream">
            Unfinished
            <br />
            Business
          </h1>
        </Rise>
        <Rise delay={0.5}>
          <p className="mx-auto mt-5 max-w-md text-lg leading-snug text-cream sm:text-xl">
            Paste your GitHub username. We find the dead project still worth reviving and tell you why.
          </p>
        </Rise>
      </div>

      <Rise delay={0.7} className="mt-8 w-full max-w-xl">
        <form onSubmit={handleSubmit} noValidate className="text-left">
          <label htmlFor="username" className={`mb-2 block text-sm font-medium text-cream ${SHADOW}`}>
            GitHub username
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="username"
              name="username"
              className="field flex-1"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError('')
              }}
              placeholder="e.g. octocat"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'username-error' : undefined}
              style={error ? { borderColor: '#f3a649' } : undefined}
            />
            <button type="submit" className="btn">
              <MagnifyingGlass size={20} weight="bold" /> Scan my repos
            </button>
          </div>
          {error && (
            <p id="username-error" role="alert" className="mt-2 rounded-lg bg-room/90 px-3 py-1.5 text-sm text-accent">
              {error}
            </p>
          )}
        </form>
        <p className={`mt-5 text-center text-sm text-cream ${SHADOW}`}>
          No account handy? Try{' '}
          {DEMOS.map((d, i) => (
            <span key={d}>
              {i > 0 && ' or '}
              <button
                type="button"
                className="font-medium underline decoration-cream/40 underline-offset-4 transition-colors duration-150 hover:decoration-accent"
                onClick={() => go(d)}
              >
                {d}
              </button>
            </span>
          ))}
        </p>
      </Rise>
    </Page>
  )
}
