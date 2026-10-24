import { MagnifyingGlass } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { EASE_OUT, Page } from '../components/Page'
import { useSettings } from '../store'

const USER_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
const DEMOS = ['BotBender167', 'octocat'] as const

function Rise({ delay, children, className = '' }: { delay: number; children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(22px)' }}
      animate={{ opacity: 1, transform: reduce ? 'none' : 'translateY(0px)' }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
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
    <Page className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-5 pb-20 pt-28 text-center">
      <div
        className="pointer-events-none absolute left-1/2 top-[44%] h-[70%] w-[min(900px,100%)] -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(ellipse at center, rgb(8 16 24 / 0.62), transparent 68%)' }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-3xl [text-shadow:0_2px_30px_rgb(5_12_18/0.8)]">
        <Rise delay={0.1}>
          <h1 className="text-[clamp(84px,15vw,200px)] leading-[0.8] text-cream">
            Unfinished
            <br />
            Business
          </h1>
        </Rise>
        <Rise delay={0.25}>
          <p className="mx-auto mt-6 max-w-md text-lg leading-snug text-cream/95 sm:text-xl">
            Paste your GitHub username. We find the dead project still worth reviving and tell you why.
          </p>
        </Rise>
      </div>

      <Rise delay={0.4} className="relative mt-8 w-full max-w-xl">
        <form onSubmit={handleSubmit} noValidate className="text-left">
          <label htmlFor="username" className="mb-2 block text-sm font-medium text-cream [text-shadow:0_1px_12px_rgb(5_12_18/0.8)]">
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
              style={error ? { borderColor: '#f0963f' } : undefined}
            />
            <button type="submit" className="btn">
              <MagnifyingGlass size={20} weight="bold" /> Scan my repos
            </button>
          </div>
          {error && (
            <p id="username-error" role="alert" className="mt-2 rounded-lg bg-ink/80 px-3 py-1.5 text-sm text-accent">
              {error}
            </p>
          )}
        </form>
        <p className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-cream/90 [text-shadow:0_1px_12px_rgb(5_12_18/0.8)]">
          <span>No account handy? Try</span>
          {DEMOS.map((d) => (
            <button key={d} type="button" className="btn ghost small !h-8 !bg-ink/70 !px-3 !text-sm" onClick={() => go(d)}>
              {d}
            </button>
          ))}
        </p>
      </Rise>
    </Page>
  )
}
