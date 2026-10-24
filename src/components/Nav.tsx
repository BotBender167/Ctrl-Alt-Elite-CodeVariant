import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { disableSound, enableSound } from '../lib/audio'
import { fmtTime } from '../lib/format'
import { EASE_OUT } from '../lib/motion'
import { useArchive, useRate, useSettings } from '../store'
import { TokenForm } from './TokenForm'

const LOW_QUOTA = 15

// Minimal chrome. On the home screen the title is already the hero, so the wordmark steps aside there
// (the old layout showed the name twice). Everywhere else it is the way back to the start.
export function Nav() {
  const { pathname } = useLocation()
  const home = pathname === '/'
  const lastUser = useSettings((s) => s.lastUser)
  const hasToken = useSettings((s) => Boolean(s.token))
  const sound = useSettings((s) => s.sound)
  const setSound = useSettings((s) => s.setSound)
  const archived = useArchive((s) => Object.keys(s.entries).length)
  const { remaining, resetAt } = useRate()
  const [open, setOpen] = useState(false)
  const lowQuota = remaining !== null && remaining < LOW_QUOTA

  const link = 'py-1 text-[15px] text-cream/75 transition-colors duration-150 hover:text-cream'
  const active = '!text-cream'

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-4 pb-8 pt-4 sm:px-8">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between [text-shadow:0_1px_14px_rgb(0_0_0/0.9)]">
        {home ? (
          <span />
        ) : (
          <Link to="/" className="font-display text-lg text-cream" aria-label="Unfinished Business, back to the start">
            Unfinished Business
          </Link>
        )}

        <nav className="relative flex items-center gap-6" aria-label="Main">
          {lastUser && !pathname.startsWith('/u/') && (
            <NavLink to={`/u/${lastUser}`} className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
              My board
            </NavLink>
          )}
          <NavLink to="/archive" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
            Archive{archived > 0 && <span className="ml-1.5 text-accent">{archived}</span>}
          </NavLink>
          <button
            type="button"
            aria-pressed={sound}
            aria-label={sound ? 'Turn the sound off' : 'Turn the sound on'}
            className={`${link} flex items-center gap-1.5`}
            onClick={() => {
              setSound(!sound)
              if (sound) disableSound()
              else void enableSound()
            }}
          >
            {sound ? <SpeakerHigh size={18} weight="bold" aria-hidden="true" /> : <SpeakerSlash size={18} weight="bold" aria-hidden="true" />}
            <span className="hidden sm:inline">Sound {sound ? 'on' : 'off'}</span>
          </button>
          {(lowQuota || hasToken) && (
            <button
              type="button"
              className={`${link} ${lowQuota ? '!text-accent' : ''}`}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {lowQuota ? `${remaining} requests left` : 'Token'}
            </button>
          )}
          <AnimatePresence>
            {open && (
              <motion.div
                className="paper absolute right-0 top-full mt-3 w-[min(92vw,22rem)] p-4 [text-shadow:none]"
                style={{ transformOrigin: 'top right' }}
                initial={{ opacity: 0, transform: 'scale(0.96)' }}
                animate={{ opacity: 1, transform: 'scale(1)' }}
                exit={{ opacity: 0, transform: 'scale(0.96)', transition: { duration: 0.12 } }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
              >
                {resetAt && lowQuota && <p className="mb-3 text-sm text-ink-soft">Resets at {fmtTime(resetAt)}.</p>}
                <TokenForm onDone={() => setOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </header>
  )
}
