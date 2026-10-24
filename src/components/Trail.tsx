import { Campfire, Signpost } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { RULES } from '../config/rules'
import { daysBetweenDates, fmtDate, fmtDays } from '../lib/format'
import type { CommitStats, Repo } from '../lib/types'
import { EASE_OUT } from '../lib/motion'

const W = 1000
const H = 220
const BORN_X = 70
const NOW_X = 930
const Y_BORN = 160
const Y_BURST = 96
const Y_LAST = 128

interface Stop {
  key: string
  x: number
  y: number
  icon?: ReactNode
  title: string
  detail: string
  extra?: string
  side: 'above' | 'below'
}

function buildTrail(meta: Repo, stats: CommitStats | null, daysSilent: number) {
  const born = stats?.firstDate ?? meta.created_at
  const last = stats?.lastDate ?? meta.pushed_at ?? meta.created_at
  const life = daysBetweenDates(born, last)
  const span = Math.max(1, life + daysSilent)
  const avail = NOW_X - BORN_X
  const lastX = Math.min(NOW_X - 170, Math.max(BORN_X + 190, BORN_X + (life / span) * avail))
  const hasBurst = Boolean(stats && stats.burstShare >= 0.3 && life >= 2)
  const burstX = hasBurst ? BORN_X + Math.min((lastX - BORN_X) * 0.5, Math.max(70, (RULES.burstDays / span) * avail)) : 0

  const lived = hasBurst
    ? `M${BORN_X} ${Y_BORN} C${BORN_X + 40} ${Y_BORN} ${burstX - 60} ${Y_BURST} ${burstX} ${Y_BURST} S${lastX - 70} ${Y_LAST} ${lastX} ${Y_LAST}`
    : `M${BORN_X} ${Y_BORN} C${BORN_X + (lastX - BORN_X) * 0.5} ${Y_BORN} ${lastX - (lastX - BORN_X) * 0.4} ${Y_LAST} ${lastX} ${Y_LAST}`
  const silent = `M${lastX} ${Y_LAST} L${NOW_X} ${Y_LAST}`

  const stops: Stop[] = [{ key: 'born', x: BORN_X, y: Y_BORN, title: 'Born', detail: fmtDate(born), side: 'below' }]
  if (hasBurst && stats) {
    stops.push({
      key: 'burst',
      x: burstX,
      y: Y_BURST,
      title: `${Math.round(stats.burstShare * 100)}% of all work`,
      detail: `in the first ${RULES.burstDays} days`,
      side: 'above',
    })
  }
  stops.push({
    key: 'last',
    x: lastX,
    y: Y_LAST,
    icon: <Campfire size={24} weight="duotone" />,
    title: 'Last breath',
    detail: fmtDate(last),
    extra: stats?.lastMessage ? `"${stats.lastMessage.slice(0, 40)}"` : undefined,
    side: 'below',
  })
  stops.push({
    key: 'now',
    x: NOW_X,
    y: Y_LAST,
    icon: <Signpost size={24} weight="duotone" />,
    title: 'Today',
    detail: `${fmtDays(daysSilent)} of silence`,
    side: 'above',
  })
  return { lived, silent, stops }
}

// The trail turns "when did it stop" into a distance you can see. Purpose: explanation. It draws once from
// birth to last breath, then the dotted stretch fades in, so the length of the silence is the last thing you read.
export function Trail({ meta, stats, daysSilent }: { meta: Repo; stats: CommitStats | null; daysSilent: number }) {
  const reduce = useReducedMotion()
  const { lived, silent, stops } = buildTrail(meta, stats, daysSilent)

  return (
    <>
      <div className="relative mx-auto hidden w-full pb-14 pt-12 sm:block" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <motion.path
            d={lived}
            fill="none"
            stroke="#f2ebd8"
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE_OUT, delay: 0.2 }}
          />
          <motion.path
            d={silent}
            fill="none"
            stroke="#b7c9cd"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="1 14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 1 }}
          />
        </svg>
        {stops.map((s, i) => (
          <div key={s.key} className="absolute" style={{ left: `${(s.x / W) * 100}%`, top: `${(s.y / H) * 100}%` }}>
            <motion.div
              className={
                s.icon
                  ? 'absolute grid h-11 w-11 place-items-center rounded-full bg-ink/70 text-accent ring-1 ring-cream/30'
                  : 'absolute h-3.5 w-3.5 rounded-full bg-cream'
              }
              style={s.icon ? { left: -22, top: -22 } : { left: -7, top: -7 }}
              initial={{ opacity: 0, transform: reduce ? 'none' : 'scale(0.8)' }}
              animate={{ opacity: 1, transform: 'scale(1)' }}
              transition={{ duration: 0.35, ease: EASE_OUT, delay: reduce ? 0 : 0.3 + i * 0.25 }}
            >
              {s.icon}
            </motion.div>
            <motion.div
              className="absolute w-40 text-center text-sm leading-snug"
              style={{ left: -80, ...(s.side === 'above' ? { bottom: s.icon ? 32 : 18 } : { top: s.icon ? 32 : 18 }) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: reduce ? 0 : 0.45 + i * 0.25 }}
            >
              <span className="block font-semibold text-cream">{s.title}</span>
              <span className="block text-mist">{s.detail}</span>
              {s.extra && <span className="mt-0.5 block italic text-mist/80">{s.extra}</span>}
            </motion.div>
          </div>
        ))}
      </div>

      <ol className="space-y-3 sm:hidden">
        {stops.map((s) => (
          <li key={s.key} className="text-sm leading-snug">
            <span className="font-semibold">{s.title}</span> <span className="text-mist">{s.detail}</span>
            {s.extra && <span className="block italic text-mist/80">{s.extra}</span>}
          </li>
        ))}
      </ol>
    </>
  )
}
