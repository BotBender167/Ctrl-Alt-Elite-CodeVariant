import { motion, useReducedMotion } from 'motion/react'
import { EASE_OUT } from '../../lib/motion'
import type { RepoLink } from '../../lib/relations'
import { hubPoint, pinPoint, STAGE_HEIGHT_UNITS } from './layout'
import type { Slot } from './layout'

export interface PlacedLink extends RepoLink {
  a: Slot
  b: Slot
}

export interface Spoke {
  id: number
  slot: Slot
}

type Point = { x: number; y: number }

function sagged(p: Point, q: Point, sag: number): { d: string; mx: number; my: number } {
  const mx = (p.x + q.x) / 2
  const my = (p.y + q.y) / 2
  const nx = -(q.y - p.y)
  const ny = q.x - p.x
  const len = Math.hypot(nx, ny) || 1
  const cx = mx + (nx / len) * sag
  const cy = my + (ny / len) * sag + sag * 0.6
  return { d: `M${p.x} ${p.y} Q${cx} ${cy} ${q.x} ${q.y}`, mx: (mx + cx) / 2, my: (my + cy) / 2 }
}

// Red string from your profile to every project, drawn as each note lands. Purpose: connection. Everything
// on the board is yours and hangs off you. Pointing at a note pulls its string tight and shows any
// project it is also tied to (the reason is written in the details card).
export function Strings({ spokes, links, lit }: { spokes: Spoke[]; links: PlacedLink[]; lit: number | null }) {
  const reduce = useReducedMotion()
  const hub = hubPoint()
  const tied = links.filter((l) => lit !== null && (l.aId === lit || l.bId === lit))
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 100 ${STAGE_HEIGHT_UNITS}`} aria-hidden="true">
        {spokes.map((s, i) => {
          const on = lit === s.id
          return (
            <motion.path
              key={s.id}
              d={sagged(hub, pinPoint(s.slot), 1.1).d}
              fill="none"
              stroke="#c0322c"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 1.5px 1.5px rgb(0 0 0 / 0.45))' }}
              initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: lit === null ? 0.9 : on ? 1 : 0.2, strokeWidth: on ? 0.36 : 0.22 }}
              transition={{
                pathLength: { duration: reduce ? 0 : 0.6, ease: EASE_OUT, delay: reduce ? 0 : 0.5 + i * 0.08 },
                opacity: { duration: 0.2, delay: lit === null && !reduce ? 0.5 + i * 0.08 : 0 },
                strokeWidth: { duration: 0.2 },
              }}
            />
          )
        })}
        {tied.map((l) => (
          <path
            key={`${l.aId}-${l.bId}`}
            d={sagged(pinPoint(l.a), pinPoint(l.b), 2.4).d}
            fill="none"
            stroke="#c0322c"
            strokeWidth={0.3}
            strokeDasharray="0.9 0.7"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </>
  )
}
