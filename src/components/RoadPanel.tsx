import { CheckCircle } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { ROAD_HELP, ROAD_LABEL, ROADS } from '../config/rules'
import type { Road } from '../config/rules'
import type { RoadScore } from '../lib/rules'
import { EASE_OUT } from './Page'

interface Props {
  roads: RoadScore[]
  chosen: Road
  onChoose: (road: Road) => void
}

export function RoadPanel({ roads, chosen, onChoose }: Props) {
  const reduce = useReducedMotion()
  const best = roads[0]?.road
  const current = roads.find((r) => r.road === chosen)

  return (
    <div>
      <div className="space-y-2" role="radiogroup" aria-label="Choose your road">
        {ROADS.map((road, i) => {
          const score = roads.find((r) => r.road === road)?.score ?? 0
          const on = road === chosen
          return (
            <motion.button
              key={road}
              type="button"
              role="radio"
              aria-checked={on}
              className={`sign ${on ? 'on' : ''}`}
              style={{ width: `${100 - (i % 2) * 4}%` }}
              initial={{ opacity: 0, transform: reduce ? 'none' : 'translateX(-14px)' }}
              animate={{ opacity: 1, transform: 'translateX(0px)' }}
              transition={{ duration: 0.35, ease: EASE_OUT, delay: reduce ? 0 : 0.2 + i * 0.05 }}
              onClick={() => onChoose(road)}
            >
              <span>
                {ROAD_LABEL[road]}
                {road === best && <span className="ml-2 text-xs font-semibold opacity-80">Best fit</span>}
              </span>
              <span className="text-sm tabular-nums opacity-80">{score}</span>
            </motion.button>
          )
        })}
      </div>

      {current && (
        <motion.div
          key={current.road}
          className="mt-4 rounded-xl bg-cream/[0.07] p-4"
          initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(6px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        >
          <p className="font-semibold">{ROAD_HELP[current.road]}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-mist">
            {current.reasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <CheckCircle size={18} weight="duotone" className="mt-0.5 flex-none text-accent" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}
