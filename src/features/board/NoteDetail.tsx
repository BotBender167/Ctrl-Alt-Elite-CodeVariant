import { motion, useReducedMotion } from 'motion/react'
import { Stamp } from '../../components/Stamp'
import { daysBetween, fmtDays, fmtMonth, fmtStars } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import type { Classified } from '../../lib/rules'
import type { Repo } from '../../lib/types'
import { DETAIL_W, placement } from './detail'
import type { Slot } from './layout'

interface Props {
  repo: Repo
  cls: Classified
  slot: Slot
  // Other projects this one is tied to by a dashed string, and why.
  ties: string[]
}

// The note you are pointing at unfolds into a larger card, in place, and what it covers is blurred (see Note),
// so only this project's details can be read. Purpose: explanation, where you are already looking. It grows
// from the size of the note it belongs to, so it reads as that note opening, and it leaves quickly.
export function NoteDetail({ repo, cls, slot, ties }: Props) {
  const reduce = useReducedMotion()
  const p = placement(slot)
  const last = repo.pushed_at ?? repo.created_at
  return (
    <motion.aside
      data-detail-card
      role="tooltip"
      className="note-detail paper"
      style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${DETAIL_W}cqw`, translate: '-50% -50%', transformOrigin: '50% 50%' }}
      initial={{ opacity: 0, transform: reduce ? 'none' : 'scale(0.5)' }}
      animate={{ opacity: 1, transform: 'scale(1)' }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    >
      <p className="flex items-baseline justify-between gap-[0.8cqw]">
        <span className="break-words font-display text-[clamp(13px,1.5cqw,26px)] leading-tight">{repo.name}</span>
        <Stamp status={cls.status} />
      </p>
      {repo.description && <p className="mt-[0.4cqw] line-clamp-2 text-[clamp(11px,1.1cqw,18px)] text-ink-soft">{repo.description}</p>}
      <p className="mt-[0.5cqw] flex flex-wrap gap-x-[1cqw] text-[clamp(10px,1cqw,16px)] text-ink-soft">
        <span>{repo.language ?? 'No language'}</span>
        <span>{fmtStars(repo.stargazers_count)} stars</span>
        <span>
          last push {fmtMonth(last)}, {fmtDays(daysBetween(last))} ago
        </span>
      </p>
      <p className="mt-[0.7cqw] border-l-2 border-string/70 pl-[0.7cqw] text-[clamp(10px,1cqw,16px)] text-ink-soft">{cls.evidence[0]}</p>
      {ties.map((t) => (
        <p key={t} className="mt-[0.5cqw] text-[clamp(10px,1cqw,16px)] text-ink-soft">
          <span className="font-semibold text-string">Tied to </span>
          {t}
        </p>
      ))}
      <p className="mt-[0.7cqw] font-hand text-[clamp(13px,1.55cqw,26px)] leading-none text-string">Drag it onto Examine to open</p>
    </motion.aside>
  )
}
