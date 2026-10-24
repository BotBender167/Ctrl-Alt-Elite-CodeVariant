import { motion, useReducedMotion } from 'motion/react'
import { Stamp } from '../../components/Stamp'
import { fmtDays, fmtMonth, fmtStars, daysBetween } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import type { Classified } from '../../lib/rules'
import type { Repo } from '../../lib/types'
import { NOTE_H, NOTE_W } from './layout'
import type { Slot } from './layout'

interface Props {
  repo: Repo
  cls: Classified
  slot: Slot
}

// What we already know about a project, shown beside its note while you point at it. It sits on whichever
// side of the note has room, so it never covers the red string you are following.
export function NoteTip({ repo, cls, slot }: Props) {
  const reduce = useReducedMotion()
  const right = slot.x < 58
  const gap = NOTE_W / 2 + 1
  const last = repo.pushed_at ?? repo.created_at
  return (
    <motion.div
      role="tooltip"
      className="paper pointer-events-none absolute z-20 w-[25cqw] min-w-[210px] p-[1.1cqw]"
      style={{
        left: `${slot.x + (right ? gap * 1 : -gap)}%`,
        top: `${slot.y}%`,
        translate: right ? '0 -50%' : '-100% -50%',
        maxHeight: `${NOTE_H * 2.4}cqw`,
      }}
      initial={{ opacity: 0, transform: reduce ? 'none' : `translateX(${right ? -8 : 8}px)` }}
      animate={{ opacity: 1, transform: 'translateX(0px)' }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
    >
      <p className="flex items-baseline justify-between gap-2">
        <span className="break-words font-display text-[clamp(13px,1.6cqw,26px)] leading-tight">{repo.name}</span>
        <Stamp status={cls.status} />
      </p>
      {repo.description && <p className="mt-1 line-clamp-2 text-[clamp(11px,1.15cqw,18px)] text-ink-soft">{repo.description}</p>}
      <p className="mt-1.5 flex flex-wrap gap-x-3 text-[clamp(10px,1.05cqw,16px)] text-ink-soft">
        <span>{repo.language ?? 'No language'}</span>
        <span>{fmtStars(repo.stargazers_count)} stars</span>
        <span>
          last push {fmtMonth(last)}, {fmtDays(daysBetween(last))} ago
        </span>
      </p>
      <p className="mt-2 border-l-2 border-string/70 pl-2 text-[clamp(10px,1.05cqw,16px)] text-ink-soft">{cls.evidence[0]}</p>
      <p className="mt-2 font-hand text-[clamp(13px,1.6cqw,26px)] leading-none text-string">Drag me onto Examine to open the case file</p>
    </motion.div>
  )
}
