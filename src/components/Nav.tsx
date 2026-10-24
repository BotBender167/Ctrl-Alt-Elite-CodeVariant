import { Archive, Key, Tent } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { fmtTime } from '../lib/format'
import { useArchive, useRate, useSettings } from '../store'
import { EASE_OUT } from './Page'
import { TokenForm } from './TokenForm'

export function Nav() {
  const lastUser = useSettings((s) => s.lastUser)
  const hasToken = useSettings((s) => Boolean(s.token))
  const archived = useArchive((s) => Object.keys(s.entries).length)
  const { remaining, limit, resetAt } = useRate()
  const [open, setOpen] = useState(false)
  const low = remaining !== null && remaining < 10

  const link = 'rounded-full px-3 py-1.5 text-[15px] text-mist transition-colors duration-150 hover:text-cream'
  const active = '!text-cream bg-cream/10'

  return (
    <header className="fixed inset-x-0 top-0 z-30 px-3 pt-3 sm:px-6">
      <div className="panel mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <Link to="/" className="flex items-center gap-2">
          <Tent size={28} weight="duotone" className="text-accent" />
          <span className="display text-[30px] leading-none">Unfinished Business</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {lastUser && (
            <NavLink to={`/u/${lastUser}`} end className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
              My camps
            </NavLink>
          )}
          <NavLink to="/archive" className={({ isActive }) => `${link} flex items-center gap-1.5 ${isActive ? active : ''}`}>
            <Archive size={18} weight="duotone" /> Archive
            {archived > 0 && <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-[#1a120b]">{archived}</span>}
          </NavLink>
        </nav>

        <div className="relative flex items-center gap-2">
          {remaining !== null && (
            <span className={`hidden text-xs sm:block ${low ? 'text-accent' : 'text-mist'}`} title={resetAt ? `Resets at ${fmtTime(resetAt)}` : undefined}>
              {remaining} of {limit} requests left
            </span>
          )}
          <button
            type="button"
            className="btn ghost small !px-3"
            aria-expanded={open}
            aria-label="GitHub token settings"
            onClick={() => setOpen((v) => !v)}
          >
            <Key size={18} weight="duotone" className={hasToken ? 'text-teal' : ''} />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                className="panel absolute right-0 top-full mt-2 w-[min(92vw,22rem)] p-4"
                style={{ transformOrigin: 'top right', background: 'rgb(14 26 37 / 0.96)' }}
                initial={{ opacity: 0, transform: 'scale(0.96)' }}
                animate={{ opacity: 1, transform: 'scale(1)' }}
                exit={{ opacity: 0, transform: 'scale(0.96)', transition: { duration: 0.12 } }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
              >
                <TokenForm onDone={() => setOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
