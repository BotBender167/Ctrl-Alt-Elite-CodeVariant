import { PushPin } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Stamp } from '../../components/Stamp'
import { daysBetween, fmtDays, fmtMonth } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import type { Classified } from '../../lib/rules'
import type { Repo } from '../../lib/types'
import { NOTE_H, NOTE_W } from './slots'
import type { Slot } from './slots'

interface Props {
  repo: Repo
  cls: Classified
  slot: Slot
  index: number
  open: boolean
  faded: boolean
  onFocusRepo: (id: number | null) => void
  onOpen: () => void
}

// One project, pinned to the cork. The paper surface is its own element so it can glide into the case file
// when opened (the folder opening). The text fades separately, so it never stretches during that move.
export function Note({ repo, cls, slot, index, open, faded, onFocusRepo, onOpen }: Props) {
  const reduce = useReducedMotion()
  const silent = daysBetween(repo.pushed_at ?? repo.created_at)
  const key = repo.name.toLowerCase()

  return (
    <div
      className="absolute"
      style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${NOTE_W}cqw`, height: `${NOTE_H}cqw`, translate: '-50% -50%' }}
    >
      {!open && (
        <motion.div
          className="absolute inset-0"
          style={{ rotate: `${slot.rot}deg` }}
          initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(-14px) scale(1.06)' }}
          animate={{ opacity: faded ? 0.45 : 1, transform: 'translateY(0px) scale(1)' }}
          transition={{ duration: 0.35, ease: EASE_OUT, delay: reduce ? 0 : 0.45 + index * 0.05 }}
        >
          <Link
            to={`/u/${repo.owner.login}/${repo.name}`}
            onClick={onOpen}
            onMouseEnter={() => onFocusRepo(repo.id)}
            onMouseLeave={() => onFocusRepo(null)}
            onFocus={() => onFocusRepo(repo.id)}
            onBlur={() => onFocusRepo(null)}
            aria-label={`Open the case file for ${repo.name}, ${cls.status}, last seen ${fmtMonth(repo.pushed_at ?? repo.created_at)}`}
            className="group absolute inset-0 block transition-transform duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-[0.4cqw] [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.04]"
          >
            <motion.span layoutId={`surface-${key}`} className="paper absolute inset-0" />
            <span className="relative flex h-full flex-col p-[0.85cqw] text-ink">
              <PushPin
                weight="fill"
                className="absolute left-1/2 -translate-x-1/2 text-string drop-shadow"
                style={{ top: '-1.15cqw', width: '2.1cqw', height: '2.1cqw' }}
              />
              <span className="mt-[0.5cqw] line-clamp-2 break-words font-display leading-[1.12] text-[clamp(10px,1.28cqw,22px)]">
                {repo.name}
              </span>
              <span className="mt-[0.45cqw] text-[clamp(8px,1cqw,16px)]">
                <Stamp status={cls.status} />
              </span>
              <span className="mt-auto font-hand leading-none text-[clamp(11px,1.6cqw,26px)] text-ink-soft">
                Last seen {fmtMonth(repo.pushed_at ?? repo.created_at)}
                <span className="block text-[clamp(9px,1.15cqw,18px)] text-ink-soft/80">silent {fmtDays(silent)}</span>
              </span>
            </span>
          </Link>
        </motion.div>
      )}
    </div>
  )
}
