import { motion, useReducedMotion } from 'motion/react'
import { Stamp } from '../../components/Stamp'
import { daysBetween, fmtDays, fmtMonth, fmtStars } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import type { Classified } from '../../lib/rules'
import type { Repo } from '../../lib/types'

interface Props {
  repo: Repo
  cls: Classified
}

// What we already know about the project you are pointing at. It lives in one fixed place beside the zones,
// not on top of the board, so it can never cover the other notes or the string you are following.
export function Inspector({ repo, cls }: Props) {
  const reduce = useReducedMotion()
  const last = repo.pushed_at ?? repo.created_at
  return (
    <motion.aside
      aria-label={`About ${repo.name}`}
      className="inspector paper"
      initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(10px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    >
      <p className="flex items-baseline justify-between gap-2">
        <span className="break-words font-display text-lg leading-tight">{repo.name}</span>
        <Stamp status={cls.status} />
      </p>
      {repo.description && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{repo.description}</p>}
      <p className="mt-1.5 flex flex-wrap gap-x-3 text-[13px] text-ink-soft">
        <span>{repo.language ?? 'No language'}</span>
        <span>{fmtStars(repo.stargazers_count)} stars</span>
        <span>
          last push {fmtMonth(last)}, {fmtDays(daysBetween(last))} ago
        </span>
      </p>
      <p className="mt-2 border-l-2 border-string/70 pl-2 text-[13px] text-ink-soft">{cls.evidence[0]}</p>
      <p className="mt-2 font-hand text-xl leading-none text-string">Drag it onto Examine to open the case file</p>
    </motion.aside>
  )
}
