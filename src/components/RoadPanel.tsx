import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect } from 'react'
import { ROAD_FIRST_STEP, ROAD_HELP, ROAD_LABEL, ROADS } from '../config/rules'
import type { Road } from '../config/rules'
import { EASE_OUT } from '../lib/motion'
import type { RoadScore } from '../lib/rules'

// Scores tick to their new value. Purpose: state change. When the search finishes or you pick a project to
// compare, the verdict visibly shifts instead of silently swapping numbers.
function Score({ value }: { value: number }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => Math.round(v))
  useEffect(() => {
    if (reduce) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration: 0.5, ease: EASE_OUT })
    return () => controls.stop()
  }, [value, mv, reduce])
  return <motion.span className="tabular-nums">{text}</motion.span>
}

interface Props {
  roads: RoadScore[]
  chosen: Road
  onChoose: (road: Road) => void
}

export function RoadPanel({ roads, chosen, onChoose }: Props) {
  const reduce = useReducedMotion()
  const best = roads[0]?.road
  const current = roads.find((r) => r.road === chosen)
  const glide = reduce ? { duration: 0 } : { type: 'spring' as const, duration: 0.38, bounce: 0.12 }

  return (
    <div>
      <div className="space-y-1.5" role="radiogroup" aria-label="Choose how to start">
        {ROADS.map((road) => {
          const score = roads.find((r) => r.road === road)?.score ?? 0
          const on = road === chosen
          return (
            <button
              key={road}
              type="button"
              role="radio"
              aria-checked={on}
              className={`sign ${on ? 'on' : ''}`}
              onClick={() => onChoose(road)}
            >
              {on && <motion.span layoutId="road-fill" className="absolute inset-0 bg-ink" transition={glide} />}
              <span className="relative flex items-center gap-2">
                {ROAD_LABEL[road]}
                {road === best && (
                  <motion.span layoutId="best-fit" className="text-xs font-semibold opacity-75" transition={glide}>
                    Best fit
                  </motion.span>
                )}
              </span>
              <span className="relative text-sm opacity-80">
                <Score value={score} />
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 min-h-[170px]">
        <AnimatePresence mode="wait" initial={false}>
          {current && (
            <motion.div
              key={current.road}
              initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(6px)' }}
              animate={{ opacity: 1, transform: 'translateY(0px)' }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <p className="font-display text-lg">{ROAD_HELP[current.road]}</p>
              <ul className="mt-2 space-y-1.5 border-l-2 border-string/70 pl-3 text-sm text-ink-soft">
                {current.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <p className="sticky mt-3 inline-block px-3 py-1.5 text-lg" style={{ rotate: '-0.8deg' }}>
                First move: {ROAD_FIRST_STEP[current.road]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
