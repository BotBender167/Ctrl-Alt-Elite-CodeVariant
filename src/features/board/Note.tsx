import { GridFour, PushPin } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { Stamp } from '../../components/Stamp'
import { daysBetween, fmtDays, fmtMonth } from '../../lib/format'
import { EASE_OUT } from '../../lib/motion'
import type { Classified } from '../../lib/rules'
import type { Repo } from '../../lib/types'
import { useDraggable } from '../dnd/useDraggable'
import { CARD } from '../dnd/types'
import { cardOf, STATUS_ICON } from './cards'
import { HUB, NOTE_H, NOTE_W, STAGE_HEIGHT_UNITS } from './layout'
import type { Slot } from './layout'

interface Props {
  repo: Repo
  cls: Classified
  slot: Slot
  index: number
  open: boolean
  faded: boolean
  // The details card is sitting on this note, so it is blurred.
  blurred: boolean
  kept: boolean
  onLight: (id: number | null) => void
}

// One project, pinned to the cork. It flies out of your profile when the board lands. You drag it onto a
// zone to act on it; pointing at it shows what we know. The paper surface is its own element so it can
// glide into the case file when opened. The text fades separately, so it never stretches during that move.
export function Note({ repo, cls, slot, index, open, faded, blurred, kept, onLight }: Props) {
  const reduce = useReducedMotion()
  const silent = daysBetween(repo.pushed_at ?? repo.created_at)
  const key = repo.name.toLowerCase()
  const Glyph = STATUS_ICON[cls.status]
  const drag = useDraggable({
    type: CARD.repo,
    payload: cardOf(repo),
    label: repo.name,
    ariaLabel: `${repo.name}, ${cls.status}, last seen ${fmtMonth(repo.pushed_at ?? repo.created_at)}`,
  })
  // Where the note starts its flight: the hub, measured in container-width units from where it will rest.
  const dx = HUB.x - slot.x
  const dy = ((HUB.y - slot.y) * STAGE_HEIGHT_UNITS) / 100

  return (
    <div
      className="absolute"
      style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${NOTE_W}cqw`, height: `${NOTE_H}cqw`, translate: '-50% -50%' }}
    >
      {!open && (
        <motion.div
          className="absolute inset-0 transition-[filter] duration-200"
          style={{ rotate: `${slot.rot}deg`, filter: blurred ? 'blur(3px) brightness(0.6)' : faded ? 'brightness(0.68) saturate(0.8)' : 'none' }}
          initial={{ opacity: 0, transform: reduce ? 'none' : `translate(${dx}cqw, ${dy}cqw) scale(0.25)` }}
          animate={{ opacity: 1, transform: 'translate(0cqw, 0cqw) scale(1)' }}
          transition={{
            opacity: { duration: 0.25 },
            transform: { duration: 0.7, ease: EASE_OUT, delay: reduce ? 0 : 0.35 + index * 0.08 },
          }}
        >
          <div
            data-drag-item
            {...drag.pointer}
            {...drag.keyboard}
            onPointerEnter={(e) => e.pointerType === 'mouse' && onLight(repo.id)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && onLight(null)}
            onFocus={() => onLight(repo.id)}
            onBlur={() => onLight(null)}
            onClick={() => onLight(repo.id)}
            className="drag group absolute inset-0 block transition-transform duration-200 ease-out data-[lifted]:opacity-30 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-[0.4cqw] [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.04]"
          >
            <motion.span layoutId={`surface-${key}`} className="paper absolute inset-0" />
            <span className="relative flex h-full flex-col p-[0.85cqw] text-ink">
              <PushPin
                weight="fill"
                className="absolute left-1/2 -translate-x-1/2 text-string drop-shadow"
                style={{ top: '-1.15cqw', width: '2.1cqw', height: '2.1cqw' }}
              />
              <span className="mt-[0.35cqw] flex items-start gap-[0.4cqw]">
                <Glyph weight="bold" className="mt-[0.15cqw] flex-none" style={{ width: '1.5cqw', height: '1.5cqw' }} aria-hidden="true" />
                <span className="line-clamp-2 break-words font-display leading-[1.12] text-[clamp(9px,1.1cqw,19px)]">{repo.name}</span>
              </span>
              <span className="mt-[0.4cqw] text-[clamp(8px,0.95cqw,15px)]">
                <Stamp status={cls.status} />
              </span>
              <span className="mt-auto font-hand leading-none text-[clamp(11px,1.5cqw,25px)] text-ink-soft">
                Last seen {fmtMonth(repo.pushed_at ?? repo.created_at)}
                <span className="block text-[clamp(9px,1.1cqw,17px)] text-ink-soft/80">silent {fmtDays(silent)}</span>
              </span>
            </span>
            {kept && (
              <span className="sticky absolute -right-[0.8cqw] -top-[1cqw] px-[0.7cqw] text-[clamp(11px,1.4cqw,22px)]" style={{ rotate: '8deg' }}>
                kept
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// The grip shown on list rows (phones), where a handle keeps the page scrollable.
export function Grip() {
  return (
    <span
      data-handle
      className="grid h-11 w-9 flex-none place-items-center rounded-md text-ink-soft"
      aria-hidden="true"
    >
      <GridFour size={22} weight="bold" />
    </span>
  )
}
