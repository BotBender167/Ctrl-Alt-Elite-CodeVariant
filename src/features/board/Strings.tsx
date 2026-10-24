import { motion, useReducedMotion } from 'motion/react'
import { EASE_OUT } from '../../lib/motion'
import type { RepoLink } from '../../lib/relations'
import { pinPoint, STAGE_HEIGHT_UNITS } from './slots'
import type { Slot } from './slots'

export interface PlacedLink extends RepoLink {
  a: Slot
  b: Slot
}

function curve(a: Slot, b: Slot): { d: string; mx: number; my: number } {
  const p = pinPoint(a)
  const q = pinPoint(b)
  const dist = Math.hypot(q.x - p.x, q.y - p.y)
  const sag = 1.6 + dist * 0.07
  const mx = (p.x + q.x) / 2
  const my = (p.y + q.y) / 2 + sag
  return { d: `M${p.x} ${p.y} Q${mx} ${my + sag * 0.35} ${q.x} ${q.y}`, mx, my: my + sag * 0.17 }
}

// Red string between related projects. Purpose: explanation. It draws in after the notes land, so you see
// that these two belong together, and the reason appears when you point at either note.
export function Strings({ links, lit }: { links: PlacedLink[]; lit: number | null }) {
  const reduce = useReducedMotion()
  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${STAGE_HEIGHT_UNITS}`}
        aria-hidden="true"
      >
        {links.map((l, i) => {
          const related = lit !== null && (l.aId === lit || l.bId === lit)
          return (
            <motion.path
              key={`${l.aId}-${l.bId}`}
              d={curve(l.a, l.b).d}
              fill="none"
              stroke="#c0322c"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 1.5px 1.5px rgb(0 0 0 / 0.45))' }}
              initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: lit === null ? 0.9 : related ? 1 : 0.22,
                strokeWidth: related ? 0.34 : 0.2,
              }}
              transition={{
                pathLength: { duration: reduce ? 0 : 0.8, ease: EASE_OUT, delay: reduce ? 0 : 1.1 + i * 0.07 },
                opacity: { duration: 0.2 },
                strokeWidth: { duration: 0.2 },
              }}
            />
          )
        })}
      </svg>
      {links
        .filter((l) => lit !== null && (l.aId === lit || l.bId === lit))
        .map((l) => {
          const c = curve(l.a, l.b)
          return (
            <span
              key={`label-${l.aId}-${l.bId}`}
              className="sticky pointer-events-none absolute z-10 whitespace-nowrap px-[0.9cqw] py-[0.35cqw] text-[clamp(11px,1.6cqw,26px)]"
              style={{ left: `${c.mx}%`, top: `${(c.my / STAGE_HEIGHT_UNITS) * 100}%`, translate: '-50% -50%', rotate: '-2deg' }}
            >
              {l.reason}
            </span>
          )
        })}
    </>
  )
}
