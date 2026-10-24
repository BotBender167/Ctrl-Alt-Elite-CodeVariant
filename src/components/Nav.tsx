import { Tent } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { fmtTime } from '../lib/format'
import { useArchive, useRate, useSettings } from '../store'
import { EASE_OUT } from '../lib/motion'
import { TokenForm } from './TokenForm'

const LOW_QUOTA = 15

// Minimal chrome: a wordmark and two text links. The request counter and token field appear only when they matter.
export function Nav() {
  const lastUser = useSettings((s) => s.lastUser)
  const hasToken = useSettings((s) => Boolean(s.token))
  const archived = useArchive((s) => Object.keys(s.entries).length)
  const { remaining, resetAt } = useRate()
  const [open, setOpen] = useState(false)
  const lowQuota = remaining !== null && remaining < LOW_QUOTA

  const link = 'py-1 text-[15px] text-cream/75 transition-colors duration-150 hover:text-cream'
  const active = '!text-cream'

  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-gradient-to-b from-ink/75 to-transparent px-4 pb-8 pt-4 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between [text-shadow:0_1px_14px_rgb(5_12_18/0.9)]">
        <Link to="/" className="flex items-center gap-2" aria-label="Unfinished Business, home">
          <Tent size={26} weight="duotone" className="text-accent" />
          <span className="display text-[28px] leading-none">Unfinished Business</span>
        </Link>

        <nav className="relative flex items-center gap-6" aria-label="Main">
          {lastUser && (
            <NavLink to={`/u/${lastUser}`} end className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
              Camps
            </NavLink>
          )}
          <NavLink to="/archive" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
            Archive{archived > 0 && <span className="ml-1.5 text-accent">{archived}</span>}
          </NavLink>
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
                className="panel absolute right-0 top-full mt-3 w-[min(92vw,22rem)] p-4 [text-shadow:none]"
                style={{ transformOrigin: 'top right', background: 'rgb(14 26 37 / 0.96)' }}
                initial={{ opacity: 0, transform: 'scale(0.96)' }}
                animate={{ opacity: 1, transform: 'scale(1)' }}
                exit={{ opacity: 0, transform: 'scale(0.96)', transition: { duration: 0.12 } }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
              >
                {resetAt && lowQuota && <p className="mb-3 text-sm text-mist">Resets at {fmtTime(resetAt)}.</p>}
                <TokenForm onDone={() => setOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </header>
  )
}
